import express from "express";
import SearchController from "../controllers/searchController";

const router = express.Router();

router.route("/search-validators").post(SearchController.apiSearchValidators);

export default router;
