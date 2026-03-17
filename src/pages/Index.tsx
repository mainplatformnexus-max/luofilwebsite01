import { useState } from "react";
import Navbar from "@/components/Navbar";
import { HomePageSkeleton } from "@/components/PageSkeleton";
import HeroBanner from "@/components/HeroBanner";
import CategoryTabs from "@/components/CategoryTabs";
import ContentRow from "@/components/ContentRow";
import RankingRow from "@/components/RankingRow";
import CelebrityRow from "@/components/CelebrityRow";
import PromoBanner from "@/components/PromoBanner";
import MobileNav from "@/components/MobileNav";
import { useMovies, useSeries, useCelebrities, useAds } from "@/hooks/useFirestore";
import { FirestoreMovie, FirestoreSeries } from "@/lib/firestore";

const gradients = [
  "linear-gradient(135deg, #e8455a, #f49097)",
  "linear-gradient(135deg, #6366f1, #a78bfa)",
  "linear-gradient(135deg, #f59e0b, #fbbf24)",
  "linear-gradient(135deg, #10b981, #6ee7b7)",
  "linear-gradient(135deg, #3b82f6, #93c5fd)",
  "linear-gradient(135deg, #ec4899, #f9a8d4)",
  "linear-gradient(135deg, #8b5cf6, #c4b5fd)",
  "linear-gradient(135deg, #14b8a6, #5eead4)",
  "linear-gradient(135deg, #f97316, #fdba74)",
  "linear-gradient(135deg, #ef4444, #fca5a5)",
];

const celebGradients = [
  "linear-gradient(135deg, #fda4af, #fecdd3)",
  "linear-gradient(135deg, #a78bfa, #c4b5fd)",
  "linear-gradient(135deg, #67e8f9, #a5f3fc)",
  "linear-gradient(135deg, #fbbf24, #fde68a)",
  "linear-gradient(135deg, #6ee7b7, #a7f3d0)",
];

type ContentItem = FirestoreMovie | FirestoreSeries;

const matchesCategory = (item: ContentItem, category: string): boolean => {
  if (category === "All Videos") return true;
  const country = (item.country || "").toLowerCase();
  const genres = ((item as any).genre || []).map((g: string) => g.toLowerCase());
  const all = [...genres, country];
  const contains = (...terms: string[]) => terms.some((t) => all.some((v) => v.includes(t.toLowerCase())));

  switch (category) {
    case "Chinese Mainland": return contains("china", "chinese", "mainland");
    case "South Korea":      return contains("korea", "korean");
    case "Thailand":         return contains("thailand", "thai");
    case "Taiwan":           return contains("taiwan");
    case "Japan":            return contains("japan", "japanese");
    case "Malaysia":         return contains("malaysia", "malay");
    case "Anime":            return contains("anime", "animation");
    case "Youth":            return contains("youth", "teen", "school");
    case "Mystery":          return contains("mystery", "thriller", "crime", "detective");
    case "LGBT":             return contains("lgbt", "bl", "gl");
    case "Costume":          return contains("costume", "historical", "ancient", "period");
    case "Romance":          return contains("romance", "romantic");
    case "Sweet Love":       return contains("sweet love", "sweet romance", "sweet");
    case "Startups":         return contains("startup", "startups", "business", "entrepreneur");
    default:                 return true;
  }
};

const toCard = (item: ContentItem, i: number) => ({
  title: item.title,
  slug: item.slug,
  poster: (item as any).poster || "",
  episodes: (item as any).episodes || (item as any).duration || "",
  rating: item.rating,
  isVip: item.isVip,
  isPopular: (item as any).isPopular,
  isHotDrama: (item as any).isHotDrama,
  gradient: (item as any).gradient || gradients[i % gradients.length],
});

type SectionDef = {
  title: string;
  sectionKey: string;
  fallback?: (item: ContentItem) => boolean;
};

const SECTION_DEFS: SectionDef[] = [
  {
    title: "Mainland Chinese",
    sectionKey: "Mainland Chinese",
    fallback: (item) => {
      const c = (item.country || "").toLowerCase();
      return c.includes("china") || c.includes("mainland");
    },
  },
  {
    title: "Suspense Adventure",
    sectionKey: "Suspense Adventure",
    fallback: (item) => {
      const g = ((item as any).genre || []).join(" ").toLowerCase();
      return g.includes("suspense") || g.includes("thriller") || g.includes("adventure");
    },
  },
  {
    title: "Fantasy and Adventure",
    sectionKey: "Fantasy and Adventure",
    fallback: (item) => {
      const g = ((item as any).genre || []).join(" ").toLowerCase();
      return g.includes("fantasy") || g.includes("adventure") || g.includes("wuxia");
    },
  },
  {
    title: "Thai Romance Drama",
    sectionKey: "Thai Romance Drama",
    fallback: (item) => {
      const c = (item.country || "").toLowerCase();
      const g = ((item as any).genre || []).join(" ").toLowerCase();
      return (c.includes("thai") || c.includes("thailand")) && (g.includes("romance") || g.includes("drama"));
    },
  },
  {
    title: "Teen Dramas",
    sectionKey: "Teen Dramas",
    fallback: (item) => {
      const g = ((item as any).genre || []).join(" ").toLowerCase();
      return g.includes("teen") || g.includes("youth") || g.includes("school");
    },
  },
  {
    title: "Inspirational Dramas",
    sectionKey: "Inspirational Dramas",
    fallback: (item) => {
      const g = ((item as any).genre || []).join(" ").toLowerCase();
      return g.includes("inspirational") || g.includes("motivational");
    },
  },
  {
    title: "Crime",
    sectionKey: "Crime",
    fallback: (item) => {
      const g = ((item as any).genre || []).join(" ").toLowerCase();
      return g.includes("crime") || g.includes("detective") || g.includes("mystery");
    },
  },
  {
    title: "Comedy",
    sectionKey: "Comedy",
    fallback: (item) => {
      const g = ((item as any).genre || []).join(" ").toLowerCase();
      return g.includes("comedy");
    },
  },
  {
    title: "War",
    sectionKey: "War",
    fallback: (item) => {
      const g = ((item as any).genre || []).join(" ").toLowerCase();
      return g.includes("war") || g.includes("military");
    },
  },
  {
    title: "Romance K-dramas",
    sectionKey: "Romance K-dramas",
    fallback: (item) => {
      const c = (item.country || "").toLowerCase();
      const g = ((item as any).genre || []).join(" ").toLowerCase();
      return (c.includes("korea") || c.includes("korean")) && g.includes("romance");
    },
  },
  {
    title: "Thriller",
    sectionKey: "Thriller",
    fallback: (item) => {
      const g = ((item as any).genre || []).join(" ").toLowerCase();
      return g.includes("thriller") || g.includes("suspense");
    },
  },
  {
    title: "Heart-Stealing CEO Series",
    sectionKey: "Heart-Stealing CEO Series",
    fallback: (item) => {
      const g = ((item as any).genre || []).join(" ").toLowerCase();
      return g.includes("ceo") || g.includes("boss") || g.includes("business romance");
    },
  },
  {
    title: "Modern Love",
    sectionKey: "Modern Love",
    fallback: (item) => {
      const g = ((item as any).genre || []).join(" ").toLowerCase();
      return g.includes("modern love") || g.includes("contemporary") || g.includes("modern romance");
    },
  },
  {
    title: "Sci-fi",
    sectionKey: "Sci-Fi",
    fallback: (item) => {
      const g = ((item as any).genre || []).join(" ").toLowerCase();
      return g.includes("sci-fi") || g.includes("science fiction") || g.includes("scifi");
    },
  },
  {
    title: "Kung Fu",
    sectionKey: "Kung Fu",
    fallback: (item) => {
      const g = ((item as any).genre || []).join(" ").toLowerCase();
      return g.includes("kung fu") || g.includes("martial arts") || g.includes("wuxia");
    },
  },
  {
    title: "Zombie & Horror",
    sectionKey: "Zombie & Horror",
    fallback: (item) => {
      const g = ((item as any).genre || []).join(" ").toLowerCase();
      return g.includes("zombie") || g.includes("horror");
    },
  },
  {
    title: "For Kids",
    sectionKey: "For Kids",
    fallback: (item) => {
      const g = ((item as any).genre || []).join(" ").toLowerCase();
      const age = (item as any).ageRating || "";
      return g.includes("kids") || g.includes("children") || g.includes("family") || age === "G" || age === "PG";
    },
  },
];

const getSectionContent = (allItems: ContentItem[], def: SectionDef) => {
  return allItems.filter((item) => {
    const secMatch = (item as any).section === def.sectionKey;
    const fallbackMatch = def.fallback ? def.fallback(item) : false;
    return secMatch || fallbackMatch;
  });
};

const Index = () => {
  const { movies, loading: moviesLoading } = useMovies();
  const { series, loading: seriesLoading } = useSeries();
  const { celebrities, loading: celebsLoading } = useCelebrities();
  const { ads } = useAds("Home");
  const [activeCategory, setActiveCategory] = useState("All Videos");

  const sortByNewest = <T extends { createdAt?: any }>(items: T[]): T[] =>
    [...items].sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db2 = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db2 - da;
    });

  const filteredMovies = sortByNewest(movies.filter((m) => (m.title || m.slug) && matchesCategory(m, activeCategory)));
  const filteredSeries = sortByNewest(series.filter((s) => (s.title || s.slug) && matchesCategory(s, activeCategory)));

  const allContent: ContentItem[] = [
    ...filteredMovies,
    ...filteredSeries,
  ];

  const allCards = allContent.map(toCard);

  const popularContent = allCards.filter((c) => c.isPopular || c.isHotDrama);
  const popularShows = popularContent.length >= 4 ? popularContent.slice(0, 8) : allCards.slice(0, 8);
  const topPicks = allCards.slice(4, 12);

  const movieSelection = filteredMovies.slice(0, 8).map((m, i) => ({
    title: m.title, slug: m.slug, poster: m.poster,
    episodes: m.rating, rating: m.rating, isVip: m.isVip,
    gradient: gradients[i % gradients.length],
  }));

  const seriesSelection = filteredSeries.slice(0, 8).map((s, i) => ({
    title: s.title, slug: s.slug, poster: s.poster,
    episodes: s.episodes, rating: s.rating, isVip: s.isVip,
    gradient: (s as any).gradient || gradients[i % gradients.length],
  }));

  const highPopularity = allCards.slice(0, 8).map((s, i) => ({
    ...s, rank: i + 1, info: s.episodes || "",
  }));

  const celebsList = celebrities.map((c, i) => ({ name: c.name, photo: c.photo, gradient: celebGradients[i % celebGradients.length] }));

  const isLoading = moviesLoading || seriesLoading;

  const allRawContent = [...movies, ...series].filter((i) => i.title || i.slug);

  return (
    <div className="min-h-screen bg-background" style={{ width: '100%', overflowX: 'hidden', margin: 0, padding: 0 }}>
      <Navbar />
      <HeroBanner />

      {isLoading ? (
        <HomePageSkeleton />
      ) : (
        <>
          <ContentRow title="Popular on LUO FILM" shows={popularShows} />
          <CategoryTabs selected={activeCategory} onSelect={setActiveCategory} />

          {allContent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <p className="text-muted-foreground text-sm">No content found for "{activeCategory}".</p>
            </div>
          ) : (
            <>
              {ads.length > 0 ? (
                <PromoBanner title={ads[0].title} subtitle={ads[0].subtitle} ctaText={ads[0].ctaText} ctaLink={ads[0].ctaLink} imageUrl={ads[0].imageUrl} />
              ) : (
                <PromoBanner />
              )}
              <ContentRow title="Top Picks for You" shows={topPicks} />
              {ads.length > 1 ? (
                <PromoBanner title={ads[1].title} subtitle={ads[1].subtitle} ctaText={ads[1].ctaText} ctaLink={ads[1].ctaLink} imageUrl={ads[1].imageUrl} />
              ) : (
                <PromoBanner />
              )}
              {highPopularity.length > 0 && <RankingRow title="High Popularity" shows={highPopularity} />}
              {celebsList.length > 0 && <CelebrityRow celebrities={celebsList} />}
              {movieSelection.length > 0 && <ContentRow title="Movie Selection" shows={movieSelection} />}
              {seriesSelection.length > 0 && <ContentRow title="Drama & Series" shows={seriesSelection} />}

              {SECTION_DEFS.map((def) => {
                const sectionItems = getSectionContent(allRawContent, def);
                if (sectionItems.length === 0) return null;
                const cards = sectionItems.slice(0, 8).map(toCard);
                return <ContentRow key={def.sectionKey} title={def.title} shows={cards} />;
              })}
            </>
          )}
        </>
      )}

      {/* Contact / Support Footer */}
      <div className="mx-4 mb-4 mt-2">
        <div className="bg-gradient-to-r from-fuchsia-600/15 via-purple-600/10 to-fuchsia-600/15 border border-fuchsia-500/20 rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="text-white/80 font-semibold text-sm">Need help? Contact us</p>
            <p className="text-white/40 text-xs mt-0.5">Our support team is ready to assist you</p>
          </div>
          <a
            href="tel:0760734679"
            className="flex items-center gap-2.5 bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:brightness-110 transition-all px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg shadow-fuchsia-500/20 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" />
            </svg>
            0760734679
          </a>
        </div>
      </div>

      <div className="h-16 md:h-16" />
      <MobileNav />
    </div>
  );
};

export default Index;
