import axios from "axios";

const instance = axios.create({
	baseURL: "http://api.stakesolana.app/v1",
	timeout: 30000,
	headers: { type: "application/json" },
});

export default instance;
