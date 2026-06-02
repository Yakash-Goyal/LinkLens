const express = require("express");
const urlController = require("../controllers/urlController");

const router = express.Router();

router.post("/shorten", urlController.createShortUrl);
router.get("/:shortCode", urlController.redirectToLongUrl);

module.exports = router;
