import { stakeSolanaAxios } from "../axios_instance/index";

const getStakePools = async () => {
	try {
		let {
			data: { data: stakePools },
		} = await stakeSolanaAxios.get(
			"/pools?sort=apy&desc=true&offset=0&limit=2000"
		);

		return stakePools;
	} catch (e) {
		console.error(`Unable to get stake pools in getStakePools(): ${e}`);
	}
};

const getStakePoolValidators = async () => {
	try {
		let stakePools = await getStakePools();
		let ValidatorsSet = new Set();

		for (let pool of stakePools) {
			let {
				data: { data: poolValidators },
			} = await stakeSolanaAxios.get(
				`/pool-validators/${pool.name}?sort=apy&desc=true&offset=0&limit=2000`
			);

			ValidatorsSet = poolValidators.reduce(
				(validatorsSet, currentValidator) => {
					return validatorsSet.add(currentValidator.node_pk);
				},
				ValidatorsSet
			);
		}

		return ValidatorsSet;
	} catch (e) {
		console.error(
			`Unable to get stake pool validators in getStakePoolValidators(): ${e}`
		);
	}
};

export default getStakePoolValidators;
