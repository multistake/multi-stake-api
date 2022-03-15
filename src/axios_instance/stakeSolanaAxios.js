import axios from "axios";

const instance = axios.create({
	baseURL: "http://api.stakesolana.app/v1",
	timeout: 60000,
	headers: { type: "application/json" },
});

export default instance;
