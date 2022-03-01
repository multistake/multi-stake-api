import _ from "lodash";

let validatorsDB;
let validatorsGeneralMainnet;
let validatorsGeneralTestnet;

export default class ValidatorsDAO {
	static async injectDB(client) {
		if (validatorsDB && validatorsGeneralMainnet && validatorsGeneralTestnet) {
			return;
		}
		try {
			validatorsDB = await client.db("validators");
			validatorsGeneralMainnet = await validatorsDB.collection(
				"validators_general_mainnet"
			);
			validatorsGeneralTestnet = await validatorsDB.collection(
				"validators_general_testnet"
			);
		} catch (e) {
			console.error(
				`Unable to establish collection handles in validatorsDAO: ${e}`
			);
		}
	}

	static async getSingleValidatorData(network, account) {
		try {
			if (_.isNil(network) || _.isNil(account)) {
				return [];
			}

			let pipeline = [
				{
					$match: {
						account: account,
					},
				},
				{
					$lookup: {
						from: "commissions_mainnet",
						localField: "account",
						foreignField: "account",
						as: "commissions",
					},
				},
				{
					$lookup: {
						from: "vote_performances_mainnet",
						localField: "account",
						foreignField: "account",
						as: "vote_performances",
					},
				},
				{
					$addFields: {
						vote_performances: {
							$arrayElemAt: ["$vote_performances", 0],
						},
						commissions: {
							$arrayElemAt: ["$commissions", 0],
						},
					},
				},
				{
					$addFields: {
						vote_performances: "$vote_performances.vote_performances",
						commissions: "$commissions.commissions",
					},
				},
			];

			return await validatorsDB
				.collection(`validators_general_${network}`)
				.aggregate(pipeline)
				.toArray();
		} catch (e) {
			console.log(
				`Unable to get Single validator data from DB in validatorsDAO: ${e}`
			);
		}
	}

	static async getValidatorsData(network) {
		try {
			return await validatorsDB
				.collection(`validators_general_${network}`)
				.find({})
				.project({ _id: 0 })
				.toArray();
		} catch (e) {
			console.log(
				`Unable to get validators data from DB in validatorsDAO: ${e}`
			);
		}
	}

	static async updateValidatorsData(
		newValidatorsData,
		previousValidatorsData,
		network
	) {
		try {
			let operations = [];

			newValidatorsData.forEach((newValidatorData) => {
				let prevValidatorData = _.find(previousValidatorsData, [
					"account",
					newValidatorData.account,
				]);

				let operation;

				if (!_.isEmpty(prevValidatorData)) {
					if (!_.isEqual(prevValidatorData, newValidatorData)) {
						// create the update operation
						let updateDoc = {
							$set: {},
						};
						_.keys(newValidatorData).forEach((key) => {
							if (!_.isEqual(newValidatorData[key], prevValidatorData[key])) {
								updateDoc.$set[key] = newValidatorData[key];
							}
						});

						operation = {
							updateOne: {
								filter: { account: newValidatorData.account },
								update: updateDoc,
							},
						};
					}
				} else {
					operation = {
						insertOne: newValidatorData,
					};
				}

				if (!_.isNil(operation)) {
					operations.push(operation);
				}
			});

			if (!_.isEmpty(operations)) {
				await validatorsDB
					.collection(`validators_general_${network}`)
					.bulkWrite(operations, { ordered: false });
			}
		} catch (e) {
			console.log(`Unable to update validatorsData in validatorsDAO: ${e}`);
		}
	}

	static async pushValidatorsData(newValidatorsData, network) {
		try {
			await validatorsDB
				.collection(`validators_general_${network}`)
				.insertMany(newValidatorsData);
		} catch (e) {
			console.log(
				`Unable to push newValidatorsData to Validators DB in validatorsDAO: ${e}`
			);
		}
	}

	static async getSearchFormData(network) {
		try {
			let namePipeline = [
				{
					$match: {
						name: {
							$nin: [null, undefined, ""],
						},
					},
				},
				{
					$project: {
						_id: 0,
						name: 1,
					},
				},
				{
					$sort: {
						name: 1,
					},
				},
			];

			let asnPipeline = [
				{
					$match: {
						autonomous_system_number: {
							$nin: [null, undefined],
						},
					},
				},
				{
					$project: {
						_id: 0,
						autonomous_system_number: 1,
					},
				},
				{
					$sort: {
						autonomous_system_number: 1,
					},
				},
			];

			let softwareVersionPipeline = [
				{
					$match: {
						software_version: { $nin: ["unknown", null, undefined] },
					},
				},
				{
					$group: {
						_id: "$software_version",
						count: {
							$sum: 1,
						},
					},
				},
				{
					$sort: {
						_id: -1,
					},
				},
			];

			let names = await validatorsDB
				.collection(`validators_general_${network}`)
				.aggregate(namePipeline)
				.map((doc) => doc.name)
				.toArray();

			let asns = await validatorsDB
				.collection(`validators_general_${network}`)
				.aggregate(asnPipeline)
				.map((doc) => doc.autonomous_system_number)
				.toArray();

			let softwareVersions = await validatorsDB
				.collection(`validators_general_${network}`)
				.aggregate(softwareVersionPipeline)
				.toArray();

			let dataCenters = await validatorsDB
				.collection(`validators_general_${network}`)
				.distinct("data_center_key");

			return {
				names,
				asns,
				softwareVersions,
				dataCenters,
			};
		} catch (e) {
			console.log(
				`Unable to get search form Data from DB in validatorsDAO: ${e}`
			);
		}
	}

	static async searchValidators(
		network,
		count,
		names,
		dataCenters,
		dataCenterConcentrationScore,
		validatorAsn,
		softwareVersion,
		validatorActiveStake,
		receivedStakeFromStakePools,
		currentValidatorCommission,
		validatorApy,
		validatorSkipRate,
		validatorVotingPerformance
	) {
		try {
			let pipeline = [];

			// apply names if they're available
			if (!_.isEmpty(names)) {
				let namesStage = { $match: { name: { $in: names } } };
				pipeline.push(namesStage);
			}

			// apply dataCenters if they're available
			if (!_.isEmpty(dataCenters)) {
				let dataCenterStage = {
					$match: { data_center_key: { $in: dataCenters } },
				};
				pipeline.push(dataCenterStage);
			}

			// apply data center score if it's provided
			if (!_.isEmpty(dataCenterConcentrationScore)) {
				let dataCenterScoresStage = {
					$match: {
						data_center_concentration_score: {
							$in: dataCenterConcentrationScore,
						},
					},
				};
				pipeline.push(dataCenterScoresStage);
			}

			// apply asn if it's provided
			if (!_.isEmpty(validatorAsn)) {
				let asnStage = {
					$match: { autonomous_system_number: { $in: validatorAsn } },
				};
				pipeline.push(asnStage);
			}

			// apply softwareVersion if it's provided
			if (!_.isEmpty(softwareVersion)) {
				let softwareVersionStage = {
					$match: { software_version: { $in: softwareVersion } },
				};
				pipeline.push(softwareVersionStage);
			}

			// apply validatorActiveStake if it's provided
			if (!_.isEmpty(validatorActiveStake)) {
				let validatorActiveStakeStage = {
					$match: {
						active_stake: {
							$gte: validatorActiveStake[0],
							$lte: validatorActiveStake[1],
						},
					},
				};
				pipeline.push(validatorActiveStakeStage);
			}

			// apply receivedStakeFromStakePools if it's provided
			if (_.isBoolean(receivedStakeFromStakePools)) {
				let received_stake_from_stake_pools = {
					$match: {
						received_stake_from_stake_pools: receivedStakeFromStakePools,
					},
				};
				pipeline.push(received_stake_from_stake_pools);
			}

			// apply currentValidatorCommission if it's provided
			if (!_.isEmpty(currentValidatorCommission)) {
				let currentValidatorCommissionStage = {
					$match: {
						commission: {
							$gte: currentValidatorCommission[0],
							$lte: currentValidatorCommission[1],
						},
					},
				};
				pipeline.push(currentValidatorCommissionStage);
			}

			// apply apy if it's provided
			if (!_.isEmpty(validatorApy)) {
				let apyStage = {
					$match: { apy: { $gte: validatorApy[0], $lte: validatorApy[1] } },
				};
				pipeline.push(apyStage);
			}

			// apply skipRate if it's provided
			if (!_.isEmpty(validatorSkipRate)) {
				let validatorSkipRateStage = {
					$match: {
						skipped_slot_percent: {
							$gte: validatorSkipRate[0],
							$lte: validatorSkipRate[1],
						},
					},
				};
				pipeline.push(validatorSkipRateStage);
			}

			// apply sort by total_score
			let totalScoreStage = {
				$sort: { total_score: -1 },
			};
			pipeline.push(totalScoreStage);

			// apply count if it's provided
			if (_.isInteger(count) && count > 0) {
				let countStage = { $limit: count };
				pipeline.push(countStage);
			}

			return await validatorsDB
				.collection(`validators_general_${network}`)
				.aggregate(pipeline)
				.toArray();
		} catch (e) {
			console.log(`Unable to search in Validators, in validatorsDAO: ${e}`);
		}
	}
}
