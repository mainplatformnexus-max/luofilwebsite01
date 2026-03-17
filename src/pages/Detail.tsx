import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import { Play, Share2, Download, Bookmark, ChevronDown, Star, ThumbsUp, Flag, Crown, Lock } from "lucide-react";
import { useMovies, useSeries, useSubscription } from "@/hooks/useFirestore";
import { useAuth } from "@/contexts/AuthContext";
import ContentRow from "@/components/ContentRow";
import VipPlansModal from "@/components/VipPlansModal";
import DownloadModal from "@/components/DownloadModal";
import { usePageMeta } from "@/hooks/usePageMeta";
import { filterLinksByQuality } from "@/lib/planLimits";

const Detail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { movies } = useMovies();
  const { series } = useSeries();
  const { subscription, hasActive, deviceAllowed, incrementDownload } = useSubscription(user?.id);
  const canAccess = isAdmin || (hasActive && deviceAllowed);

  const [vipOpen, setVipOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const movie = movies.find((m) => m.slug === slug);
  const show = series.find((s) => s.slug === slug);
  const content = movie || show;

  const title = content?.title || slug?.replace(/-/g, " ") || "Unknown";
  const rating = movie?.rating || show?.rating || "—";
  const year = movie?.year || show?.year || "";
  const duration = movie?.duration || show?.episodes || "";
  const ageRating = movie?.ageRating || "13+";
  const genres = movie?.genre || show?.genre || [];
  const description = movie?.description || show?.description || "";
  const poster = movie?.poster || show?.poster || "";
  const rawStreamLinks = movie?.streamLinks || show?.streamLinks || [];
  const planMaxQuality = subscription?.limits?.maxQuality ?? "720p";
  const streamLinks = rawStreamLinks;

  usePageMeta({
    title: content ? `${title} - Free download luofilm.site vj paul real` : "LUO FILM",
    description: `${title} - Free download luofilm.site vj paul real`,
    image: poster || undefined,
  });

  const allContent = [...movies, ...series].filter((c) => c.slug !== slug && (c.title || c.slug));
  const recommended = allContent.slice(0, 8).map((c) => ({
    title: c.title,
    slug: c.slug,
    poster: c.poster || "",
    rating: c.rating || "",
    episodes: ("duration" in c ? (c as any).duration : ("episodes" in c ? (c as any).episodes : "")),
    isVip: c.isVip,
  }));

  const handlePlay = () => {
    navigate(`/play/${slug}`);
  };

  const handleDownload = () => {
    if (isAdmin) { setDownloadOpen(true); return; }
    if (!user || !hasActive) { setVipOpen(true); return; }
    setDownloadOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="relative w-full" style={{ paddingTop: "56px" }}>
        <div className="relative w-full" style={{ aspectRatio: "16/9", maxHeight: "570px" }}>
          {poster ? (
            <img src={poster} alt={title} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="absolute inset-0 bg-muted" />
          )}
          <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(90deg, hsl(225 24% 8%) 0%, hsl(225 24% 8% / 0.8) 25%, transparent 60%)" }} />
          <div className="absolute bottom-0 left-0 right-0 z-10" style={{ height: "200px", background: "linear-gradient(0deg, hsl(225 24% 8%) 0%, hsl(225 24% 8% / 0.6) 40%, transparent 100%)" }} />

          <div className="absolute inset-0 z-30 flex items-center justify-center">
            <button
              className="w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-transform hover:scale-110 bg-primary relative"
              onClick={handlePlay}
            >
              <Play className="w-4 h-4 md:w-7 md:h-7 text-primary-foreground fill-primary-foreground ml-0.5 md:ml-1" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-20 px-4 md:px-14" style={{ marginTop: "-120px" }}>
        <div className="max-w-[800px]">
          <h1 className="text-base md:text-[32px] font-bold text-foreground leading-tight mb-2 md:mb-3">{title}</h1>

          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <span className="vip-badge inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold">
              <Crown className="w-3 h-3" /> VIP
            </span>
            {hasActive && subscription && (
              <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                ✓ {subscription.plan}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mb-2 md:mb-4 flex-wrap">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 md:w-4 md:h-4 fill-primary text-primary" />
              <span className="text-primary font-bold text-xs md:text-sm">{rating}</span>
            </div>
            <div className="w-px h-3 bg-muted-foreground/40" />
            <span className="text-muted-foreground text-xs md:text-sm">{ageRating}</span>
            <div className="w-px h-3 bg-muted-foreground/40" />
            <span className="text-muted-foreground text-xs md:text-sm">{year}</span>
            {duration && (
              <>
                <div className="w-px h-3 bg-muted-foreground/40" />
                <span className="text-muted-foreground text-xs md:text-sm">{duration}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 mb-2 md:mb-4 flex-wrap">
            {genres.map((genre) => (
              <span key={genre} className="px-1.5 py-0.5 md:px-2.5 md:py-1 rounded text-[10px] md:text-xs font-medium bg-secondary text-secondary-foreground">{genre}</span>
            ))}
          </div>

          <div className="mb-3 md:mb-5">
            <p className={`text-muted-foreground text-[11px] md:text-[13px] leading-relaxed ${!descExpanded ? "line-clamp-3" : ""}`}>
              <span className="font-medium text-foreground/70">Description</span>: {description || "No description available."}
            </p>
            {description && description.length > 120 && (
              <button onClick={() => setDescExpanded(!descExpanded)} className="text-primary text-xs mt-1 flex items-center gap-1">
                <ChevronDown className={`w-3 h-3 transition-transform ${descExpanded ? "rotate-180" : ""}`} />
                {descExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>

          <div className="mb-3 md:mb-5">
            <button
              className="flex items-center gap-1.5 px-5 md:px-8 py-2 md:py-2.5 rounded font-bold text-xs md:text-sm bg-primary text-primary-foreground mb-3 md:mb-4 hover:opacity-90"
              onClick={handlePlay}
            >
              <Play className="w-3 h-3 md:w-4 md:h-4 fill-primary-foreground" /> Play Now
            </button>

            <div className="flex items-center justify-between gap-1 md:gap-6">
              {[
                { icon: ThumbsUp, label: "Like", onClick: () => {} },
                { icon: Share2, label: "Share", onClick: () => {} },
                { icon: Download, label: "Download", onClick: handleDownload },
                { icon: Bookmark, label: "Watch Later", onClick: () => {} },
                { icon: Flag, label: "Report", onClick: () => {} },
              ].map(({ icon: Icon, label, onClick }) => (
                <button key={label} onClick={onClick} className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors min-w-0">
                  <div className="w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center border border-border relative">
                    <Icon className="w-3 h-3 md:w-4 md:h-4" />
                    {label === "Download" && !canAccess && <Lock className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 text-black rounded-full p-[1px]" />}
                  </div>
                  <span className="text-[8px] md:text-[10px] leading-tight text-center whitespace-nowrap">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {!canAccess && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-amber-400 shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-sm text-amber-400">Subscription Required</p>
                  <p className="text-xs text-white/60 mt-0.5">Subscribe to watch and download all content in full quality.</p>
                </div>
                <button onClick={() => setVipOpen(true)} className="px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-lg hover:bg-amber-400 shrink-0">
                  Subscribe
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-0 md:px-0 mt-4">
        <ContentRow title="Recommended" shows={recommended} />
      </div>

      <div className="h-16" />

      <MobileNav />
      <VipPlansModal open={vipOpen} onOpenChange={setVipOpen} />
      <DownloadModal
        open={downloadOpen}
        onOpenChange={setDownloadOpen}
        title={title}
        streamLinks={streamLinks}
        subscription={subscription}
        onUpgrade={() => { setDownloadOpen(false); setVipOpen(true); }}
        onDownloaded={incrementDownload}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default Detail;
