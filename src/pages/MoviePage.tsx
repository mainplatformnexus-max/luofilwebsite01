import Navbar from "@/components/Navbar";
import ContentRow from "@/components/ContentRow";
import MobileNav from "@/components/MobileNav";
import { useMovies } from "@/hooks/useFirestore";
import { ContentPageSkeleton } from "@/components/PageSkeleton";

const toCard = (m: any) => ({
  title: m.title, slug: m.slug, poster: m.poster,
  episodes: m.duration, rating: m.rating, isVip: m.isVip,
});

const hasCategory = (m: any, cat: string) =>
  m.categories?.some((c: string) => c.toLowerCase().includes(cat.toLowerCase()));

const hasGenre = (m: any, genre: string) =>
  m.genre?.some((g: string) => g.toLowerCase().includes(genre.toLowerCase()));

const MoviePage = () => {
  const { movies, loading } = useMovies();

  const all = movies.map(toCard);
  const popular = movies.filter((m) => m.isPopular || m.isHotDrama).map(toCard);
  const comingSoon = movies.filter((m) => m.isComingSoon).map(toCard);
  const topRated = movies.filter((m) => m.isTopTen).map(toCard);
  const latest = movies.filter((m) => parseInt(m.year) >= 2024).map(toCard);
  const action = movies.filter((m) => hasGenre(m, "Action")).map(toCard);
  const romance = movies.filter((m) => hasGenre(m, "Romance") || hasCategory(m, "Romance")).map(toCard);
  const sweetRomance = movies.filter((m) => hasCategory(m, "Sweet Romance")).map(toCard);
  const ancientCostume = movies.filter((m) => hasCategory(m, "Ancient Costume") || hasGenre(m, "Historical") || hasGenre(m, "Period")).map(toCard);
  const highQuality = movies.filter((m) => hasCategory(m, "High Quality")).map(toCard);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div style={{ marginTop: "48px" }} className="pt-6 pb-16">
        {loading ? (
          <ContentPageSkeleton />
        ) : all.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">No movies uploaded yet</div>
        ) : (
          <>
            <ContentRow title="Popular on LUO FILM" shows={all.slice(0, 8)} />
            {popular.length > 0 && <ContentRow title="Hot Movies" shows={popular} />}
            {topRated.length > 0 && <ContentRow title="Top Rated" shows={topRated} />}
            {latest.length > 0 && <ContentRow title="Latest Release" shows={latest} />}
            {action.length > 0 && <ContentRow title="Action & Adventure" shows={action} />}
            {romance.length > 0 && <ContentRow title="Romance" shows={romance} />}
            {sweetRomance.length > 0 && <ContentRow title="Sweet Romance" shows={sweetRomance} />}
            {ancientCostume.length > 0 && <ContentRow title="Ancient Costume" shows={ancientCostume} />}
            {highQuality.length > 0 && <ContentRow title="High Quality" shows={highQuality} />}
            {comingSoon.length > 0 && <ContentRow title="Coming Soon" shows={comingSoon} />}
            <ContentRow title="All Movies" shows={all} />
          </>
        )}
      </div>
      <MobileNav />
    </div>
  );
};

export default MoviePage;
