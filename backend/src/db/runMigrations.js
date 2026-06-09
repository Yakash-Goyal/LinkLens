const fs = require("node:fs");
const path = require("node:path");
const postgres = require("../config/postgres");

const defaultMigrationsDir = path.join(__dirname, "migrations");

function getMigrationFiles(migrationsDir = defaultMigrationsDir) {
  return fs
    .readdirSync(migrationsDir)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort()
    .map((fileName) => path.join(migrationsDir, fileName));
}

async function runMigrations({ db = postgres, migrationsDir } = {}) {
  const migrationFiles = getMigrationFiles(migrationsDir);

  for (const filePath of migrationFiles) {
    const sql = fs.readFileSync(filePath, "utf8");
    await db.query(sql);
  }

  return migrationFiles.length;
}

module.exports = {
  getMigrationFiles,
  runMigrations,
};
