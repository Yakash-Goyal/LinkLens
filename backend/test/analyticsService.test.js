const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildClickEvent,
  createBreakdownPipeline,
  createDailyClicksPipeline,
  getAnalyticsSummary,
  recordClickEvent,
} = require("../src/services/analyticsService");

test("builds a click event from request metadata", () => {
  const event = buildClickEvent({
    shortCode: "abc123",
    ipAddress: "203.0.113.10",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148",
    referrer: "https://linkedin.com",
    country: "IN",
  });

  assert.equal(event.shortCode, "abc123");
  assert.equal(event.country, "IN");
  assert.equal(event.deviceType, "mobile");
  assert.equal(event.referrer, "https://linkedin.com");
  assert.match(event.hashedIp, /^[a-f0-9]{64}$/);
  assert.ok(event.timestamp instanceof Date);
});

test("defaults missing click metadata for aggregation", () => {
  const event = buildClickEvent({
    shortCode: "abc123",
  });

  assert.equal(event.country, "Unknown");
  assert.equal(event.deviceType, "unknown");
  assert.equal(event.referrer, "direct");
});

test("persists click event through the model", async () => {
  const createdEvents = [];
  const ClickEventModel = {
    async create(event) {
      createdEvents.push(event);
      return event;
    },
  };

  const event = await recordClickEvent(
    {
      shortCode: "abc123",
      ipAddress: "203.0.113.10",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      referrer: "",
      country: "US",
    },
    { ClickEventModel }
  );

  assert.equal(createdEvents.length, 1);
  assert.equal(event.shortCode, "abc123");
  assert.equal(event.deviceType, "desktop");
  assert.equal(event.referrer, "direct");
});

test("creates aggregation pipelines for analytics breakdowns", () => {
  const devicePipeline = createBreakdownPipeline("abc123", "deviceType");
  const dailyPipeline = createDailyClicksPipeline("abc123");

  assert.deepEqual(devicePipeline[0], {
    $match: {
      shortCode: "abc123",
    },
  });
  assert.deepEqual(devicePipeline[1].$group._id, "$deviceType");
  assert.deepEqual(dailyPipeline[1].$group._id.$dateToString.format, "%Y-%m-%d");
});

test("returns analytics summary from PostgreSQL and MongoDB data", async () => {
  const aggregateCalls = [];
  const urlRepository = {
    async findByShortCode(shortCode) {
      assert.equal(shortCode, "abc123");

      return {
        short_code: "abc123",
        long_url: "https://example.com/report",
        total_clicks: "8",
      };
    },
  };
  const ClickEventModel = {
    async distinct(field, filter) {
      assert.equal(field, "hashedIp");
      assert.deepEqual(filter, {
        shortCode: "abc123",
      });

      return ["visitor-1", "visitor-2"];
    },
    async aggregate(pipeline) {
      aggregateCalls.push(pipeline);
      const groupId = pipeline[1].$group._id;

      if (groupId === "$deviceType") {
        return [
          {
            _id: "mobile",
            count: 5,
          },
        ];
      }

      if (groupId === "$country") {
        return [
          {
            _id: "IN",
            count: 6,
          },
        ];
      }

      if (groupId === "$referrer") {
        return [
          {
            _id: "https://linkedin.com",
            count: 4,
          },
        ];
      }

      return [
        {
          _id: "2026-06-03",
          count: 8,
        },
      ];
    },
  };

  const summary = await getAnalyticsSummary(
    {
      shortCode: "abc123",
    },
    { ClickEventModel, urlRepository }
  );

  assert.equal(aggregateCalls.length, 4);
  assert.deepEqual(summary, {
    shortCode: "abc123",
    longUrl: "https://example.com/report",
    totalClicks: 8,
    uniqueVisitors: 2,
    devices: [
      {
        label: "mobile",
        count: 5,
      },
    ],
    countries: [
      {
        label: "IN",
        count: 6,
      },
    ],
    referrers: [
      {
        label: "https://linkedin.com",
        count: 4,
      },
    ],
    dailyClicks: [
      {
        date: "2026-06-03",
        count: 8,
      },
    ],
  });
});

test("returns 404 when analytics are requested for a missing short code", async () => {
  const urlRepository = {
    async findByShortCode() {
      return null;
    },
  };
  const ClickEventModel = {
    async distinct() {
      throw new Error("MongoDB should not be queried");
    },
    async aggregate() {
      throw new Error("MongoDB should not be queried");
    },
  };

  await assert.rejects(
    () =>
      getAnalyticsSummary(
        {
          shortCode: "missing",
        },
        { ClickEventModel, urlRepository }
      ),
    (error) =>
      error.statusCode === 404 && error.message === "Short URL not found"
  );
});
