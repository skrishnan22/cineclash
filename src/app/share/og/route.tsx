import { ImageResponse } from "next/og";

import { verifySignedSharePayload } from "@/lib/share-signature";
import { APP_NAME } from "@/lib/share-text";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getHostLabel = (request: Request) => {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");

  if (host) {
    return host;
  }

  return new URL(request.url).host;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const payload = searchParams.get("payload");
  const sig = searchParams.get("sig");
  const verified = verifySignedSharePayload(payload, sig);
  const hostLabel = getHostLabel(request);

  const scoreLine = verified
    ? `${verified.score} correct`
    : "Score unavailable";
  const statsLine = verified
    ? `${verified.totalGuesses} ${verified.totalGuesses === 1 ? "guess" : "guesses"} · ${((verified.score / verified.totalGuesses) * 100).toFixed(0)}% accuracy`
    : "Lives-based gameplay · Keep playing until you run out";

  const response = new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "80px",
          position: "relative",
          color: "#fef9f3",
          backgroundImage:
            "linear-gradient(160deg, #1f2937 0%, #43382c 55%, #b08957 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "900px",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              textTransform: "uppercase",
              letterSpacing: "0.35em",
              color: "rgba(255, 255, 255, 0.7)",
            }}
          >
            {APP_NAME}
          </div>
          <div
            style={{
              fontSize: "84px",
              fontWeight: 700,
              lineHeight: 1.05,
            }}
          >
            {scoreLine}
          </div>
          <div
            style={{
              fontSize: "32px",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "rgba(255, 255, 255, 0.78)",
            }}
          >
            {statsLine}
          </div>
          <div
            style={{
              fontSize: "22px",
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            {hostLabel}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );

  response.headers.set("Cache-Control", "public, max-age=86400");

  return response;
}
