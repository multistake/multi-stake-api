import _ from "lodash";

let commissionHistoryDB;
let mainnet;
let testnet;

export default class CommissionHistoryDAO {
	static async injectDB(client) {
		if (commissionHistoryDB && mainnet && testnet) {
			return;
		}
		try {
			commissionHistoryDB = await client.db("commission_history");
			mainnet = await commissionHistoryDB.collection("mainnet");
			testnet = await commissionHistoryDB.collection("testnet");
		} catch (e) {
			console.error(
				`Unable to establish collection handles in CommissionHistoryDAO: ${e}`
			);
		}
	}

	static async getPreviousCommissions(network) {
		let pipeline = [
			{
				$project: {
					account: 1,
					commission: {
						$arrayElemAt: ["$commissions", -1],
					},
				},
			},
			{
				$project: {
					_id: 0,
					account: 1,
					epoch: "$commission.epoch",
					commission: "$commission.commission",
				},
			},
		];

		try {
			return await commissionHistoryDB
				.collection(network)
				.aggregate(pipeline)
				.toArray();
		} catch (error) {
			console.error(
				`Unable to get previousCommissions from DB in CommissionHistoryDAO: ${e}`
			);
		}
	}

	static async pushNewValidatorCommissions(data, network) {
		let docs = data.map((doc) => {
			return {
				account: doc.account,
				commissions: [{ commission: doc.commission, epoch: doc.epoch }],
			};
		});

		try {
			await commissionHistoryDB.collection(network).insertMany(docs);
		} catch (error) {
			console.error(
				`Unable to push newValidatorCommissions to DB in CommissionHistoryDAO: ${e}`
			);
		}
	}

	static async updateValidatorsCommissionHistory(updateOperations, network) {
		try {
			if (!_.isEmpty(updateOperations)) {
				await commissionHistoryDB
					.collection(network)
					.bulkWrite(updateOperations, { ordered: false });
			}
		} catch (e) {
			console.error(
				`Unable to update validator_commission_history in CommissionHistoryDAO: ${e}`
			);
		}
	}
}
