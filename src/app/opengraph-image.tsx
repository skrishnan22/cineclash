import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "CineClash - Pick which movie has the higher IMDb rating";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const fontBasePath = path.join(process.cwd(), "public", "fonts");
const antonFont = readFile(path.join(fontBasePath, "Anton-Regular.ttf"));
const manropeMediumFont = readFile(
  path.join(fontBasePath, "Manrope-Medium.ttf"),
);

export default async function Image() {
  const [antonData, manropeMediumData] = await Promise.all([
    antonFont,
    manropeMediumFont,
  ]);

  const dashes = Array.from({ length: 22 }, (_, i) => i);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          padding: 50,
          fontFamily: "Manrope",
          fontWeight: 500,
        }}
      >
        {/* Ticket container */}
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            backgroundColor: "#38bdf8",
            borderRadius: 14,
            position: "relative",
          }}
        >
          {/* Notch circles at stub divider */}
          <div
            style={{
              position: "absolute",
              top: -18,
              left: 252,
              display: "flex",
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#09090b",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -18,
              left: 252,
              display: "flex",
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#09090b",
            }}
          />

          {/* Left stub */}
          <div
            style={{
              width: 270,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                transform: "rotate(-90deg)",
                fontSize: 52,
                fontWeight: 400,
                letterSpacing: "0.25em",
                color: "rgba(12, 74, 110, 0.25)",
                lineHeight: 1,
                whiteSpace: "nowrap",
                fontFamily: "Anton",
              }}
            >
              ADMIT ONE
            </div>
          </div>

          {/* Dashed divider */}
          <div
            style={{
              width: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingTop: 24,
              paddingBottom: 24,
            }}
          >
            {dashes.map((i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  width: 3,
                  height: 14,
                  backgroundColor: "rgba(0, 0, 0, 0.15)",
                  borderRadius: 2,
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          {/* Right body */}
          <div
            style={{
              flex: 1,
              display: "flex",
              padding: 30,
              paddingLeft: 26,
            }}
          >
            {/* Inner cream card */}
            <div
              style={{
                flex: 1,
                backgroundColor: "#fdf6e7",
                borderRadius: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "28px 50px",
                position: "relative",
              }}
            >
              {/* Corner decorations */}
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  width: 28,
                  height: 28,
                  borderTop: "2px solid rgba(12, 74, 110, 0.15)",
                  borderLeft: "2px solid rgba(12, 74, 110, 0.15)",
                  borderTopLeftRadius: 10,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 28,
                  height: 28,
                  borderTop: "2px solid rgba(12, 74, 110, 0.15)",
                  borderRight: "2px solid rgba(12, 74, 110, 0.15)",
                  borderTopRightRadius: 10,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: 12,
                  width: 28,
                  height: 28,
                  borderBottom: "2px solid rgba(12, 74, 110, 0.15)",
                  borderLeft: "2px solid rgba(12, 74, 110, 0.15)",
                  borderBottomLeftRadius: 10,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 12,
                  right: 12,
                  width: 28,
                  height: 28,
                  borderBottom: "2px solid rgba(12, 74, 110, 0.15)",
                  borderRight: "2px solid rgba(12, 74, 110, 0.15)",
                  borderBottomRightRadius: 10,
                }}
              />

              {/* Header */}
              <div
                style={{
                  display: "flex",
                  fontSize: 72,
                  fontWeight: 400,
                  letterSpacing: "0.15em",
                  color: "#0c4a6e",
                  fontFamily: "Anton",
                }}
              >
                CINECLASH
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 14,
                  letterSpacing: "0.4em",
                  color: "rgba(12, 74, 110, 0.4)",
                  marginTop: 8,
                }}
              >
                CINECLASH.QUEST
              </div>

              {/* Tagline */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginTop: 40,
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 28,
                    color: "#0284c7",
                    fontWeight: 500,
                    textAlign: "center",
                  }}
                >
                  Pick which movie has the higher IMDb rating
                </div>
                <div
                  style={{
                    display: "flex",
                    padding: "10px 28px",
                    backgroundColor: "#0284c7",
                    borderRadius: 999,
                    fontSize: 16,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    color: "#ffffff",
                    marginTop: 16,
                  }}
                >
                  PLAY NOW
                </div>
              </div>
            </div>
          </div>
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
          data: manropeMediumData,
          weight: 500,
          style: "normal",
        },
      ],
    },
  );
}
