import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

import moviesData from "@/../data/movies.json";

export const runtime = "nodejs";
export const alt = "CineClash - Pick which movie has the higher IMDb rating";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const fontBasePath = path.join(process.cwd(), "public", "fonts");
const antonFont = readFile(path.join(fontBasePath, "Anton-Regular.ttf"));
const manropeBoldFont = readFile(path.join(fontBasePath, "Manrope-Bold.ttf"));

// Pick two iconic movies (ranks 1 and 2)
const movie1 = moviesData.movies[0]!; // The Shawshank Redemption
const movie2 = moviesData.movies[1]!; // The Godfather
const poster1 = movie1.posterUrl ?? movie1.posterUrlLarge ?? "";
const poster2 = movie2.posterUrl ?? movie2.posterUrlLarge ?? "";

export default async function Image() {
  const [antonData, manropeBoldData] = await Promise.all([
    antonFont,
    manropeBoldFont,
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          fontFamily: "Manrope",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, rgba(56, 189, 248, 0.08) 0%, transparent 70%)",
          }}
        />

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 56,
            fontWeight: 400,
            letterSpacing: "0.2em",
            color: "#38bdf8",
            fontFamily: "Anton",
            marginBottom: 32,
          }}
        >
          CINECLASH
        </div>

        {/* Posters container */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 60,
          }}
        >
          {/* Movie 1 poster */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5), 0 0 60px rgba(56, 189, 248, 0.15)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={poster1}
                width={220}
                height={330}
                alt={movie1.title}
                style={{
                  objectFit: "cover",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 16,
                color: "rgba(255,255,255,0.6)",
                fontWeight: 700,
                maxWidth: 220,
                textAlign: "center",
              }}
            >
              {movie1.title}
            </div>
          </div>

          {/* VS Badge */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "#38bdf8",
                boxShadow: "0 0 40px rgba(56, 189, 248, 0.4)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 32,
                  fontWeight: 400,
                  color: "#0c4a6e",
                  fontFamily: "Anton",
                  letterSpacing: "0.05em",
                }}
              >
                VS
              </div>
            </div>
          </div>

          {/* Movie 2 poster */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5), 0 0 60px rgba(56, 189, 248, 0.15)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={poster2}
                width={220}
                height={330}
                alt={movie2.title}
                style={{
                  objectFit: "cover",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 16,
                color: "rgba(255,255,255,0.6)",
                fontWeight: 700,
                maxWidth: 220,
                textAlign: "center",
              }}
            >
              {movie2.title}
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "rgba(255,255,255,0.8)",
            marginTop: 32,
            fontWeight: 700,
          }}
        >
          Which has the higher IMDb rating?
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Anton",
          data: antonData,
          weight: 400,
          style: "normal",
        },
        {
          name: "Manrope",
          data: manropeBoldData,
          weight: 700,
          style: "normal",
        },
      ],
    },
  );
}
