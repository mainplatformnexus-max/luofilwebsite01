const PROJECT_ID = "luo-film";
const BASE_URL = "https://luofilm.site";

async function queryFirestore(collection: string, slug: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
  const body = {
    structuredQuery: {
      from: [{ collectionId: collection }],
      where: {
        fieldFilter: {
          field: { fieldPath: "slug" },
          op: "EQUAL",
          value: { stringValue: slug },
        },
      },
      limit: 1,
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!Array.isArray(data) || !data[0]?.document?.fields) return null;
  const fields = data[0].document.fields;
  const get = (key: string) => fields[key]?.stringValue || fields[key]?.integerValue || "";
  return {
    title: get("title"),
    description: get("description"),
    poster: get("poster"),
    slug: get("slug"),
  };
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") || "";
  const type = url.searchParams.get("type") || "detail";

  let content = await queryFirestore("movies", slug);
  if (!content || !content.title) {
    content = await queryFirestore("series", slug);
  }

  const title = content?.title
    ? `${content.title} - Free download luofilm.site vj paul real`
    : `LUO FILM - Free download luofilm.site vj paul real`;
  const description = content?.title
    ? `${content.title} - Free download luofilm.site vj paul real`
    : "Stream the best movies and series free on luofilm.site - VJ Paul Real";
  const image = content?.poster || `${BASE_URL}/logo.png`;
  const pageUrl = `${BASE_URL}/${type}/${slug}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:type" content="video.movie" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:site_name" content="LUO FILM" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <link rel="icon" href="${image}" />
  <script>window.location.replace("${pageUrl}");</script>
</head>
<body>
  <p>Redirecting to <a href="${pageUrl}">${title}</a>...</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export const config = { runtime: "edge" };
