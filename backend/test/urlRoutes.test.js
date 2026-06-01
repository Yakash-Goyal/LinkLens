const assert = require("node:assert/strict");
const test = require("node:test");

const app = require("../src/app");

test("POST /shorten rejects invalid URLs with a 400 response", async () => {
  const server = app.listen(0);

  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/shorten`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        longUrl: "not-a-url",
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error, "A valid http or https longUrl is required");
  } finally {
    server.close();
  }
});
