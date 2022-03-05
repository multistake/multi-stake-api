import express from "express";
import compression from "compression";
import { searchRoutes, dataRoutes } from "./api/routes/index";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(compression());

app.options("*", cors());
app.use("/search", searchRoutes);
app.use("/data", dataRoutes);

export default app;
