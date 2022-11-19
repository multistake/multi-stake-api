import { Connection, clusterApiUrl } from "@solana/web3.js";

const getSolanaConnection = (network) => {
  let cluster;
  switch (network) {
    case "mainnet":
      cluster = "mainnet-beta";
      break;
    default:
      console.error("Unknown network");
  }

  const endpoint =
    process.env.CUSTOM_MAINNET_ENDPOINT || clusterApiUrl(cluster);

  let connection = new Connection(endpoint, "confirmed");

  return connection;
};

export default getSolanaConnection;
