import Navbar from "@/components/Navbar";
import ContentRow from "@/components/ContentRow";
import MobileNav from "@/components/MobileNav";
import PromoBanner from "@/components/PromoBanner";
import { useSeries, useMovies, useAds } from "@/hooks/useFirestore";
import { ContentPageSkeleton } from "@/components/PageSkeleton";

const VARIETY_GENRES = ["Variety Show", "Reality", "Talk Show", "Game Show"];
const VARIETY_CATS = ["Variety Show", "Reality Show"];

const isVariety = (item: any) =>
  item.genre?.some((g: string) => VARIETY_GENRES.includes(g)) ||
  item.categories?.some((c: string) => VARIETY_CATS.some(v => c.toLowerCase().includes(v.toLowerCase())));

const toCard = (item: any, useEpisodes = true) => ({
  title: item.title, slug: item.slug, poster: item.poster,
  episodes: useEpisodes ? item.episodes : item.duration,
  rating: item.rating, isVip: item.isVip,
});

const VarietyShowPage = () => {
  const { series, loading: sLoading } = useSeries();
  const { movies, loading: mLoading } = useMovies();
  const { ads } = useAds("Variety Show");

  const varietyFromSeries = series.filter(isVariety).map((s) => toCard(s, true));
  const varietyFromMovies = movies.filter(isVariety).map((m) => toCard(m, false));
  const allVariety = [...varietyFromSeries, ...varietyFromMovies];
  const loading = sLoading || mLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div style={{ marginTop: "48px" }} className="pt-6 pb-16">
        {loading ? (
          <ContentPageSkeleton />
        ) : allVariety.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">No variety shows uploaded yet. Upload content with "Variety Show" genre or category.</div>
        ) : (
          <>
            <ContentRow title="Popular Variety Shows" shows={allVariety.slice(0, 8)} />
            {ads[0] && <PromoBanner {...ads[0]} />}
            {varietyFromSeries.length > 0 && <ContentRow title="Variety Series" shows={varietyFromSeries} />}
            {varietyFromMovies.length > 0 && <ContentRow title="Variety Specials" shows={varietyFromMovies} />}
            {ads[1] && <PromoBanner {...ads[1]} />}
            <ContentRow title="All Variety Shows" shows={allVariety} />
          </>
        )}
      </div>
      <MobileNav />
    </div>
  );
};

export default VarietyShowPage;
