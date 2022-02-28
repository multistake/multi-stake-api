export default class SearchController {
	static async apiGetValidators() {}

	static async apiSearchValidators(req, res, next) {
		try {
		} catch (err) {
			console.error(
				`Unable to search in Validators data in SearchController: ${err}`
			);
		}
	}
}
