const express = require("express");
const urlController = require("../controllers/urlController");

const router = express.Router();

router.post("/shorten", urlController.createShortUrl);

module.exports = router;
