const shortenerService = require("../services/shortenerService");

async function createShortUrl(req, res, next) {
  try {
    const baseUrl =
      process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
    const result = await shortenerService.createShortUrl({
      longUrl: req.body.longUrl,
      expiresAt: req.body.expiresAt,
      baseUrl,
    });

    res.status(201).json({
      shortUrl: result.shortUrl,
      shortCode: result.shortCode,
      longUrl: result.longUrl,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createShortUrl,
};
