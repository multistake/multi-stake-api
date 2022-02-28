import _ from "lodash";

let votePerformanceHistoryDB;
let mainnet;
let testnet;

export default class VotePerformanceHistoryDAO {
	static async injectDB(client) {
		if (votePerformanceHistoryDB && mainnet && testnet) {
			return;
		}
		try {
			votePerformanceHistoryDB = await client.db("vote_performance_history");
			mainnet = await votePerformanceHistoryDB.collection("mainnet");
			testnet = await votePerformanceHistoryDB.collection("testnet");
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
			return await votePerformanceHistoryDB
				.collection(network)
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
			await votePerformanceHistoryDB.collection(network).insertMany(docs);
		} catch (error) {
			console.error(
				`Unable to push newValidatorCommissions to DB in VotePerformanceHistoryDAO: ${e}`
			);
		}
	}

	static async updateVotePerformanceHistory(updateOperations, network) {
		try {
			if (!_.isEmpty(updateOperations)) {
				await votePerformanceHistoryDB
					.collection(network)
					.bulkWrite(updateOperations, { ordered: false });
			}
		} catch (e) {
			console.error(
				`Unable to update validator_commission_history in VotePerformanceHistoryDAO: ${e}`
			);
		}
	}
}
