import { ImageResponse } from "next/og";

import { verifySignedSharePayload } from "@/lib/share-signature";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const payload = searchParams.get("payload");
  const sig = searchParams.get("sig");
  const verified = verifySignedSharePayload(payload, sig);

  const score = verified?.score ?? 0;
  const totalGuesses = verified?.totalGuesses ?? 0;
  const accuracy =
    totalGuesses > 0 ? ((score / totalGuesses) * 100).toFixed(0) : "0";

  const dashes = Array.from({ length: 22 }, (_, i) => i);

  const response = new ImageResponse(
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
                fontSize: 56,
                fontWeight: 700,
                letterSpacing: "0.3em",
                color: "rgba(12, 74, 110, 0.25)",
                whiteSpace: "nowrap",
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
                  fontSize: 48,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  color: "#0c4a6e",
                }}
              >
                CINECLASH
              </div>
              <div
                style={{
                  fontSize: 14,
                  letterSpacing: "0.4em",
                  color: "rgba(12, 74, 110, 0.4)",
                  marginTop: 4,
                }}
              >
                CINECLASH.QUEST
              </div>

              {/* Score */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 28,
                  marginTop: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    color: "rgba(56, 189, 248, 0.5)",
                  }}
                >
                  ★
                </div>
                <div
                  style={{
                    fontSize: 160,
                    fontWeight: 700,
                    color: "#0284c7",
                    lineHeight: 1,
                  }}
                >
                  {score}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    color: "rgba(56, 189, 248, 0.5)",
                  }}
                >
                  ★
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  padding: "6px 24px",
                  backgroundColor: "rgba(12, 74, 110, 0.05)",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.25em",
                  color: "#155e75",
                  marginTop: 8,
                }}
              >
                CORRECT GUESSES
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  marginTop: 24,
                  paddingTop: 16,
                  borderTop: "1px solid rgba(12, 74, 110, 0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 700,
                      color: "#0c4a6e",
                    }}
                  >
                    {totalGuesses}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.2em",
                      color: "rgba(12, 74, 110, 0.45)",
                    }}
                  >
                    ROUNDS
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                  }}
                >
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 700,
                      color: "#0c4a6e",
                    }}
                  >
                    {accuracy}%
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.2em",
                      color: "rgba(12, 74, 110, 0.45)",
                    }}
                  >
                    ACCURACY
                  </div>
                </div>
              </div>
            </div>
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
