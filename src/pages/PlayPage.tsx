import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import { Play, ChevronDown, ChevronRight, Star, Share2, Bookmark, ThumbsUp, Flag, Download, Crown, Lock } from "lucide-react";
import { useMovies, useSeries, useLiveChannels, useSportContent, useSubscription, useEpisodesBySeries } from "@/hooks/useFirestore";
import { useAuth } from "@/contexts/AuthContext";
import VipPlansModal from "@/components/VipPlansModal";
import DownloadModal from "@/components/DownloadModal";
import { useState, useEffect, useRef } from "react";
import Hls from "hls.js";
import { FirestoreEpisode } from "@/lib/firestore";
import { toast } from "@/hooks/use-toast";
import { usePageMeta } from "@/hooks/usePageMeta";

const isM3U8 = (url: string) => url.includes(".m3u8");
const isDirectVideo = (url: string) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
const isIframeEmbed = (url: string) =>
  url.includes("youtube.com/embed") ||
  url.includes("youtu.be") ||
  url.includes("dailymotion.com/embed") ||
  url.includes("vimeo.com") ||
  url.includes("/embed/") ||
  url.includes("player.") ||
  url.includes("mediadelivery.net");

interface VideoPlayerProps {
  url: string;
  poster: string;
}

const VideoPlayer = ({ url, poster }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!url || !videoRef.current) return;
    if (isIframeEmbed(url) || (!isM3U8(url) && !isDirectVideo(url))) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isM3U8(url)) {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(videoRef.current);
      } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
        videoRef.current.src = url;
      }
    } else if (isDirectVideo(url)) {
      videoRef.current.src = url;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url]);

  if (!url) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black gap-3">
        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-muted">
          <Play className="w-8 h-8 text-muted-foreground ml-1" />
        </div>
        <span className="text-muted-foreground text-sm">No stream available</span>
      </div>
    );
  }

  if (isIframeEmbed(url) || (!isM3U8(url) && !isDirectVideo(url))) {
    const embedUrl = url.includes("youtu.be")
      ? url.replace("youtu.be/", "youtube.com/embed/")
      : url;
    return (
      <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "200px" }}>
        <iframe
          src={embedUrl}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
          allowFullScreen
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      className="w-full h-full"
      controls
      autoPlay
      poster={poster}
      playsInline
      style={{ background: "#000" }}
    >
      Your browser does not support video playback.
    </video>
  );
};

const EpisodeSkeleton = ({ count = 12 }: { count?: number }) => (
  <div className="grid grid-cols-6 gap-1.5 animate-pulse">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-9 rounded-md bg-secondary/60" />
    ))}
  </div>
);

const parseActor = (actor: string): { name: string; image?: string } => {
  const parts = actor.split("|");
  return { name: parts[0].trim(), image: parts[1]?.trim() };
};

const PlayPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAdmin } = useAuth();
  const { movies } = useMovies();
  const { series } = useSeries();
  const { channels } = useLiveChannels();
  const { sports } = useSportContent();
  const { subscription, hasActive } = useSubscription(user?.id);

  // Resolve series BEFORE the episode hook (hook must know the series identity)
  const show = series.find((s) => s.slug === slug);

  // Fetch episodes for this series directly from Firestore (no global fetch + filter)
  const { episodes: seriesEpisodes, loading: episodesLoading } = useEpisodesBySeries(
    show?.title || "",
    show?.id || "",
    show?.slug || ""
  );

  const canAccess = isAdmin || hasActive;
  const [vipOpen, setVipOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [activeSeason, setActiveSeason] = useState(1);

  // Action button states (persisted in localStorage)
  const [liked, setLiked] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`liked_${slug}`) || "false"); } catch { return false; }
  });
  const [inWatchLater, setInWatchLater] = useState(() => {
    try { const list = JSON.parse(localStorage.getItem("watchLater") || "[]"); return list.includes(slug); } catch { return false; }
  });

  const movie = movies.find((m) => m.slug === slug);
  const channel = channels.find((c) => c.slug === slug);
  const sport = sports.find((s) => s.slug === slug);
  const content = movie || show || channel || sport;
  const isSeries = !!show;

  const title = content?.title || slug?.replace(/-/g, " ") || "Unknown";
  const rating = (movie?.rating || show?.rating || "—") as string;
  const year = (movie?.year || show?.year || "") as string;
  const duration = (movie?.duration || show?.episodes || "") as string;
  const ageRating = movie?.ageRating || show?.ageRating || "13+";
  const genres = movie?.genre || show?.genre || [];
  const description = (movie?.description || show?.description || channel?.description || sport?.description || "") as string;
  const poster = (movie?.poster || show?.poster || channel?.thumbnail || sport?.thumbnail || "") as string;

  usePageMeta({
    title: content ? `${title} - Free download luofilm.site vj paul real` : "LUO FILM",
    description: `${title} - Free download luofilm.site vj paul real`,
    image: poster || undefined,
  });

  // ─── Episode field normalizers (handles both old & new format) ───────────────
  const epSeason = (ep: FirestoreEpisode) => ep.seasonNumber ?? ep.season ?? 0;
  const epNum    = (ep: FirestoreEpisode) => ep.episodeNumber ?? ep.episode ?? 0;
  const epName   = (ep: FirestoreEpisode) => ep.name || ep.title || "";
  const epHasStream = (ep: FirestoreEpisode) =>
    !!(ep.streamLink || ep.streamLinks?.length);
  const epStreamLinks = (ep: FirestoreEpisode): { quality: string; url: string; fileSize?: string }[] => {
    if (ep.streamLinks?.length) return ep.streamLinks;
    if (ep.streamLink) return [{ quality: "HD", url: ep.streamLink }];
    return [];
  };
  const epDownloadLinks = (ep: FirestoreEpisode): { quality: string; url: string; fileSize?: string }[] => {
    const out: { quality: string; url: string; fileSize?: string }[] = [];
    if (ep.downloadLink) out.push({ quality: "Download", url: ep.downloadLink });
    if (ep.streamLinks?.length) out.push(...ep.streamLinks);
    else if (ep.streamLink && !ep.downloadLink) out.push({ quality: "HD", url: ep.streamLink });
    return out;
  };

  // Seasons available
  const seasons = Array.from(new Set(seriesEpisodes.map(epSeason))).sort((a, b) => a - b);

  // Set default season on load
  useEffect(() => {
    if (seasons.length > 0 && !seasons.includes(activeSeason)) {
      setActiveSeason(seasons[0]);
    }
  }, [seasons.length]);

  // Episodes for active season
  const seasonEpisodes = seriesEpisodes
    .filter((e) => epSeason(e) === activeSeason)
    .sort((a, b) => epNum(a) - epNum(b));

  // Currently selected episode from URL param
  const currentEpId = searchParams.get("ep");
  const currentEpisode: FirestoreEpisode | undefined = currentEpId
    ? seriesEpisodes.find((e) => e.id === currentEpId)
    : seasonEpisodes[0];

  // Auto-select the season of the current episode
  useEffect(() => {
    if (currentEpisode) {
      setActiveSeason(epSeason(currentEpisode));
    }
  }, [currentEpisode?.id]);

  // Primary URL for the video player (embed URL takes priority for movies)
  const primaryUrl: string =
    (isSeries && currentEpisode ? epStreamLinks(currentEpisode)[0]?.url : null) ||
    (movie?.embedUrl && movie.embedUrl.trim() ? movie.embedUrl : null) ||
    (movie?.streamLinks?.[0]?.url || null) ||
    (show?.streamLinks?.[0]?.url || null) ||
    (channel?.streamUrl || null) ||
    (sport?.streamUrl || null) ||
    "";

  // Download quality links (for the quality/download bar and download modal)
  const downloadQualityLinks: { quality: string; url: string; fileSize?: string }[] =
    isSeries && currentEpisode
      ? epStreamLinks(currentEpisode)
      : (movie?.streamLinks || []);

  // Download links for the download modal
  const downloadLinks: { quality: string; url: string; fileSize?: string }[] =
    isSeries && currentEpisode
      ? epDownloadLinks(currentEpisode)
      : (movie?.streamLinks || []);

  const actors = movie?.actors || show?.actors || [];

  const allContent = [...movies, ...series].filter((c) => c.slug !== slug && (c.title || c.slug));

  const episodeTitle = isSeries && currentEpisode
    ? `Ep ${epNum(currentEpisode)}${epName(currentEpisode) ? ": " + epName(currentEpisode) : ""}`
    : "";

  const downloadTitle = isSeries && currentEpisode
    ? `${title} - S${epSeason(currentEpisode)}E${epNum(currentEpisode)}${epName(currentEpisode) ? " " + epName(currentEpisode) : ""}`
    : title;

  return (
    <>
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-[56px]">
        <div className="flex flex-col lg:flex-row w-full" style={{ minHeight: "calc(100vh - 56px)" }}>
          {/* Main video + info area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Video Player */}
            <div className="w-full bg-black" style={{ aspectRatio: "16/9", maxHeight: "480px" }}>
              {!canAccess ? (
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 md:gap-4 z-20 bg-black">
                    {poster && (
                      <img src={poster} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-20" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    )}
                    <div className="relative z-10 flex flex-col items-center gap-2 md:gap-4 text-center px-4 md:px-6">
                      <div className="w-9 h-9 md:w-16 md:h-16 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
                        <Crown className="w-4 h-4 md:w-8 md:h-8 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-xs md:text-lg">Subscription Required</p>
                        <p className="text-white/50 text-[10px] md:text-sm mt-0.5 md:mt-1">Subscribe to watch this content in full quality</p>
                      </div>
                      <button onClick={() => setVipOpen(true)} className="px-4 py-1.5 md:px-8 md:py-3 bg-amber-500 text-black font-bold rounded-lg md:rounded-xl hover:bg-amber-400 text-[10px] md:text-sm">
                        Subscribe Now
                      </button>
                      <button onClick={() => navigate(-1)} className="text-white/40 text-[10px] md:text-xs hover:text-white/70">
                        ← Go Back
                      </button>
                    </div>
                  </div>
                </div>
              ) : primaryUrl ? (
                <VideoPlayer
                  url={primaryUrl}
                  poster={currentEpisode?.thumbnail || poster}
                />
              ) : (
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    {(currentEpisode?.thumbnail || poster) && (
                      <img
                        src={currentEpisode?.thumbnail || poster}
                        alt={title}
                        className="absolute inset-0 w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 z-10">
                      <div className="w-20 h-20 rounded-full flex items-center justify-center bg-muted">
                        <Play className="w-8 h-8 text-muted-foreground ml-1" />
                      </div>
                      <span className="text-muted-foreground text-sm">No stream available yet</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Download by quality */}
            {downloadQualityLinks.length > 0 && canAccess && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-background border-b border-border flex-wrap">
                {downloadQualityLinks.map((link, i) => {
                  const q = (link.quality || "").toUpperCase();
                  const style =
                    q.includes("4K") || q.includes("UHD")
                      ? "bg-violet-600 hover:bg-violet-500 text-white"
                      : q.includes("1080")
                      ? "bg-blue-600 hover:bg-blue-500 text-white"
                      : q.includes("720")
                      ? "bg-green-600 hover:bg-green-500 text-white"
                      : q.includes("480")
                      ? "bg-amber-500 hover:bg-amber-400 text-black"
                      : q.includes("360")
                      ? "bg-orange-500 hover:bg-orange-400 text-white"
                      : "bg-secondary hover:bg-primary/20 text-secondary-foreground";
                  const WORKER = "https://download.mainplatform-nexus.workers.dev/";
                  const rawUrl = link.url.startsWith(WORKER)
                    ? (new URL(link.url).searchParams.get("url") || link.url)
                    : link.url;
                  const ext = rawUrl.match(/\.(mp4|mkv|webm|mov)/i)?.[1] ? `.${rawUrl.match(/\.(mp4|mkv|webm|mov)/i)![1]}` : ".mp4";
                  const fileName = `${title} vj. paul ug (www.luofilm.site)${ext}`;
                  const downloadUrl = `${WORKER}?url=${encodeURIComponent(rawUrl)}&filename=${encodeURIComponent(fileName)}&download=1`;
                  return (
                    <a
                      key={i}
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`download-quality-btn-${i}`}
                      className={`flex items-center gap-1.5 pl-2.5 pr-3 py-1 rounded-lg text-xs font-bold transition-colors ${style}`}
                    >
                      <Download className="w-3 h-3 shrink-0" />
                      <span>{link.quality}</span>
                      {link.fileSize && <span className="opacity-70 font-normal">({link.fileSize})</span>}
                    </a>
                  );
                })}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between px-4 md:px-6 py-2 md:py-3 border-b border-border">
              {/* Like */}
              <button
                onClick={() => {
                  const newVal = !liked;
                  setLiked(newVal);
                  localStorage.setItem(`liked_${slug}`, JSON.stringify(newVal));
                  toast({ title: newVal ? "Added to Liked" : "Removed from Liked" });
                }}
                data-testid="action-like"
                className={`flex flex-col items-center gap-0.5 transition-colors ${liked ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <div className={`w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center border ${liked ? "border-primary bg-primary/20" : "border-border bg-secondary/70"}`}>
                  <ThumbsUp className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </div>
                <span className="text-[8px] md:text-[10px] leading-tight">{liked ? "Liked" : "Like"}</span>
              </button>

              {/* Share */}
              <button
                onClick={async () => {
                  const url = window.location.href;
                  if (navigator.share) {
                    try { await navigator.share({ title, url }); } catch {}
                  } else {
                    await navigator.clipboard.writeText(url);
                    toast({ title: "Link copied!", description: "Share link copied to clipboard." });
                  }
                }}
                data-testid="action-share"
                className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center border border-border bg-secondary/70">
                  <Share2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </div>
                <span className="text-[8px] md:text-[10px] leading-tight">Share</span>
              </button>

              {/* Download */}
              <button
                onClick={() => { if (!canAccess) { setVipOpen(true); } else { setDownloadOpen(true); } }}
                data-testid="action-download"
                className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center border border-border bg-secondary/70 relative">
                  <Download className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  {!canAccess && <Lock className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 text-black rounded-full p-[1px]" />}
                </div>
                <span className="text-[8px] md:text-[10px] leading-tight">Download</span>
              </button>

              {/* Watch Later */}
              <button
                onClick={() => {
                  try {
                    const list: string[] = JSON.parse(localStorage.getItem("watchLater") || "[]");
                    const newList = inWatchLater ? list.filter((s) => s !== slug) : [...list, slug];
                    localStorage.setItem("watchLater", JSON.stringify(newList));
                    setInWatchLater(!inWatchLater);
                    toast({ title: !inWatchLater ? "Added to Watch Later" : "Removed from Watch Later" });
                  } catch {}
                }}
                data-testid="action-watch-later"
                className={`flex flex-col items-center gap-0.5 transition-colors ${inWatchLater ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <div className={`w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center border ${inWatchLater ? "border-primary bg-primary/20" : "border-border bg-secondary/70"}`}>
                  <Bookmark className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </div>
                <span className="text-[8px] md:text-[10px] leading-tight whitespace-nowrap">{inWatchLater ? "Saved" : "Watch Later"}</span>
              </button>

              {/* Report */}
              <button
                onClick={() => {
                  toast({ title: "Report submitted", description: "Thank you. Our team will review this content." });
                }}
                data-testid="action-report"
                className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center border border-border bg-secondary/70">
                  <Flag className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </div>
                <span className="text-[8px] md:text-[10px] leading-tight">Report</span>
              </button>
            </div>

            {/* Mobile-only episodes section (shown between action buttons and info) */}
            {isSeries && (
              <div className="lg:hidden border-b border-border">
                <div className="p-4">
                  {seasons.length > 1 && (
                    <div className="flex items-center gap-1 mb-3 flex-wrap">
                      {seasons.map((s) => (
                        <button
                          key={s}
                          onClick={() => setActiveSeason(s)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            s === activeSeason
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground hover:bg-primary/20"
                          }`}
                        >
                          Season {s}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-foreground">
                      {seasons.length > 1 ? `Season ${activeSeason}` : "Episodes"}
                      {!episodesLoading && <span className="text-muted-foreground font-normal ml-1.5">({seasonEpisodes.length})</span>}
                    </h2>
                    {currentEpisode && (
                      <span className="text-xs text-primary font-medium">
                        EP {epNum(currentEpisode)} playing
                      </span>
                    )}
                  </div>
                  {episodesLoading && <EpisodeSkeleton count={6} />}
                  {!episodesLoading && seriesEpisodes.length === 0 && (
                    <div className="py-4 text-center">
                      <Play className="w-6 h-6 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-xs text-muted-foreground">No episodes available yet.</p>
                    </div>
                  )}
                  {!episodesLoading && seasonEpisodes.length > 0 && (
                    <div className="grid grid-cols-6 gap-1.5">
                      {seasonEpisodes.map((ep) => {
                        const isPlaying = currentEpisode?.id === ep.id;
                        const hasStream = epHasStream(ep);
                        return (
                          <button
                            key={ep.id}
                            title={epName(ep) || `Episode ${epNum(ep)}`}
                            onClick={() => {
                              if (!canAccess) { setVipOpen(true); return; }
                              setSearchParams({ ep: ep.id! });
                            }}
                            className={`relative flex items-center justify-center rounded-md h-9 text-xs font-semibold transition-all border ${
                              isPlaying
                                ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                                : hasStream
                                ? "bg-secondary text-foreground border-border hover:bg-primary/20 hover:border-primary/50 hover:text-primary"
                                : "bg-secondary/40 text-muted-foreground border-border/40 cursor-default opacity-60"
                            }`}
                          >
                            {epNum(ep)}
                            {isPlaying && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border border-background" />
                            )}
                            {!canAccess && !isPlaying && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-background flex items-center justify-center">
                                <Lock className="w-1.5 h-1.5 text-black" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {currentEpisode && (
                    <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex gap-3">
                        {currentEpisode.thumbnail && (
                          <div className="flex-shrink-0 rounded overflow-hidden bg-muted" style={{ width: 80, height: 46 }}>
                            <img
                              src={currentEpisode.thumbnail}
                              alt={`Episode ${epNum(currentEpisode)}`}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-primary leading-tight">
                            Episode {epNum(currentEpisode)}{epName(currentEpisode) ? ` — ${epName(currentEpisode)}` : ""}
                          </p>
                          {currentEpisode.duration && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">{currentEpisode.duration}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Title & Meta (below video on mobile, stays in main area) */}
            <div className="px-3 md:px-6 py-2 md:py-4 border-b border-border">
              {/* Mobile: compact single-line layout */}
              <div className="md:hidden">
                <Link to={`/detail/${slug}`} className="flex items-center gap-0.5 group mb-0.5 min-w-0">
                  <h1 className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors truncate">{title}</h1>
                  <ChevronRight className="w-3 h-3 text-foreground/40 flex-shrink-0" />
                </Link>
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hidden whitespace-nowrap text-[9px] text-muted-foreground">
                  {episodeTitle && (
                    <span className="text-primary font-medium shrink-0">{episodeTitle}</span>
                  )}
                  {episodeTitle && <span className="shrink-0 opacity-40">·</span>}
                  <span className="flex items-center gap-0.5 shrink-0">
                    <Star className="w-2.5 h-2.5 fill-primary text-primary" />
                    {rating}
                  </span>
                  <span className="shrink-0 opacity-40">·</span>
                  <span className="shrink-0">{ageRating}</span>
                  {year && <><span className="shrink-0 opacity-40">·</span><span className="shrink-0">{year}</span></>}
                  {genres.map((genre, i) => (
                    <span key={genre} className="shrink-0 flex items-center gap-1">
                      <span className="opacity-40">·</span>
                      <span className="px-1 py-px rounded text-[8px] bg-secondary text-secondary-foreground">{genre}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Desktop: multi-line layout */}
              <div className="hidden md:block">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Link to={`/detail/${slug}`} className="flex items-center gap-1 group mb-1">
                      <h1 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">{title}</h1>
                      <ChevronRight className="w-4 h-4 text-foreground/40 flex-shrink-0" />
                    </Link>
                    {episodeTitle && (
                      <p className="text-sm text-primary font-medium mb-1">{episodeTitle}</p>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground text-xs flex-wrap">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        <span>{rating}</span>
                      </div>
                      <div className="w-px h-3 bg-border" />
                      <span>{ageRating}</span>
                      {year && <><div className="w-px h-3 bg-border" /><span>{year}</span></>}
                      {duration && !isSeries && <><div className="w-px h-3 bg-border" /><span>{duration}</span></>}
                    </div>
                  </div>
                </div>
                {genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {genres.map((genre) => (
                      <span key={genre} className="px-2 py-0.5 rounded text-[11px] bg-secondary text-secondary-foreground">{genre}</span>
                    ))}
                  </div>
                )}
              </div>

              {description && (
                <div className="mt-3">
                  <p className={`text-muted-foreground text-xs leading-relaxed ${!descExpanded ? "line-clamp-2" : ""}`}>
                    {description}
                  </p>
                  <button className="flex items-center gap-0.5 mt-1 text-foreground/50 text-[11px]" onClick={() => setDescExpanded(!descExpanded)}>
                    <ChevronDown className={`w-3 h-3 transition-transform ${descExpanded ? "rotate-180" : ""}`} />
                    <span>{descExpanded ? "Show less" : "Show more"}</span>
                  </button>
                </div>
              )}

              {actors.length > 0 && (
                <div className="mt-4">
                  <h2 className="text-foreground/70 text-xs font-medium mb-2">Cast</h2>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hidden pb-1">
                    {actors.map((actor) => {
                      const { name, image } = parseActor(actor);
                      return (
                        <div key={actor} className="flex-shrink-0 flex flex-col items-center gap-1.5">
                          {image ? (
                            <img
                              src={image}
                              alt={name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full object-cover border-2 border-primary"
                              onError={(e) => {
                                const t = e.target as HTMLImageElement;
                                t.style.display = "none";
                                (t.nextSibling as HTMLElement | null)?.style?.setProperty("display", "flex");
                              }}
                            />
                          ) : null}
                          <div
                            className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary items-center justify-center text-xs font-bold text-primary"
                            style={{ display: image ? "none" : "flex" }}
                          >
                            {name.charAt(0)}
                          </div>
                          <span className="text-[10px] text-foreground/60 text-center w-14 truncate">{name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile recommendations (visible only on mobile) */}
            {allContent.length > 0 && (
              <div className="lg:hidden pb-4 mt-2 border-t border-border pt-4">
                <h2 className="text-sm font-semibold text-foreground mb-3 px-3">You May Also Like</h2>
                <div className="flex gap-3 overflow-x-auto scrollbar-hidden px-3 pb-1">
                  {allContent.slice(0, 12).map((item, i) => (
                    <div
                      key={i}
                      className="cursor-pointer group flex-shrink-0 w-[110px]"
                      onClick={() => navigate(`/play/${item.slug}`)}
                    >
                      <div className="relative rounded-lg overflow-hidden bg-muted aspect-[2/3]">
                        {item.poster ? (
                          <img
                            src={item.poster}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-secondary">
                            <Play className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-active:opacity-100 transition-opacity">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <Play className="w-3.5 h-3.5 text-primary-foreground fill-primary-foreground ml-0.5" />
                          </div>
                        </div>
                        {item.isVip && (
                          <div className="absolute top-1 left-1 px-1 py-0.5 rounded text-[8px] font-bold bg-amber-500 text-black leading-none">VIP</div>
                        )}
                      </div>
                      <p className="text-[11px] text-foreground mt-1.5 line-clamp-2 leading-tight group-hover:text-primary transition-colors font-medium">{item.title}</p>
                      {item.year && <p className="text-[9px] text-muted-foreground mt-0.5">{item.year}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar (desktop only) */}
          <div className="hidden lg:block lg:w-[360px] xl:w-[400px] flex-shrink-0 overflow-y-auto scrollbar-hidden bg-background border-l border-border sticky top-[56px] self-start" style={{ height: "calc(100vh - 56px)" }}>
            {isSeries ? (
              <div className="p-4">
                {/* Season tabs */}
                {seasons.length > 1 && (
                  <div className="flex items-center gap-1 mb-4 flex-wrap">
                    {seasons.map((s) => (
                      <button
                        key={s}
                        data-testid={`season-tab-${s}`}
                        onClick={() => setActiveSeason(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          s === activeSeason
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-primary/20"
                        }`}
                      >
                        Season {s}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-foreground">
                    {seasons.length > 1 ? `Season ${activeSeason}` : "Episodes"}
                    {!episodesLoading && <span className="text-muted-foreground font-normal ml-1.5">({seasonEpisodes.length})</span>}
                  </h2>
                  {currentEpisode && (
                    <span className="text-xs text-primary font-medium">
                      EP {epNum(currentEpisode)} playing
                    </span>
                  )}
                </div>

                {/* Loading skeleton */}
                {episodesLoading && <EpisodeSkeleton count={12} />}

                {/* Empty state */}
                {!episodesLoading && seriesEpisodes.length === 0 && (
                  <div className="py-8 text-center">
                    <Play className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">No episodes available yet.</p>
                    <p className="text-[11px] text-muted-foreground/50 mt-1">Check back later or contact the admin.</p>
                  </div>
                )}

                {/* Episode number boxes grid */}
                {!episodesLoading && seasonEpisodes.length > 0 && (
                <div className="grid grid-cols-6 gap-1.5">
                  {seasonEpisodes.map((ep) => {
                    const isPlaying = currentEpisode?.id === ep.id;
                    const hasStream = epHasStream(ep);
                    return (
                      <button
                        key={ep.id}
                        data-testid={`episode-box-${ep.id}`}
                        title={epName(ep) || `Episode ${epNum(ep)}`}
                        onClick={() => {
                          if (!canAccess) { setVipOpen(true); return; }
                          setSearchParams({ ep: ep.id! });
                        }}
                        className={`relative flex items-center justify-center rounded-md h-9 text-xs font-semibold transition-all border ${
                          isPlaying
                            ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                            : hasStream
                            ? "bg-secondary text-foreground border-border hover:bg-primary/20 hover:border-primary/50 hover:text-primary"
                            : "bg-secondary/40 text-muted-foreground border-border/40 cursor-default opacity-60"
                        }`}
                      >
                        {epNum(ep)}
                        {isPlaying && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border border-background" />
                        )}
                        {!canAccess && !isPlaying && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-background flex items-center justify-center">
                            <Lock className="w-1.5 h-1.5 text-black" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                )}

                {/* Current episode detail strip */}
                {currentEpisode && (
                  <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex gap-3">
                      {currentEpisode.thumbnail && (
                        <div className="flex-shrink-0 rounded overflow-hidden bg-muted" style={{ width: 80, height: 46 }}>
                          <img
                            src={currentEpisode.thumbnail}
                            alt={`Episode ${epNum(currentEpisode)}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-primary leading-tight">
                          Episode {epNum(currentEpisode)}{epName(currentEpisode) ? ` — ${epName(currentEpisode)}` : ""}
                        </p>
                        {currentEpisode.duration && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">{currentEpisode.duration}</p>
                        )}
                        {epHasStream(currentEpisode) && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {epStreamLinks(currentEpisode).map((l, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                                {l.quality}
                              </span>
                            ))}
                            {currentEpisode.downloadLink && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                                DL
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations below episodes */}
                {allContent.length > 0 && (
                  <div className="mt-6">
                    <div className="h-px mb-4 bg-border" />
                    <h2 className="text-foreground/70 text-xs font-medium mb-3">You May Also Like</h2>
                    <div className="flex flex-col gap-3">
                      {allContent.slice(0, 6).map((item, i) => (
                        <div key={i} className="flex gap-3 cursor-pointer group" onClick={() => navigate(`/play/${item.slug}`)}>
                          <div className="w-[110px] flex-shrink-0 rounded overflow-hidden relative bg-muted" style={{ aspectRatio: "16/9" }}>
                            {item.poster ? (
                              <img
                                src={item.poster}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            ) : null}
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-primary">
                                <Play className="w-3 h-3 text-primary-foreground fill-primary-foreground ml-0.5" />
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground truncate group-hover:text-primary transition-colors font-medium">{item.title}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{item.year}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* For movies / live / sport: show recommendations */
              <div className="p-5">
                <Link to={`/detail/${slug}`} className="flex items-center gap-1 group mb-3">
                  <h1 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{title}</h1>
                  <ChevronRight className="w-4 h-4 text-foreground/40" />
                </Link>

                <div className="h-px mb-4 bg-border" />
                <h2 className="text-foreground/70 text-xs font-medium mb-3">Recommend</h2>
                <div className="flex flex-col gap-3">
                  {allContent.slice(0, 10).map((item, i) => (
                    <div key={i} className="flex gap-3 cursor-pointer group" onClick={() => navigate(`/play/${item.slug}`)}>
                      <div className="w-[140px] flex-shrink-0 rounded overflow-hidden relative bg-muted" style={{ aspectRatio: "16/9" }}>
                        {item.poster ? (
                          <img
                            src={item.poster}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary">
                            <Play className="w-3.5 h-3.5 text-primary-foreground fill-primary-foreground ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate group-hover:text-primary transition-colors">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    <MobileNav />
    <VipPlansModal open={vipOpen} onOpenChange={setVipOpen} />
    <DownloadModal
      open={downloadOpen}
      onOpenChange={setDownloadOpen}
      title={downloadTitle}
      streamLinks={downloadLinks}
      subscription={subscription}
      onUpgrade={() => { setDownloadOpen(false); setVipOpen(true); }}
      isAdmin={isAdmin}
    />
    </>
  );
};

export default PlayPage;
