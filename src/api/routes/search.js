import express from "express";
import SearchController from "../controllers/searchController";

const router = express.Router();

router.route("/search-validators").get(SearchController.apiSearchValidators);

export default router;
