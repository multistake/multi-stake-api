import _ from "lodash";
import { validatorsAppAxios } from "../axios_instance/index";
import getStakePoolValidators from "./getStakePoolValidators";
import getValidatorsApy from "./getValidatorsApy";
import updateHistoricalCommissions from "./updateHistoricalCommission";
import updateVotePerformanceHistory from "./updateVotePerformanceHistory";
import validatorsDAO from "../dao/validatorsDAO";
import getCurrentEpochInfo from "../utils/getCurrentEpochInfo";

let previousValidatorsData = {
	mainnet: null,
	testnet: null,
};

let networks = ["mainnet", "testnet"];

const getValidatorsData = async (network, epochInfo) => {
	try {
		let { data: validatorsData } = await validatorsAppAxios.get(
			`/validators/${network}.json`
		);
		let newValidatorsData;

		if (network === "mainnet") {
			let stakePoolsValidators = await getStakePoolValidators();

			// only available on mainnet
			const validatorsApy = await getValidatorsApy("mainnet", epochInfo.epoch);

			let skipStakePoolValidatorsUpdate = false;
			if (_.isEmpty(stakePoolsValidators)) {
				skipStakePoolValidatorsUpdate = true;
			}

			newValidatorsData = validatorsData.map((doc) => {
				// specify apy for current doc
				let { apy } = _.find(
					validatorsApy,
					(apy) => apy.node_pk === doc.account
				) || { apy: null };

				return {
					...doc,
					apy: apy,
					received_stake_from_stake_pools: skipStakePoolValidatorsUpdate
						? doc.received_stake_from_stake_pools
						: stakePoolsValidators.has(doc.account),
					skipped_slot_percent: Number(doc.skipped_slot_percent),
				};
			});
		} else if (network === "testnet") {
			newValidatorsData = validatorsData.map((doc) => ({
				...doc,
				skipped_slot_percent: Number(doc.skipped_slot_percent),
			}));
		} else {
			console.error(
				"Invalid network in updateValidatorsData/getValidatorsData"
			);
		}

		return newValidatorsData;
	} catch (err) {
		console.error(`Unable to get Validators Data: ${err}`);
	}
};

const updateValidatorsData = async () => {
	try {
		for (let network of networks) {
			const epochInfo = await getCurrentEpochInfo(network);
			let newValidatorsData = await getValidatorsData(network, epochInfo);

			await updateHistoricalCommissions(newValidatorsData, network, epochInfo);
			await updateVotePerformanceHistory(network, epochInfo);

			if (!_.isEmpty(previousValidatorsData[network])) {
				await validatorsDAO.updateValidatorsData(
					newValidatorsData,
					previousValidatorsData[network],
					network
				);

				previousValidatorsData[network] = newValidatorsData;
			} else {
				let fetchedValidatorsData = await validatorsDAO.getAllValidatorsData(
					network
				);

				if (_.isEmpty(fetchedValidatorsData)) {
					// push newValidatorsData to DB
					await validatorsDAO.pushValidatorsData(newValidatorsData, network);

					previousValidatorsData[network] = newValidatorsData;
					// we are done with task
					continue;
				} else {
					await validatorsDAO.updateValidatorsData(
						newValidatorsData,
						fetchedValidatorsData,
						network
					);

					previousValidatorsData[network] = fetchedValidatorsData;
				}
			}
		}
	} catch (err) {
		console.error(`Unable to updateValidatorsData: ${err}`);
	}
};

export default updateValidatorsData;
