const shortenerService = require("../services/shortenerService");

function getClientIp(req) {
  const forwardedFor = req.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
}

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

async function redirectToLongUrl(req, res, next) {
  try {
    const result = await shortenerService.getRedirectTarget({
      shortCode: req.params.shortCode,
      analyticsContext: {
        ipAddress: getClientIp(req),
        userAgent: req.get("user-agent"),
        referrer: req.get("referer") || req.get("referrer"),
        country: req.get("cf-ipcountry") || "Unknown",
      },
    });

    res.redirect(302, result.longUrl);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createShortUrl,
  getClientIp,
  redirectToLongUrl,
};
