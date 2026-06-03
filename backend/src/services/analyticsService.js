const ClickEvent = require("../models/clickEventModel");
const { detectDeviceType } = require("../utils/detectDeviceType");
const { hashIp } = require("../utils/hashIp");

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

module.exports = {
  buildClickEvent,
  recordClickEvent,
};
