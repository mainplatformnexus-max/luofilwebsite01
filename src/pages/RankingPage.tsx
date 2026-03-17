import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import { useMovies, useSeries } from "@/hooks/useFirestore";
import { useState } from "react";
import { Flame, Play, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RankingPageSkeleton } from "@/components/PageSkeleton";

const tabs = ["Overall", "Drama", "Movie", "Anime", "Variety Show"];

const TOP_BADGE_STYLES: Record<number, { bg: string; text: string; shadow: string; label: string }> = {
  1: {
    bg: "linear-gradient(135deg, #f59e0b, #fbbf24, #d97706)",
    text: "text-black",
    shadow: "shadow-[0_0_8px_rgba(245,158,11,0.7)]",
    label: "TOP 1",
  },
  2: {
    bg: "linear-gradient(135deg, #94a3b8, #cbd5e1, #64748b)",
    text: "text-black",
    shadow: "shadow-[0_0_8px_rgba(148,163,184,0.6)]",
    label: "TOP 2",
  },
  3: {
    bg: "linear-gradient(135deg, #b45309, #d97706, #92400e)",
    text: "text-white",
    shadow: "shadow-[0_0_8px_rgba(180,83,9,0.6)]",
    label: "TOP 3",
  },
};

const getTopBadge = (rank: number) => {
  if (rank <= 3) return TOP_BADGE_STYLES[rank];
  return { bg: "rgba(0,0,0,0.55)", text: "text-white/80", shadow: "", label: `TOP ${rank}` };
};

const RankingPage = () => {
  const { movies, loading: mLoading } = useMovies();
  const { series, loading: sLoading } = useSeries();
  const [activeTab, setActiveTab] = useState("Overall");
  const navigate = useNavigate();
  const loading = mLoading || sLoading;

  const allContent = [
    ...movies.map((m) => ({ title: m.title, slug: m.slug, poster: m.poster, rating: m.rating, episodes: m.duration, isVip: m.isVip, genre: m.genre, type: "Movie" })),
    ...series.map((s) => ({ title: s.title, slug: s.slug, poster: s.poster, rating: s.rating, episodes: s.episodes, isVip: s.isVip, genre: s.genre, type: "Series" })),
  ].sort((a, b) => parseFloat(b.rating || "0") - parseFloat(a.rating || "0"));

  const filtered =
    activeTab === "Overall" ? allContent :
    activeTab === "Drama" ? allContent.filter(c => c.genre?.some(g => ["Drama", "Romance", "Historical", "Costume", "Wuxia"].includes(g))) :
    activeTab === "Movie" ? allContent.filter(c => c.type === "Movie") :
    activeTab === "Anime" ? allContent.filter(c => c.genre?.some(g => ["Animation", "Anime", "Fantasy"].includes(g))) :
    allContent.filter(c => c.genre?.some(g => ["Variety Show", "Reality"].includes(g)));

  const ranked = filtered.slice(0, 10).map((item, i) => ({ ...item, rank: i + 1 }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div style={{ marginTop: "48px" }} className="pt-2 md:pt-6">
        {loading ? (
          <RankingPageSkeleton />
        ) : (
          <>
            <div className="px-3 md:px-14 mb-4 md:mb-6">
              <div className="flex items-center gap-1.5 md:gap-3 mb-3 md:mb-4">
                <Flame className="w-4 h-4 md:w-6 md:h-6 text-primary" />
                <h1 className="text-sm md:text-3xl font-bold text-foreground uppercase tracking-wide">ALL RANKINGS</h1>
              </div>
              <div className="flex gap-1 md:gap-2 flex-wrap">
                {tabs.map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`category-chip ${activeTab === tab ? "active" : ""}`}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-3 md:px-14 pb-20">
              {ranked.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground text-sm">No content found for this category</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-4">
                  {ranked.map((item) => {
                    const badge = getTopBadge(item.rank);
                    return (
                      <div
                        key={item.slug}
                        className="cursor-pointer group"
                        onClick={() => navigate(`/detail/${item.slug}`)}
                      >
                        <div className="w-full aspect-[3/4] rounded-lg mb-1.5 relative overflow-hidden bg-muted">
                          {item.poster ? (
                            <img
                              src={item.poster}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5" />
                          )}

                          <span
                            className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-[4px] text-[10px] font-black z-10 tracking-wide ${badge.text} ${badge.shadow}`}
                            style={{ background: badge.bg }}
                          >
                            {badge.label}
                          </span>

                          {item.isVip && (
                            <span className="absolute top-1.5 right-1.5 vip-badge px-1 py-0.5 rounded text-[9px] font-bold z-10">VIP</span>
                          )}

                          {item.rating && (
                            <span className="absolute bottom-1 right-1 flex items-center gap-0.5 bg-black/60 rounded px-1 py-0.5 z-10">
                              <Star className="w-2 h-2 fill-yellow-400 text-yellow-400" />
                              <span className="text-[9px] text-white font-medium">{item.rating}</span>
                            </span>
                          )}

                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/play/${item.slug}`); }}
                              className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-primary flex items-center justify-center"
                            >
                              <Play className="w-4 h-4 text-primary-foreground fill-primary-foreground ml-0.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-[10px] md:text-[13px] text-foreground truncate leading-tight">{item.title}</p>
                        {item.episodes && (
                          <p className="text-[9px] md:text-[11px] text-muted-foreground mt-0.5">{item.episodes}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <MobileNav />
    </div>
  );
};

export default RankingPage;
