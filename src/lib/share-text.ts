export const APP_NAME = "CineScore Duel";
export const SHARE_DESCRIPTION =
  "Pick which movie has the higher IMDb rating and share your score.";

export const buildShareTitle = (score?: number, totalGuesses?: number) => {
  if (typeof score === "number") {
    return `I got ${score} correct in ${APP_NAME}`;
  }

  return APP_NAME;
};

export const buildShareText = (score: number, totalGuesses: number) =>
  `I got ${score} correct in ${APP_NAME}. Can you beat it?`;
