const crypto = require("node:crypto");

function hashIp(ipAddress, salt = process.env.IP_HASH_SALT || "linklens-dev-salt") {
  const normalizedIp = ipAddress || "unknown";

  return crypto
    .createHash("sha256")
    .update(`${salt}:${normalizedIp}`)
    .digest("hex");
}

module.exports = {
  hashIp,
};
