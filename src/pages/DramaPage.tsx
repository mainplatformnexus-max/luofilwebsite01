import Navbar from "@/components/Navbar";
import ContentRow from "@/components/ContentRow";
import MobileNav from "@/components/MobileNav";
import PromoBanner from "@/components/PromoBanner";
import { useSeries, useAds } from "@/hooks/useFirestore";
import { ContentPageSkeleton } from "@/components/PageSkeleton";

const toCard = (s: any) => ({
  title: s.title, slug: s.slug, poster: s.poster,
  episodes: s.episodes, rating: s.rating, isVip: s.isVip,
});

const hasCategory = (s: any, cat: string) =>
  s.categories?.some((c: string) => c.toLowerCase().includes(cat.toLowerCase()));

const hasGenre = (s: any, genre: string) =>
  s.genre?.some((g: string) => g.toLowerCase().includes(genre.toLowerCase()));

const isNotAnimeOrVariety = (s: any) =>
  !s.genre?.some((g: string) => ["Animation", "Anime", "Variety Show", "Reality"].includes(g)) &&
  !s.categories?.some((c: string) => ["Anime", "Animation", "Variety Show", "Reality"].includes(c));

const DramaPage = () => {
  const { series, loading } = useSeries();
  const { ads } = useAds("Drama");

  const dramas = series.filter(isNotAnimeOrVariety);
  const all = dramas.map(toCard);
  const popular = dramas.filter((s) => s.isPopular || s.isHotDrama).map(toCard);
  const comingSoon = dramas.filter((s) => s.isComingSoon).map(toCard);
  const romance = dramas.filter((s) => hasGenre(s, "Romance") || hasCategory(s, "Romance")).map(toCard);
  const sweetRomance = dramas.filter((s) => hasCategory(s, "Sweet Romance")).map(toCard);
  const action = dramas.filter((s) => hasGenre(s, "Action") || hasGenre(s, "Historical")).map(toCard);
  const ancientCostume = dramas.filter((s) => hasCategory(s, "Ancient Costume") || hasGenre(s, "Historical") || hasGenre(s, "Period")).map(toCard);
  const highQuality = dramas.filter((s) => hasCategory(s, "High Quality")).map(toCard);

  const showAll = all.length === 0 ? series.map(toCard) : all;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div style={{ marginTop: "48px" }} className="pt-6 pb-16">
        {loading ? (
          <ContentPageSkeleton />
        ) : showAll.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">No dramas uploaded yet</div>
        ) : (
          <>
            <ContentRow title="Popular on LUO FILM" shows={showAll.slice(0, 8)} />
            {ads[0] && <PromoBanner {...ads[0]} />}
            {popular.length > 0 && <ContentRow title="Hot Dramas" shows={popular} />}
            {romance.length > 0 && <ContentRow title="Romance & Love" shows={romance} />}
            {sweetRomance.length > 0 && <ContentRow title="Sweet Romance" shows={sweetRomance} />}
            {ads[1] && <PromoBanner {...ads[1]} />}
            {action.length > 0 && <ContentRow title="Action & Historical" shows={action} />}
            {ancientCostume.length > 0 && <ContentRow title="Ancient Costume" shows={ancientCostume} />}
            {highQuality.length > 0 && <ContentRow title="High Quality" shows={highQuality} />}
            {comingSoon.length > 0 && <ContentRow title="Coming Soon" shows={comingSoon} />}
            <ContentRow title="All Dramas" shows={showAll} />
          </>
        )}
      </div>
      <MobileNav />
    </div>
  );
};

export default DramaPage;
