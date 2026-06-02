const assert = require("node:assert/strict");
const test = require("node:test");

const ClickEvent = require("../src/models/clickEventModel");

test("defines click analytics fields for aggregation", () => {
  const schemaPaths = ClickEvent.schema.paths;

  assert.ok(schemaPaths.shortCode);
  assert.ok(schemaPaths.timestamp);
  assert.ok(schemaPaths.hashedIp);
  assert.ok(schemaPaths.country);
  assert.ok(schemaPaths.deviceType);
  assert.ok(schemaPaths.referrer);
});

test("applies analyst-friendly defaults to click events", () => {
  const event = new ClickEvent({
    shortCode: "abc123",
    hashedIp: "hashed-ip",
  });

  assert.equal(event.country, "Unknown");
  assert.equal(event.deviceType, "unknown");
  assert.equal(event.referrer, "direct");
  assert.ok(event.timestamp instanceof Date);
});

test("accepts supported device types", async () => {
  const supportedDeviceTypes = [
    "desktop",
    "mobile",
    "tablet",
    "bot",
    "unknown",
  ];

  for (const deviceType of supportedDeviceTypes) {
    const event = new ClickEvent({
      shortCode: "abc123",
      hashedIp: "hashed-ip",
      deviceType,
    });

    await event.validate();
  }
});

test("rejects unsupported device types", async () => {
  const event = new ClickEvent({
    shortCode: "abc123",
    hashedIp: "hashed-ip",
    deviceType: "smart-fridge",
  });

  await assert.rejects(() => event.validate(), /deviceType/);
});

test("creates indexes for common analytics queries", () => {
  const indexes = ClickEvent.schema.indexes();

  assert.ok(
    indexes.some(([fields]) => fields.shortCode === 1 && fields.timestamp === -1)
  );
  assert.ok(
    indexes.some(([fields]) => fields.shortCode === 1 && fields.hashedIp === 1)
  );
});
