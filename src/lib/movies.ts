import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type Movie = {
  id: string;
  title: string;
  year: number | null;
  rating: number | null;
  posterUrl: string | null;
  posterUrlLarge?: string | null;
  rank?: number | null;
  tmdbId?: number | null;
  posterPath?: string | null;
};

type MoviePayload = {
  movies: Movie[];
};

const dataPaths = ["data/movies.json", "data/movies.sample.json"];

const readMoviesFile = async (filePath: string): Promise<MoviePayload | null> => {
  try {
    const payload = await readFile(filePath, "utf-8");
    return JSON.parse(payload) as MoviePayload;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
};

export const loadMovies = cache(async (): Promise<Movie[]> => {
  for (const relativePath of dataPaths) {
    const absolutePath = path.join(process.cwd(), relativePath);
    const payload = await readMoviesFile(absolutePath);

    if (payload?.movies?.length) {
      return payload.movies;
    }
  }

  return [];
});
