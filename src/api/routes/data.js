import express from "express";
import DataController from "../controllers/dataController";
const router = express.Router();

router.route("/search-form").get(DataController.apiGetSearchFormData);
router
	.route("/validator/:account")
	.get(DataController.apiGetSingleValidatorData);
router.route("/validators/:page");

export default router;
