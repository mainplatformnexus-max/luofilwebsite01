import { useState, useEffect } from "react";
import { Trophy, ArrowUp, ArrowDown, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMovies, useSeries } from "@/hooks/useFirestore";
import { moviesService, seriesService } from "@/lib/firestore";
import { toast } from "@/hooks/use-toast";

const rankingSections = ["Overall", "Drama", "Movie", "Anime", "Variety Show", "Most Watched"];

type RankItem = { id: string; title: string; rank: number; section: string; rating: string; type: string; firestoreId: string; collection: "movies" | "series" };

export default function AdminRanking() {
  const { movies, loading: moviesLoading } = useMovies();
  const { series, loading: seriesLoading } = useSeries();
  const [section, setSection] = useState("Overall");
  const [items, setItems] = useState<RankItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (moviesLoading || seriesLoading) return;
    const all: RankItem[] = [
      ...movies.map((m, i) => ({
        id: `movie-${m.id}`,
        firestoreId: m.id!,
        collection: "movies" as const,
        title: m.title,
        rank: (m as any).displayOrder || i + 1,
        section: m.section || "Overall",
        rating: m.rating || "0",
        type: "Movie",
      })),
      ...series.map((s, i) => ({
        id: `series-${s.id}`,
        firestoreId: s.id!,
        collection: "series" as const,
        title: s.title,
        rank: (s as any).displayOrder || i + 1,
        section: s.section || "Overall",
        rating: s.rating || "0",
        type: "Series",
      })),
    ];
    setItems(all);
  }, [movies, series, moviesLoading, seriesLoading]);

  const filtered = items
    .filter((i) => section === "Overall" || i.section === section || i.section === "" || i.type === section)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 20)
    .map((item, idx) => ({ ...item, displayRank: idx + 1 }));

  const moveUp = (id: string) => {
    setItems((prev) => {
      const sectionItems = prev.filter((i) => section === "Overall" || i.section === section || i.type === section).sort((a, b) => a.rank - b.rank);
      const idx = sectionItems.findIndex((i) => i.id === id);
      if (idx <= 0) return prev;
      const above = sectionItems[idx - 1];
      const current = sectionItems[idx];
      return prev.map((i) => {
        if (i.id === current.id) return { ...i, rank: above.rank };
        if (i.id === above.id) return { ...i, rank: current.rank };
        return i;
      });
    });
  };

  const moveDown = (id: string) => {
    setItems((prev) => {
      const sectionItems = prev.filter((i) => section === "Overall" || i.section === section || i.type === section).sort((a, b) => a.rank - b.rank);
      const idx = sectionItems.findIndex((i) => i.id === id);
      if (idx < 0 || idx >= sectionItems.length - 1) return prev;
      const below = sectionItems[idx + 1];
      const current = sectionItems[idx];
      return prev.map((i) => {
        if (i.id === current.id) return { ...i, rank: below.rank };
        if (i.id === below.id) return { ...i, rank: current.rank };
        return i;
      });
    });
  };

  const saveRankings = async () => {
    setSaving(true);
    try {
      await Promise.all(
        filtered.map((item) => {
          const service = item.collection === "movies" ? moviesService : seriesService;
          return service.update(item.firestoreId, { displayOrder: item.displayRank } as any);
        })
      );
      toast({ title: "Rankings saved" });
    } catch {
      toast({ title: "Failed to save rankings", variant: "destructive" });
    }
    setSaving(false);
  };

  const loading = moviesLoading || seriesLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Trophy className="w-6 h-6 text-amber-400" /> Ranking Management</h1>
        <button onClick={saveRankings} disabled={saving || loading} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg text-sm font-semibold hover:bg-amber-400 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Rankings
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {rankingSections.map((s) => (
          <button key={s} onClick={() => setSection(s)} className={cn("px-3 py-1.5 rounded-lg text-xs", section === s ? "bg-amber-500 text-black font-semibold" : "bg-white/5 text-white/60")}>{s}</button>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-white/40"><Loader2 className="w-4 h-4 animate-spin" /> Loading content...</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-white/30 text-sm">No content found in this section.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50">
                <th className="p-3 w-20">Rank</th>
                <th className="text-left p-3">Title</th>
                <th className="p-3">Type</th>
                <th className="p-3">Rating</th>
                <th className="p-3">Move</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3 text-center">
                    <span className={cn("inline-flex w-8 h-8 rounded-full items-center justify-center font-bold text-sm", item.displayRank <= 3 ? "bg-amber-500 text-black" : "bg-white/10 text-white/60")}>
                      {item.displayRank}
                    </span>
                  </td>
                  <td className="p-3 font-medium">{item.title}</td>
                  <td className="p-3 text-center text-white/50">{item.type}</td>
                  <td className="p-3 text-center text-white/50">⭐ {item.rating || "—"}</td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => moveUp(item.id)} className="p-1 rounded bg-white/10 hover:bg-white/20"><ArrowUp className="w-3.5 h-3.5" /></button>
                      <button onClick={() => moveDown(item.id)} className="p-1 rounded bg-white/10 hover:bg-white/20"><ArrowDown className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
