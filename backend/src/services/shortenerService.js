const analyticsService = require("./analyticsService");
const urlRepository = require("../repositories/urlRepository");
const { encodeBase62 } = require("../utils/base62");

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validateHttpUrl(rawUrl) {
  if (typeof rawUrl !== "string" || rawUrl.trim() === "") {
    return false;
  }

  try {
    const parsedUrl = new URL(rawUrl);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch (error) {
    return false;
  }
}

function validateCustomAlias(customAlias) {
  if (customAlias === undefined || customAlias === null || customAlias === "") {
    return true;
  }

  if (typeof customAlias !== "string") {
    return false;
  }

  const reservedAliases = new Set(["analytics", "health", "shorten"]);

  return (
    /^[a-zA-Z0-9_-]{3,10}$/.test(customAlias) &&
    !reservedAliases.has(customAlias.toLowerCase())
  );
}

function formatBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

function isExpired(record, now = new Date()) {
  if (!record.expires_at) {
    return false;
  }

  return new Date(record.expires_at) <= now;
}

async function createShortUrl(
  { longUrl, customAlias, expiresAt = null, baseUrl },
  dependencies = {}
) {
  if (!validateHttpUrl(longUrl)) {
    throw createHttpError(400, "A valid http or https longUrl is required");
  }

  if (!baseUrl) {
    throw createHttpError(500, "Base URL is not configured");
  }

  if (!validateCustomAlias(customAlias)) {
    throw createHttpError(
      400,
      "customAlias must be 3-10 URL-safe characters and cannot be reserved"
    );
  }

  const repository = dependencies.urlRepository || urlRepository;

  if (customAlias) {
    const customRecord = await repository.createUrlRecordWithShortCode({
      longUrl,
      shortCode: customAlias,
      expiresAt,
    });

    return {
      id: customRecord.id,
      longUrl: customRecord.long_url,
      shortCode: customRecord.short_code,
      shortUrl: `${formatBaseUrl(baseUrl)}/${customRecord.short_code}`,
      createdAt: customRecord.created_at,
      expiresAt: customRecord.expires_at,
    };
  }

  const createdRecord = await repository.createUrlRecord({ longUrl, expiresAt });
  const shortCode = encodeBase62(BigInt(createdRecord.id));
  const updatedRecord = await repository.updateShortCode(
    createdRecord.id,
    shortCode
  );

  return {
    id: updatedRecord.id,
    longUrl: updatedRecord.long_url,
    shortCode: updatedRecord.short_code,
    shortUrl: `${formatBaseUrl(baseUrl)}/${updatedRecord.short_code}`,
    createdAt: updatedRecord.created_at,
    expiresAt: updatedRecord.expires_at,
  };
}

async function getRedirectTarget({ shortCode, analyticsContext }, dependencies = {}) {
  const repository = dependencies.urlRepository || urlRepository;
  const analytics = dependencies.analyticsService || analyticsService;
  const logger = dependencies.logger || console;
  const now = dependencies.now || new Date();
  const record = await repository.findByShortCode(shortCode);

  if (!record) {
    throw createHttpError(404, "Short URL not found");
  }

  if (isExpired(record, now)) {
    throw createHttpError(410, "Short URL has expired");
  }

  await repository.incrementClickCount(shortCode);

  if (analyticsContext) {
    try {
      await analytics.recordClickEvent({
        shortCode,
        ...analyticsContext,
      });
    } catch (error) {
      logger.warn("Click analytics recording failed", error);
    }
  }

  return {
    longUrl: record.long_url,
    shortCode: record.short_code,
  };
}

module.exports = {
  createShortUrl,
  getRedirectTarget,
  isExpired,
  validateCustomAlias,
  validateHttpUrl,
};
