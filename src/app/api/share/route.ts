import { NextResponse } from "next/server";

import { createSignedSharePayload } from "@/lib/share-signature";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const payload = body as { score?: number; totalGuesses?: number };
  const score = Number(payload.score);
  const totalGuesses = Number(payload.totalGuesses);

  if (!Number.isFinite(score) || !Number.isFinite(totalGuesses)) {
    return new NextResponse("Invalid score or totalGuesses", { status: 400 });
  }

  let encodedPayload: string;
  let sig: string;

  try {
    ({ payload: encodedPayload, sig } = createSignedSharePayload({
      score,
      totalGuesses,
    }));
  } catch {
    return new NextResponse("Share signing unavailable", { status: 500 });
  }
  const sharePath = `/share?payload=${encodedPayload}&sig=${sig}`;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/g, "");
  const origin = baseUrl || new URL(request.url).origin;
  const shareUrl = new URL(sharePath, origin).toString();

  return NextResponse.json({ sharePath, shareUrl });
}
