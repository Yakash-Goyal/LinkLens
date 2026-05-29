const postgres = require("../config/postgres");

async function createUrlRecord({ longUrl, expiresAt = null }, db = postgres) {
  const result = await db.query(
    `INSERT INTO urls (long_url, expires_at)
     VALUES ($1, $2)
     RETURNING id, short_code, long_url, created_at, expires_at, total_clicks`,
    [longUrl, expiresAt]
  );

  return result.rows[0];
}

async function updateShortCode(id, shortCode, db = postgres) {
  const result = await db.query(
    `UPDATE urls
     SET short_code = $1
     WHERE id = $2
     RETURNING id, short_code, long_url, created_at, expires_at, total_clicks`,
    [shortCode, id]
  );

  return result.rows[0];
}

async function findByShortCode(shortCode, db = postgres) {
  const result = await db.query(
    `SELECT id, short_code, long_url, created_at, expires_at, total_clicks
     FROM urls
     WHERE short_code = $1`,
    [shortCode]
  );

  return result.rows[0] || null;
}

async function incrementClickCount(shortCode, db = postgres) {
  const result = await db.query(
    `UPDATE urls
     SET total_clicks = total_clicks + 1
     WHERE short_code = $1
     RETURNING id, short_code, long_url, created_at, expires_at, total_clicks`,
    [shortCode]
  );

  return result.rows[0] || null;
}

module.exports = {
  createUrlRecord,
  updateShortCode,
  findByShortCode,
  incrementClickCount,
};
