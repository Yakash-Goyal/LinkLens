const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createShortUrl,
  validateHttpUrl,
} = require("../src/services/shortenerService");

test("validates only http and https URLs", () => {
  assert.equal(validateHttpUrl("https://example.com"), true);
  assert.equal(validateHttpUrl("http://example.com/path"), true);
  assert.equal(validateHttpUrl("ftp://example.com"), false);
  assert.equal(validateHttpUrl("not-a-url"), false);
  assert.equal(validateHttpUrl(""), false);
});

test("creates a short URL from a stored PostgreSQL ID", async () => {
  const calls = [];
  const urlRepository = {
    async createUrlRecord(payload) {
      calls.push(["create", payload]);

      return {
        id: "3844",
        long_url: payload.longUrl,
        short_code: null,
      };
    },
    async updateShortCode(id, shortCode) {
      calls.push(["update", { id, shortCode }]);

      return {
        id,
        short_code: shortCode,
        long_url: "https://example.com/report",
        created_at: "2026-06-01T00:00:00.000Z",
        expires_at: null,
      };
    },
  };

  const result = await createShortUrl(
    {
      longUrl: "https://example.com/report",
      baseUrl: "http://localhost:5000/",
    },
    { urlRepository }
  );

  assert.deepEqual(calls, [
    [
      "create",
      {
        longUrl: "https://example.com/report",
        expiresAt: null,
      },
    ],
    [
      "update",
      {
        id: "3844",
        shortCode: "100",
      },
    ],
  ]);
  assert.equal(result.shortCode, "100");
  assert.equal(result.shortUrl, "http://localhost:5000/100");
  assert.equal(result.longUrl, "https://example.com/report");
});

test("rejects invalid long URLs before writing to storage", async () => {
  const urlRepository = {
    async createUrlRecord() {
      throw new Error("Repository should not be called");
    },
  };

  await assert.rejects(
    () =>
      createShortUrl(
        {
          longUrl: "invalid",
          baseUrl: "http://localhost:5000",
        },
        { urlRepository }
      ),
    /valid http or https longUrl/
  );
});
