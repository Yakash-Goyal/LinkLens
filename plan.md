# Scalable URL Shortener & Analytics Platform

## Overview

A production-grade URL shortening platform designed to generate compact links, redirect users efficiently, collect analytics, and scale under high traffic.

Inspired by systems such as Bitly and TinyURL.

---

# Problem Statement

Long URLs are:

- Hard to share
- Difficult to remember
- Poor for campaign tracking
- Inefficient for analytics
- Difficult to manage at scale

This system solves:

- URL shortening
- Link management
- Click analytics
- Traffic monitoring
- Scalable redirection

---

# Objectives

Build a platform that:

- Converts long URLs into short URLs
- Redirects users with minimal latency
- Tracks engagement metrics
- Supports expiration and aliases
- Scales efficiently

---

# Architecture

Client

↓

Express API

↓

Redis Cache + Rate Limiting

↓

PostgreSQL (Primary Data Store)

↓

MongoDB (Analytics Storage)

---

# Technology Stack

## Backend

- Node.js
- Express.js

## Databases

### PostgreSQL
Used for:

- URL mappings
- Source of truth
- Fast indexed lookups

### MongoDB
Used for:

- Click events
- Analytics aggregation

## Cache

Redis

Used for:

- URL cache
- Rate limiting
- Hot URL optimization

## Frontend

- React
- Chart.js or Recharts

## DevOps

- Docker
- Docker Compose

---

# Functional Requirements

## Phase 1 — Core System

### Create Short URL

Input:

```json
{
  "longUrl": "https://example.com"
}
```

Output:

```json
{
  "shortUrl": "http://localhost:5000/abc123"
}
```

---

### Redirect

Endpoint:

```http
GET /:shortCode
```

Behavior:

- Lookup short code
- Return HTTP 302 redirect

---

### Analytics

Endpoint:

```http
GET /analytics/:shortCode
```

Return:

- Total clicks
- Unique visitors
- Devices
- Countries
- Referrers

---

# Phase 2 — Production Features

## Redis Cache

Flow:

Request

↓

Redis

↓

Cache Hit → Redirect

Cache Miss

↓

PostgreSQL

↓

Store in Cache

↓

Redirect

---

## Custom Alias

Example:

```text
/my-product
```

Requirements:

- Alias validation
- Duplicate prevention

---

## Expiration

Store:

```sql
expires_at TIMESTAMP
```

Behavior:

```http
410 Gone
```

---

## Unique Visitors

Logic:

```text
hash(IP + shortCode)
```

Privacy-safe tracking.

---

## Rate Limiting

Example:

```text
100 requests per minute
```

Implementation:

Redis-based.

---

## Dashboard

Features:

- Click charts
- Device analytics
- Country analytics
- Traffic trends
- Referrer breakdown

---

# Database Design

## PostgreSQL

Table:

```sql
CREATE TABLE urls (
    id BIGSERIAL PRIMARY KEY,

    short_code VARCHAR(10)
    UNIQUE,

    long_url TEXT
    NOT NULL,

    created_at TIMESTAMP
    DEFAULT NOW(),

    expires_at TIMESTAMP,

    total_clicks BIGINT
    DEFAULT 0
);
```

Indexes:

```sql
CREATE UNIQUE INDEX idx_short_code
ON urls(short_code);
```

---

## MongoDB

Collection:

```javascript
{
    shortCode:String,

    timestamp:Date,

    hashedIP:String,

    country:String,

    deviceType:String,

    referrer:String
}
```

---

# URL Generation Strategy

## Base62 Encoding

Character Set:

```text
0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
```

Flow:

1. Insert URL into PostgreSQL
2. Get generated ID
3. Convert ID → Base62
4. Save as short_code

Example:

```text
125 → cb
```

---

# API Design

## POST /shorten

Creates short URL.

Request:

```json
{
  "longUrl":"https://example.com"
}
```

Response:

```json
{
  "shortUrl":"http://localhost:5000/cb"
}
```

---

## GET /:shortCode

Redirect endpoint.

Response:

```http
302 Redirect
```

---

## GET /analytics/:shortCode

Analytics endpoint.

Response:

```json
{
  "totalClicks":1200,
  "uniqueVisitors":700
}
```

---

# Folder Structure

```text
scalable-url-shortener/

src/

├── config/

│ ├── postgres.js

│ ├── mongo.js

│ └── redis.js

│

├── controllers/

│ ├── urlController.js

│ └── analyticsController.js

│

├── routes/

│ ├── urlRoutes.js

│ └── analyticsRoutes.js

│

├── services/

│ ├── shortenerService.js

│ ├── analyticsService.js

│ └── cacheService.js

│

├── models/

│ └── clickEventModel.js

│

├── middleware/

│ ├── rateLimiter.js

│ └── errorHandler.js

│

├── utils/

│ ├── base62.js

│ ├── hashIP.js

│ └── geoLocation.js

│

└── app.js

dashboard/

Dockerfile

docker-compose.yml

server.js

.env

README.md
```

---

# Performance Optimizations

## Redis

- Read-through cache
- Hot URL optimization

## PostgreSQL

- Indexed lookup

## MongoDB

- High-volume writes

## Async Analytics

Flow:

Redirect

↓

Background analytics

---

# Security

- Rate limiting
- Input validation
- URL validation
- Helmet middleware
- IP hashing

---

# Scalability Strategy

## Horizontal Scaling

Multiple backend instances.

## Cache Layer

Redis.

## Database Separation

PostgreSQL → Core

MongoDB → Analytics

## Future Improvements

- Kafka
- Queue workers
- CDN
- Sharding
- Distributed IDs

---

# Resume Summary

Built a scalable URL shortening and analytics platform using Node.js, PostgreSQL, MongoDB, and Redis implementing Base62-based link generation, indexed redirection, caching, and analytics collection for efficient traffic management.

---

# Development Roadmap

## Week 1

- Express setup
- PostgreSQL
- Base62
- Shorten endpoint
- Redirect endpoint

## Week 2

- Mongo analytics
- Redis cache
- Rate limiting

## Week 3

- Dashboard
- Docker
- Deployment
- Documentation

---

# Core Concepts

- HTTP 302 Redirect
- Base62 Encoding
- B-tree Indexing
- Cache-aside Strategy
- Hybrid Databases
- Request–Response Lifecycle

---

# Success Criteria

The project is complete when:

- URL shortening works
- Redirect latency is low
- Analytics are accurate
- Cache reduces DB hits
- Dashboard visualizes usage
- Architecture is interview-ready