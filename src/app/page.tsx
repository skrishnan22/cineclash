import MovieGame from "@/components/MovieGame";
import { loadMovies } from "@/lib/movies";

export default async function Home() {
  const movies = await loadMovies();

  return (
    <main className="relative min-h-screen">
      <MovieGame movies={movies} />
    </main>
  );
}
