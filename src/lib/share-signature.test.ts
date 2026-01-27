import { beforeEach, describe, expect, it } from "vitest";

import { createSignedSharePayload, verifySignedSharePayload } from "./share-signature";

describe("share-signature", () => {
  beforeEach(() => {
    process.env.SHARE_SIGNING_SECRET = "test-secret";
  });

  it("signs and verifies a payload", () => {
    const { payload, sig, normalized } = createSignedSharePayload({
      score: 7,
      totalGuesses: 10,
    });

    const verified = verifySignedSharePayload(payload, sig);
    expect(verified).toEqual(normalized);
  });

  it("rejects invalid signatures", () => {
    const { payload } = createSignedSharePayload({
      score: 3,
      totalGuesses: 5,
    });
    const verified = verifySignedSharePayload(payload, "invalid");
    expect(verified).toBeNull();
  });

  it("clamps score to totalGuesses", () => {
    const { payload, sig } = createSignedSharePayload({
      score: 12,
      totalGuesses: 10,
    });
    const verified = verifySignedSharePayload(payload, sig);
    expect(verified?.score).toBe(10);
  });
});
