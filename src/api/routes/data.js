import express from "express";
import DataController from "../controllers/dataController";
const router = express.Router();

router.route("/search-form").get(DataController.apiGetSearchFormData);
router.route("/validator").get(DataController.apiGetSingleValidatorData);
router.route("/validators").get(DataController.apiGetGroupValidatorsData);

export default router;
