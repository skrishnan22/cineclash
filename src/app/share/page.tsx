import type { Metadata } from "next";
import { headers } from "next/headers";

import { buildShareTitle, SHARE_DESCRIPTION } from "@/lib/share-text";
import { verifySignedSharePayload } from "@/lib/share-signature";
import ShareRedirect from "./share-redirect";

export const dynamic = "force-dynamic";

const getBaseUrl = async () => {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";

  if (host) {
    return `${proto}://${host}`;
  }

  const fallback = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return fallback.replace(/\/+$/g, "");
};

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  const payload = getParam(searchParams.payload);
  const sig = getParam(searchParams.sig);
  const verified = verifySignedSharePayload(payload ?? null, sig ?? null);
  const title = buildShareTitle(verified?.score, verified?.totalGuesses);
  const baseUrl = await getBaseUrl();
  const sharePath = payload && sig ? `/share?payload=${payload}&sig=${sig}` : "/";
  const shareUrl = new URL(sharePath, baseUrl).toString();
  const ogImagePath = payload && sig ? `/share/og?payload=${payload}&sig=${sig}` : "/share/og";
  const ogImageUrl = new URL(ogImagePath, baseUrl).toString();

  return {
    metadataBase: new URL(baseUrl),
    title,
    description: SHARE_DESCRIPTION,
    openGraph: {
      title,
      description: SHARE_DESCRIPTION,
      url: shareUrl,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: SHARE_DESCRIPTION,
      images: [ogImageUrl],
    },
  };
}

export default function SharePage() {
  return <ShareRedirect />;
}
