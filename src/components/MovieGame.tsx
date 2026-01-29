"use client";

import Image from "next/image";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createInitialState, gameReducer, type Guess, type Round } from "@/lib/game";
import type { Movie } from "@/lib/movies";
import { trackEvent } from "@/lib/analytics";
import { buildTwitterIntentUrl } from "@/lib/share-actions";
import { APP_NAME, buildShareText } from "@/lib/share-text";

type MovieGameProps = {
  movies: Movie[];
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const formatRating = (rating: number | null) =>
  rating === null ? "N/A" : rating.toFixed(1);

const formatDuration = (start: number | null, end: number | null) => {
  if (!start || !end) return "0:00";
  const totalSeconds = Math.max(0, Math.round((end - start) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const getPosterUrl = (movie: Movie) => {
  if (movie.posterUrl) return movie.posterUrl;
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
/*  Icons                                                             */
/* ------------------------------------------------------------------ */

const HeartIcon = ({
  filled,
  breaking,
}: {
  filled: boolean;
  breaking?: boolean;
}) => (
  <div className="relative w-6 h-6">
    {/* Empty Heart Background (Always visible as placeholder) */}
    <svg
      viewBox="0 0 24 24"
      className="absolute inset-0 w-6 h-6 fill-none text-zinc-800"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </svg>

    {/* Filled Heart (Visible when filled or breaking) */}
    {(filled || breaking) && (
      <svg
        viewBox="0 0 24 24"
        className={`absolute inset-0 w-6 h-6 transition-all duration-300 fill-error text-error drop-shadow-[0_0_8px_rgba(244,63,94,0.6)] ${
          breaking ? "animate-heart-break" : ""
        }`}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
      </svg>
    )}
  </div>
);

const BoltIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-8 h-8 fill-accent text-accent animate-pulse-glow"
    aria-hidden="true"
  >
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const StarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-5 h-5 fill-accent text-accent"
    aria-hidden="true"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Components                                                        */
/* ------------------------------------------------------------------ */

const PosterPrefetcher = ({ rounds }: { rounds: Round[] }) => {
  useEffect(() => {
    rounds.forEach((round) => {
      const leftUrl = getPosterUrl(round.left);
      const rightUrl = getPosterUrl(round.right);
      // Use Image objects instead of fetch() to properly prime browser cache
      if (leftUrl) {
        const img = new window.Image();
        img.src = leftUrl;
      }
      if (rightUrl) {
        const img = new window.Image();
        img.src = rightUrl;
      }
    });
  }, [rounds]);

  return null;
};

const MovieCard = ({
  movie,
  reveal,
  label,
  onSelect,
  disabled,
  isWinner,
  isLoser,
  isSelected,
  delay = 0,
}: {
  movie: Movie;
  reveal: boolean;
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
  isWinner?: boolean;
  isLoser?: boolean;
  isSelected?: boolean;
  delay?: number;
}) => {
  const title = movie.title ?? "Untitled";
  const posterUrl = getPosterUrl(movie);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const effectivePosterUrl = imageFailed ? null : posterUrl;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`group relative w-full h-full overflow-hidden bg-zinc-900 transition-all duration-500 focus:outline-none ${
        !reveal && !disabled ? "cursor-pointer hover:z-10" : "cursor-default"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background Image */}
      <div
        className={`absolute inset-0 transition-transform duration-700 ease-out ${!reveal && !disabled ? "group-hover:scale-105" : ""}`}
      >
        {/* Loading placeholder - shown while image loads */}
        {effectivePosterUrl && !imageLoaded && (
          <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
        )}
        {effectivePosterUrl ? (
          <Image
            src={effectivePosterUrl}
            alt={title}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className={`object-cover transition-opacity duration-300 ${
              !imageLoaded
                ? "opacity-0"
                : reveal && isLoser
                  ? "opacity-30 grayscale"
                  : "opacity-60 group-hover:opacity-80"
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageFailed(true)}
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-zinc-600">
            <span className="font-display text-2xl uppercase tracking-widest opacity-20">
              No Poster
            </span>
          </div>
        )}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 flex flex-col items-start text-left z-20">
        <span className="font-mono text-xs text-accent uppercase tracking-[0.2em] mb-2 opacity-80">
          {label}
        </span>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[0.9] text-white uppercase break-words w-full shadow-black drop-shadow-lg">
          {title}
        </h2>
      </div>

      {/* Reveal Overlay */}
      {reveal && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pb-24 sm:pb-32 animate-scale-in">
          <div className="flex flex-col items-center justify-center p-6 text-center bg-black/50 backdrop-blur-sm rounded-2xl">
            {/* Huge Stamp Feedback - Only on selected card */}
            {isSelected &&
              (isWinner ? (
                <div className="font-display text-5xl sm:text-7xl text-success tracking-tighter uppercase -rotate-6 border-4 border-success px-4 py-2 opacity-90 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                  Correct
                </div>
              ) : isLoser ? (
                <div className="font-display text-5xl sm:text-7xl text-error tracking-tighter uppercase rotate-6 border-4 border-error px-4 py-2 opacity-90 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]">
                  Wrong
                </div>
              ) : null)}

            {/* Rating Below - Secondary */}
            <div className="mt-6 flex flex-col items-center">
              <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-1">
                IMDb Rating
              </span>
              <span
                className={`text-4xl font-display ${isWinner ? "text-white" : "text-zinc-500"}`}
              >
                {formatRating(movie.rating ?? null)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Selection Highlight (Hover) */}
      {!reveal && !disabled && (
        <div className="absolute inset-0 border-4 border-transparent group-hover:border-accent/50 transition-colors duration-300 pointer-events-none" />
      )}
    </button>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Game                                                         */
/* ------------------------------------------------------------------ */

export default function MovieGame({ movies }: MovieGameProps) {
  const [state, dispatch] = useReducer(gameReducer, createInitialState());
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  // Share state
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [canCopyImage, setCanCopyImage] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const feedbackTimerRef = useRef<number | null>(null);

  const playableMovies = useMemo(
    () => movies.filter((m) => typeof m.rating === "number"),
    [movies],
  );

  // Effects
  useEffect(() => {
    if (state.phase === "reveal") nextButtonRef.current?.focus();
  }, [state.phase]);

  useEffect(() => {
    // Detect mobile devices
    const mobileCheck =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      ) ||
      (navigator.maxTouchPoints > 0 && window.innerWidth < 768);
    setIsMobile(mobileCheck);

    // Check clipboard image support (only reliable on desktop)
    const supportsClipboardItem =
      typeof ClipboardItem !== "undefined" &&
      (typeof ClipboardItem.supports !== "function" ||
        ClipboardItem.supports("image/png"));
    const supportsClipboardWrite =
      typeof navigator.clipboard?.write === "function";
    const supportsClipboardImage =
      window.isSecureContext && supportsClipboardItem && supportsClipboardWrite;
    const supportsExecCopy =
      (document.queryCommandSupported?.("copy") ?? false) === true;
    // Only enable copy image on non-mobile devices
    setCanCopyImage(
      !mobileCheck && (supportsClipboardImage || supportsExecCopy),
    );
  }, []);

  useEffect(
    () => () => {
      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (state.phase === "reveal") {
      const lastRound = state.rounds[state.rounds.length - 1];
      if (lastRound)
        trackEvent("guess", {
          guess: lastRound.guess,
          outcome: lastRound.outcome,
        });
    } else if (state.phase === "complete") {
      trackEvent("session_complete", {
        score: state.score,
        totalGuesses: state.totalGuesses,
      });
    }
  }, [state.phase, state.rounds, state.score, state.totalGuesses]);

  // Handlers
  const handleStart = () => {
    dispatch({ type: "start", movies: playableMovies, now: Date.now() });
    trackEvent("session_start", {});
  };

  const handleGuess = (guess: Guess) => dispatch({ type: "guess", guess });
  const handleNext = () => dispatch({ type: "next", now: Date.now() });
  const handleReset = () => dispatch({ type: "reset" });

  const setFeedback = (message: string | null) => {
    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    setShareFeedback(message);
    if (message) {
      feedbackTimerRef.current = window.setTimeout(() => {
        setShareFeedback(null);
        feedbackTimerRef.current = null;
      }, 2500);
    }
  };

  const copyTextToClipboard = async (text: string) => {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!ok) {
      window.prompt("Copy this link:", text);
    }
    return ok;
  };

  const copyImageToClipboard = async (blob: Blob) => {
    if (!window.isSecureContext) return false;
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      return false;
    }
    if (
      typeof ClipboardItem.supports === "function" &&
      !ClipboardItem.supports("image/png")
    ) {
      return false;
    }

    const pngBlob =
      blob.type === "image/png" ? blob : blob.slice(0, blob.size, "image/png");
    const clipboardItem = new ClipboardItem({ "image/png": pngBlob });
    await navigator.clipboard.write([clipboardItem]);
    return true;
  };

  const copyImageWithExecCommand = async (blob: Blob) => {
    if (!document.body) return false;
    if ((document.queryCommandSupported?.("copy") ?? false) === false) {
      return false;
    }

    const blobUrl = URL.createObjectURL(blob);
    const img = document.createElement("img");
    img.src = blobUrl;
    img.alt = "Share image";
    img.style.position = "fixed";
    img.style.top = "0";
    img.style.left = "-9999px";
    img.style.opacity = "0";
    img.style.pointerEvents = "none";
    document.body.appendChild(img);

    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image load failed"));
      });
      const selection = window.getSelection();
      if (!selection) return false;
      selection.removeAllRanges();
      const range = document.createRange();
      range.selectNode(img);
      selection.addRange(range);
      const ok = document.execCommand("copy");
      selection.removeAllRanges();
      return ok;
    } catch {
      return false;
    } finally {
      document.body.removeChild(img);
      URL.revokeObjectURL(blobUrl);
    }
  };

  const ensureShareUrl = async () => {
    if (shareUrl) return shareUrl;
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: state.score,
          totalGuesses: state.totalGuesses,
        }),
      });
      if (!res.ok) throw new Error("Share failed");
      const data = await res.json();
      const url =
        data.shareUrl ||
        new URL(data.sharePath || "/", window.location.origin).toString();
      setShareUrl(url);
      return url;
    } catch {
      return window.location.href;
    }
  };

  const fetchShareImage = async (shareUrl: string) => {
    const ogUrl = `/share/og${new URL(shareUrl).search}`;
    const res = await fetch(ogUrl);
    if (!res.ok) return null;
    return res.blob();
  };

  const handleShare = async () => {
    if (shareStatus === "loading") return;
    setShareStatus("loading");
    setFeedback(null);
    trackEvent("share_attempt", { method: "share_button" });
    try {
      const text = buildShareText(state.score, state.totalGuesses);
      const baseUrl = window.location.origin;

      // Try Web Share API with image (works on mobile + modern desktop)
      if (navigator.share) {
        try {
          // Generate image URL for fetching (still needs params internally)
          const shareUrlForImage = await ensureShareUrl();
          const blob = await fetchShareImage(shareUrlForImage);
          if (blob) {
            const file = new File([blob], "cineclash-score.png", {
              type: "image/png",
            });
            if (navigator.canShare?.({ files: [file] })) {
              trackEvent("share_attempt", { method: "web_share_image" });
              await navigator.share({ text, url: baseUrl, files: [file] });
              trackEvent("share_success", { method: "web_share_image" });
              setShareStatus("idle");
              setFeedback("Shared");
              return;
            }
          }
        } catch (e) {
          // User cancelled the share sheet — not an error
          if (e instanceof Error && e.name === "AbortError") {
            setShareStatus("idle");
            setFeedback("Share cancelled");
            return;
          }
          trackEvent("share_fallback", {
            from: "web_share_image",
            to: "web_share_text",
          });
        }

        try {
          trackEvent("share_attempt", { method: "web_share_text" });
          await navigator.share({ text, url: baseUrl });
          trackEvent("share_success", { method: "web_share_text" });
          setShareStatus("idle");
          setFeedback("Shared");
          return;
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError") {
            setShareStatus("idle");
            setFeedback("Share cancelled");
            return;
          }
          trackEvent("share_fallback", {
            from: "web_share_text",
            to: "twitter_intent",
          });
        }
      }

      // Fallback: Twitter intent
      trackEvent("share_attempt", { method: "twitter_intent" });
      window.open(
        buildTwitterIntentUrl({ text, url: baseUrl }),
        "_blank",
        "noopener,noreferrer",
      );
      trackEvent("share_success", { method: "twitter_intent" });
      setShareStatus("idle");
      setFeedback("Opened X");
    } catch {
      setShareStatus("error");
      setFeedback("Share failed");
      trackEvent("share_error", { method: "share_button" });
    }
  };

  const handleCopyLink = async () => {
    if (shareStatus === "loading") return;
    setShareStatus("loading");
    setFeedback(null);
    trackEvent("share_attempt", { method: "copy_link" });
    try {
      const url = await ensureShareUrl();
      const ok = await copyTextToClipboard(url);
      if (ok) {
        trackEvent("share_success", { method: "copy_link" });
        setFeedback("Link copied");
      } else {
        trackEvent("share_error", { method: "copy_link" });
        setFeedback("Copy failed");
      }
      setShareStatus("idle");
    } catch {
      setShareStatus("error");
      setFeedback("Copy failed");
      trackEvent("share_error", { method: "copy_link" });
    }
  };

  const handleCopyImage = async () => {
    if (shareStatus === "loading") return;
    setShareStatus("loading");
    setFeedback(null);
    trackEvent("share_attempt", { method: "copy_image" });
    try {
      const url = await ensureShareUrl();
      const blob = await fetchShareImage(url);
      if (!blob) throw new Error("Failed to generate image");

      let copied = await copyImageToClipboard(blob);
      if (!copied) {
        trackEvent("share_fallback", {
          from: "copy_image_clipboard",
          to: "copy_image_exec",
        });
        copied = await copyImageWithExecCommand(blob);
      }

      if (!copied) {
        setShareStatus("error");
        setFeedback("Image copy failed");
        trackEvent("share_error", { method: "copy_image" });
        return;
      }

      setShareStatus("idle");
      setFeedback("Image copied to clipboard");
      trackEvent("share_success", { method: "copy_image" });
    } catch {
      setShareStatus("error");
      setFeedback("Image copy failed");
      trackEvent("share_error", { method: "copy_image" });
    }
  };

  const handleSaveImage = async () => {
    if (shareStatus === "loading") return;
    setShareStatus("loading");
    setFeedback(null);
    trackEvent("share_attempt", { method: "save_image" });
    try {
      const url = await ensureShareUrl();
      const blob = await fetchShareImage(url);
      if (!blob) throw new Error("Failed to generate image");
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "cineclash-score.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      setShareStatus("idle");
      setFeedback("Image saved");
      trackEvent("share_success", { method: "save_image" });
    } catch {
      setShareStatus("error");
      setFeedback("Save failed");
      trackEvent("share_error", { method: "save_image" });
    }
  };

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (state.phase === "guess") {
        if (e.key === "ArrowLeft" || e.key.toLowerCase() === "l")
          handleGuess("left");
        if (e.key === "ArrowRight" || e.key.toLowerCase() === "r")
          handleGuess("right");
      } else if (state.phase === "reveal") {
        if (e.key === "Enter" || e.key === " ") handleNext();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [state.phase]);

  /* ---------------------------------------------------------------- */
  /*  Views                                                           */
  /* ---------------------------------------------------------------- */

  // Landing View
  if (state.phase === "landing") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black -z-10" />

        <div className="space-y-8 max-w-2xl relative z-10 animate-fade-in">
          <div className="inline-block px-4 py-1.5 border border-white/10 rounded-full bg-white/5 backdrop-blur-sm">
            <span className="text-xs font-mono text-accent uppercase tracking-[0.3em]">
              CineClash
            </span>
          </div>

          <h1 className="font-display text-7xl sm:text-9xl leading-[0.8] tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
            HIGHER
            <br />
            RATING
          </h1>

          <p className="font-sans text-lg text-zinc-400 max-w-md mx-auto leading-relaxed">
            Two movies. One choice. Guess the higher IMDb rating.{" "}
            <span className="text-white">Three strikes and you're out.</span>
          </p>

          <div className="pt-8">
            <button
              onClick={handleStart}
              className="group relative inline-flex items-center justify-center px-10 py-5 font-display text-2xl uppercase tracking-widest text-black bg-accent hover:bg-yellow-400 transition-all duration-300 clip-path-button"
            >
              <span className="relative z-10">Start Game</span>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 text-xs font-mono text-zinc-600 uppercase tracking-widest">
          Press Start to Enter The Arena
        </div>
      </main>
    );
  }

  // Complete View
  if (state.phase === "complete") {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

        {/* Ticket Wrapper */}
        <div className="relative w-full max-w-3xl animate-scale-in">
          <div className="drop-shadow-[0_25px_50px_rgba(56,189,248,0.25)]">
            {/* Main Ticket Container with Classic Shape */}
            <div className="ticket-classic w-full min-h-[280px] sm:min-h-[380px] p-4 sm:p-6 flex relative">
              {/* The dashed line divider - hidden on mobile */}
              <div className="ticket-dashed-line hidden sm:block" />

              {/* STUB (Left Side) - Hidden on mobile */}
              <div className="hidden sm:flex w-[28%] pr-4 flex-col items-center justify-center border-r border-sky-900/20 relative z-10">
                {/* Vertical "ADMIT ONE" */}
                <div className="vertical-text font-display text-5xl sm:text-7xl text-sky-950/40 tracking-widest leading-none whitespace-nowrap opacity-60 mix-blend-multiply select-none">
                  ADMIT ONE
                </div>

                {/* Barcode */}
                <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 h-[70%] w-4 sm:w-6 bg-[repeating-linear-gradient(0deg,#000,#000_2px,transparent_2px,transparent_5px)] opacity-40 mix-blend-multiply" />
              </div>

              {/* BODY (Right Side on desktop, Full width on mobile) */}
              <div className="flex-1 sm:pl-8 flex flex-col relative z-10">
                {/* Inner Cream Card */}
                <div className="ticket-cream-bg w-full h-full rounded-lg border border-sky-900/10 p-4 sm:p-6 flex flex-col items-center text-center relative shadow-inner">
                  {/* Corner Decorations */}
                  <div className="absolute top-2 left-2 w-4 sm:w-6 h-4 sm:h-6 border-t border-l border-sky-900/20 rounded-tl-xl" />
                  <div className="absolute top-2 right-2 w-4 sm:w-6 h-4 sm:h-6 border-t border-r border-sky-900/20 rounded-tr-xl" />
                  <div className="absolute bottom-2 left-2 w-4 sm:w-6 h-4 sm:h-6 border-b border-l border-sky-900/20 rounded-bl-xl" />
                  <div className="absolute bottom-2 right-2 w-4 sm:w-6 h-4 sm:h-6 border-b border-r border-sky-900/20 rounded-br-xl" />

                  {/* Header */}
                  <h1 className="font-display text-2xl sm:text-5xl text-sky-900 uppercase tracking-widest mb-1 opacity-90">
                    CineClash
                  </h1>
                  <div className="font-mono text-[8px] sm:text-[10px] text-sky-900/50 uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-4 sm:mb-6">
                    {new Date().toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>

                  {/* Score */}
                  <div className="flex-1 flex items-center justify-center gap-6 sm:gap-12 w-full my-2">
                    <div className="hidden sm:block">
                      <StarIcon />
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="font-display text-7xl sm:text-9xl text-sky-600 leading-[0.85] tracking-normal drop-shadow-sm">
                        {state.score}
                      </span>
                      <div className="px-2 sm:px-3 py-1 bg-sky-900/5 rounded-full mt-2">
                        <span className="font-mono text-[10px] sm:text-xs text-sky-800 uppercase tracking-wider sm:tracking-widest font-bold">
                          Correct Guesses
                        </span>
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      <StarIcon />
                    </div>
                  </div>

                  {/* Footer Stats */}
                  <div className="w-full grid grid-cols-2 items-end mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-sky-900/10">
                    <div className="text-left">
                      <div className="font-display text-xl sm:text-2xl text-sky-900">
                        {state.totalGuesses}
                      </div>
                      <div className="font-mono text-[8px] sm:text-[9px] text-sky-900/50 uppercase tracking-wider">
                        Rounds
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-display text-xl sm:text-2xl text-sky-900">
                        {((state.score / state.totalGuesses) * 100).toFixed(0)}%
                      </div>
                      <div className="font-mono text-[8px] sm:text-[9px] text-sky-900/50 uppercase tracking-wider">
                        Accuracy
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {isMobile ? (
                <button
                  onClick={handleShare}
                  disabled={shareStatus === "loading"}
                  className="px-4 sm:px-6 py-2 border border-sky-400 text-sky-700 font-bold font-mono text-[10px] sm:text-xs uppercase tracking-widest hover:bg-sky-100 transition-colors rounded hover:shadow-sm transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                  title="Share your score"
                >
                  SHARE SCORE
                </button>
              ) : (
                canCopyImage && (
                  <button
                    onClick={handleCopyImage}
                    disabled={shareStatus === "loading"}
                    className="px-4 sm:px-6 py-2 border border-sky-400 text-sky-700 font-bold font-mono text-[10px] sm:text-xs uppercase tracking-widest hover:bg-sky-100 transition-colors rounded hover:shadow-sm transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                    title="Copy score image"
                  >
                    COPY IMAGE TO SHARE
                  </button>
                )
              )}
              <button
                onClick={handleReset}
                className="px-4 sm:px-6 py-2 border border-sky-400 text-sky-700 font-bold font-mono text-[10px] sm:text-xs uppercase tracking-widest hover:bg-sky-100 transition-colors rounded hover:shadow-sm transform hover:-translate-y-0.5 active:translate-y-0"
              >
                REPLAY
              </button>
            </div>
            {shareFeedback && (
              <div
                className={`text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border ${
                  shareStatus === "error"
                    ? "text-rose-700 border-rose-200 bg-rose-50"
                    : "text-sky-900 border-sky-200 bg-sky-50"
                }`}
                aria-live="polite"
              >
                {shareFeedback}
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Game View
  const activeRound = state.activeRound;

  if (activeRound) {
    const isReveal = state.phase === "reveal";
    const leftRating = activeRound.left.rating ?? 0;
    const rightRating = activeRound.right.rating ?? 0;
    const leftWin = leftRating >= rightRating;

    return (
      <main className="h-screen w-full flex flex-col relative bg-zinc-950 overflow-hidden">
        {/* Prefetch posters for upcoming rounds */}
        <PosterPrefetcher rounds={state.upcomingRounds} />

        {/* Ambient Background Spotlights */}
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[128px] pointer-events-none -translate-y-1/2" />
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[128px] pointer-events-none -translate-y-1/2" />

        {/* HUD - Marquee Bar */}
        <header className="flex-none z-50 flex justify-between items-center px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            {[...Array(3)].map((_, i) => (
              <HeartIcon
                key={i}
                filled={i < state.livesRemaining}
                breaking={i === state.livesRemaining}
              />
            ))}
          </div>
          <div className="flex flex-col items-end">
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
              Score
            </span>
            <span className="font-display text-3xl leading-none text-white text-glow">
              {state.score}
            </span>
          </div>
        </header>

        {/* Game Stage Area */}
        <div className="flex-1 relative flex items-center justify-center p-2 sm:p-4 lg:p-8 overflow-hidden">
          <div className="w-full max-w-6xl h-full flex flex-col lg:flex-row gap-2 sm:gap-4 lg:gap-12 items-center justify-center">
            {/* Left Poster */}
            <div className="relative w-full lg:w-[400px] aspect-[2/3] max-h-[calc(42vh-60px)] sm:max-h-[38vh] lg:max-h-[70vh] flex-shrink-0 perspective-1000">
              <MovieCard
                key={`left-${activeRound.left.id}`}
                movie={activeRound.left}
                reveal={isReveal}
                label="Challenger 01"
                onSelect={() => handleGuess("left")}
                disabled={isReveal}
                isWinner={leftWin}
                isLoser={!leftWin}
                isSelected={activeRound.guess === "left"}
              />
            </div>

            {/* Center VS Badge */}
            <div className="relative z-40 flex flex-col items-center justify-center gap-2 sm:gap-4 flex-shrink-0 py-1 sm:py-0 lg:h-auto">
              <div className="relative flex items-center justify-center w-10 h-10 sm:w-16 sm:h-16 bg-black border border-zinc-700 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <span className="font-display text-lg sm:text-xl text-white italic pr-1">
                  VS
                </span>
              </div>

              {isReveal && (
                <div
                  className={`whitespace-nowrap px-3 sm:px-4 py-1 sm:py-1.5 bg-black border border-white/10 rounded-full animate-scale-in ${activeRound.outcome === "correct" ? "text-success border-success/30" : "text-error border-error/30"}`}
                >
                  <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest font-bold">
                    {activeRound.outcome === "correct" ? "Correct" : "Wrong"}
                  </span>
                </div>
              )}
            </div>

            {/* Right Poster */}
            <div className="relative w-full lg:w-[400px] aspect-[2/3] max-h-[calc(42vh-60px)] sm:max-h-[38vh] lg:max-h-[70vh] flex-shrink-0 perspective-1000">
              <MovieCard
                key={`right-${activeRound.right.id}`}
                movie={activeRound.right}
                reveal={isReveal}
                label="Challenger 02"
                onSelect={() => handleGuess("right")}
                disabled={isReveal}
                isWinner={!leftWin}
                isLoser={leftWin}
                isSelected={activeRound.guess === "right"}
                delay={100}
              />
            </div>
          </div>
        </div>

        {/* Next Button Overlay (Floating Bottom) */}
        {isReveal && (
          <div className="absolute bottom-8 left-0 right-0 z-50 flex justify-center animate-slide-up pointer-events-none">
            <button
              ref={nextButtonRef}
              onClick={handleNext}
              className="pointer-events-auto px-10 py-4 bg-white text-black font-display text-xl uppercase tracking-widest hover:bg-accent hover:text-black transition-colors shadow-[0_10px_40px_rgba(0,0,0,0.5)] clip-path-slant"
            >
              Next Round <span className="opacity-50 text-sm ml-2">↵</span>
            </button>
          </div>
        )}
      </main>
    );
  }

  return null;
}
