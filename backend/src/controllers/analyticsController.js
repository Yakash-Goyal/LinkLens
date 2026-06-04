const analyticsService = require("../services/analyticsService");

async function getAnalyticsSummary(req, res, next) {
  try {
    const summary = await analyticsService.getAnalyticsSummary({
      shortCode: req.params.shortCode,
      from: req.query.from,
      to: req.query.to,
    });

    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAnalyticsSummary,
};
