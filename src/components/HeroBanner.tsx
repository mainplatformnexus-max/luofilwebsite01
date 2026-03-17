import { ChevronLeft, ChevronRight, Play, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCarousels } from "@/hooks/useFirestore";
import { useState, useEffect, useRef } from "react";
import heroBanner from "@/assets/hero-banner.jpg";

const HeroBanner = () => {
  const navigate = useNavigate();
  const { carousels, loading } = useCarousels("Home");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const slides = carousels.length > 0 ? carousels : [{
    id: "fallback",
    title: "Welcome to LUO FILM",
    image: heroBanner,
    linkTo: "/",
    page: "Home",
    order: 1,
    description: "Watch trending movies, dramas, and anime for free. Stream the latest Asian entertainment.",
    rating: "9.5",
    year: "2025",
    tags: ["Drama", "Action", "Romance"],
  }];

  const goToSlide = (index: number) => {
    if (animating) return;
    setAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setAnimating(false), 600);
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentSlide((p) => (p + 1) % slides.length);
    }, 5000);
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [slides.length]);

  const prevSlide = () => {
    const prev = (currentSlide - 1 + slides.length) % slides.length;
    goToSlide(prev);
    startTimer();
  };

  const nextSlide = () => {
    const next = (currentSlide + 1) % slides.length;
    goToSlide(next);
    startTimer();
  };

  const current = slides[currentSlide] || slides[0];

  const handleNavigate = (linkTo?: string) => {
    if (!linkTo) return;
    if (linkTo.startsWith("http://") || linkTo.startsWith("https://")) {
      window.open(linkTo, "_blank", "noopener noreferrer");
    } else {
      navigate(linkTo);
    }
  };

  return (
    <div className="relative w-full" style={{ marginTop: '48px' }}>
      <div className="relative w-full aspect-[16/7] max-h-[600px] overflow-hidden">
        {slides.map((slide, i) => (
          <img
            key={slide.id || i}
            src={slide.image || heroBanner}
            alt={slide.title}
            referrerPolicy="no-referrer"
            onClick={() => i === currentSlide && handleNavigate(slide.linkTo)}
            className={`absolute inset-0 w-full h-full object-cover ${slide.linkTo ? "cursor-pointer" : ""}`}
            style={{
              opacity: i === currentSlide ? 1 : 0,
              transition: "opacity 0.7s ease-in-out",
              zIndex: i === currentSlide ? 1 : 0,
            }}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-r from-background/60 md:from-background via-transparent to-transparent" style={{ zIndex: 2 }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 md:from-background via-transparent to-transparent" style={{ zIndex: 2 }} />

        <button
          onClick={prevSlide}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-6 h-6 md:w-10 md:h-10 flex items-center justify-center rounded bg-[rgba(0,0,0,0.4)] hover:bg-[rgba(0,0,0,0.6)] transition-colors"
          style={{ zIndex: 10 }}
        >
          <ChevronLeft className="w-3.5 h-3.5 md:w-6 md:h-6 text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-6 h-6 md:w-10 md:h-10 flex items-center justify-center rounded bg-[rgba(0,0,0,0.4)] hover:bg-[rgba(0,0,0,0.6)] transition-colors"
          style={{ zIndex: 10 }}
        >
          <ChevronRight className="w-3.5 h-3.5 md:w-6 md:h-6 text-white" />
        </button>

        <div
          className="absolute bottom-[15%] left-6 md:left-16 max-w-lg"
          style={{ zIndex: 5, transition: "opacity 0.4s ease-in-out", opacity: animating ? 0.6 : 1 }}
        >
          {current.rating && (
            <div className="flex items-center gap-2 text-[11px] md:text-sm text-foreground/90 font-medium mb-1 md:mb-2">
              <span className="text-primary flex items-center gap-1">
                <Star className="w-2.5 h-2.5 md:w-3 md:h-3 fill-primary text-primary" />
                {current.rating}
              </span>
              {current.year && (
                <>
                  <span className="text-foreground/20 mx-1">|</span>
                  <span>{current.year}</span>
                </>
              )}
            </div>
          )}
          <h1 className="text-sm md:text-5xl font-bold text-foreground mb-1 md:mb-2 tracking-tight uppercase">
            {current.title}
          </h1>
          {current.tags && current.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 md:gap-2 mb-2 md:mb-3">
              {current.tags.map((tag: string) => (
                <span key={tag} className="px-1 py-0.5 md:px-1.5 rounded-sm bg-secondary text-secondary-foreground text-[9px] md:text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {current.description && (
            <p className="hidden md:block text-sm text-foreground/80 mb-4 line-clamp-2 leading-relaxed" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              {current.description}
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavigate(current.linkTo)}
              className="w-8 h-8 md:w-[52px] md:h-[52px] rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <Play className="w-3.5 h-3.5 md:w-5 md:h-5 fill-primary-foreground text-primary-foreground ml-0.5" />
            </button>
          </div>
        </div>

        <div className="absolute bottom-4 right-6 md:right-16 flex gap-2" style={{ zIndex: 10 }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { goToSlide(i); startTimer(); }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentSlide ? "bg-primary w-4" : "bg-foreground/30"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
