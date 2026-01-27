type EventPayload = Record<string, unknown>;

export const trackEvent = (name: string, payload?: EventPayload) => {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info(`[analytics] ${name}`, payload ?? {});
};
