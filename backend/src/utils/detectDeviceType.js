function detectDeviceType(userAgent = "") {
  const normalizedUserAgent = userAgent.toLowerCase();

  if (!normalizedUserAgent) {
    return "unknown";
  }

  if (/bot|crawler|spider|crawling/.test(normalizedUserAgent)) {
    return "bot";
  }

  if (/ipad|tablet|android(?!.*mobile)/.test(normalizedUserAgent)) {
    return "tablet";
  }

  if (/mobile|iphone|ipod|android.*mobile/.test(normalizedUserAgent)) {
    return "mobile";
  }

  if (/windows|macintosh|linux/.test(normalizedUserAgent)) {
    return "desktop";
  }

  return "unknown";
}

module.exports = {
  detectDeviceType,
};
