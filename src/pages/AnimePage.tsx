import Navbar from "@/components/Navbar";
import ContentRow from "@/components/ContentRow";
import MobileNav from "@/components/MobileNav";
import { useSeries, useMovies } from "@/hooks/useFirestore";
import { ContentPageSkeleton } from "@/components/PageSkeleton";

const ANIME_GENRES = ["Animation", "Anime", "Fantasy"];
const ANIME_CATS = ["Anime", "Animation"];

const isAnime = (item: any) =>
  item.genre?.some((g: string) => ANIME_GENRES.includes(g)) ||
  item.categories?.some((c: string) => ANIME_CATS.includes(c));

const toCard = (item: any, useEpisodes = true) => ({
  title: item.title, slug: item.slug, poster: item.poster,
  episodes: useEpisodes ? item.episodes : item.duration,
  rating: item.rating, isVip: item.isVip,
});

const AnimePage = () => {
  const { series, loading: sLoading } = useSeries();
  const { movies, loading: mLoading } = useMovies();

  const animeFromSeries = series.filter(isAnime).map((s) => toCard(s, true));
  const animeFromMovies = movies.filter(isAnime).map((m) => toCard(m, false));
  const allAnime = [...animeFromSeries, ...animeFromMovies];
  const loading = sLoading || mLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div style={{ marginTop: "48px" }} className="pt-6 pb-16">
        {loading ? (
          <ContentPageSkeleton />
        ) : allAnime.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">No anime uploaded yet. Upload content with "Animation" or "Anime" genre or category.</div>
        ) : (
          <>
            <ContentRow title="Popular Anime" shows={allAnime.slice(0, 8)} />
            {animeFromSeries.length > 0 && <ContentRow title="Anime Series" shows={animeFromSeries} />}
            {animeFromMovies.length > 0 && <ContentRow title="Anime Movies" shows={animeFromMovies} />}
            <ContentRow title="All Anime" shows={allAnime} />
          </>
        )}
      </div>
      <MobileNav />
    </div>
  );
};

export default AnimePage;
