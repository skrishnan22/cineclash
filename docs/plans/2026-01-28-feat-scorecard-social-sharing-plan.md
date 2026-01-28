---
title: feat: Improve scorecard social sharing
type: feat
date: 2026-01-28
---

# Improve scorecard social sharing

## Overview
Make scorecard sharing reliable across X and other socials on web + mobile by leaning on the signed share URL and dynamic OG image, with a clear fallback ladder for platforms that cannot attach images.

## Stakeholders
- Players who want to share results quickly.
- Growth/marketing focused on organic sharing.
- Dev/ops responsible for share endpoints and OG rendering reliability.

## Problem Statement / Motivation
Sharing text is easy, but getting the scorecard image into posts is inconsistent across platforms. We need a predictable flow that ensures the ticket image appears on social previews and that users always have a working fallback (copy link or save image).

## User Flow
- Player finishes a game and lands on the results ticket.
- Player taps Share.
- Preferred path: Web Share API with image.
- Fallback path: Web Share API with text + link, then X intent, then Copy Link / Save Image.
- Share URL is public and permanent so previews remain stable.

## Proposed Solution
- Keep the signed share URL (`/share?payload=...&sig=...`) as the canonical share link.
- Continue to generate OG/Twitter metadata on `/share` and render the ticket image in `/share/og`.
- Expand the results share controls to include Copy Link and optional Copy Image (if clipboard image support exists).
- Add clear UX states (loading, copied, error) and track share outcomes and fallback paths.

## Technical Considerations
- Social crawlers cache OG images; unique signed URLs per session avoid stale previews.
- Web Share API support varies; feature-detect `navigator.share` and `navigator.canShare` for files.
- Clipboard image support requires `ClipboardItem`; not available in all browsers.
- Signed payload validation/clamping already exists; keep payload minimal and versioned.
- Ensure canonical base URL (prefer `

`) for share URLs to avoid internal hostnames.
- In-app browsers may block share sheets or clipboard access; ensure copy/save fallbacks always work.

## Implementation Suggestions
- Add Copy Link and (optional) Copy Image actions with feature detection in `src/components/MovieGame.tsx`.
- Extend the share fallback ladder to attempt text + link share before X intent in `src/components/MovieGame.tsx`.
- Normalize share URL host using `NEXT_PUBLIC_SITE_URL` fallback in `src/app/api/share/route.ts`.
- Confirm metadata and OG image URL generation in `src/app/share/page.tsx`.
- Keep OG renderer aligned with ticket styling in `src/app/share/og/route.tsx`.
- Track share outcomes (attempt, success, fallback) in `src/components/MovieGame.tsx`.

## Pseudocode
```ts
// src/components/MovieGame.tsx
// Preferred: share image -> share text + link -> X intent -> copy link/save image
```

## Acceptance Criteria
- [ ] Sharing produces a public, permanent share URL with OG image.
- [ ] X shows a summary_large_image card with the ticket image for the share URL.
- [ ] On supported devices, Web Share API includes the image file.
- [ ] On unsupported devices, users can copy the link and/or save the image.
- [ ] Optional: Copy Image works on supported browsers and degrades gracefully.
- [ ] Share failures show a non-blocking error state with retry.
- [ ] Analytics capture share attempts and the fallback path used.

## Success Metrics
- Share attempt rate (% of completed sessions).
- Share success rate by platform and fallback path.
- OG image render p95 latency and error rate.
- Copy Link usage vs. share sheet usage.

## Dependencies & Risks
- `SHARE_SIGNING_SECRET` must be set in production.
- Social platforms cache previews; updates may lag.
- In-app browsers may block share sheets or clipboard APIs.
- OG render performance affects perceived share quality.

## Non-Goals
- OAuth-based image uploads to X.
- Native app share integrations.
- User accounts or persistent share history.

## Test Plan
- Manual: iOS Safari, Android Chrome, desktop Chrome/Firefox.
- Social: validate share URLs on X, Slack, and Discord using fresh URLs.
- Failure: simulate `/api/share` 4xx/5xx and `/share/og` errors.
- Accessibility: keyboard focus, ARIA labels for share controls.
- Analytics: verify events for each share path.

## AI-Era Considerations
- Keep the share fallback ladder documented to prevent regressions.
- Add regression checks for OG metadata and signature parsing.
- Flag AI-generated UI changes for human review.

## References & Research
- Brainstorm: `docs/brainstorms/2026-01-25-movie-rating-higher-lower-brainstorm.md`
- Existing share metadata: `src/app/share/page.tsx:26`
- OG image renderer: `src/app/share/og/route.tsx:8`
- Share API signer: `src/app/api/share/route.ts:5`
- Share UI: `src/components/MovieGame.tsx:381`
- Share text/actions: `src/lib/share-text.ts:5`, `src/lib/share-actions.ts:6`
- Signature utilities: `src/lib/share-signature.ts:89`
- Legacy client renderer: `src/lib/share-image.ts:91`
- Prior plan: `docs/plans/2026-01-26-feat-score-share-poster-image-plan.md`
- External research: skipped (local patterns sufficient; no docs/solutions found)
