import ValidatorsDAO from "../../dao/validatorsDAO";

export default class DataController {
	static async apiGetSearchFormData(req, res) {
		try {
			const { network } = req.query;

			let { names, asns, softwareVersions, dataCenters } =
				await ValidatorsDAO.getSearchFormData(network);

			res.send({
				names,
				asns,
				softwareVersions,
				dataCenters,
			});
		} catch (err) {
			console.error(`Unable to get search-form data in DataController: ${err}`);
		}
	}

	static async apiGetSingleValidatorData(req, res) {
		try {
			const { network } = req.query;
			const { account } = req.params;

			let validatorData = await ValidatorsDAO.getSingleValidatorData(
				network,
				account
			);

			res.send(validatorData);
		} catch (err) {
			console.error(
				`Unable to get single validator data in DataController: ${err}`
			);
		}
	}
}
