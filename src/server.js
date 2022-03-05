import express from "express";
import compression from "compression";
import { searchRoutes, dataRoutes } from "./api/routes/index";
import cors from "cors";

const app = express();

const corsOptions = {
	origin: "*",
	credentials: true, //access-control-allow-credentials:true
	optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(compression());

app.use("/search", searchRoutes);
app.use("/data", dataRoutes);

export default app;
