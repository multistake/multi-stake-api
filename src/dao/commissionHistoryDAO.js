import _ from "lodash";

let validatorsDB;
let commissionsMainnet;

export default class CommissionHistoryDAO {
  static async injectDB(client) {
    if (validatorsDB && commissionsMainnet) {
      return;
    }
    try {
      validatorsDB = await client.db("validators");
      commissionsMainnet = await validatorsDB.collection("commissions_mainnet");
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
      return await validatorsDB
        .collection(`commissions_${network}`)
        .aggregate(pipeline)
        .toArray();
    } catch (e) {
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
      await validatorsDB.collection(`commissions_${network}`).insertMany(docs);
    } catch (e) {
      console.error(
        `Unable to push newValidatorCommissions to DB in CommissionHistoryDAO: ${e}`
      );
    }
  }

  static async updateValidatorsCommissionHistory(updateOperations, network) {
    try {
      if (!_.isEmpty(updateOperations)) {
        await validatorsDB
          .collection(`commissions_${network}`)
          .bulkWrite(updateOperations, { ordered: false });
      }
    } catch (e) {
      console.error(
        `Unable to update validator_commission_history in CommissionHistoryDAO: ${e}`
      );
    }
  }
}
