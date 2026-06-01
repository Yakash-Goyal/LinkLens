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

function formatBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

async function createShortUrl(
  { longUrl, expiresAt = null, baseUrl },
  dependencies = {}
) {
  if (!validateHttpUrl(longUrl)) {
    throw createHttpError(400, "A valid http or https longUrl is required");
  }

  if (!baseUrl) {
    throw createHttpError(500, "Base URL is not configured");
  }

  const repository = dependencies.urlRepository || urlRepository;
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

module.exports = {
  createShortUrl,
  validateHttpUrl,
};
