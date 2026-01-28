import { describe, expect, it, vi } from "vitest";
import {
  createInitialState,
  drawRound,
  drawMultipleRounds,
  evaluateGuess,
  gameReducer,
  sanitizeMovies,
} from "./game";
import type { Movie } from "./movies";

const makeMovie = (id: string, rating: number): Movie => ({
  id,
  title: id,
  year: 2000,
  rating,
  posterUrl: null,
});

describe("sanitizeMovies", () => {
  it("filters out movies without numeric ratings", () => {
    const movies: Movie[] = [
      makeMovie("a", 8.2),
      { ...makeMovie("b", 7.1), rating: null },
      { ...makeMovie("c", 6.0), id: "" },
    ];

    const result = sanitizeMovies(movies);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });
});

describe("drawRound", () => {
  it("returns two unique movies and removes them from remaining", () => {
    const movies = [makeMovie("a", 8.1), makeMovie("b", 7.4), makeMovie("c", 6.2)];
    const spy = vi.spyOn(Math, "random").mockReturnValue(0);

    const result = drawRound(movies);

    spy.mockRestore();

    expect(result).not.toBeNull();
    expect(result?.round.left.id).toBe("a");
    expect(result?.round.right.id).toBe("b");
    expect(result?.remaining).toHaveLength(1);
    expect(result?.remaining[0].id).toBe("c");
  });

  it("returns null when only ties are possible", () => {
    const movies = [makeMovie("a", 8.0), makeMovie("b", 8.0)];
    const spy = vi.spyOn(Math, "random").mockReturnValue(0);

    const result = drawRound(movies);

    spy.mockRestore();

    expect(result).toBeNull();
  });
});

describe("drawMultipleRounds", () => {
  it("draws multiple rounds and removes movies from remaining", () => {
    const movies = [
      makeMovie("a", 8.0),
      makeMovie("b", 7.0),
      makeMovie("c", 6.0),
      makeMovie("d", 5.0),
      makeMovie("e", 4.0),
      makeMovie("f", 3.0),
    ];
    const spy = vi.spyOn(Math, "random").mockReturnValue(0);

    const result = drawMultipleRounds(movies, 3);

    spy.mockRestore();

    expect(result.rounds).toHaveLength(3);
    expect(result.remaining).toHaveLength(0);
  });

  it("returns fewer rounds if pool is exhausted", () => {
    const movies = [
      makeMovie("a", 8.0),
      makeMovie("b", 7.0),
      makeMovie("c", 6.0),
    ];
    const spy = vi.spyOn(Math, "random").mockReturnValue(0);

    const result = drawMultipleRounds(movies, 5);

    spy.mockRestore();

    expect(result.rounds).toHaveLength(1);
    expect(result.remaining).toHaveLength(1);
  });
});

describe("evaluateGuess", () => {
  it("evaluates higher and lower guesses correctly", () => {
    const round = {
      left: makeMovie("a", 7.2),
      right: makeMovie("b", 8.8),
      guess: null,
      outcome: null,
    };

    expect(evaluateGuess(round, "right")).toBe("correct");
    expect(evaluateGuess(round, "left")).toBe("wrong");
  });
});

describe("gameReducer", () => {
  it("runs through a lives-based session", () => {
    const movies = [
      makeMovie("a", 8.0),
      makeMovie("b", 7.0),
      makeMovie("c", 9.0),
      makeMovie("d", 6.0),
      makeMovie("e", 5.0),
      makeMovie("f", 4.0),
      makeMovie("g", 3.0),
      makeMovie("h", 2.0),
      makeMovie("i", 1.0),
      makeMovie("j", 10.0),
    ];
    const values = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let callIndex = 0;
    const spy = vi
      .spyOn(Math, "random")
      .mockImplementation(() => values[callIndex++] ?? 0);

    let state = gameReducer(createInitialState(), {
      type: "start",
      movies,
      now: 1000,
    });

    expect(state.livesRemaining).toBe(3);
    expect(state.totalGuesses).toBe(0);

    // First round: left=a(8.0), right=b(7.0)
    // Correct guess - score increments, lives stay same
    const correctGuess = state.activeRound!.left.rating! > state.activeRound!.right.rating! ? "left" : "right";
    state = gameReducer(state, { type: "guess", guess: correctGuess });
    expect(state.phase).toBe("reveal");
    expect(state.score).toBe(1);
    expect(state.livesRemaining).toBe(3);
    expect(state.totalGuesses).toBe(1);

    state = gameReducer(state, { type: "next", now: 2000 });
    expect(state.phase).toBe("guess");

    // Wrong guess - lives decrement, score stays same
    const wrongGuess = state.activeRound!.left.rating! > state.activeRound!.right.rating! ? "right" : "left";
    const scoreBeforeWrong = state.score;
    state = gameReducer(state, { type: "guess", guess: wrongGuess });
    expect(state.phase).toBe("reveal");
    expect(state.score).toBe(scoreBeforeWrong);
    expect(state.livesRemaining).toBe(2);
    expect(state.totalGuesses).toBe(2);

    state = gameReducer(state, { type: "next", now: 3000 });
    expect(state.phase).toBe("guess");

    // Another wrong guess
    const wrongGuess2 = state.activeRound!.left.rating! > state.activeRound!.right.rating! ? "right" : "left";
    state = gameReducer(state, { type: "guess", guess: wrongGuess2 });
    expect(state.livesRemaining).toBe(1);
    expect(state.totalGuesses).toBe(3);

    state = gameReducer(state, { type: "next", now: 4000 });
    expect(state.phase).toBe("guess");

    // Final wrong guess - lives reach 0
    const wrongGuess3 = state.activeRound!.left.rating! > state.activeRound!.right.rating! ? "right" : "left";
    state = gameReducer(state, { type: "guess", guess: wrongGuess3 });
    expect(state.livesRemaining).toBe(0);
    expect(state.totalGuesses).toBe(4);

    // Game should complete when lives reach 0
    state = gameReducer(state, { type: "next", now: 5000 });
    expect(state.phase).toBe("complete");
    expect(state.completedAt).toBe(5000);

    spy.mockRestore();
  });

  it("returns an error when there are not enough movies", () => {
    const movies = [makeMovie("a", 8.0)];

    const state = gameReducer(createInitialState(), {
      type: "start",
      movies,
      now: 1000,
    });

    expect(state.phase).toBe("landing");
    expect(state.error).toContain("Not enough movies");
  });
});
