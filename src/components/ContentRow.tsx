import { ChevronRight, Play, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";

interface Show {
  title: string;
  slug?: string;
  episodes?: string;
  poster?: string;
  gradient?: string;
  badge?: string;
  rating?: string;
  isVip?: boolean;
}

interface ContentRowProps {
  title: string;
  shows: Show[];
  showArrow?: boolean;
}

const ShowCard = ({ show }: { show: Show }) => {
  const navigate = useNavigate();
  const handleClick = () => {
    if (!show.title && !show.slug) return;
    const slug = show.slug || (show.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!slug) return;
    navigate(`/detail/${slug}`);
  };

  return (
    <div className="flex-shrink-0 w-[120px] md:w-[170px] cursor-pointer group" onClick={handleClick}>
      <div className="w-full aspect-[3/4] rounded-lg mb-1 relative overflow-hidden bg-black/20">
        {show.poster && (
          <img
            src={show.poster}
            alt={show.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
        {(show.badge || show.isVip) && (
          <span className={`absolute top-1.5 left-1.5 px-1 py-0.5 rounded-sm text-[9px] font-bold z-10 ${
            (show.badge === 'VIP' || show.isVip) ? 'vip-badge' : 'bg-primary text-primary-foreground'
          }`}>
            {show.badge || 'VIP'}
          </span>
        )}
        {show.rating && (
          <span className="absolute bottom-1 right-1 flex items-center gap-0.5 bg-black/60 rounded px-1 py-0.5 z-10">
            <Star className="w-2 h-2 fill-yellow-400 text-yellow-400" />
            <span className="text-[9px] text-white font-medium">{show.rating}</span>
          </span>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
          <div className="w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-primary">
            <Play className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
          </div>
        </div>
      </div>
      <p className="text-[10px] md:text-[13px] text-foreground truncate leading-tight">{show.title}</p>
      {show.episodes && (
        <p className="text-[9px] md:text-[11px] text-muted-foreground mt-0.5">{show.episodes}</p>
      )}
    </div>
  );
};

const ContentRow = ({ title, shows, showArrow = true }: ContentRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 400, behavior: "smooth" });
    }
  };

  if (shows.length === 0) return null;

  return (
    <section className="mb-3 md:mb-8 animate-fade-in">
      <div className="flex items-center gap-1 px-1 md:px-4 mb-1.5 md:mb-3">
        <h2 className="text-xs md:text-xl font-bold text-foreground uppercase tracking-wide">{title}</h2>
      </div>
      <div className="relative">
        <div ref={scrollRef} className="flex gap-1.5 md:gap-3 px-1 md:px-4 overflow-x-auto scrollbar-hidden pb-1">
          {shows.map((show, i) => (
            <ShowCard key={i} show={show} />
          ))}
        </div>
        {/* Gradient fade — pointer-events-none so it never blocks card clicks */}
        <div
          className="absolute right-0 top-0 bottom-1 w-8 md:w-10 pointer-events-none z-10"
          style={{ background: "linear-gradient(to left, rgba(10,12,15,0.9) 40%, transparent 100%)" }}
        />
        {/* Small tappable arrow button only covers a tiny circle at center-right */}
        <button
          onClick={scrollRight}
          className="absolute right-0.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 flex items-center justify-center cursor-pointer"
        >
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-white drop-shadow-lg" />
        </button>
      </div>
    </section>
  );
};

export default ContentRow;
