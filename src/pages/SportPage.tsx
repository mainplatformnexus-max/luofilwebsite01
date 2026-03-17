import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import { Trophy, Signal, Play, Lock } from "lucide-react";
import { useSportContent } from "@/hooks/useFirestore";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const categories = ["All", "Football", "Basketball", "Tennis", "Cricket", "Rugby", "Athletics", "Boxing", "Swimming", "Cycling", "General"];

const SportPage = () => {
  const { sports, loading } = useSportContent();
  const navigate = useNavigate();
  const [filterCat, setFilterCat] = useState("All");

  const filtered = filterCat === "All" ? sports : sports.filter((s) => s.category === filterCat);

  const handlePlay = (item: any) => {
    navigate(`/play/${item.slug}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div style={{ marginTop: "48px" }} className="pt-3 md:pt-6 pb-16 px-2 md:px-4 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-6">
          <div className="p-1.5 md:p-2 rounded-lg bg-amber-500/20">
            <Trophy className="w-4 h-4 md:w-6 md:h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-base md:text-2xl font-bold text-foreground leading-tight">Sport</h1>
            <p className="text-muted-foreground text-[11px] md:text-sm">Live matches, highlights, and sports content</p>
          </div>
        </div>

        {/* Category filter — horizontal scroll on mobile */}
        <div className="flex gap-1.5 md:gap-2 mb-3 md:mb-6 overflow-x-auto scrollbar-hidden pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-2.5 py-1 md:px-4 md:py-1.5 rounded-full text-[11px] md:text-sm whitespace-nowrap transition-colors flex-shrink-0 ${
                filterCat === cat
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-video bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 md:py-20 gap-3">
            <Trophy className="w-10 h-10 md:w-16 md:h-16 text-primary opacity-40" />
            <h2 className="text-base md:text-xl font-semibold text-foreground">No sports content yet</h2>
            <p className="text-muted-foreground text-xs md:text-sm text-center max-w-xs">
              Sports content will appear here once added by the admin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => handlePlay(item)}
                className="group cursor-pointer rounded-lg md:rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-primary/50 transition-all hover:scale-[1.02]"
              >
                <div className="aspect-video relative bg-white/10">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Trophy className="w-6 h-6 md:w-10 md:h-10 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-primary flex items-center justify-center">
                      <Play className="w-3.5 h-3.5 md:w-5 md:h-5 fill-primary-foreground text-primary-foreground ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute top-1 left-1 md:top-2 md:left-2 flex gap-0.5 md:gap-1">
                    {item.isLive && (
                      <span className="flex items-center gap-0.5 px-1 py-0.5 bg-red-500 text-white text-[8px] md:text-[9px] font-bold rounded">
                        <Signal className="w-1.5 h-1.5 md:w-2 md:h-2" /> LIVE
                      </span>
                    )}
                    {item.isVip && (
                      <span className="flex items-center gap-0.5 px-1 py-0.5 bg-amber-500 text-black text-[8px] md:text-[9px] font-bold rounded">
                        <Lock className="w-1.5 h-1.5 md:w-2 md:h-2" /> VIP
                      </span>
                    )}
                  </div>
                  {item.category && (
                    <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 px-1 py-0.5 bg-black/60 text-white/70 text-[8px] md:text-[9px] rounded">
                      {item.category}
                    </div>
                  )}
                </div>
                <div className="p-1.5 md:p-3">
                  <p className="text-[10px] md:text-sm font-semibold text-foreground line-clamp-1">{item.title}</p>
                  {item.description && (
                    <p className="text-[9px] md:text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="hidden md:flex flex-wrap gap-1 mt-1.5">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-white/10 rounded text-white/60">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <MobileNav />
    </div>
  );
};

export default SportPage;
