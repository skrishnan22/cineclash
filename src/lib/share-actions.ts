type TwitterIntentOptions = {
  text: string;
  url: string;
};

export const buildTwitterIntentUrl = ({ text, url }: TwitterIntentOptions) => {
  const params = new URLSearchParams();

  if (text) {
    params.set("text", text);
  }

  if (url) {
    params.set("url", url);
  }

  return `https://twitter.com/intent/tweet?${params.toString()}`;
};
