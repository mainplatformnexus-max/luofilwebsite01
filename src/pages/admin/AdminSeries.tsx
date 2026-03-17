import { useState } from "react";
import { Plus, Edit, Trash2, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSeries } from "@/hooks/useFirestore";
import { seriesService, FirestoreSeries } from "@/lib/firestore";
import { toast } from "@/hooks/use-toast";

const genres = ["Action", "Comedy", "Drama", "Romance", "Thriller", "Sci-Fi", "Horror", "Fantasy", "Animation", "Historical", "Mystery", "Youth", "Costume"];
const sections = [
  "Trending", "New Release", "Popular", "Recommended", "Top Rated",
  "Action", "Romance", "Comedy", "Thriller", "Sci-Fi", "Horror",
  "Fantasy", "Animation", "Documentary", "Variety Show", "Costume", "Mystery",
  "Adventure", "Wuxia", "Historical", "Crime", "War",
  "Suspense Adventure", "Mainland Chinese", "Fantasy and Adventure",
  "Thai Romance Drama", "Teen Dramas", "Inspirational Dramas",
  "Romance K-dramas", "Heart-Stealing CEO Series", "Modern Love",
  "Kung Fu", "Zombie & Horror", "For Kids",
];

const emptySeries: Omit<FirestoreSeries, "id"> = {
  title: "", slug: "", poster: "", rating: "", year: "2025", seasons: 1, episodes: "",
  description: "", genre: [], actors: [], section: "Trending", country: "", isVip: false,
};

export default function AdminSeries() {
  const { series, loading } = useSeries();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FirestoreSeries | null>(null);
  const [form, setForm] = useState(emptySeries);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEditing(null); setForm(emptySeries); setFormOpen(true); };
  const openEdit = (s: FirestoreSeries) => { setEditing(s); setForm(s); setFormOpen(true); };

  const deleteSeries = async (id: string) => {
    if (!confirm("Delete this series?")) return;
    await seriesService.delete(id);
    toast({ title: "Series deleted" });
  };

  const toggleGenre = (g: string) => setForm((f) => ({ ...f, genre: f.genre.includes(g) ? f.genre.filter((x) => x !== g) : [...f.genre, g] }));

  const handleSave = async () => {
    if (!form.title) return;
    setSaving(true);
    try {
      const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      if (editing?.id) {
        await seriesService.update(editing.id, { ...form, slug });
        toast({ title: "Series updated" });
      } else {
        await seriesService.create({ ...form, slug });
        toast({ title: "Series uploaded" });
      }
      setFormOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const filtered = series.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()));
  const inputClass = "w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-amber-500/50";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Series ({series.length})</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg text-sm font-semibold hover:bg-amber-400"><Plus className="w-4 h-4" /> Upload Series</button>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search series..." className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-amber-500/50" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/40">Loading series from database...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-white/40">No series found. Upload your first series!</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((s) => (
            <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group">
              <div className="aspect-[2/3] bg-white/10 relative">
                {s.poster ? (
                  <img src={s.poster} alt={s.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">No Poster</div>
                )}
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-black text-xs font-bold rounded">⭐ {s.rating}</div>
                {s.isVip && <div className="absolute top-2 left-2 vip-badge px-1.5 py-0.5 rounded text-[10px] font-bold">VIP</div>}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => openEdit(s)} className="p-2 bg-blue-500 rounded-lg"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => deleteSeries(s.id!)} className="p-2 bg-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm truncate">{s.title}</h3>
                <p className="text-xs text-white/50">{s.year} · {s.episodes || `${s.seasons} Season${s.seasons > 1 ? "s" : ""}`} · {s.country}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-[#12121a] border-white/10 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Series" : "Upload Series"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-white/50 mb-1 block">Title *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} /></div>
              <div><label className="text-xs text-white/50 mb-1 block">Poster URL</label><input value={form.poster} onChange={(e) => setForm({ ...form, poster: e.target.value })} className={inputClass} /></div>
              <div><label className="text-xs text-white/50 mb-1 block">Rating</label><input value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className={inputClass} /></div>
              <div><label className="text-xs text-white/50 mb-1 block">Year</label><input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className={inputClass} /></div>
              <div><label className="text-xs text-white/50 mb-1 block">Episodes</label><input value={form.episodes} onChange={(e) => setForm({ ...form, episodes: e.target.value })} className={inputClass} placeholder="24 Episodes" /></div>
              <div><label className="text-xs text-white/50 mb-1 block">Seasons</label><input type="number" value={form.seasons} onChange={(e) => setForm({ ...form, seasons: parseInt(e.target.value) || 1 })} className={inputClass} /></div>
              <div><label className="text-xs text-white/50 mb-1 block">Country</label><input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputClass} /></div>
              <div><label className="text-xs text-white/50 mb-1 block">Section</label><select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className={inputClass}>{sections.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.isVip} onChange={(e) => setForm({ ...form, isVip: e.target.checked })} />
                <label className="text-xs text-white/50">VIP Only</label>
              </div>
            </div>
            <div><label className="text-xs text-white/50 mb-1 block">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputClass} /></div>
            <div><label className="text-xs text-white/50 mb-2 block">Genres</label><div className="flex gap-2 flex-wrap">{genres.map((g) => (<button key={g} onClick={() => toggleGenre(g)} className={cn("px-3 py-1 rounded-full text-xs border", form.genre.includes(g) ? "border-amber-500 bg-amber-500/20 text-amber-400" : "border-white/10 text-white/50")}>{g}</button>))}</div></div>
            <div><label className="text-xs text-white/50 mb-2 block">Cast (comma separated)</label><input value={form.actors.join(", ")} onChange={(e) => setForm({ ...form, actors: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} className={inputClass} placeholder="Actor 1, Actor 2" /></div>
            <button onClick={handleSave} disabled={saving} className="w-full py-2.5 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 disabled:opacity-50">{saving ? "Saving..." : editing ? "Update Series" : "Upload Series"}</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}