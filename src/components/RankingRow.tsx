import { ChevronRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { showsData } from "@/data/shows";
import { useRef } from "react";

interface RankShow {
  title: string;
  rank: number;
  gradient: string;
  info?: string;
  badge?: string;
  poster?: string;
}

interface RankingRowProps {
  title: string;
  shows: RankShow[];
}

const RankingRow = ({ title, shows }: RankingRowProps) => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 600, behavior: "smooth" });
    }
  };

  return (
    <section className="mb-3 md:mb-8 animate-fade-in">
      <div className="flex items-center gap-1 px-1 md:px-4 mb-3">
        <h2 className="text-xs md:text-xl font-bold text-foreground uppercase tracking-wide">{title}</h2>
      </div>
      <div className="relative group/row overflow-hidden">
        <div ref={scrollRef} className="flex gap-2 md:gap-3 px-1 md:px-4 overflow-x-auto scrollbar-hidden pb-2">
          {shows.map((show) => {
            const handleClick = () => {
              const found = showsData.find((s) => s.title === show.title);
              if (found) navigate(`/detail/${found.slug}`);
              else {
                const slug = show.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                navigate(`/detail/${slug}`);
              }
            };

            return (
              <div key={show.rank} className="flex-shrink-0 w-[120px] md:w-[170px] cursor-pointer group" onClick={handleClick}>
                <div
                  className="w-full aspect-[3/4] rounded-lg mb-2 relative overflow-hidden"
                  style={{ background: show.gradient }}
                >
                  {show.poster && (
                    <img
                      src={show.poster}
                      alt={show.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  {show.badge && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-sm text-[11px] font-bold bg-primary text-primary-foreground z-10">
                      {show.badge}
                    </span>
                  )}
                  {show.rank <= 10 && (
                    <span className="absolute top-2 right-2 bg-primary text-primary-foreground px-1.5 py-0.5 rounded-sm text-[10px] font-bold z-10">
                      TOP {show.rank}
                    </span>
                  )}
                  <div
                    className="absolute bottom-0 left-0 right-0 px-2 pb-2 pt-8"
                    style={{ background: "linear-gradient(0deg, rgba(10,12,15,0.8) 0%, transparent 100%)" }}
                  >
                    {show.info && <span className="text-[11px] text-foreground/80">{show.info}</span>}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary">
                      <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                    </div>
                  </div>
                </div>
                <p className="text-[13px] text-foreground truncate leading-tight">{show.title}</p>
                {show.info && <p className="text-[11px] text-muted-foreground mt-0.5">{show.info}</p>}
              </div>
            );
          })}
        </div>
        <button
          onClick={scrollRight}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-20 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-6 h-6 text-foreground" />
        </button>
      </div>
    </section>
  );
};

export default RankingRow;
