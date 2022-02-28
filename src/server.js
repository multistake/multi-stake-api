import express from "express";
import compression from "compression";
import { searchRoutes, dataRoutes } from "./api/routes/index";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(compression());

app.use("/search", searchRoutes);
app.use("/data", dataRoutes);

export default app;
