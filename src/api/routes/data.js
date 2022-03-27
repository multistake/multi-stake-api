import express from "express";
import DataController from "../controllers/dataController";
const router = express.Router();

router.route("/general").post(DataController.apiGetGeneralData);
router.route("/validator").post(DataController.apiGetSingleValidatorData);
router.route("/validators").post(DataController.apiGetGroupValidatorsData);

export default router;
