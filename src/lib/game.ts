import type { Movie } from "@/lib/movies";

export type Guess = "left" | "right";
export type Outcome = "correct" | "wrong";
export type Phase = "landing" | "guess" | "reveal" | "complete";

export type Round = {
  left: Movie;
  right: Movie;
  guess: Guess | null;
  outcome: Outcome | null;
};

export type GameState = {
  phase: Phase;
  livesRemaining: number;
  totalGuesses: number;
  score: number;
  startedAt: number | null;
  completedAt: number | null;
  rounds: Round[];
  activeRound: Round | null;
  upcomingRounds: Round[];
  remaining: Movie[];
  error: string | null;
};

export type GameAction =
  | { type: "start"; movies: Movie[]; now: number }
  | { type: "guess"; guess: Guess }
  | { type: "next"; now: number }
  | { type: "reset" };

export const createInitialState = (): GameState => ({
  phase: "landing",
  livesRemaining: 3,
  totalGuesses: 0,
  score: 0,
  startedAt: null,
  completedAt: null,
  rounds: [],
  activeRound: null,
  upcomingRounds: [],
  remaining: [],
  error: null,
});

export const sanitizeMovies = (movies: Movie[]): Movie[] =>
  movies.filter((movie) => movie.id && typeof movie.rating === "number");

export const shuffleMovies = (movies: Movie[]): Movie[] => {
  const shuffled = [...movies];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
};

export const drawRound = (
  remaining: Movie[],
): { round: Round; remaining: Movie[] } | null => {
  if (remaining.length < 2) {
    return null;
  }

  const pool = [...remaining];
  const leftIndex = Math.floor(Math.random() * pool.length);
  const left = pool.splice(leftIndex, 1)[0];

  let rightIndex = Math.floor(Math.random() * pool.length);
  let right = pool.splice(rightIndex, 1)[0];
  let attempts = 0;

  while (right.rating === left.rating && attempts < pool.length) {
    pool.push(right);
    rightIndex = Math.floor(Math.random() * pool.length);
    right = pool.splice(rightIndex, 1)[0];
    attempts += 1;
  }

  if (right.rating === left.rating) {
    return null;
  }

  return {
    round: {
      left,
      right,
      guess: null,
      outcome: null,
    },
    remaining: pool,
  };
};

export const drawMultipleRounds = (
  remaining: Movie[],
  count: number,
): { rounds: Round[]; remaining: Movie[] } => {
  const rounds: Round[] = [];
  let pool = [...remaining];

  for (let i = 0; i < count; i += 1) {
    const result = drawRound(pool);
    if (!result) break;
    rounds.push(result.round);
    pool = result.remaining;
  }

  return { rounds, remaining: pool };
};

export const evaluateGuess = (round: Round, guess: Guess): Outcome => {
  const leftRating = round.left.rating ?? 0;
  const rightRating = round.right.rating ?? 0;
  const picked = guess === "left" ? leftRating : rightRating;
  const other = guess === "left" ? rightRating : leftRating;

  if (picked === other) {
    return "wrong";
  }

  return picked > other ? "correct" : "wrong";
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case "start": {
      const pool = shuffleMovies(sanitizeMovies(action.movies));
      const minimumNeeded = 2;

      if (pool.length < minimumNeeded) {
        return {
          ...createInitialState(),
          error: "Not enough movies to start a game.",
        };
      }

      // Draw 4 rounds upfront: 1 active + 3 upcoming for prefetching
      const { rounds: drawnRounds, remaining } = drawMultipleRounds(pool, 4);

      if (drawnRounds.length === 0) {
        return {
          ...createInitialState(),
          error: "Unable to find a valid starting pair.",
        };
      }

      const [activeRound, ...upcomingRounds] = drawnRounds;

      return {
        phase: "guess",
        livesRemaining: 3,
        totalGuesses: 0,
        score: 0,
        startedAt: action.now,
        completedAt: null,
        rounds: [],
        activeRound,
        upcomingRounds,
        remaining,
        error: null,
      };
    }
    case "guess": {
      if (state.phase !== "guess" || !state.activeRound) {
        return state;
      }

      const outcome = evaluateGuess(state.activeRound, action.guess);
      const score = outcome === "correct" ? state.score + 1 : state.score;
      const livesRemaining =
        outcome === "wrong" ? state.livesRemaining - 1 : state.livesRemaining;
      const completedRound = {
        ...state.activeRound,
        guess: action.guess,
        outcome,
      };

      return {
        ...state,
        score,
        livesRemaining,
        totalGuesses: state.totalGuesses + 1,
        rounds: [...state.rounds, completedRound],
        activeRound: completedRound,
        phase: "reveal",
      };
    }
    case "next": {
      if (state.phase !== "reveal") {
        return state;
      }

      if (state.livesRemaining <= 0) {
        return {
          ...state,
          phase: "complete",
          completedAt: action.now,
        };
      }

      // Pop next round from queue
      const [nextRound, ...remainingUpcoming] = state.upcomingRounds;

      if (!nextRound) {
        // Queue is empty, try to draw directly
        const draw = drawRound(state.remaining);
        if (!draw) {
          return {
            ...state,
            phase: "complete",
            completedAt: action.now,
            error: "Out of movies.",
          };
        }
        return {
          ...state,
          phase: "guess",
          activeRound: draw.round,
          upcomingRounds: [],
          remaining: draw.remaining,
        };
      }

      // Draw 1 more round to replenish the queue
      const draw = drawRound(state.remaining);
      const newUpcoming = draw
        ? [...remainingUpcoming, draw.round]
        : remainingUpcoming;
      const newRemaining = draw ? draw.remaining : state.remaining;

      return {
        ...state,
        phase: "guess",
        activeRound: nextRound,
        upcomingRounds: newUpcoming,
        remaining: newRemaining,
      };
    }
    case "reset":
      return createInitialState();
    default:
      return state;
  }
};
