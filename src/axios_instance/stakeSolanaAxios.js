import axios from "axios";
// TODO: consider replacing this api with a better alternative
// TODO: The api is slow and unstable.
// TODO: maybe figuring out node_pk of stake pools and getting validators directly
const instance = axios.create({
	baseURL: "http://api.stakesolana.app/v1",
	timeout: 90000,
	headers: { type: "application/json" },
});

export default instance;
