import _ from "lodash";
import VotePerformanceHistoryDAO from "../dao/votePerformanceHistoryDAO";
import calculateVotePerformance from "../utils/calculateVotePerformance";
import { Connection, clusterApiUrl } from "@solana/web3.js";

let previousVotePerformances = {
	mainnet: null,
	testnet: null,
};

const getVoteAccountsInfo = async (network) => {
	let cluster;

	try {
		switch (network) {
			case "testnet":
				cluster = "testnet";
				break;
			case "mainnet":
				cluster = "mainnet-beta";
				break;
			default:
				console.error("Unknown network");
		}

		let connection = new Connection(clusterApiUrl(cluster), "confirmed");

		let { current, delinquent } = await connection.getVoteAccounts("confirmed");

		let voteAccountsData = current.concat(delinquent).map((voteAccData) => ({
			account: voteAccData.nodePubkey,
			epochCredits: voteAccData.epochCredits,
		}));

		return voteAccountsData;
	} catch (e) {
		console.error(
			`Unable to get vote Accounts Information in getVoteAccountsInfo: ${e}`
		);
	}
};

const updateHistoricalValidatorCommission = async (network, epochInfo) => {
	try {
		let rawVotePerformanceData = await getVoteAccountsInfo(network);
		let newVotePerformances = await calculateVotePerformance(
			rawVotePerformanceData,
			epochInfo
		);

		let updateOperations = [];
		// previous vote performances of [network]
		let prevStateVotePerformances = previousVotePerformances[network];

		if (_.isEmpty(prevStateVotePerformances)) {
			// fetch data from db
			let fetchedVotePerformances =
				await VotePerformanceHistoryDAO.getPreviousVotePerformances(network);
			// if still it's null or undefined then push the newValidatorCommissions to database
			if (!_.isEmpty(fetchedVotePerformances)) {
				previousVotePerformances[network] = fetchedVotePerformances;
				prevStateVotePerformances = fetchedVotePerformances;
			} else {
				await VotePerformanceHistoryDAO.pushNewVotePerformances(
					newVotePerformances,
					network
				);

				previousVotePerformances[network] = newVotePerformances;

				// exiting the function because we handled the data
				return;
			}
		}

		newVotePerformances.forEach((newRecord) => {
			let previousRecord = _.find(prevStateVotePerformances, [
				"account",
				newRecord.account,
			]);

			// if epoch has changed then push new record
			// commissions array.
			// or if it wasn't present in previousVotePerformances
			// add the new document to collection with {upsert: true}
			if (
				_.isEmpty(previousRecord) ||
				previousRecord.epoch !== newRecord.epoch
			) {
				updateOperations.push({
					updateOne: {
						filter: { account: newRecord.account },
						update: {
							$push: {
								vote_performances: {
									epoch: newRecord.epoch,
									performance: newRecord.votePerformance,
								},
							},
						},
						upsert: true,
					},
				});
			} else if (previousRecord.votePerformance !== newRecord.votePerformance) {
				updateOperations.push({
					updateOne: {
						filter: {
							account: newRecord.account,
							[`vote_performances.epoch`]: newRecord.epoch,
						},
						update: {
							$set: {
								[`vote_performances.$.performance`]: newRecord.votePerformance,
							},
						},
					},
				});
			}
		});

		// updating data in DB
		await VotePerformanceHistoryDAO.updateVotePerformanceHistory(
			updateOperations,
			network
		);

		// finally put current data in previousCommissions to be used the next time
		previousVotePerformances[network] = newVotePerformances;
	} catch (e) {
		console.error(
			`Unable to update validator_historical_commission in updateHistoricalValidatorCommission: ${e}`
		);
	}
};

export default updateHistoricalValidatorCommission;
