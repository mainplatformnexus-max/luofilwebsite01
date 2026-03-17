const BOT_UA = /Twitterbot|facebookexternalhit|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Discordbot|Googlebot|bingbot|DuckDuckBot|Applebot/i;

export default async function middleware(request: Request): Promise<Response | undefined> {
  const ua = request.headers.get("user-agent") || "";
  const url = new URL(request.url);
  const path = url.pathname;

  if (
    BOT_UA.test(ua) &&
    (path.startsWith("/detail/") || path.startsWith("/play/"))
  ) {
    const parts = path.split("/").filter(Boolean);
    const slug = parts[parts.length - 1] || "";
    const type = path.startsWith("/play/") ? "play" : "detail";

    const ogUrl = new URL(request.url);
    ogUrl.pathname = "/api/og";
    ogUrl.search = "";
    ogUrl.searchParams.set("slug", slug);
    ogUrl.searchParams.set("type", type);

    try {
      const ogRes = await fetch(ogUrl.toString());
      return new Response(ogRes.body, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "s-maxage=3600",
        },
      });
    } catch {
      return undefined;
    }
  }

  return undefined;
}

export const config = {
  matcher: ["/detail/:path*", "/play/:path*"],
};
