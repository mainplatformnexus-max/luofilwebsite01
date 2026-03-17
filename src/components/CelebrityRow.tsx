import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

interface Celebrity {
  name: string;
  photo?: string;
  gradient: string;
}

interface CelebrityRowProps {
  celebrities: Celebrity[];
}

const CelebrityRow = ({ celebrities }: CelebrityRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  return (
    <section className="mb-3 md:mb-8 animate-fade-in">
      <div className="flex items-center gap-1 px-1 md:px-4 mb-3">
        <h2 className="text-xs md:text-xl font-bold text-foreground uppercase tracking-wide">Popular Celebrities</h2>
      </div>
      <div className="relative">
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-10 md:w-9 md:h-16 bg-background/90 backdrop-blur-sm rounded-r-lg flex items-center justify-center shadow-md"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-3 h-3 md:w-5 md:h-5 text-foreground" />
        </button>

        <div ref={scrollRef} className="flex gap-3 px-1 md:px-4 overflow-x-auto scrollbar-hidden pb-2">
          {celebrities.map((celeb, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer">
              <div
                className="celebrity-avatar w-[72px] h-[72px] rounded-full overflow-hidden"
                style={!celeb.photo ? { background: celeb.gradient } : undefined}
              >
                {celeb.photo ? (
                  <img
                    src={celeb.photo}
                    alt={celeb.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                      (e.currentTarget.parentElement as HTMLElement).style.background = celeb.gradient;
                    }}
                  />
                ) : null}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap max-w-[80px] text-center truncate">{celeb.name}</span>
            </div>
          ))}
        </div>

        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-10 md:w-9 md:h-16 bg-background/90 backdrop-blur-sm rounded-l-lg flex items-center justify-center shadow-md"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-3 h-3 md:w-5 md:h-5 text-foreground" />
        </button>
      </div>
    </section>
  );
};

export default CelebrityRow;
