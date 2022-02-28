import express from "express";
import DataController from "../controllers/dataController";
const router = express.Router();

router.route("/search-form").get(DataController.apiGetSearchFormData);
// router.route("/validators/:page")
// router.route("/validators/:validatorAccount")

export default router;
