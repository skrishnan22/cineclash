const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const cheerio = require("cheerio");

const IMDB_URL = "https://www.imdb.com/chart/top/";
const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/";
const DEFAULT_OUTPUT_PATH = path.join(process.cwd(), "data", "movies.json");
const REQUEST_DELAY_MS = 250;
const DEFAULT_POSTER_SIZES = ["w500", "w780"];
const DEFAULT_CACHE_MAX_AGE = 60 * 60 * 24 * 30;

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

const argv = process.argv.slice(2);
const hasFlag = (flag) => argv.includes(flag);
const getArg = (flag) => {
  const index = argv.indexOf(flag);
  if (index === -1) {
    return null;
  }
  return argv[index + 1] ?? null;
};

const parseLimit = () => {
  const value = getArg("--limit");
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseSizes = () => {
  const value = getArg("--sizes");
  if (!value) {
    return DEFAULT_POSTER_SIZES;
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchHtml = async (url) => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; MovieGameBot/1.0)",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
};

const extractNextData = (html) => {
  const $ = cheerio.load(html);
  const script = $("script#__NEXT_DATA__").html();

  if (!script) {
    throw new Error("Unable to find __NEXT_DATA__ on IMDb page.");
  }

  return JSON.parse(script);
};

const extractMovies = (nextData) => {
  const edges = nextData?.props?.pageProps?.pageData?.chartTitles?.edges;

  if (!Array.isArray(edges)) {
    throw new Error("IMDb chart data not found in __NEXT_DATA__.");
  }

  return edges.map((edge) => {
    const node = edge.node ?? {};
    const rating = node.ratingsSummary?.aggregateRating ?? null;

    return {
      id: node.id,
      title: node.titleText?.text ?? node.originalTitleText?.text ?? "Untitled",
      year: node.releaseYear?.year ?? null,
      rating,
      rank: edge.currentRank ?? null,
    };
  });
};

const fetchTmdbPoster = async (imdbId) => {
  const url = new URL(`${TMDB_API_URL}/find/${imdbId}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("external_source", "imdb_id");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`TMDB lookup failed for ${imdbId}: ${response.status}`);
  }

  const payload = await response.json();
  const movie = payload?.movie_results?.[0];

  if (!movie) {
    return {
      tmdbId: null,
      posterPath: null,
    };
  }

  return {
    tmdbId: movie.id ?? null,
    posterPath: movie.poster_path ?? null,
  };
};

const buildPosterUrl = (posterPath, size) => {
  if (!posterPath) {
    return null;
  }

  return `${TMDB_IMAGE_BASE}${size}${posterPath}`;
};

const normalizeTitle = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

const buildPosterKey = ({ imdbId, title, size, posterPath }) => {
  const slug = normalizeTitle(title || "movie");
  const hash = crypto
    .createHash("sha1")
    .update(`${imdbId}-${slug}`)
    .digest("hex")
    .slice(0, 12);
  const extension = posterPath?.split(".").pop() || "jpg";
  return `tmdb/posters/${size}/${imdbId}-${slug}-${hash}.${extension}`;
};

const fetchPosterImage = async ({ posterPath, size }) => {
  const posterUrl = `${TMDB_IMAGE_BASE}${size}${posterPath}`;
  const response = await fetch(posterUrl);

  if (response.status === 429) {
    throw new Error(`TMDB rate limited for ${posterPath}`);
  }

  if (!response.ok) {
    throw new Error(`TMDB poster fetch failed: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const buffer = await response.arrayBuffer();
  return { buffer, contentType };
};

const uploadWithRetry = async ({ key, buffer, contentType }) => {
  if (!BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required to upload posters.");
  }

  const { put } = await import("@vercel/blob");
  const attempts = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await put(key, Buffer.from(buffer), {
        access: "public",
        addRandomSuffix: false,
        contentType,
        cacheControlMaxAge: DEFAULT_CACHE_MAX_AGE,
      });
      console.log("uploaded", key);
    } catch (error) {
      lastError = error;
      console.log("error", error);

      await sleep(500 * attempt);
    }
  }

  throw lastError;
};

const run = async () => {
  const html = await fetchHtml(IMDB_URL);
  const nextData = extractNextData(html);
  const allMovies = extractMovies(nextData);
  const limit = parseLimit();
  const movies = limit ? allMovies.slice(0, limit) : allMovies;
  const outputPath = getArg("--output") ?? DEFAULT_OUTPUT_PATH;
  const useTmdb = Boolean(TMDB_API_KEY);
  const shouldCachePosters = hasFlag("--cache-posters");
  const posterSizes = parseSizes();
  const cachePosters = shouldCachePosters && Boolean(BLOB_READ_WRITE_TOKEN);

  if (!useTmdb) {
    console.warn("TMDB_API_KEY is not set. Poster URLs will be null.");
  }

  if (shouldCachePosters && !BLOB_READ_WRITE_TOKEN) {
    console.warn("BLOB_READ_WRITE_TOKEN is not set. Skipping poster cache.");
  }

  const enriched = [];
  const failures = [];

  for (const movie of movies) {
    if (!movie.id) {
      failures.push({ imdbId: null, reason: "missing imdb id" });
      continue;
    }

    if (useTmdb) {
      try {
        const { tmdbId, posterPath } = await fetchTmdbPoster(movie.id);
        let posterUrl = null;
        let posterUrlLarge = null;

        if (cachePosters && posterPath) {
          for (const size of posterSizes) {
            try {
              const { buffer, contentType } = await fetchPosterImage({
                posterPath,
                size,
              });
              const key = buildPosterKey({
                imdbId: movie.id,
                title: movie.title,
                size,
                posterPath,
              });
              const result = await uploadWithRetry({
                key,
                buffer,
                contentType,
              });

              if (size === "w500") {
                posterUrl = result.url;
              }

              if (size === "w780") {
                posterUrlLarge = result.url;
              }
            } catch (error) {
              failures.push({
                imdbId: movie.id,
                reason: `cache ${size}: ${error.message}`,
              });
            }
          }
        }

        if (!cachePosters) {
          posterUrl = buildPosterUrl(posterPath, "w500");
          posterUrlLarge = buildPosterUrl(posterPath, "w780");
        }

        enriched.push({
          ...movie,
          tmdbId,
          posterPath,
          posterUrl,
          posterUrlLarge,
        });
      } catch (error) {
        failures.push({ imdbId: movie.id, reason: error.message });
        enriched.push({
          ...movie,
          tmdbId: null,
          posterPath: null,
          posterUrl: null,
          posterUrlLarge: null,
        });
      }

      await sleep(REQUEST_DELAY_MS);
    } else {
      enriched.push({
        ...movie,
        tmdbId: null,
        posterPath: null,
        posterUrl: null,
        posterUrlLarge: null,
      });
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    source: {
      imdbUrl: IMDB_URL,
      tmdbApi: TMDB_API_URL,
    },
    movies: enriched,
    failures,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(
    outputPath,
    `${JSON.stringify(output, null, 2)}\n`,
    "utf-8",
  );

  console.log(`Saved ${enriched.length} movies to ${outputPath}`);
  if (failures.length) {
    console.log(`Failures: ${failures.length}`);
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
