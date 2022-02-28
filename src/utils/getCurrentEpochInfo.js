import { Connection, clusterApiUrl } from "@solana/web3.js";

const getCurrentEpochInfo = async (network) => {
	let cluster;
	switch (network) {
		case "mainnet":
			cluster = "mainnet-beta";
			break;
		case "testnet":
			cluster = "testnet";
			break;
		default:
			console.error("Unknown network");
	}

	let connection = new Connection(clusterApiUrl(cluster), "confirmed");

	return await connection.getEpochInfo();
};

export default getCurrentEpochInfo;
