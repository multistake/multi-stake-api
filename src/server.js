import express from "express";
import compression from "compression";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(compression());

export default app;
