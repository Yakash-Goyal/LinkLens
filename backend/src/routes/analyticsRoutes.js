const express = require("express");
const analyticsController = require("../controllers/analyticsController");

const router = express.Router();

router.get("/:shortCode", analyticsController.getAnalyticsSummary);

module.exports = router;
