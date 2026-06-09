# LinkLens

LinkLens is a URL shortener and click analytics platform built for a data analyst interview demo. It creates short links, redirects users, captures privacy-safe clickstream events, and exposes analytics for campaign reporting.

## What It Does

- Create generated short links with `POST /shorten`
- Create custom aliases such as `/btstag`
- Redirect with `GET /:shortCode`
- Track click events in MongoDB
- Store URL mappings in PostgreSQL
- Show analytics with `GET /analytics/:shortCode`
- Filter analytics with `from` and `to`
- Use a static dashboard in `dashboard/index.html`

## Architecture

```text
Dashboard
  -> Express API
  -> PostgreSQL for URL mappings
  -> MongoDB for click events
```

PostgreSQL is the source of truth for URL records. MongoDB stores high-volume click events that can be aggregated by device, country, referrer, visitor, and date.

## Run With Docker

From the project root:

```bash
docker compose up --build
```

The API runs at:

```text
http://localhost:5000
```

Open the dashboard file:

```text
dashboard/index.html
```

## Run Backend Locally

Start PostgreSQL and MongoDB locally, then create `backend/.env` from `backend/.env.example`.

```bash
cd backend
npm install
npm start
```

## API Examples

Create a short URL:

```http
POST /shorten
Content-Type: application/json
```

```json
{
  "longUrl": "https://example.com/report",
  "customAlias": "btstag"
}
```

Redirect:

```http
GET /btstag
```

Analytics:

```http
GET /analytics/btstag?from=2026-06-01&to=2026-06-09
```

Example analytics response:

```json
{
  "shortCode": "btstag",
  "longUrl": "https://example.com/report",
  "range": {
    "from": "2026-06-01T00:00:00.000Z",
    "to": "2026-06-09T00:00:00.000Z"
  },
  "totalClicks": 12,
  "uniqueVisitors": 8,
  "devices": [
    {
      "label": "mobile",
      "count": 7
    }
  ],
  "countries": [],
  "referrers": [],
  "dailyClicks": []
}
```

## Interview Talking Points

- Base62 encoding turns database IDs into compact URL-safe short codes.
- PostgreSQL provides reliable indexed short-code lookup.
- MongoDB stores flexible clickstream events for analytics.
- IPs are hashed before storage for privacy-safe unique visitor tracking.
- Analytics failures do not block redirects.
- Date filters make the analytics endpoint useful for reporting windows.

## Test

```bash
cd backend
npm test
```
