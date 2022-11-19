import getSolanaConnection from "./getSolanaConnection";

const getCurrentEpochInfo = async (network) => {
  let connection = getSolanaConnection(network);

  return await connection.getEpochInfo();
};

export default getCurrentEpochInfo;
