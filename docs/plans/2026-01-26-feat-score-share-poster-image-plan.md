---
title: feat: Score share poster image
type: feat
date: 2026-01-26
---

# Score share poster image

## Overview
Add a share flow to the results screen that uses a dynamic Open Graph (OG) image. The OG image is a cinematic poster-style score card (score, session length, app name, URL) with a custom background (no movie poster). The Share button opens Twitter/X with a prefilled link that renders the OG preview image for that specific signed score payload.

## Problem Statement / Motivation
The game already targets quick, casual sessions and the brainstorm calls out a shareable result card. The UI currently shows a placeholder for sharing, so players have no way to share their scores. Enabling a polished share experience is key for organic growth and validates the core loop.

## Proposed Solution
- Add a Share action on the results screen to open a Twitter/X intent URL with a share link.
- Create a `/share` page that sets dynamic metadata (Open Graph + Twitter) based on a signed payload.
- Create a dynamic OG image route (1200x630) that renders the same score card design as the on-screen result card.
- Define a canonical share URL format that carries a signed payload (e.g. `/share?payload=...&sig=...`).
- Keep a minimal fallback (copy link) for users who do not use Twitter/X.

## User Flow
- Player finishes final round and sees results screen with score card.
- Player taps Share.
- System opens a Twitter/X intent URL with prefilled text and the `/share` link.
- Twitter/X renders the OG preview using the dynamic image route tied to that score.
- Player can copy the link if they want to share elsewhere.

## Technical Considerations
- **OG image rendering**: implement `ImageResponse` in the App Router (server/edge). This is separate from the existing canvas renderer.
- **Design parity**: the on-screen score card and OG image should share a single layout spec (spacing, typography, background treatments) to avoid drift.
- **Signed payload**: sign a small JSON payload (score, rounds, version) server-side; verify signature on `/share` and OG route.
- **Input validation**: sanitize and clamp `score` and `rounds` after signature verification.
- **Caching**: OG responses can be cached per unique query string; set cache headers explicitly.
- **Metadata**: create dynamic Open Graph + Twitter metadata on `/share` so the preview matches the score.
- **Accessibility**: keyboard-accessible share control and focus return after opening the intent.

## Implementation Plan

### Phase 1: Product Decisions + Copy
- Define share text template and URL format in `src/lib/share-text.ts` (new).
- Do not include movie titles on the share image (score-only card).
- Lock the score card layout spec used by both the UI and OG image.

### Phase 2: UI Integration
- Replace the placeholder in `src/components/MovieGame.tsx` with a Share button.
- Render the final score card in the same layout used by the OG preview.
- Add a Copy Link fallback for non-Twitter shares.

### Phase 3: Share Execution
- Add a server-only signer utility for share payloads (score, rounds, version) with HMAC.
- Add an API route to return a signed share URL for a session result (server signs, client requests).
- Add `/share` page with `generateMetadata` for `openGraph` and `twitter` fields.
- Add OG image route (e.g. `/share/og`) that renders a 1200x630 score card via `ImageResponse`.
- Add a Twitter/X intent URL builder in `src/lib/share-actions.ts` (new).

### Phase 4: Caching + Validation
- Add cache headers for OG image responses (cache per query string, 24h TTL).
- Validate signature and clamp payload values for score and rounds.

## Edge Cases
- Invalid or missing signature: render a generic score card (no user score) and avoid leaking details.
- Malformed or missing query params: render a generic score card with placeholders.
- Long text or large scores: clamp and keep within safe areas.
- Users without Twitter: allow Copy Link instead of intent.

## Test Plan
- Unit: share text template formatting in `src/lib/share-text.ts`.
- Unit: signature verification and payload parsing.
- UI: Share button visibility and Copy Link fallback in `src/components/MovieGame.tsx`.
- E2E: share flow opens Twitter intent with correct signed `/share` URL.
- Visual: OG image with long text and small screens.

## Non-Goals
- User accounts, leaderboards, or persistent share history.
- Uploading images to Twitter/X via API (no OAuth media upload in v1).

## Acceptance Criteria
- [x] Results screen shows a Share action (no placeholder text).
- [x] Share opens a Twitter/X intent URL with text and a signed `/share` link.
- [x] `/share` sets Open Graph + Twitter metadata that include the dynamic OG image URL.
- [x] OG image renders a 1200x630 poster-style score card that matches the on-screen design.
- [x] OG image reflects the signed score and rounds payload.
- [x] Invalid or missing signature produces a generic OG image.
- [x] Share controls are keyboard accessible and return focus after share.
- [x] Copy Link fallback works for non-Twitter sharing.

## Success Metrics
- Share rate: percent of completed sessions that trigger share or download.
- Share completion rate: percent of share attempts that succeed without retry.
- Image generation failure rate: < 2% of share attempts.

## Dependencies & Risks
- Share signing secret availability in all environments.
- Crawler behavior variance across platforms (Twitterbot, Slack, Discord).
- Design drift risk between on-screen card and OG rendering.

## Open Questions
- None.

## AI-Era Considerations
- Capture the share text template and image layout decisions clearly so AI-generated UI work remains consistent.
- Add explicit tests for share failure paths to prevent silent regressions.

## References & Research
- Brainstorm: `docs/brainstorms/2026-01-25-movie-rating-higher-lower-brainstorm.md`
- Existing share renderer (design reference): `src/lib/share-image.ts`
- Results screen placeholder: `src/components/MovieGame.tsx`
- Metadata entry point: `src/app/layout.tsx`
- Related plan: `docs/plans/2026-01-26-feat-movie-rating-higher-lower-game-plan.md`
