type ShareImageOptions = {
  posterPath?: string | null;
  scoreText: string;
  sessionLength: string;
  title?: string;
  attribution?: string;
};

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 630;

const getCssVar = (name: string, fallback: string) => {
  const value = getComputedStyle(document.body).getPropertyValue(name).trim();
  return value || fallback;
};

const fetchPosterBlob = async (posterPath: string) => {
  const response = await fetch(
    `/api/poster?path=${encodeURIComponent(posterPath)}`,
  );

  if (!response.ok) {
    throw new Error("Poster fetch failed");
  }

  return response.blob();
};

const loadBitmap = async (blob: Blob) => {
  if ("createImageBitmap" in window) {
    return createImageBitmap(blob);
  }

  const image = new Image();
  image.src = URL.createObjectURL(blob);

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  return image;
};

const drawCover = (
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  width: number,
  height: number,
) => {
  const sourceWidth =
    "width" in image ? (image as { width: number }).width : CANVAS_WIDTH;
  const sourceHeight =
    "height" in image ? (image as { height: number }).height : CANVAS_HEIGHT;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;

  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
};

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) => {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

export const renderShareImage = async ({
  posterPath,
  scoreText,
  sessionLength,
  title = "CineClash",
  attribution,
}: ShareImageOptions) => {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas not supported");
  }

  const titleFont = getCssVar("--font-title", "serif");
  const bodyFont = getCssVar("--font-body", "sans-serif");
  if (document.fonts?.load) {
    await document.fonts.load(`700 72px ${titleFont}`);
    await document.fonts.load(`500 32px ${bodyFont}`);
  }

  if (posterPath) {
    try {
      const blob = await fetchPosterBlob(posterPath);
      const bitmap = await loadBitmap(blob);
      drawCover(ctx, bitmap, CANVAS_WIDTH, CANVAS_HEIGHT);
      if (bitmap instanceof ImageBitmap) {
        bitmap.close();
      }
    } catch {
      ctx.fillStyle = "#2a2a2f";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, "#1f2937");
    gradient.addColorStop(1, "#43382c");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  const overlay = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  overlay.addColorStop(0, "rgba(0, 0, 0, 0.05)");
  overlay.addColorStop(0.55, "rgba(0, 0, 0, 0.55)");
  overlay.addColorStop(1, "rgba(0, 0, 0, 0.8)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const padding = 80;
  const maxWidth = CANVAS_WIDTH - padding * 2;

  ctx.fillStyle = "#fef9f3";
  ctx.font = `700 72px ${titleFont}`;
  const titleLines = wrapText(ctx, title, maxWidth);
  titleLines.forEach((line, index) => {
    ctx.fillText(line, padding, CANVAS_HEIGHT - 230 + index * 78);
  });

  ctx.font = `600 44px ${bodyFont}`;
  ctx.fillText(scoreText, padding, CANVAS_HEIGHT - 140);

  ctx.font = `500 28px ${bodyFont}`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
  ctx.fillText(`Session length · ${sessionLength}`, padding, CANVAS_HEIGHT - 95);

  ctx.font = `500 22px ${bodyFont}`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.fillText(
    attribution ?? `${window.location.host} · IMDb Top 250`,
    padding,
    CANVAS_HEIGHT - 55,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
      } else {
        reject(new Error("Unable to export share image"));
      }
    }, "image/png");
  });

  return blob;
};
