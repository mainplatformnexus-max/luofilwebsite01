import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MovieSlide {
  title: string;
  slug: string;
  year: string;
  rating: string;
  tags: string[];
  description: string;
  score: string;
  isVip: boolean;
  bgImage: string;
  characterImage: string;
  titleImage?: string;
}

const movieSlides: MovieSlide[] = [
  {
    title: "The Ghost Marriage",
    slug: "the-ghost-marriage",
    year: "2026",
    rating: "13+",
    tags: ["Chinese Mainland", "Costume", "Romance"],
    description: "Can the series of bizarre events truly be brought to an end?",
    score: "-",
    isVip: true,
    bgImage: "https://pic1.iqiyipic.com/hamster/20260310/28/25/d24f8dbce9_1808_1017.webp",
    characterImage: "https://pic2.iqiyipic.com/hamster/20260310/79/9c/bed4a7c55a_xxx.webp",
    titleImage: "https://pic3.iqiyipic.com/hamster/20260310/28/76/2f34aa64ec_xxx.webp",
  },
  {
    title: "Detective Dee: Buddha's Wrath",
    slug: "detective-dee-buddhas-wrath",
    year: "2026",
    rating: "13+",
    tags: ["Chinese Mainland", "Costume", "Mystery", "Action"],
    description: "In the early years of the Zaichu reign of the Tang Dynasty, the wreckage of the collapsed Heavenly Pagoda is resurrected overnight.",
    score: "9.2",
    isVip: true,
    bgImage: "https://pic5.iqiyipic.com/image/20260304/16/af/v_193371785_m_601_en.jpg",
    characterImage: "",
  },
  {
    title: "FURY IN THE SHADOWS",
    slug: "fury-in-the-shadows",
    year: "2026",
    rating: "13+",
    tags: ["Chinese Mainland", "Revenge", "Crime", "Action"],
    description: "In Southeast Asia in the 1980s, the gang led by armed robber Tan Li is trapped in Dina City after a robbery.",
    score: "8.8",
    isVip: true,
    bgImage: "https://pic9.iqiyipic.com/image/20260212/b6/19/v_192634854_m_601_en.jpg",
    characterImage: "",
  },
  {
    title: "SECOND LIFE",
    slug: "second-life",
    year: "2024",
    rating: "13+",
    tags: ["Chinese Mainland", "Martial Arts", "Comedy", "Action"],
    description: "28 years ago, Liang gives birth to a boy in prison. Years later, a mother and son help each other redeem themselves.",
    score: "9.8",
    isVip: true,
    bgImage: "https://pic5.iqiyipic.com/image/20250314/63/0d/v_177958807_m_601_en_m1.jpg",
    characterImage: "",
  },
];

const MovieHeroBanner = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % movieSlides.length);
  }, []);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + movieSlides.length) % movieSlides.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(goNext, 6000);
    return () => clearInterval(interval);
  }, [goNext]);

  const slide = movieSlides[activeIndex];

  return (
    <div className="relative w-full" style={{ marginTop: "48px" }}>
      <div className="relative w-full aspect-[16/7] max-h-[600px] overflow-hidden">
        {/* Background image */}
        {movieSlides.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === activeIndex ? 1 : 0 }}
          >
            <img
              src={s.bgImage}
              alt={s.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              loading={i === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}

        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        {/* Character overlay */}
        {slide.characterImage && (
          <div className="absolute right-[5%] bottom-0 h-[90%] w-[40%] pointer-events-none z-[5]">
            <img
              src={slide.characterImage}
              alt=""
              className="w-full h-full object-contain object-bottom"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Nav arrows */}
        <button
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded bg-[rgba(0,0,0,0.3)] hover:bg-[rgba(0,0,0,0.5)] transition-colors z-20"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <button
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded bg-[rgba(0,0,0,0.3)] hover:bg-[rgba(0,0,0,0.5)] transition-colors z-20"
        >
          <ChevronRight className="w-6 h-6 text-foreground" />
        </button>

        {/* Content overlay */}
        <div className="absolute bottom-[15%] left-16 max-w-lg z-10">
          {slide.isVip && (
            <span className="vip-badge inline-block px-1.5 py-0.5 rounded text-xs font-bold mb-3">
              VIP
            </span>
          )}

          {slide.titleImage ? (
            <div className="mb-3">
              <img
                src={slide.titleImage}
                alt={slide.title}
                className="max-h-[80px] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-2 tracking-tight">
              {slide.title}
            </h2>
          )}

          <div className="flex items-center gap-2 text-sm text-foreground/80 font-medium mb-3">
            {slide.score !== "-" && (
              <>
                <span className="text-primary flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 28 27" fill="currentColor">
                    <path d="M14 0l4.3 8.7L27.4 10l-6.7 6.5 1.6 9.2L14 21.4 5.7 25.7l1.6-9.2L.6 10l9.1-1.3z" />
                  </svg>
                  {slide.score}
                </span>
                <span className="text-foreground/20 mx-1">|</span>
              </>
            )}
            <span>{slide.year}</span>
            <span className="text-foreground/20 mx-1">|</span>
            <span>{slide.rating}</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {slide.tags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded-sm bg-foreground/[0.08] text-foreground/80 text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

          <p
            className="text-sm text-foreground/80 mb-5 line-clamp-2 leading-relaxed font-medium"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
          >
            {slide.description}
          </p>

          <div className="flex items-center gap-3">
            <button
              className="w-[60px] h-[60px] rounded-full bg-primary flex items-center justify-center hover:brightness-110 transition"
              onClick={() => navigate(`/detail/${slide.slug}`)}
            >
              <Play className="w-6 h-6 text-primary-foreground fill-primary-foreground ml-0.5" />
            </button>
            <button className="w-10 h-10 rounded-full border border-foreground/25 flex items-center justify-center hover:border-primary transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Dots */}
        <div className="absolute bottom-4 right-16 flex gap-2 z-20">
          {movieSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === activeIndex ? "bg-primary" : "bg-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MovieHeroBanner;
