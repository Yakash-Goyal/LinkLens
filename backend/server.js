require("dotenv").config();

const app = require("./src/app");
const { connectMongo } = require("./src/config/mongo");
const { runMigrations } = require("./src/db/runMigrations");

const PORT = process.env.PORT || 5000;

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function retry(operation, { label, retries = 10, delayMs = 1000 }) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`${label} failed (${attempt}/${retries}): ${error.message}`);

      if (attempt < retries) {
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}

async function startServer() {
  await retry(() => runMigrations(), {
    label: "PostgreSQL migration",
  });
  await retry(() => connectMongo(), {
    label: "MongoDB connection",
  });

  return app.listen(PORT, () => {
    console.log(`LinkLens API running on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Failed to start LinkLens API", error);
    process.exit(1);
  });
}

module.exports = {
  retry,
  startServer,
};
