import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const instance = axios.create({
	baseURL: "https://www.validators.app/api/v1",
	timeout: 30000,
	headers: {
		Token: process.env.VALIDATORS_APP_TOKEN || "tWvMW29ppkSkyyxkme3r5c2c",
	},
});

export default instance;
