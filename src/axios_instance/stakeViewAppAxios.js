import axios from "axios";

const instance = axios.create({
	baseURL: "https://stakeview.app",
	timeout: 60000,
	headers: { type: "application/json" },
});

export default instance;
