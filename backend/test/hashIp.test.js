const assert = require("node:assert/strict");
const test = require("node:test");

const { hashIp } = require("../src/utils/hashIp");

test("hashes IP addresses consistently with a salt", () => {
  const firstHash = hashIp("203.0.113.10", "test-salt");
  const secondHash = hashIp("203.0.113.10", "test-salt");

  assert.equal(firstHash, secondHash);
  assert.match(firstHash, /^[a-f0-9]{64}$/);
});

test("uses the salt when hashing IP addresses", () => {
  assert.notEqual(
    hashIp("203.0.113.10", "salt-a"),
    hashIp("203.0.113.10", "salt-b")
  );
});
