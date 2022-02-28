import ValidatorsDAO from "../../dao/validatorsDAO";

export default class SearchController {
	static async apiGetValidators() {}

	static async apiSearchValidators(req, res) {
		try {
			const {
				query: {
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
					validatorVotingPerformance,
				},
				network,
			} = req.body;

			// structure of query parameters
			// {
			// 	count: Number,
			// 	names: String[],
			// 	dataCenters: String[],
			// 	dataCenterConcentrationScore: Number[],
			// 	validatorAsn: Number[],
			// 	softwareVersion: String[],
			// 	validatorActiveStake: Number[],
			// 	receivedStakeFromStakePools: Boolean,
			// 	historical_validator_commission: Number[],
			// 	currentValidatorCommission: Number[],
			// 	validatorApy: Number[],
			// 	validatorSkipRate: Number[],
			// 	validator_voting_performance: Number[],

			// }

			let foundValidators = await ValidatorsDAO.searchValidators(
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
			);

			res.send(foundValidators);
		} catch (err) {
			console.error(
				`Unable to search in Validators data in SearchController: ${err}`
			);
		}
	}
}
