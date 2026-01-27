Movie rating higher/lower game built with Next.js.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Data Ingestion

The game uses a local JSON snapshot at `data/movies.json`. Generate it from IMDb + TMDB:

```bash
TMDB_API_KEY=your_key npm run ingest:imdb -- --output data/movies.json
```

To cache posters in Vercel Blob (recommended for production), set the Blob token and CDN base:

```bash
TMDB_API_KEY=your_key \
BLOB_READ_WRITE_TOKEN=your_blob_token \
POSTER_CDN_BASE=https://your-store.public.blob.vercel-storage.com \
npm run ingest:imdb -- --cache-posters --sizes w500,w780 --output data/movies.json
```

For on-demand poster caching via `/api/poster`, the runtime also needs:

```bash
BLOB_READ_WRITE_TOKEN=your_blob_token
POSTER_CDN_BASE=https://your-store.public.blob.vercel-storage.com
```

Poster caching uses deterministic object keys based on movie id + title.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to load Cinzel and Source Sans 3.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
