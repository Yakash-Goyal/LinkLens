const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createShortUrl,
  getRedirectTarget,
  isExpired,
  validateCustomAlias,
  validateHttpUrl,
} = require("../src/services/shortenerService");

test("validates only http and https URLs", () => {
  assert.equal(validateHttpUrl("https://example.com"), true);
  assert.equal(validateHttpUrl("http://example.com/path"), true);
  assert.equal(validateHttpUrl("ftp://example.com"), false);
  assert.equal(validateHttpUrl("not-a-url"), false);
  assert.equal(validateHttpUrl(""), false);
});

test("validates custom aliases", () => {
  assert.equal(validateCustomAlias(undefined), true);
  assert.equal(validateCustomAlias("sale2026"), true);
  assert.equal(validateCustomAlias("my-link"), true);
  assert.equal(validateCustomAlias("ab"), false);
  assert.equal(validateCustomAlias("this-is-too-long"), false);
  assert.equal(validateCustomAlias("bad alias"), false);
  assert.equal(validateCustomAlias("analytics"), false);
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

test("creates a short URL with a custom alias", async () => {
  const calls = [];
  const urlRepository = {
    async createUrlRecordWithShortCode(payload) {
      calls.push(["createWithAlias", payload]);

      return {
        id: "1",
        short_code: payload.shortCode,
        long_url: payload.longUrl,
        created_at: "2026-06-04T00:00:00.000Z",
        expires_at: null,
      };
    },
  };

  const result = await createShortUrl(
    {
      longUrl: "https://example.com/report",
      customAlias: "btstag",
      baseUrl: "http://localhost:5000/",
    },
    { urlRepository }
  );

  assert.deepEqual(calls, [
    [
      "createWithAlias",
      {
        longUrl: "https://example.com/report",
        shortCode: "btstag",
        expiresAt: null,
      },
    ],
  ]);
  assert.equal(result.shortCode, "btstag");
  assert.equal(result.shortUrl, "http://localhost:5000/btstag");
});

test("rejects invalid custom aliases before writing to storage", async () => {
  const urlRepository = {
    async createUrlRecordWithShortCode() {
      throw new Error("Repository should not be called");
    },
  };

  await assert.rejects(
    () =>
      createShortUrl(
        {
          longUrl: "https://example.com/report",
          customAlias: "analytics",
          baseUrl: "http://localhost:5000",
        },
        { urlRepository }
      ),
    /customAlias/
  );
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

test("checks whether a URL record is expired", () => {
  const now = new Date("2026-06-02T10:00:00.000Z");

  assert.equal(isExpired({ expires_at: null }, now), false);
  assert.equal(
    isExpired({ expires_at: "2026-06-02T10:00:01.000Z" }, now),
    false
  );
  assert.equal(
    isExpired({ expires_at: "2026-06-02T09:59:59.000Z" }, now),
    true
  );
});

test("returns redirect target and increments click count", async () => {
  const calls = [];
  const urlRepository = {
    async findByShortCode(shortCode) {
      calls.push(["find", shortCode]);

      return {
        short_code: shortCode,
        long_url: "https://example.com/report",
        expires_at: null,
      };
    },
    async incrementClickCount(shortCode) {
      calls.push(["increment", shortCode]);
    },
  };

  const result = await getRedirectTarget(
    {
      shortCode: "100",
    },
    { urlRepository }
  );

  assert.deepEqual(calls, [
    ["find", "100"],
    ["increment", "100"],
  ]);
  assert.deepEqual(result, {
    longUrl: "https://example.com/report",
    shortCode: "100",
  });
});

test("records click analytics when redirect metadata is provided", async () => {
  const calls = [];
  const urlRepository = {
    async findByShortCode(shortCode) {
      calls.push(["find", shortCode]);

      return {
        short_code: shortCode,
        long_url: "https://example.com/report",
        expires_at: null,
      };
    },
    async incrementClickCount(shortCode) {
      calls.push(["increment", shortCode]);
    },
  };
  const analyticsService = {
    async recordClickEvent(event) {
      calls.push(["analytics", event]);
    },
  };

  await getRedirectTarget(
    {
      shortCode: "100",
      analyticsContext: {
        ipAddress: "203.0.113.10",
        userAgent: "Mozilla/5.0",
        referrer: "https://linkedin.com",
        country: "IN",
      },
    },
    { analyticsService, urlRepository }
  );

  assert.deepEqual(calls, [
    ["find", "100"],
    ["increment", "100"],
    [
      "analytics",
      {
        shortCode: "100",
        ipAddress: "203.0.113.10",
        userAgent: "Mozilla/5.0",
        referrer: "https://linkedin.com",
        country: "IN",
      },
    ],
  ]);
});

test("does not fail redirects when click analytics recording fails", async () => {
  const warnings = [];
  const urlRepository = {
    async findByShortCode(shortCode) {
      return {
        short_code: shortCode,
        long_url: "https://example.com/report",
        expires_at: null,
      };
    },
    async incrementClickCount() {},
  };
  const analyticsService = {
    async recordClickEvent() {
      throw new Error("MongoDB unavailable");
    },
  };

  const result = await getRedirectTarget(
    {
      shortCode: "100",
      analyticsContext: {
        ipAddress: "203.0.113.10",
      },
    },
    {
      analyticsService,
      logger: {
        warn(...args) {
          warnings.push(args);
        },
      },
      urlRepository,
    }
  );

  assert.equal(result.longUrl, "https://example.com/report");
  assert.equal(warnings.length, 1);
});

test("returns 404 when redirect short code is missing", async () => {
  const urlRepository = {
    async findByShortCode() {
      return null;
    },
    async incrementClickCount() {
      throw new Error("Click count should not be incremented");
    },
  };

  await assert.rejects(
    () =>
      getRedirectTarget(
        {
          shortCode: "missing",
        },
        { urlRepository }
      ),
    (error) =>
      error.statusCode === 404 && error.message === "Short URL not found"
  );
});

test("returns 410 when redirect short code is expired", async () => {
  const urlRepository = {
    async findByShortCode(shortCode) {
      return {
        short_code: shortCode,
        long_url: "https://example.com/report",
        expires_at: "2026-06-02T09:59:59.000Z",
      };
    },
    async incrementClickCount() {
      throw new Error("Expired links should not increment clicks");
    },
  };

  await assert.rejects(
    () =>
      getRedirectTarget(
        {
          shortCode: "100",
        },
        {
          urlRepository,
          now: new Date("2026-06-02T10:00:00.000Z"),
        }
      ),
    (error) =>
      error.statusCode === 410 && error.message === "Short URL has expired"
  );
});
