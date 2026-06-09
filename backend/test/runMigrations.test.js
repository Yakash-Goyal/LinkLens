const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const {
  getMigrationFiles,
  runMigrations,
} = require("../src/db/runMigrations");

test("lists SQL migrations in deterministic order", () => {
  const migrationsDir = path.join(__dirname, "../src/db/migrations");
  const migrationFiles = getMigrationFiles(migrationsDir);

  assert.deepEqual(
    migrationFiles.map((filePath) => path.basename(filePath)),
    ["001_create_urls.sql"]
  );
});

test("runs SQL migrations through the provided database client", async () => {
  const calls = [];
  const migrationsDir = path.join(__dirname, "../src/db/migrations");
  const db = {
    async query(sql) {
      calls.push(sql);
    },
  };

  const count = await runMigrations({ db, migrationsDir });

  assert.equal(count, 1);
  assert.match(calls[0], /CREATE TABLE IF NOT EXISTS urls/);
});
