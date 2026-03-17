import { useEffect } from "react";

interface PageMetaOptions {
  title: string;
  description: string;
  image?: string;
}

const DEFAULT_TITLE = "LUO FILM - Watch Movies, Dramas, Anime & Variety Shows Online";
const DEFAULT_DESC = "LUO FILM - Stream the best Asian movies, dramas, anime, and variety shows online. Watch free and premium content with subtitles on luofilm.site";
const DEFAULT_IMAGE = "https://luofilm.site/logo.png";
const DEFAULT_FAVICON = "/logo.png";

function setMeta(attr: string, attrVal: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${attrVal}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, attrVal);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setFavicon(href: string) {
  let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    document.head.appendChild(link);
  }
  link.href = href;

  let apple = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
  if (!apple) {
    apple = document.createElement("link");
    apple.rel = "apple-touch-icon";
    document.head.appendChild(apple);
  }
  apple.href = href;
}

export function usePageMeta({ title, description, image }: PageMetaOptions) {
  useEffect(() => {
    if (!title) return;

    document.title = title;

    if (image) setFavicon(image);

    const pageUrl = window.location.href;
    const ogImage = image || DEFAULT_IMAGE;

    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", ogImage);
    setMeta("property", "og:url", pageUrl);
    setMeta("property", "og:type", "video.movie");
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", ogImage);
    setMeta("name", "description", description);

    return () => {
      document.title = DEFAULT_TITLE;
      setFavicon(DEFAULT_FAVICON);
      setMeta("property", "og:title", DEFAULT_TITLE);
      setMeta("property", "og:description", DEFAULT_DESC);
      setMeta("property", "og:image", DEFAULT_IMAGE);
      setMeta("property", "og:url", "https://luofilm.site/");
      setMeta("property", "og:type", "website");
      setMeta("name", "twitter:title", DEFAULT_TITLE);
      setMeta("name", "twitter:description", DEFAULT_DESC);
      setMeta("name", "twitter:image", DEFAULT_IMAGE);
      setMeta("name", "description", DEFAULT_DESC);
    };
  }, [title, description, image]);
}
