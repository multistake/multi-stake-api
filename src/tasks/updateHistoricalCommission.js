import _ from "lodash";
import CommissionHistoryDAO from "../dao/commissionHistoryDAO";

let previousCommissions = {
	mainnet: null,
	testnet: null,
};

const updateHistoricalCommissions = async (
	validatorsData,
	network,
	epochInfo
) => {
	let newValidatorCommissions = validatorsData.map((doc) => {
		return {
			account: doc.account,
			epoch: _.isNil(doc.epoch) ? epochInfo.epoch : doc.epoch,
			commission: doc.commission,
		};
	});

	try {
		let updateOperations = [];
		// previousCommissions of [network]
		let prevStateCommissions = previousCommissions[network];

		if (_.isEmpty(prevStateCommissions)) {
			// fetch data from db
			let fetchedPrevCommissions =
				await CommissionHistoryDAO.getPreviousCommissions(network);
			// if still it's null or undefined then push the newValidatorCommissions to database
			if (!_.isEmpty(fetchedPrevCommissions)) {
				previousCommissions[network] = fetchedPrevCommissions;
				prevStateCommissions = fetchedPrevCommissions;
			} else {
				await CommissionHistoryDAO.pushNewValidatorCommissions(
					newValidatorCommissions,
					network
				);

				previousCommissions[network] = newValidatorCommissions;

				// we are done with this task, exit the function
				return;
			}
		}

		newValidatorCommissions.forEach((newRecord) => {
			let previousRecord = _.find(prevStateCommissions, [
				"account",
				newRecord.account,
			]);

			// if epoch has changed then push new record
			// commissions array.
			// or if it wasn't present in previousCommissions
			if (
				_.isEmpty(previousRecord) ||
				previousRecord.epoch !== newRecord.epoch
			) {
				updateOperations.push({
					updateOne: {
						filter: { account: newRecord.account },
						update: {
							$push: {
								commissions: {
									epoch: newRecord.epoch,
									commission: newRecord.commission,
								},
							},
						},
						// insert the new document to the collection if it doesn't exist'
						upsert: true,
					},
				});
			} else if (previousRecord.commission !== newRecord.commission) {
				updateOperations.push({
					updateOne: {
						filter: {
							account: newRecord.account,
							[`commissions.epoch`]: newRecord.epoch,
						},
						update: {
							$set: { [`commissions.$.commission`]: newRecord.commission },
						},
					},
				});
			}
		});

		// updating data in DB
		await CommissionHistoryDAO.updateValidatorsCommissionHistory(
			updateOperations,
			network
		);

		// finally put current data in previousCommissions to be used the next time
		previousCommissions[network] = newValidatorCommissions;
	} catch (e) {
		console.error(
			`Unable to update validator_historical_commission in updateHistoricalValidatorCommission: ${e}`
		);
	}
};

export default updateHistoricalCommissions;
