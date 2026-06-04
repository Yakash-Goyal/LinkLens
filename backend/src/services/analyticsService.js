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

function parseDateRange({ from, to } = {}) {
  const dateRange = {};

  if (from) {
    const fromDate = new Date(from);

    if (Number.isNaN(fromDate.getTime())) {
      throw createHttpError(400, "from must be a valid date");
    }

    dateRange.from = fromDate;
  }

  if (to) {
    const toDate = new Date(to);

    if (Number.isNaN(toDate.getTime())) {
      throw createHttpError(400, "to must be a valid date");
    }

    dateRange.to = toDate;
  }

  if (dateRange.from && dateRange.to && dateRange.from > dateRange.to) {
    throw createHttpError(400, "from must be before to");
  }

  return dateRange;
}

function createEventFilter(shortCode, dateRange = {}) {
  const filter = {
    shortCode,
  };

  if (dateRange.from || dateRange.to) {
    filter.timestamp = {};

    if (dateRange.from) {
      filter.timestamp.$gte = dateRange.from;
    }

    if (dateRange.to) {
      filter.timestamp.$lte = dateRange.to;
    }
  }

  return filter;
}

function createBreakdownPipeline(shortCode, fieldName, dateRange) {
  return [
    {
      $match: createEventFilter(shortCode, dateRange),
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

function createDailyClicksPipeline(shortCode, dateRange) {
  return [
    {
      $match: createEventFilter(shortCode, dateRange),
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

async function getAnalyticsSummary({ shortCode, from, to }, dependencies = {}) {
  const repository = dependencies.urlRepository || urlRepository;
  const ClickEventModel = dependencies.ClickEventModel || ClickEvent;
  const urlRecord = await repository.findByShortCode(shortCode);

  if (!urlRecord) {
    throw createHttpError(404, "Short URL not found");
  }

  const dateRange = parseDateRange({ from, to });
  const eventFilter = createEventFilter(shortCode, dateRange);
  const [
    uniqueVisitorHashes,
    deviceRows,
    countryRows,
    referrerRows,
    dailyRows,
  ] = await Promise.all([
    ClickEventModel.distinct("hashedIp", eventFilter),
    ClickEventModel.aggregate(
      createBreakdownPipeline(shortCode, "deviceType", dateRange)
    ),
    ClickEventModel.aggregate(
      createBreakdownPipeline(shortCode, "country", dateRange)
    ),
    ClickEventModel.aggregate(
      createBreakdownPipeline(shortCode, "referrer", dateRange)
    ),
    ClickEventModel.aggregate(createDailyClicksPipeline(shortCode, dateRange)),
  ]);

  return {
    shortCode,
    longUrl: urlRecord.long_url,
    range: {
      from: dateRange.from ? dateRange.from.toISOString() : null,
      to: dateRange.to ? dateRange.to.toISOString() : null,
    },
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
  createEventFilter,
  getAnalyticsSummary,
  parseDateRange,
  recordClickEvent,
};
