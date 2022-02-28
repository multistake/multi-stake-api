import _ from "lodash";

const calculateSingleVotePerformance = (rawCreditData, epochInfo) => {
	// get the most recent epoch credit info
	let recentCredits = rawCreditData.epochCredits.at(-1);
	let epoch, finalCredits, startingCredits, votePerformance;

	if (!_.isEmpty(recentCredits)) {
		[epoch, finalCredits, startingCredits] = recentCredits;
		votePerformance = (finalCredits - startingCredits) / epochInfo.slotsInEpoch;
	}

	// calculate vote Performance with this formula
	return {
		account: rawCreditData.account,
		epoch: _.isNil(epoch) ? epochInfo.epoch : epoch,
		votePerformance: _.isNil(votePerformance) ? 0 : votePerformance,
	};
};

const calculateVotePerformance = async (rawCreditsData, epochInfo) => {
	let processedCreditsData = rawCreditsData.map((creditDoc) =>
		calculateSingleVotePerformance(creditDoc, epochInfo)
	);

	return processedCreditsData;
};

export default calculateVotePerformance;
