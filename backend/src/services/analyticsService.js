const ClickEvent = require("../models/clickEventModel");
const urlRepository = require("../repositories/urlRepository");
const { detectDeviceType } = require("../utils/detectDeviceType");
const { hashIp } = require("../utils/hashIp");

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeReferrer(referrer) {
  if (!referrer) {
    return "direct";
  }

  return referrer;
}

function buildClickEvent({
  shortCode,
  ipAddress,
  userAgent,
  referrer,
  country = "Unknown",
}) {
  return {
    shortCode,
    timestamp: new Date(),
    hashedIp: hashIp(ipAddress),
    country,
    deviceType: detectDeviceType(userAgent),
    referrer: normalizeReferrer(referrer),
  };
}

async function recordClickEvent(payload, dependencies = {}) {
  const ClickEventModel = dependencies.ClickEventModel || ClickEvent;
  const event = buildClickEvent(payload);

  return ClickEventModel.create(event);
}

function normalizeBreakdown(rows) {
  return rows.map((row) => ({
    label: row._id || "Unknown",
    count: row.count,
  }));
}

function createBreakdownPipeline(shortCode, fieldName) {
  return [
    {
      $match: {
        shortCode,
      },
    },
    {
      $group: {
        _id: `$${fieldName}`,
        count: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        count: -1,
        _id: 1,
      },
    },
  ];
}

function createDailyClicksPipeline(shortCode) {
  return [
    {
      $match: {
        shortCode,
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            date: "$timestamp",
            format: "%Y-%m-%d",
          },
        },
        count: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ];
}

async function getAnalyticsSummary({ shortCode }, dependencies = {}) {
  const repository = dependencies.urlRepository || urlRepository;
  const ClickEventModel = dependencies.ClickEventModel || ClickEvent;
  const urlRecord = await repository.findByShortCode(shortCode);

  if (!urlRecord) {
    throw createHttpError(404, "Short URL not found");
  }

  const [
    uniqueVisitorHashes,
    deviceRows,
    countryRows,
    referrerRows,
    dailyRows,
  ] = await Promise.all([
    ClickEventModel.distinct("hashedIp", { shortCode }),
    ClickEventModel.aggregate(createBreakdownPipeline(shortCode, "deviceType")),
    ClickEventModel.aggregate(createBreakdownPipeline(shortCode, "country")),
    ClickEventModel.aggregate(createBreakdownPipeline(shortCode, "referrer")),
    ClickEventModel.aggregate(createDailyClicksPipeline(shortCode)),
  ]);

  return {
    shortCode,
    longUrl: urlRecord.long_url,
    totalClicks: Number(urlRecord.total_clicks || 0),
    uniqueVisitors: uniqueVisitorHashes.length,
    devices: normalizeBreakdown(deviceRows),
    countries: normalizeBreakdown(countryRows),
    referrers: normalizeBreakdown(referrerRows),
    dailyClicks: dailyRows.map((row) => ({
      date: row._id,
      count: row.count,
    })),
  };
}

module.exports = {
  buildClickEvent,
  createBreakdownPipeline,
  createDailyClicksPipeline,
  getAnalyticsSummary,
  recordClickEvent,
};
