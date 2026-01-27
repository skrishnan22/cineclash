---
title: feat: Movie rating higher/lower web game
type: feat
date: 2026-01-26
---

# Movie rating higher/lower web game

## Overview
Build a simple web game where players choose which of two movies has the higher IMDb rating. The experience targets quick, casual sessions with minimal friction, offers 5 or 10 round sessions, and keeps play going even after a wrong guess (streak resets, session continues). Rounds are untimed. The movie pool is the IMDb Top 250 overall, and each card shows only poster and title. After each guess, both ratings are revealed. The session ends with a shareable cinematic poster style image card that includes score and session length.

## Problem Statement / Motivation
We want a lightweight game that feels fun in 1 to 2 minutes and is easy to share. The higher/lower mechanic is intuitive and rewards fast recognition while remaining accessible to casual players. A shareable result image helps the game spread organically.

## Proposed Solution
- Landing screen with a short explanation and a 5 or 10 round selector.
- Core loop: show two movie cards, accept higher/lower guess, reveal both ratings, update score and streak, then move to the next round.
- End screen: show total score and session length with a share action that generates a cinematic poster style image card.
- Use the IMDb Top 250 dataset for the movie pool.

## User Stories
- As a player, I want to choose a short or standard session length so I can play quickly or settle in for more rounds.
- As a player, I want to see only poster and title before guessing so the challenge feels fair.
- As a player, I want the ratings revealed after I guess so I can learn and feel the payoff.
- As a player, I want to keep playing after a wrong guess so the session feels casual and low pressure.
- As a player, I want a shareable poster at the end so I can show my score.

## User Flow
- Landing screen -> choose 5 or 10 rounds -> start session.
- Round: view two cards -> choose higher/lower -> reveal ratings and result -> tap Next.
- Final round -> results screen -> share or download image -> optional restart.

## Data & State Model
- Movie: id, title, rating, posterUrl.
- Session: targetRounds, currentRound, score, streak, startedAt, completedAt.
- Round: leftMovieId, rightMovieId, guess, outcome.
- Pool: shuffled list of Top 250 movies, usedIds set.

## Implementation Plan
- Source Top 250 data and poster URLs; add a local JSON snapshot for development.
- Build core game state machine (start, guess, reveal, advance, complete).
- Implement landing screen with round selector and default to 5.
- Implement round UI with two cards, higher/lower controls, and reveal state.
- Enforce uniqueness: draw without repeats; reroll ties.
- Implement results screen with score and session length.
- Build share image generator (client-side canvas or serverless render) and download fallback.
- Add accessibility: keyboard shortcuts, focus management, aria labels, readable text overlays.
- Instrument analytics events for start, guess, reveal, complete, share.

## Share Image Generation (Technical Plan)
- Default to a client-side canvas renderer for speed and no server dependency.
- Add a lightweight serverless poster proxy endpoint to avoid CORS-tainted canvas and enable caching.
- Create a dedicated share layout with fixed 1200x630 output, cinematic gradient overlay, and clear typography.
- Reuse the winning or last-round poster as the background; fall back to a textured gradient if missing.
- Include: game title, score (e.g., "7/10"), session length, and small attribution/URL.
- Use embedded web fonts via `FontFace` and pre-load before render to prevent layout shifts.
- Rendering flow:
  - Fetch poster via proxy to a Blob, draw to canvas, then draw gradient overlay.
  - Draw title and metadata with safe margins and line wrapping for long titles.
  - Export as PNG data URL, then offer Web Share if available, else download.
- Performance: cache poster blobs in memory for the session; cap image size and timeouts.
- Error handling: on any render failure, show a simplified text-only card and enable download.

## Edge Cases
- Poster missing or slow: show placeholder and allow play to continue.
- Equal ratings: reroll pair before presenting to the user.
- Image generation failure: fallback to download or share text.
- Re-entry or refresh mid-session: either resume from state or reset cleanly.
- Mobile layout: ensure cards and controls fit without overlap.

## Test Plan
- Unit: game state transitions, scoring, streak, tie reroll, uniqueness.
- UI: keyboard navigation, focus order, and reveal states.
- E2E: 5 and 10 round sessions, share flow, download fallback.
- Visual: poster placeholder, long titles, small screens.

## Rollout Plan
- Ship behind a feature flag or isolated route for initial testing.
- Validate data source licensing before public launch.
- Monitor share errors and image generation failures after release.

## Non-Goals
- Timed rounds or leaderboards in this release.
- Free-form movie search or user-submitted movies.

## Technical Considerations
- Data source and licensing for IMDb Top 250 and poster images must be validated before release.
- Handle missing posters or ratings without blocking gameplay.
- Share image generation needs a fallback when system share is unavailable.
- Accessibility: keyboard navigation, focus states, and readable text on poster images.
- Performance on mobile should remain smooth with image-heavy cards.

## Acceptance Criteria
- [x] Player can start a 5 or 10 round session from the landing screen.
- [x] If no length is selected, the session defaults to 5 rounds.
- [x] Each round shows two unique movies (poster + title only) from the IMDb Top 250.
- [x] Players choose higher/lower; both ratings are revealed to one decimal place.
- [x] Score increases on correct guesses; streak increases on correct and resets on incorrect.
- [x] Wrong guesses do not end the session; play continues to the next round.
- [x] Ties are prevented by re-rolling any pair with equal ratings.
- [x] No movie repeats within a single session.
- [x] A user-controlled Next action advances to the next round after the reveal.
- [x] Results screen shows score and session length, with a Share action.
- [x] Share generates a cinematic poster style image containing score and session length.
- [x] If system share is unavailable, users can download the share image.
- [x] If a poster fails to load, a placeholder is shown and the round continues.
- [x] App is usable on desktop and mobile, with keyboard-accessible controls.

## Success Metrics
- Share rate: percent of completed sessions that trigger share or download.
- Completion rate: percent of started sessions that reach the results screen.
- Average session duration and rounds per session.

## Dependencies & Risks
- IMDb Top 250 and poster usage may have licensing or attribution requirements.
- Poster load failures could affect visual quality and engagement.
- Share image generation could fail on some browsers; fallback is required.

## Open Questions
- Confirm the data source and usage rights for ratings and posters.
- Confirm the exact share image layout for the cinematic poster style.

## AI-Era Considerations
- Document any AI-generated assets or copy so they receive human review.
- Add explicit tests for share generation and error states to avoid regressions.

## References & Research
- Brainstorm: docs/brainstorms/2026-01-25-movie-rating-higher-lower-brainstorm.md
