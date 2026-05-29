const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createUrlRecord,
  findByShortCode,
  incrementClickCount,
  updateShortCode,
} = require("../src/repositories/urlRepository");

function createMockDb(rows = []) {
  const calls = [];

  return {
    calls,
    async query(text, params) {
      calls.push({ text, params });

      return {
        rows,
      };
    },
  };
}

test("creates a URL record before a short code is assigned", async () => {
  const expectedRow = {
    id: "1",
    short_code: null,
    long_url: "https://example.com",
    total_clicks: "0",
  };
  const db = createMockDb([expectedRow]);

  const row = await createUrlRecord(
    { longUrl: "https://example.com", expiresAt: null },
    db
  );

  assert.equal(row, expectedRow);
  assert.match(db.calls[0].text, /INSERT INTO urls/);
  assert.deepEqual(db.calls[0].params, ["https://example.com", null]);
});

test("updates a URL record with the generated short code", async () => {
  const expectedRow = {
    id: "1",
    short_code: "1",
    long_url: "https://example.com",
    total_clicks: "0",
  };
  const db = createMockDb([expectedRow]);

  const row = await updateShortCode("1", "1", db);

  assert.equal(row, expectedRow);
  assert.match(db.calls[0].text, /UPDATE urls/);
  assert.deepEqual(db.calls[0].params, ["1", "1"]);
});

test("finds a URL record by short code", async () => {
  const expectedRow = {
    id: "1",
    short_code: "abc",
    long_url: "https://example.com",
    total_clicks: "4",
  };
  const db = createMockDb([expectedRow]);

  const row = await findByShortCode("abc", db);

  assert.equal(row, expectedRow);
  assert.match(db.calls[0].text, /WHERE short_code = \$1/);
  assert.deepEqual(db.calls[0].params, ["abc"]);
});

test("returns null when a short code is not found", async () => {
  const db = createMockDb([]);

  const row = await findByShortCode("missing", db);

  assert.equal(row, null);
});

test("increments click count for redirect analytics", async () => {
  const expectedRow = {
    id: "1",
    short_code: "abc",
    long_url: "https://example.com",
    total_clicks: "5",
  };
  const db = createMockDb([expectedRow]);

  const row = await incrementClickCount("abc", db);

  assert.equal(row, expectedRow);
  assert.match(db.calls[0].text, /total_clicks = total_clicks \+ 1/);
  assert.deepEqual(db.calls[0].params, ["abc"]);
});
