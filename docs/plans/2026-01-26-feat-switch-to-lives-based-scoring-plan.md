---
title: feat: Switch to lives-based scoring
type: feat
date: 2026-01-26
---

# Switch to lives-based scoring

## Overview
Replace round-based sessions and streak scoring with a lives-based session model. Each session starts with 3 lives, a wrong guess consumes 1 life, and play continues until lives reach 0 (or the movie pool cannot produce a valid pair). The score is the total number of correct answers. Remove round selection, round counters, and streak UI while keeping the higher/lower mechanic, untimed rounds, Top 250 pool, and rating reveal after each guess.

## Stakeholders
- Players: faster start, simpler scoring, longer play if they keep guessing correctly.
- Developers: update reducer, UI, share payloads, and tests across core files.
- Operations: monitor share endpoints and OG image generation after scoring change.

## Problem Statement / Motivation
The current 5/10 round selector and streak scoring add friction and complexity for a casual game. A lives-based session is simpler to understand (keep playing until you miss) and aligns with the desired low-pressure, continuous play experience.

## Proposed Solution
- Landing: replace 5/10 round selector with a single Start action.
- Session rules: initialize with 3 lives; decrement on wrong guess; end when lives hit 0 or when no valid pair can be drawn.
- Scoring: score increments on correct guesses only; remove streaks and round counters.
- Results/share: show final score as a count of correct answers; remove any rounds-based text.

## User Stories
- As a player, I can start a session immediately without choosing a length.
- As a player, I can see how many lives remain as I play.
- As a player, a wrong guess costs a life but the session continues until lives reach 0.
- As a player, I can share a result that reflects my correct answers.

## User Flow
- Landing -> Start session (3 lives).
- Guess -> Reveal -> Update score or lives -> Next pair while lives > 0.
- Lives reach 0 or no valid pair -> Results -> Share or Play again.

## Data & State Model
- Session: livesRemaining, score, totalGuesses, startedAt, completedAt.
- Round: leftMovieId, rightMovieId, guess, outcome.
- Remove: targetRounds, currentRound, streak.

## Implementation Plan
- Update game state and reducer to use lives-based completion logic in `src/lib/game.ts`.
- Replace round and streak UI with lives display and score-only summary in `src/components/MovieGame.tsx`.
- Update share text, signature payload, and OG image rendering to remove rounds in `src/lib/share-text.ts`, `src/lib/share-signature.ts`, `src/app/api/share/route.ts`, `src/app/share/og/route.tsx`.
- Adjust tests for new session rules in `src/lib/game.test.ts` and `src/lib/share-signature.test.ts`.
- Audit analytics payloads for rounds/streak references and update if present in `src/components/MovieGame.tsx`.

## Edge Cases
- No valid pair available while lives remain: end session with a clear message (for example, "Out of movies").
- Equal ratings: continue to reroll ties before presenting a round.
- Share/signature failures: fall back to share text without breaking results screen.

## Test Plan
- Unit: lives decrement, score increment, completion when lives reach 0, pool exhaustion handling.
- UI: lives display updates, results summary text, removal of round selector and streak labels.
- Share: signature validation without rounds, OG image text reflects score only.

## Rollout Plan
- Ship directly with focused QA on results and share flows.
- Monitor share endpoint errors and OG image rendering after release.

## Non-Goals
- Variable lives or difficulty modes.
- Streak-based bonuses or round-based leaderboards.

## Technical Considerations
- Share payload currently requires rounds; redesign to score-only and update validation.
- Define a new share payload schema (for example, score + totalGuesses + version) and clamping rules.
- Ensure accessibility for life loss feedback (announce changes or provide clear text).
- Clarify behavior when pool exhaustion ends the session before lives reach 0.
- Add a tie reroll attempt limit to prevent infinite loops and define fallback behavior.

## Acceptance Criteria
- [ ] Landing screen starts a session without a round selector.
- [ ] Sessions initialize with 3 lives, displayed during gameplay.
- [ ] Correct guesses increment score by 1.
- [ ] Wrong guesses decrement lives by 1 exactly once per reveal.
- [ ] Session ends when lives reach 0 and shows results.
- [ ] If no valid pair can be drawn, session ends with a specific message.
- [ ] Results and share output do not reference rounds or streaks.
- [ ] Share signature and OG image render correctly with score-only data.

## Success Metrics
- Completion rate of started sessions.
- Average correct answers per session.
- Share rate for completed sessions.

## Dependencies & Risks
- Share signature and OG output are tightly coupled to rounds; changes must be coordinated.
- Pool exhaustion may end sessions early; messaging must be clear to avoid confusion.
- Analytics events may need updates if they include round or streak fields.

## Open Questions
- Confirm lives are fixed at 3 (default) rather than configurable.
- Confirm session end priority when lives remain but no valid pairs exist.
- Confirm share copy format (default: "X correct").
- Define share payload schema and score clamping rules.
- Decide whether to display secondary stats (time, total guesses, accuracy).
- Set a tie reroll attempt limit and fallback behavior.
- Decide replay pool strategy (reshuffle full pool vs continue remaining).

## AI-Era Considerations
- Note any AI-generated changes in the PR description for human review.
- Add explicit tests for the new completion conditions to avoid regressions.

## References & Research
- Brainstorm: `docs/brainstorms/2026-01-25-movie-rating-higher-lower-brainstorm.md`
- Existing plan: `docs/plans/2026-01-26-feat-movie-rating-higher-lower-game-plan.md`
- Game state: `src/lib/game.ts:14`, `src/lib/game.ts:115`
- UI entry: `src/components/MovieGame.tsx:75`, `src/components/MovieGame.tsx:395`, `src/components/MovieGame.tsx:517`
- Share text: `src/lib/share-text.ts:5`, `src/lib/share-text.ts:16`
- Share signature: `src/lib/share-signature.ts:51`, `src/app/api/share/route.ts:14`
- OG image: `src/app/share/og/route.tsx:27`
- Tests: `src/lib/game.test.ts:1`, `src/lib/share-signature.test.ts:1`
- External research: skipped (local patterns sufficient; no docs/solutions found)
