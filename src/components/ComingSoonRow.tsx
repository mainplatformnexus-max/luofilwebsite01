import { ChevronRight, Play } from "lucide-react";
import { useRef } from "react";

interface ComingSoonShow {
  title: string;
  date: string;
  gradient: string;
}

interface ComingSoonRowProps {
  shows: ComingSoonShow[];
}

const ComingSoonRow = ({ shows }: ComingSoonRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 600, behavior: "smooth" });
    }
  };

  return (
    <section className="mb-3 md:mb-8 animate-fade-in">
      <div className="flex items-center gap-1 px-1 md:px-4 mb-3">
        <h2 className="text-xs md:text-xl font-bold text-foreground uppercase tracking-wide">Coming Soon</h2>
      </div>
      <div className="relative group/row overflow-hidden">
        <div ref={scrollRef} className="flex gap-2 md:gap-3 px-1 md:px-4 overflow-x-auto scrollbar-hidden pb-2">
          {shows.map((show, i) => (
            <div key={i} className="flex-shrink-0 w-[120px] md:w-[170px] cursor-pointer group">
              <div className="w-full aspect-[3/4] rounded-lg mb-2 relative overflow-hidden bg-black/20">
                <div
                  className="absolute bottom-0 left-0 right-0 px-2 pb-2 pt-8"
                  style={{ background: "linear-gradient(0deg, rgba(10,12,15,0.8) 0%, transparent 100%)" }}
                >
                  <span className="text-[11px] text-foreground/80">{show.date}</span>
                </div>
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-sm text-[11px] font-bold bg-primary text-primary-foreground z-10">
                  Coming soon
                </span>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary">
                    <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                  </div>
                </div>
              </div>
              <p className="text-[13px] text-foreground truncate leading-tight">{show.title}</p>
            </div>
          ))}
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

export default ComingSoonRow;
