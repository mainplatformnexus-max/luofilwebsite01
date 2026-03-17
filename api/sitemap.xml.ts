const PROJECT_ID = "luo-film";
const BASE_URL = "https://luofilm.site";

async function fetchCollection(collection: string): Promise<{ slug: string; updatedAt?: string }[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}?pageSize=500`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.documents) return [];
    return data.documents.map((doc: any) => {
      const f = doc.fields || {};
      return {
        slug: f.slug?.stringValue || "",
        updatedAt: f.updatedAt?.stringValue || "",
      };
    }).filter((d: any) => d.slug);
  } catch {
    return [];
  }
}

export default async function handler(req: Request): Promise<Response> {
  const [movies, series] = await Promise.all([
    fetchCollection("movies"),
    fetchCollection("series"),
  ]);

  const staticPages = [
    { url: BASE_URL, priority: "1.0", changefreq: "daily" },
    { url: `${BASE_URL}/movie`, priority: "0.9", changefreq: "daily" },
    { url: `${BASE_URL}/drama`, priority: "0.9", changefreq: "daily" },
    { url: `${BASE_URL}/anime`, priority: "0.8", changefreq: "weekly" },
    { url: `${BASE_URL}/variety-show`, priority: "0.8", changefreq: "weekly" },
    { url: `${BASE_URL}/live-tv`, priority: "0.7", changefreq: "daily" },
    { url: `${BASE_URL}/sport`, priority: "0.7", changefreq: "daily" },
    { url: `${BASE_URL}/ranking`, priority: "0.7", changefreq: "daily" },
  ];

  const movieUrls = movies.map(m => ({
    url: `${BASE_URL}/detail/${m.slug}`,
    priority: "0.8",
    changefreq: "weekly",
    updatedAt: m.updatedAt,
  }));

  const seriesUrls = series.map(s => ({
    url: `${BASE_URL}/detail/${s.slug}`,
    priority: "0.8",
    changefreq: "weekly",
    updatedAt: s.updatedAt,
  }));

  const allUrls = [...staticPages, ...movieUrls, ...seriesUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allUrls.map(u => `  <url>
    <loc>${u.url}</loc>
    <changefreq>${(u as any).changefreq || "weekly"}</changefreq>
    <priority>${u.priority}</priority>${(u as any).updatedAt ? `
    <lastmod>${(u as any).updatedAt.substring(0, 10)}</lastmod>` : ""}
  </url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export const config = { runtime: "edge" };
