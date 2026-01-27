---
title: feat: Cache TMDB posters in Vercel Blob
type: feat
date: 2026-01-26
---

# Cache TMDB posters in Vercel Blob

## Overview
Reduce poster latency by caching TMDB poster images in Vercel Blob (CDN-backed). Use a hybrid strategy: pre-warm via ingestion and fetch-on-demand on cache misses. Serve cached poster URLs by default in gameplay and share-image rendering. Ensure TMDB compliance (cache <= 6 months, attribution, rate limiting).

## Problem Statement / Motivation
Posters currently load directly from TMDB per session, which introduces latency and inconsistent user experience. Caching posters in our own storage reduces TTFB, improves reliability, and lowers repeated TMDB requests.

## Proposed Solution
- Store posters in Vercel Blob and serve via the Blob CDN.
- Extend the ingestion script to download and upload posters (sizes `w500` and `w780`).
- Write Blob CDN URLs into `data/movies.json` (`posterUrl`, `posterUrlLarge`).
- Update the poster proxy to read from cached objects first and backfill on miss.
- Add TMDB attribution in the UI (text + logo).
- Enforce cache TTL <= 6 months via upload cache headers and refresh policy.

## Technical Considerations
- **TMDB terms**: caching must not exceed 6 months; attribution/logo required.
- **Rate limits**: throttle TMDB requests in ingestion and on-demand fallback.
- **Hybrid caching**: ingestion warms the cache, on-demand handles misses.
- **Variants**: store both `w500` (cards) and `w780` (share image) to avoid runtime resizing.
- **Security**: validate poster path input; avoid open proxy; keep tokens server-side.
- **Next.js image config**: add Blob CDN domain to `next.config.ts` `remotePatterns`.

## Data Model Updates
- Movie JSON additions:
  - `posterUrl`: cached CDN URL for `w500`
  - `posterUrlLarge`: cached CDN URL for `w780`
  - `posterPath`: original TMDB path (retain for on-demand fallback)

## Implementation Plan

### Phase 1: Storage + Keying
- Decide Blob key format, e.g. `tmdb/posters/{size}/{tmdbId}-{posterPathHash}.jpg`.
- Add Blob CDN base URL env var (e.g. `POSTER_CDN_BASE`).
- Ensure upload metadata sets cache headers respecting 6-month TTL.

### Phase 2: Ingestion Upgrade
- Update `scripts/ingest-imdb-top250.js` to:
  - Fetch TMDB image configuration once.
  - Download `w500` and `w780` posters for each movie.
  - Upload to Vercel Blob with cache headers.
  - Write Blob URLs into `data/movies.json`.
- Add flags: `--cache-posters`, `--sizes w500,w780`, `--cdn-base`, `--limit`.
- Respect TMDB rate limits with throttling and backoff on 429s.

### Phase 3: Runtime Proxy Hybrid
- Update `src/app/api/poster/route.ts` to:
  - Check for cached Blob URLs (via JSON or deterministic key lookup).
  - On cache miss, fetch from TMDB, upload to Blob, then return.
  - Return cache-friendly headers for client/CDN.
- Keep strict path validation and avoid open redirects.

### Phase 4: App Integration
- Prefer cached `posterUrl` (and `posterUrlLarge` for share image).
- Update share image renderer to use cached Blob URLs or fall back to proxy.
- Add attribution block in UI footer and share image output.

### Phase 5: Observability + Safety
- Log cache hit/miss and TMDB fetch count.
- Track latency improvement (poster load p95).
- Add admin/manual refresh script for poster regeneration.

## Acceptance Criteria
- [ ] Poster images are served from Vercel Blob CDN by default.
- [ ] Ingestion writes `posterUrl` and `posterUrlLarge` into `data/movies.json`.
- [ ] Hybrid proxy fetches from TMDB only on cache miss and uploads to Blob.
- [ ] TMDB attribution is visible in the UI and share poster.
- [ ] Cache headers ensure storage <= 6 months (or scheduled refresh before expiry).
- [ ] Poster load p95 is reduced (target >= 50% vs direct TMDB).
- [ ] Missing posters continue to show placeholders without blocking gameplay.

## Success Metrics
- Poster cache hit rate >= 80% after warm-up.
- TMDB request volume reduced >= 70% after ingestion.
- Poster load p95 latency improvement >= 50%.

## Dependencies & Risks
- Vercel Blob credentials and egress costs.
- TMDB terms compliance (cache TTL, attribution, rate limits).
- CDN cache behavior and invalidation strategy.

## Open Questions
- TTL specifics for Blob objects (proposed: max-age 30 days, revalidate monthly).
- Attribution placement details and logo asset source.
- Whether to support additional sizes or formats (webp).

## References & Research
- TMDB Terms: https://www.themoviedb.org/documentation/api/terms-of-use
- TMDB Image Basics: https://developer.themoviedb.org/docs/image-basics
- TMDB Rate Limiting: https://developer.themoviedb.org/docs/rate-limiting
- Next.js images: https://nextjs.org/docs/app/building-your-application/optimizing/images
- Existing code: `scripts/ingest-imdb-top250.js`, `src/app/api/poster/route.ts`, `src/components/MovieGame.tsx`
