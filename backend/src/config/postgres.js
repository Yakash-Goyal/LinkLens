const { Pool } = require("pg");

const connectionString = process.env.POSTGRES_URL;

const pool = new Pool(
  connectionString
    ? { connectionString }
    : {
        host: process.env.POSTGRES_HOST || "localhost",
        port: Number(process.env.POSTGRES_PORT || 5432),
        database: process.env.POSTGRES_DATABASE || "linklens",
        user: process.env.POSTGRES_USER || "postgres",
        password: process.env.POSTGRES_PASSWORD || "postgres",
      }
);

function query(text, params) {
  return pool.query(text, params);
}

module.exports = {
  pool,
  query,
};
