import { useLocation, useNavigate } from "react-router-dom";
import { useMovies, useSeries } from "@/hooks/useFirestore";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import { Play, Star, Search } from "lucide-react";

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get("q") || "";
  const { movies } = useMovies();
  const { series } = useSeries();

  const q = query.toLowerCase().trim();

  const results = q
    ? [
        ...movies
          .filter((m) =>
            m.title?.toLowerCase().includes(q) ||
            m.genre?.some((g) => g.toLowerCase().includes(q)) ||
            m.country?.toLowerCase().includes(q)
          )
          .map((m) => ({ ...m, type: "movie" as const })),
        ...series
          .filter((s) =>
            s.title?.toLowerCase().includes(q) ||
            s.genre?.some((g) => g.toLowerCase().includes(q)) ||
            s.country?.toLowerCase().includes(q)
          )
          .map((s) => ({ ...s, type: "series" as const })),
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div style={{ marginTop: "48px" }} className="pt-4 px-3 md:px-14 pb-20">
        {/* Search heading */}
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          {q ? (
            <h1 className="text-xs font-bold uppercase tracking-wide text-foreground">
              Results for <span className="text-primary">"{query}"</span>
            </h1>
          ) : (
            <h1 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Type to search movies & series
            </h1>
          )}
          {results.length > 0 && (
            <span className="text-[10px] text-muted-foreground ml-auto">{results.length} found</span>
          )}
        </div>

        {/* Results grid */}
        {q && results.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No results for "{query}"</p>
            <p className="text-muted-foreground/50 text-xs mt-1">Try a different title, genre, or country</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2 md:gap-3">
            {results.map((item, i) => {
              const slug = item.slug || item.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
              return (
                <div
                  key={i}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/detail/${slug}`)}
                >
                  <div
                    className="w-full aspect-[3/4] rounded-lg mb-1 relative overflow-hidden bg-muted"
                    style={{ background: (item as any).gradient || "hsl(var(--muted))" }}
                  >
                    {item.poster && (
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    {item.isVip && (
                      <span className="absolute top-1 left-1 vip-badge px-1 py-0.5 rounded-sm text-[8px] font-bold z-10">VIP</span>
                    )}
                    {item.rating && (
                      <span className="absolute bottom-1 right-1 flex items-center gap-0.5 bg-black/60 rounded px-1 py-0.5 z-10">
                        <Star className="w-2 h-2 fill-yellow-400 text-yellow-400" />
                        <span className="text-[8px] text-white font-medium">{item.rating}</span>
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary">
                        <Play className="w-3.5 h-3.5 text-primary-foreground fill-primary-foreground ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] md:text-xs text-foreground truncate leading-tight">{item.title}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 capitalize">{item.type}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <MobileNav />
    </div>
  );
};

export default SearchPage;
