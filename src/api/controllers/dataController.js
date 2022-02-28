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
}
