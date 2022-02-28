import { stakeViewAppAxios } from "../axios_instance/index";

const getValidatorsApy = async (network, currentEpoch) => {
	try {
		let {
			data: { validators },
		} = await stakeViewAppAxios.get(`/apy/${currentEpoch}.json`);

		let validatorsApy = validators.map((validatorData) => {
			return {
				node_pk: validatorData.id,
				apy: validatorData.apy,
			};
		});

		return validatorsApy;
	} catch (e) {
		console.error(`Unable to get validators' apy in getValidatorsApy(): ${e}`);
	}
};

export default getValidatorsApy;
