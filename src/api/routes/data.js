import express from "express";
import DataController from "../controllers/dataController";
const router = express.Router();

router.route("/search-form").post(DataController.apiGetSearchFormData);
router.route("/validator").post(DataController.apiGetSingleValidatorData);
router.route("/validators").post(DataController.apiGetGroupValidatorsData);

export default router;
