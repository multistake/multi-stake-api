import ValidatorsDAO from "../../dao/validatorsDAO";

export default class DataController {
	static async apiGetSearchFormData(req, res) {
		try {
			const { network } = req.body;

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
			const { account, network } = req.body;

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

	static async apiGetGroupValidatorsData(req, res) {
		try {
			const {
				network,
				page,
				perPage,
				sort: { sortBy, direction },
			} = req.body;

			let validatorsData = await ValidatorsDAO.getGroupValidatorsData(
				network,
				page,
				perPage,
				sortBy,
				direction
			);

			res.send(validatorsData);
		} catch (err) {
			console.error(
				`Unable to get group of validators data in DataController: ${err}`
			);
		}
	}
}
