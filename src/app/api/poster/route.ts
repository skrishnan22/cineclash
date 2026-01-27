import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { put } from "@vercel/blob";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/";
const POSTER_PATH_REGEX = /^\/[a-zA-Z0-9/_-]+\.(jpg|png)$/;
const VALID_SIZES = new Set(["w500", "w780"]);
const DEFAULT_SIZE = "w500";
const DEFAULT_CACHE_MAX_AGE = 60 * 60 * 24 * 30;
const POSTER_CDN_BASE = process.env.POSTER_CDN_BASE;

const normalizeTitle = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

const sanitizeId = (value: string) => value.replace(/[^a-zA-Z0-9_-]+/g, "");

const buildPosterKey = ({
  imdbId,
  title,
  size,
  posterPath,
}: {
  imdbId: string;
  title: string;
  size: string;
  posterPath: string;
}) => {
  const slug = normalizeTitle(title || "movie");
  const hash = createHash("sha1")
    .update(`${imdbId}-${slug}`)
    .digest("hex")
    .slice(0, 12);
  const extension = posterPath.split(".").pop() ?? "jpg";
  return `tmdb/posters/${size}/${imdbId}-${slug}-${hash}.${extension}`;
};

const uploadWithRetry = async ({
  key,
  buffer,
  contentType,
}: {
  key: string;
  buffer: ArrayBuffer;
  contentType: string;
}) => {
  const attempts = 3;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await put(key, Buffer.from(buffer), {
        access: "public",
        addRandomSuffix: false,
        contentType,
        cacheControlMaxAge: DEFAULT_CACHE_MAX_AGE,
      });
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    }
  }

  throw lastError;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const posterPath = searchParams.get("path");
  const size = searchParams.get("size") ?? DEFAULT_SIZE;
  const title = searchParams.get("title") ?? "movie";
  const rawId =
    searchParams.get("id") ?? searchParams.get("imdbId") ?? posterPath;

  if (!posterPath || !POSTER_PATH_REGEX.test(posterPath)) {
    return new NextResponse("Invalid poster path", { status: 400 });
  }

  if (!VALID_SIZES.has(size)) {
    return new NextResponse("Invalid poster size", { status: 400 });
  }

  const imdbId = sanitizeId(rawId ?? "movie");
  const key = buildPosterKey({ imdbId, title, size, posterPath });
  const cdnBase = POSTER_CDN_BASE?.replace(/\/+$/g, "");
  const cachedUrl = cdnBase ? `${cdnBase}/${key}` : null;

  if (cachedUrl) {
    try {
      const headResponse = await fetch(cachedUrl, { method: "HEAD" });
      if (headResponse.ok) {
        return NextResponse.redirect(cachedUrl, 307);
      }
    } catch {
      // Ignore and fall back to TMDB.
    }
  }

  const tmdbUrl = `${TMDB_IMAGE_BASE}${size}${posterPath}`;
  const response = await fetch(tmdbUrl);

  if (response.status === 429) {
    return new NextResponse("TMDB rate limited", { status: 429 });
  }

  if (!response.ok) {
    return new NextResponse("Poster unavailable", { status: 404 });
  }

  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const buffer = await response.arrayBuffer();

  if (cachedUrl) {
    try {
      await uploadWithRetry({ key, buffer, contentType });
    } catch (error) {
      console.error("Poster upload failed", error);
    }
  }

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": `public, max-age=${DEFAULT_CACHE_MAX_AGE}`,
    },
  });
}
