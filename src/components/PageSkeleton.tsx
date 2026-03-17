import { Skeleton } from "@/components/ui/skeleton";

const CardSkeleton = ({ wide = false }: { wide?: boolean }) => (
  <div className={`flex-shrink-0 ${wide ? "w-[170px] md:w-[220px]" : "w-[120px] md:w-[170px]"}`}>
    <Skeleton className="w-full aspect-[3/4] rounded-lg mb-1.5" />
    <Skeleton className="h-3 w-4/5 rounded mb-1" />
    <Skeleton className="h-2.5 w-3/5 rounded" />
  </div>
);

const RowSkeleton = ({ count = 6, wide = false }: { count?: number; wide?: boolean }) => (
  <div className="mb-6 md:mb-10 animate-pulse">
    <Skeleton className="h-4 w-40 mx-3 md:mx-5 mb-3 rounded" />
    <div className="flex gap-2 md:gap-3 px-3 md:px-5 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} wide={wide} />
      ))}
    </div>
  </div>
);

const HeroBannerSkeleton = () => (
  <div className="px-3 md:px-5 mb-4 md:mb-6">
    <Skeleton className="w-full h-[180px] md:h-[380px] rounded-2xl" />
  </div>
);

const GridSkeleton = ({ count = 10 }: { count?: number }) => (
  <div className="px-3 md:px-14 animate-pulse">
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Skeleton className="w-full aspect-[3/4] rounded-lg mb-1.5" />
          <Skeleton className="h-3 w-4/5 rounded mb-1" />
          <Skeleton className="h-2.5 w-3/5 rounded" />
        </div>
      ))}
    </div>
  </div>
);

const RankingTabsSkeleton = () => (
  <div className="px-3 md:px-14 mb-5 animate-pulse">
    <div className="flex items-center gap-2 mb-3">
      <Skeleton className="w-5 h-5 rounded" />
      <Skeleton className="h-5 w-36 rounded" />
    </div>
    <div className="flex gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-7 w-20 rounded-full" />
      ))}
    </div>
  </div>
);

export const HomePageSkeleton = () => (
  <div className="pt-2 md:pt-4" style={{ marginTop: "48px" }}>
    <HeroBannerSkeleton />
    <RowSkeleton count={7} />
    <div className="px-3 md:px-5 mb-5">
      <Skeleton className="w-full h-[80px] md:h-[120px] rounded-xl" />
    </div>
    <RowSkeleton count={7} />
    <div className="px-3 md:px-5 mb-5">
      <Skeleton className="w-full h-[80px] md:h-[120px] rounded-xl" />
    </div>
    <RowSkeleton count={7} wide />
    <div className="flex gap-3 px-3 md:px-5 mb-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex-shrink-0">
          <Skeleton className="w-[72px] h-[72px] md:w-[90px] md:h-[90px] rounded-full mb-1.5" />
          <Skeleton className="h-2.5 w-14 mx-auto rounded" />
        </div>
      ))}
    </div>
    <RowSkeleton count={7} />
    <RowSkeleton count={7} />
  </div>
);

export const ContentPageSkeleton = () => (
  <div className="pt-6 pb-16" style={{ marginTop: "48px" }}>
    <RowSkeleton count={7} />
    <RowSkeleton count={7} />
    <RowSkeleton count={7} />
    <RowSkeleton count={7} />
  </div>
);

export const RankingPageSkeleton = () => (
  <div className="pt-2 md:pt-6" style={{ marginTop: "48px" }}>
    <RankingTabsSkeleton />
    <GridSkeleton count={10} />
  </div>
);
