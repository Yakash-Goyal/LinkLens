const assert = require("node:assert/strict");
const test = require("node:test");

const { BASE62_CHARACTERS, encodeBase62 } = require("../src/utils/base62");

test("uses 62 URL-safe characters", () => {
  assert.equal(BASE62_CHARACTERS.length, 62);
  assert.match(BASE62_CHARACTERS, /^[0-9a-zA-Z]+$/);
});

test("encodes small values into single characters", () => {
  assert.equal(encodeBase62(0), "0");
  assert.equal(encodeBase62(1), "1");
  assert.equal(encodeBase62(10), "a");
  assert.equal(encodeBase62(35), "z");
  assert.equal(encodeBase62(36), "A");
  assert.equal(encodeBase62(61), "Z");
});

test("encodes values larger than the character set", () => {
  assert.equal(encodeBase62(62), "10");
  assert.equal(encodeBase62(63), "11");
  assert.equal(encodeBase62(3843), "ZZ");
  assert.equal(encodeBase62(3844), "100");
});

test("encodes BigInt values from PostgreSQL IDs", () => {
  assert.equal(encodeBase62(3844n), "100");
});

test("rejects values that cannot produce reliable short codes", () => {
  assert.throws(() => encodeBase62(-1), /non-negative integer/);
  assert.throws(() => encodeBase62(-1n), /non-negative integer/);
  assert.throws(() => encodeBase62(1.5), /non-negative integer/);
  assert.throws(
    () => encodeBase62(Number.MAX_SAFE_INTEGER + 1),
    /non-negative integer/
  );
});
