"use client";

import Image from "next/image";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  createInitialState,
  gameReducer,
  type Guess,
} from "@/lib/game";
import type { Movie } from "@/lib/movies";
import { trackEvent } from "@/lib/analytics";
import { buildTwitterIntentUrl } from "@/lib/share-actions";
import { APP_NAME, buildShareText } from "@/lib/share-text";

type MovieGameProps = {
  movies: Movie[];
};


const formatRating = (rating: number | null) =>
  rating === null ? "N/A" : rating.toFixed(1);

const formatDuration = (start: number | null, end: number | null) => {
  if (!start || !end) {
    return "0:00";
  }
  const totalSeconds = Math.max(0, Math.round((end - start) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const getPosterUrl = (movie: Movie) => {
  if (movie.posterUrl) {
    return movie.posterUrl;
  }

  if (movie.posterPath) {
    const params = new URLSearchParams({
      id: movie.id,
      title: movie.title ?? "movie",
      path: movie.posterPath,
      size: "w500",
    });
    return `/api/poster?${params.toString()}`;
  }

  return null;
};

/* ------------------------------------------------------------------ */
/*  Inline SVG icon components                                        */
/* ------------------------------------------------------------------ */

const HeartIcon = ({
  filled,
  breaking,
}: {
  filled: boolean;
  breaking?: boolean;
}) => (
  <svg
    viewBox="0 0 24 24"
    className={`h-6 w-6 transition-all duration-300 ${
      filled
        ? "fill-[#e04050] text-[#e04050]"
        : "fill-none text-slate-300"
    } ${breaking ? "animate-heart-break" : ""}`}
    aria-hidden="true"
  >
    <path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      strokeWidth={filled ? 0 : 2}
      stroke="currentColor"
    />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
    <path d="M8 0l2.5 5 5.5.8-4 3.9.9 5.3L8 12.5 3.1 15l.9-5.3-4-3.9L5.5 5z" />
  </svg>
);

const FlameIcon = () => (
  <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  MovieCard                                                          */
/* ------------------------------------------------------------------ */

const MovieCard = ({
  movie,
  reveal,
  label,
  onSelect,
  disabled,
  isWinner,
  animationDelay = 0,
}: {
  movie: Movie;
  reveal: boolean;
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
  isWinner?: boolean;
  animationDelay?: number;
}) => {
  const title = movie.title ?? "Untitled";
  const posterUrl = getPosterUrl(movie);
  const [imageFailed, setImageFailed] = useState(false);
  const effectivePosterUrl = imageFailed ? null : posterUrl;
  const sharedBody = (
    <div className="relative aspect-[2/3] max-h-[calc(100dvh-11rem)] w-full bg-[#1a1a2e]">
      {effectivePosterUrl ? (
        <Image
          src={effectivePosterUrl}
          alt={title}
          fill
          sizes="(min-width: 1024px) 420px, (min-width: 640px) 45vw, 90vw"
          className="object-contain"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(160deg,#1f2937,#43382c_55%,#b08957)] p-6 text-center">
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
              Poster unavailable
            </div>
            <div className="text-lg font-semibold leading-snug text-white">
              {title}
            </div>
          </div>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 text-white">
        <div className="text-[0.65rem] uppercase tracking-[0.35em] text-white/70">
          {label}
        </div>
        <div className="mt-2 text-lg font-semibold leading-snug text-white">
          {title}
        </div>
      </div>
      {reveal ? (
        <div
          className={`absolute left-4 top-4 rounded-full px-3.5 py-1.5 text-sm font-bold shadow-lg transition-all ${
            isWinner
              ? "bg-[#c48a3b] text-white ring-2 ring-[#c48a3b]/30"
              : "bg-white/80 text-slate-500"
          }`}
        >
          <span className="flex items-center gap-1">
            {isWinner && <StarIcon />}
            {formatRating(movie.rating ?? null)}
          </span>
        </div>
      ) : null}
    </div>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        aria-label={`Select ${title}`}
        style={{ animationDelay: `${animationDelay}ms` }}
        className="animate-fade-slide-up relative flex w-full flex-col overflow-hidden rounded-3xl border border-black/10 bg-white/80 text-left shadow-[0_24px_50px_-30px_rgba(15,15,20,0.6)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6efe5] hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {sharedBody}
      </button>
    );
  }

  return (
    <div
      style={{ animationDelay: `${animationDelay}ms` }}
      className="animate-fade-slide-up relative flex w-full flex-col overflow-hidden rounded-3xl border border-black/10 bg-white/80 text-left shadow-[0_24px_50px_-30px_rgba(15,15,20,0.6)]"
    >
      {sharedBody}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  ScoreCard (game-over screen)                                       */
/* ------------------------------------------------------------------ */

const defaultShareHost = () => {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) {
    try {
      return new URL(envUrl).host;
    } catch {
      // Ignore malformed env value.
    }
  }

  return "cinescoreduel.com";
};

const ScoreCard = ({
  score,
  totalGuesses,
  host,
}: {
  score: number;
  totalGuesses: number;
  host: string;
}) => (
  <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-black/10 bg-[linear-gradient(160deg,#1f2937,#43382c_55%,#b08957)] px-8 py-10 text-left text-white shadow-[0_32px_70px_-35px_rgba(15,15,20,0.7)] sm:px-12">
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.55)_55%,rgba(0,0,0,0.85))]" />
    <div className="relative space-y-4">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/70">
        {APP_NAME}
      </p>
      <p className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
        {score} correct
      </p>
      <p className="text-xs uppercase tracking-[0.3em] text-white/70">
        {totalGuesses} {totalGuesses === 1 ? "guess" : "guesses"} · {((score / totalGuesses) * 100).toFixed(0)}% accuracy
      </p>
      <p className="text-xs text-white/60">{host}</p>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main game component                                                */
/* ------------------------------------------------------------------ */

export default function MovieGame({ movies }: MovieGameProps) {
  const [state, dispatch] = useReducer(gameReducer, createInitialState());
  const nextButtonRef = useRef<HTMLButtonElement | null>(null);
  const shareButtonRef = useRef<HTMLButtonElement | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<
    "idle" | "loading" | "copied" | "error"
  >("idle");
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareHost, setShareHost] = useState(defaultShareHost);

  /* Heart break animation tracking */
  const prevLivesRef = useRef(state.livesRemaining);
  const [breakingLifeIndex, setBreakingLifeIndex] = useState<number | null>(null);

  const playableMovies = useMemo(
    () => movies.filter((movie) => typeof movie.rating === "number"),
    [movies],
  );

  const hasCachedPosters = useMemo(
    () => movies.some((movie) => Boolean(movie.posterUrl)),
    [movies],
  );

  /* Compute current streak from rounds history */
  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = state.rounds.length - 1; i >= 0; i--) {
      if (state.rounds[i].outcome === "correct") {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [state.rounds]);

  const handleStart = () => {
    dispatch({
      type: "start",
      movies: playableMovies,
      now: Date.now(),
    });
    trackEvent("session_start", {});
  };

  const handleGuess = (guess: Guess) => {
    dispatch({ type: "guess", guess });
  };

  const handleNext = () => {
    dispatch({ type: "next", now: Date.now() });
  };

  const handleReset = () => {
    dispatch({ type: "reset" });
  };

  const requestShareUrl = async () => {
    const response = await fetch("/api/share", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        score: state.score,
        totalGuesses: state.totalGuesses,
      }),
    });

    if (!response.ok) {
      throw new Error("Share request failed");
    }

    const data = (await response.json()) as {
      shareUrl?: string;
      sharePath?: string;
    };
    const url =
      data.shareUrl ??
      new URL(data.sharePath ?? "/", window.location.origin).toString();
    setShareUrl(url);
    return url;
  };

  const ensureShareUrl = async () => {
    if (shareUrl) {
      return shareUrl;
    }

    return requestShareUrl();
  };

  const handleShare = async () => {
    setShareError(null);
    setShareStatus("loading");

    try {
      const url = await ensureShareUrl();
      const text = buildShareText(state.score, state.totalGuesses);
      const intentUrl = buildTwitterIntentUrl({ text, url });
      window.open(intentUrl, "_blank", "noopener,noreferrer");
      trackEvent("share_intent", {
        score: state.score,
        totalGuesses: state.totalGuesses,
      });
      setShareStatus("idle");
    } catch {
      setShareError("Unable to prepare share link.");
      setShareStatus("error");
    } finally {
      shareButtonRef.current?.focus();
    }
  };

  const handleCopyLink = async () => {
    setShareError(null);
    setShareStatus("loading");

    try {
      const url = await ensureShareUrl();
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        window.prompt("Copy this link", url);
      }
      trackEvent("share_copy", {
        score: state.score,
        totalGuesses: state.totalGuesses,
      });
      setShareStatus("copied");
    } catch {
      setShareError("Unable to copy share link.");
      setShareStatus("error");
    }
  };

  /* Keyboard: L/R during guess phase */
  useEffect(() => {
    if (state.phase !== "guess") {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "l") {
        event.preventDefault();
        dispatch({ type: "guess", guess: "left" });
      }

      if (event.key === "ArrowRight" || event.key.toLowerCase() === "r") {
        event.preventDefault();
        dispatch({ type: "guess", guess: "right" });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.phase]);

  /* Keyboard: Enter/Space during reveal phase */
  useEffect(() => {
    if (state.phase !== "reveal") {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        dispatch({ type: "next", now: Date.now() });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.phase]);

  useEffect(() => {
    setShareHost(window.location.host);
  }, []);

  useEffect(() => {
    if (shareStatus === "copied") {
      const timer = window.setTimeout(() => {
        setShareStatus("idle");
      }, 2000);

      return () => window.clearTimeout(timer);
    }
  }, [shareStatus]);

  useEffect(() => {
    if (state.phase !== "complete") {
      setShareUrl(null);
      setShareStatus("idle");
      setShareError(null);
    }
  }, [state.phase]);

  useEffect(() => {
    if (state.phase === "reveal") {
      nextButtonRef.current?.focus();
    }
  }, [state.phase]);

  /* Heart break animation */
  useEffect(() => {
    if (state.livesRemaining < prevLivesRef.current) {
      const lostIndex = state.livesRemaining;
      setBreakingLifeIndex(lostIndex);
      const timer = setTimeout(() => setBreakingLifeIndex(null), 600);
      prevLivesRef.current = state.livesRemaining;
      return () => clearTimeout(timer);
    }
    prevLivesRef.current = state.livesRemaining;
  }, [state.livesRemaining]);

  /* Reset heart tracking on game restart */
  useEffect(() => {
    if (state.phase === "landing") {
      prevLivesRef.current = 3;
      setBreakingLifeIndex(null);
    }
  }, [state.phase]);

  useEffect(() => {
    if (state.phase === "reveal") {
      const lastRound = state.rounds[state.rounds.length - 1];
      if (lastRound) {
        trackEvent("guess", {
          guess: lastRound.guess,
          outcome: lastRound.outcome,
        });
      }
    }

    if (state.phase === "complete") {
      trackEvent("session_complete", {
        score: state.score,
        totalGuesses: state.totalGuesses,
        durationSeconds:
          state.startedAt && state.completedAt
            ? Math.round((state.completedAt - state.startedAt) / 1000)
            : 0,
      });
    }
  }, [
    state.phase,
    state.rounds,
    state.score,
    state.totalGuesses,
    state.startedAt,
    state.completedAt,
  ]);

  /* ---------------------------------------------------------------- */
  /*  Landing screen                                                   */
  /* ---------------------------------------------------------------- */

  if (state.phase === "landing") {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-700">
          IMDb Top 250 Duel
        </div>
        <div className="max-w-2xl space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Choose the higher rating. Three lives. Keep playing.
          </h1>
          <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
            Two movie posters enter. One rating reigns. Tap the movie you think
            is higher. Wrong guess costs a life. Play until you run out.
          </p>
        </div>
        <button
          type="button"
          onClick={handleStart}
          className="rounded-full bg-[#c48a3b] px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg shadow-amber-500/30 transition hover:-translate-y-0.5 hover:bg-[#b47931]"
        >
          Start game
        </button>
        {!hasCachedPosters ? (
          <p className="max-w-lg rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-900">
            Cached posters missing. Run TMDB ingest with cache enabled.
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs uppercase tracking-[0.3em] text-slate-500">
          <span>Untimed gameplay</span>
          <span>3 lives to start</span>
          <span>Results recap</span>
        </div>
        {state.error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}
      </section>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Complete screen                                                  */
  /* ---------------------------------------------------------------- */

  if (state.phase === "complete") {
    const sessionLength = formatDuration(state.startedAt, state.completedAt);
    const shareDisabled = shareStatus === "loading";
    const shareLabel = shareDisabled ? "Preparing..." : "Share on X";
    const copyLabel = shareStatus === "copied" ? "Link copied" : "Copy link";

    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-700">
          Session complete
        </div>
        <ScoreCard
          score={state.score}
          totalGuesses={state.totalGuesses}
          host={shareHost}
        />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleShare}
            disabled={shareDisabled}
            ref={shareButtonRef}
            className="rounded-full bg-slate-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {shareLabel}
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            disabled={shareDisabled}
            className="rounded-full border border-black/10 bg-white/80 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {copyLabel}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-black/10 bg-white/80 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700"
          >
            Play again
          </button>
        </div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
          Elapsed time · {sessionLength}
        </p>
        {shareStatus === "loading" ? (
          <p aria-live="polite" className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Preparing share link
          </p>
        ) : null}
        {shareStatus === "copied" ? (
          <p aria-live="polite" className="text-xs uppercase tracking-[0.3em] text-emerald-600">
            Link copied to clipboard
          </p>
        ) : null}
        {shareError ? (
          <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {shareError}
          </p>
        ) : null}
        {state.error ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {state.error}
          </p>
        ) : null}
      </section>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Active game (guess / reveal)                                     */
  /* ---------------------------------------------------------------- */

  const activeRound = state.activeRound;

  if (!activeRound) {
    return null;
  }

  const reveal = state.phase === "reveal";
  const outcome = activeRound.outcome;
  const leftRating = activeRound.left.rating ?? 0;
  const rightRating = activeRound.right.rating ?? 0;
  const higherSide = leftRating >= rightRating ? "left" : "right";
  const roundKey = `${activeRound.left.id}-${activeRound.right.id}`;

  return (
    <section className="mx-auto flex h-[100dvh] w-full max-w-6xl flex-col px-6 py-4">
      {/* ---- Header ---- */}
      <header className="film-strip-border flex flex-shrink-0 flex-wrap items-center justify-between gap-4 rounded-3xl border border-black/10 bg-white/80 px-6 py-4">
        <div className="flex items-center gap-5">
          {/* Hearts */}
          <div
            className="flex items-center gap-1.5"
            aria-label={`${state.livesRemaining} lives remaining`}
          >
            {Array.from({ length: 3 }, (_, i) => (
              <HeartIcon
                key={i}
                filled={i < state.livesRemaining}
                breaking={i === breakingLifeIndex}
              />
            ))}
          </div>
          {/* Divider */}
          <div className="h-8 w-px bg-slate-200" />
          {/* Score */}
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-400">
              Score
            </p>
            <p className="text-2xl font-semibold text-slate-900">
              {state.score}
            </p>
          </div>
          {/* Streak */}
          {currentStreak >= 2 && (
            <div className="animate-pulse-gold flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              <FlameIcon />
              {currentStreak}x
            </div>
          )}
        </div>
        <div className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
          Pick the higher rating
        </div>
      </header>

      {/* ---- Card grid (flexible middle) ---- */}
      <div className="mt-4 flex min-h-0 flex-1 items-center">
        <div
          key={roundKey}
          className="grid w-full gap-4 lg:grid-cols-[1fr_auto_1fr]"
        >
          <MovieCard
            movie={activeRound.left}
            reveal={reveal}
            label="Left"
            onSelect={reveal ? undefined : () => handleGuess("left")}
            disabled={reveal}
            isWinner={reveal && higherSide === "left"}
            animationDelay={0}
          />

          {/* VS divider */}
          <div className="flex items-center justify-center gap-4 lg:flex-col">
            {/* Horizontal lines on mobile */}
            <div className="h-px flex-1 bg-slate-300 lg:hidden" />

            <div className="flex flex-col items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-300 bg-white/90 shadow-sm"
                style={{ fontFamily: "var(--font-title)" }}
              >
                <span className="text-sm font-bold tracking-wide text-slate-700">
                  VS
                </span>
              </div>

              {reveal ? (
                <span
                  aria-live="polite"
                  className={`flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-[0.2em] shadow-sm ${
                    outcome === "correct"
                      ? "bg-emerald-500 text-white"
                      : "bg-rose-500 text-white animate-wrong-shake"
                  }`}
                >
                  {outcome === "correct" ? <CheckIcon /> : <XIcon />}
                  {outcome === "correct" ? "Correct" : "Wrong"}
                </span>
              ) : (
                <span className="rounded-full bg-white/80 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">
                  Make your call
                </span>
              )}
            </div>

            {/* Horizontal lines on mobile */}
            <div className="h-px flex-1 bg-slate-300 lg:hidden" />
          </div>

          <MovieCard
            movie={activeRound.right}
            reveal={reveal}
            label="Right"
            onSelect={reveal ? undefined : () => handleGuess("right")}
            disabled={reveal}
            isWinner={reveal && higherSide === "right"}
            animationDelay={100}
          />
        </div>
      </div>

      {/* ---- Bottom action bar (always visible) ---- */}
      <div className="flex flex-shrink-0 flex-wrap items-center justify-center gap-4 pb-2 pt-4">
        {reveal ? (
          <button
            type="button"
            onClick={handleNext}
            ref={nextButtonRef}
            className="rounded-full bg-slate-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Next
            <span className="ml-2 hidden text-[0.6rem] text-white/50 sm:inline">
              [Enter]
            </span>
          </button>
        ) : (
          <p className="rounded-full border border-black/10 bg-white/80 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
            Tap the movie you think is higher
            <span className="ml-3 hidden text-slate-400 sm:inline">
              [L] / [R]
            </span>
          </p>
        )}
      </div>
    </section>
  );
}
