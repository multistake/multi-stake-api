import _ from "lodash";

let validatorsDB;
let votePerformancesMainnet;
let votePerformancesTestnet;

export default class VotePerformanceHistoryDAO {
	static async injectDB(client) {
		if (validatorsDB && votePerformancesMainnet && votePerformancesTestnet) {
			return;
		}
		try {
			validatorsDB = await client.db("validators");
			votePerformancesMainnet = await validatorsDB.collection(
				"vote_performances_mainnet"
			);
			votePerformancesTestnet = await validatorsDB.collection(
				"vote_performances_testnet"
			);
		} catch (e) {
			console.error(
				`Unable to establish collection handles in VotePerformanceHistoryDAO: ${e}`
			);
		}
	}

	static async getPreviousVotePerformances(network) {
		let pipeline = [
			{
				$project: {
					account: 1,
					vote_performance: {
						$arrayElemAt: ["$vote_performances", -1],
					},
				},
			},
			{
				$project: {
					_id: 0,
					account: 1,
					epoch: "$vote_performance.epoch",
					votePerformance: "$vote_performance.performance",
				},
			},
		];

		try {
			return await validatorsDB
				.collection(`vote_performances_${network}`)
				.aggregate(pipeline)
				.toArray();
		} catch (e) {
			console.error(
				`Unable to get Previous Vote Performances from DB in VotePerformanceHistoryDAO: ${e}`
			);
		}
	}

	static async pushNewVotePerformances(data, network) {
		let docs = data.map((doc) => {
			return {
				account: doc.account,
				vote_performances: [
					{ performance: doc.votePerformance, epoch: doc.epoch },
				],
			};
		});

		try {
			await validatorsDB
				.collection(`vote_performances_${network}`)
				.insertMany(docs);
		} catch (e) {
			console.error(
				`Unable to push newValidatorCommissions to DB in VotePerformanceHistoryDAO: ${e}`
			);
		}
	}

	static async updateVotePerformanceHistory(
		prevStateVotePerformances,
		newVotePerformances,
		network
	) {
		try {
			let updateOperations = [];

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
				} else if (
					previousRecord.votePerformance !== newRecord.votePerformance
				) {
					updateOperations.push({
						updateOne: {
							filter: {
								account: newRecord.account,
								[`vote_performances.epoch`]: newRecord.epoch,
							},
							update: {
								$set: {
									[`vote_performances.$.performance`]:
										newRecord.votePerformance,
								},
							},
						},
					});
				}
			});

			if (!_.isEmpty(updateOperations)) {
				await validatorsDB
					.collection(`vote_performances_${network}`)
					.bulkWrite(updateOperations, { ordered: false });
			}
		} catch (e) {
			console.error(
				`Unable to update validator_commission_history in VotePerformanceHistoryDAO: ${e}`
			);
		}
	}
}
