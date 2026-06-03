const assert = require("node:assert/strict");
const test = require("node:test");

const { detectDeviceType } = require("../src/utils/detectDeviceType");

test("detects common device types from user agents", () => {
  assert.equal(
    detectDeviceType("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"),
    "desktop"
  );
  assert.equal(
    detectDeviceType(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148"
    ),
    "mobile"
  );
  assert.equal(detectDeviceType("Mozilla/5.0 (iPad; CPU OS 17_0)"), "tablet");
  assert.equal(detectDeviceType("Googlebot/2.1"), "bot");
  assert.equal(detectDeviceType(""), "unknown");
});
