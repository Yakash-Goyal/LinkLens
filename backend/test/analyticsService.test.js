const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildClickEvent,
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
