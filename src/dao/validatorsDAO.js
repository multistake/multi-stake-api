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

	static async getGroupValidatorsData(
		network,
		page = 1,
		perPage = 5,
		sortBy = "total_score",
		direction = -1
	) {
		try {
			let skipped = (page - 1) * perPage;

			if (_.isNil(network) || _.isNil(page)) {
				return [];
			}

			let pipeline = [
				{
					$sort: {
						[sortBy]: direction,
					},
				},

				{
					$skip: skipped,
				},

				{
					$limit: perPage,
				},
				{
					$lookup: {
						from: `commissions_${network}`,
						localField: "account",
						foreignField: "account",
						as: "commissions",
					},
				},
				{
					$lookup: {
						from: `vote_performances_${network}`,
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

	static async getAllValidatorsData(network) {
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
							// *: we handle special attributes with dedicated logic here
							if (!_.isEqual(newValidatorData[key], prevValidatorData[key])) {
								if (key === "received_stake_from_stake_pools") {
									if (newValidatorData[key] !== null) {
										updateDoc.$set[key] = newValidatorData[key];
									}
								} else {
									updateDoc.$set[key] = newValidatorData[key];
								}
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

	static async getGetGeneralData(network) {
		try {
			// *: pipelines below got replaced by distinct() method
			// *: reason is duplicate results.
			// let namePipeline = [
			// 	{
			// 		$match: {
			// 			name: {
			// 				$nin: [null, undefined, ""],
			// 			},
			// 		},
			// 	},
			// 	{
			// 		$project: {
			// 			_id: 0,
			// 			name: 1,
			// 		},
			// 	},
			// 	{
			// 		$sort: {
			// 			name: 1,
			// 		},
			// 	},
			// ];

			// let asnPipeline = [
			// 	{
			// 		$match: {
			// 			autonomous_system_number: {
			// 				$nin: [null, undefined],
			// 			},
			// 		},
			// 	},
			// 	{
			// 		$project: {
			// 			_id: 0,
			// 			autonomous_system_number: 1,
			// 		},
			// 	},
			// 	{
			// 		$sort: {
			// 			autonomous_system_number: 1,
			// 		},
			// 	},
			// ];

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

			let count = await validatorsDB
				.collection(`validators_general_${network}`)
				.count();

			let names = await validatorsDB
				.collection(`validators_general_${network}`)
				.distinct("name");

			names = names.filter(
				(name) =>
					name !== "" && name !== '""' && name !== undefined && name !== null
			);

			let asns = await validatorsDB
				.collection(`validators_general_${network}`)
				.distinct("autonomous_system_number");

			asns = asns.filter(
				(asn) => asn !== "" && asn !== '""' && asn !== undefined && asn !== null
			);

			let softwareVersions = await validatorsDB
				.collection(`validators_general_${network}`)
				.aggregate(softwareVersionPipeline)
				.toArray();

			let dataCenters = await validatorsDB
				.collection(`validators_general_${network}`)
				.distinct("data_center_key");

			dataCenters = dataCenters.filter(
				(datacenterkey) =>
					datacenterkey !== "" &&
					datacenterkey !== '""' &&
					datacenterkey !== undefined &&
					datacenterkey !== null
			);

			return {
				count,
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
		asns,
		softwareVersions,
		activeStake,
		receivedStakeFromStakePools,
		currentValidatorCommission,
		apy,
		skipRate,
		votingPerformance
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
			if (!_.isEmpty(asns)) {
				let asnStage = {
					$match: { autonomous_system_number: { $in: asns } },
				};
				pipeline.push(asnStage);
			}

			// apply softwareVersion if it's provided
			if (!_.isEmpty(softwareVersions)) {
				let softwareVersionStage = {
					$match: { software_version: { $in: softwareVersions } },
				};
				pipeline.push(softwareVersionStage);
			}

			// apply validatorActiveStake if it's provided
			if (!_.isEmpty(activeStake)) {
				let activeStakeStage = {
					$match: {
						active_stake: {
							$gte: activeStake[0],
							$lte: activeStake[1],
						},
					},
				};
				pipeline.push(activeStakeStage);
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
			if (!_.isEmpty(apy)) {
				let apyStage = {
					$match: { apy: { $gte: apy[0], $lte: apy[1] } },
				};
				pipeline.push(apyStage);
			}

			// apply skipRate if it's provided
			if (!_.isEmpty(skipRate)) {
				let skipRateStage = {
					$match: {
						skipped_slot_percent: {
							$gte: skipRate[0],
							$lte: skipRate[1],
						},
					},
				};
				pipeline.push(skipRateStage);
			}

			// populating validator data with vote performance history
			// and commission history
			let populatingStage = [
				{
					$lookup: {
						from: `vote_performances_${network}`,
						localField: "account",
						foreignField: "account",
						as: "vote_performances",
					},
				},
				{
					$lookup: {
						from: `commissions_${network}`,
						localField: "account",
						foreignField: "account",
						as: "commissions",
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

			pipeline = pipeline.concat(populatingStage);

			// apply validatorVotingPerformance if it's provided
			if (!_.isEmpty(votingPerformance)) {
				let votePerformanceStages = [
					{
						$addFields: {
							vote_performances_avg: {
								$avg: "$vote_performances.performance",
							},
						},
					},
					{
						$match: {
							vote_performances_avg: {
								$gte: votingPerformance[0],
								$lte: votingPerformance[1],
							},
						},
					},
				];
				pipeline = pipeline.concat(votePerformanceStages);
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
