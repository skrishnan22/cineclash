import { createHmac, timingSafeEqual } from "node:crypto";

const SHARE_PAYLOAD_VERSION = 2;
const MIN_GUESSES = 1;
const MAX_GUESSES = 100;

export type SharePayload = {
  v: number;
  score: number;
  totalGuesses: number;
};

const getSigningSecret = () => {
  const secret = process.env.SHARE_SIGNING_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "dev-share-secret";
  }

  throw new Error("SHARE_SIGNING_SECRET is not set");
};

const base64UrlEncode = (value: Buffer | string) => {
  const buffer = typeof value === "string" ? Buffer.from(value) : value;
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

const base64UrlDecode = (value: string) => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingNeeded = padded.length % 4;
  const paddedValue =
    paddingNeeded === 0 ? padded : `${padded}${"=".repeat(4 - paddingNeeded)}`;
  return Buffer.from(paddedValue, "base64");
};

const clampInt = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
};

const normalizePayload = (payload: SharePayload): SharePayload => {
  const totalGuesses = clampInt(payload.totalGuesses, MIN_GUESSES, MAX_GUESSES);
  const score = clampInt(payload.score, 0, totalGuesses);

  return {
    v: SHARE_PAYLOAD_VERSION,
    score,
    totalGuesses,
  };
};

const signPayload = (payload: string) => {
  const secret = getSigningSecret();
  const signature = createHmac("sha256", secret).update(payload).digest();
  return base64UrlEncode(signature);
};

const isSharePayload = (value: unknown): value is SharePayload => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as SharePayload;
  return (
    typeof payload.v === "number" &&
    typeof payload.score === "number" &&
    typeof payload.totalGuesses === "number"
  );
};

const safeEqual = (left: string, right: string) => {
  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
};

export const createSignedSharePayload = ({
  score,
  totalGuesses,
}: {
  score: number;
  totalGuesses: number;
}) => {
  const normalized = normalizePayload({
    v: SHARE_PAYLOAD_VERSION,
    score,
    totalGuesses,
  });
  const payloadJson = JSON.stringify(normalized);
  const payload = base64UrlEncode(payloadJson);
  const sig = signPayload(payload);

  return { payload, sig, normalized };
};

export const verifySignedSharePayload = (
  payload: string | null,
  sig: string | null,
): SharePayload | null => {
  if (!payload || !sig) {
    return null;
  }

  let expected: string;
  try {
    expected = signPayload(payload);
  } catch {
    return null;
  }

  if (!safeEqual(sig, expected)) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(base64UrlDecode(payload).toString("utf-8"));
  } catch {
    return null;
  }

  if (!isSharePayload(parsed)) {
    return null;
  }

  if (parsed.v !== SHARE_PAYLOAD_VERSION) {
    return null;
  }

  return normalizePayload(parsed);
};
