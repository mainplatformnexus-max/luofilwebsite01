import { useState } from "react";
import { Plus, Edit, Trash2, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useMovies } from "@/hooks/useFirestore";
import { moviesService, FirestoreMovie } from "@/lib/firestore";
import { toast } from "@/hooks/use-toast";

const sections = [
  "Trending", "New Release", "Popular", "Recommended",
  "Action", "Romance", "Comedy", "Thriller", "Sci-Fi", "Horror",
  "Fantasy", "Animation", "Documentary", "Variety Show", "Costume", "Mystery",
  "Adventure", "Wuxia", "Historical", "Crime", "War",
  "Suspense Adventure", "Mainland Chinese", "Fantasy and Adventure",
  "Thai Romance Drama", "Teen Dramas", "Inspirational Dramas",
  "Romance K-dramas", "Heart-Stealing CEO Series", "Modern Love",
  "Kung Fu", "Zombie & Horror", "For Kids",
];
const genres = ["Action", "Comedy", "Drama", "Romance", "Thriller", "Sci-Fi", "Horror", "Fantasy", "Animation", "Documentary", "Variety Show", "Costume", "Mystery", "Adventure", "Wuxia", "Historical"];

const extractEmbedSrc = (input: string): string => {
  const trimmed = input.trim();
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/);
  if (srcMatch) return srcMatch[1];
  return trimmed;
};

const emptyMovie: Omit<FirestoreMovie, "id"> = {
  title: "", slug: "", poster: "", rating: "", ageRating: "13+", year: "2025",
  country: "", genre: [], description: "", section: "Trending", duration: "",
  actors: [], isVip: false, embedUrl: "", streamLinks: [],
};

export default function AdminMovies() {
  const { movies, loading } = useMovies();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FirestoreMovie | null>(null);
  const [form, setForm] = useState(emptyMovie);
  const [saving, setSaving] = useState(false);

  const [embedCodeInput, setEmbedCodeInput] = useState("");
  const openCreate = () => { setEditing(null); setForm(emptyMovie); setEmbedCodeInput(""); setFormOpen(true); };

  const openEdit = (m: FirestoreMovie) => {
    setEditing(m);
    setForm({
      ...emptyMovie,
      ...m,
      genre: Array.isArray(m.genre) ? m.genre : [],
      actors: Array.isArray(m.actors) ? m.actors : [],
      streamLinks: Array.isArray(m.streamLinks) ? m.streamLinks : [],
      embedUrl: m.embedUrl || "",
    });
    setEmbedCodeInput(m.embedUrl || "");
    setFormOpen(true);
  };

  const deleteMovie = async (id: string) => {
    if (!confirm("Delete this movie?")) return;
    await moviesService.delete(id);
    toast({ title: "Movie deleted" });
  };

  const addStreamLink = () => setForm((f) => ({ ...f, streamLinks: [...(f.streamLinks || []), { quality: "", url: "", fileSize: "" }] }));
  const removeStreamLink = (i: number) => setForm((f) => ({ ...f, streamLinks: (f.streamLinks || []).filter((_, idx) => idx !== i) }));
  const updateStreamLink = (i: number, field: "quality" | "url" | "fileSize", val: string) =>
    setForm((f) => ({ ...f, streamLinks: (f.streamLinks || []).map((l, idx) => idx === i ? { ...l, [field]: val } : l) }));

  const toggleGenre = (g: string) => setForm((f) => ({ ...f, genre: f.genre.includes(g) ? f.genre.filter((x) => x !== g) : [...f.genre, g] }));
  const toggleActor = (a: string) => setForm((f) => ({ ...f, actors: f.actors.includes(a) ? f.actors.filter((x) => x !== a) : [...f.actors, a] }));

  const handleSave = async () => {
    if (!form.title) return;
    setSaving(true);
    try {
      const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const embedUrl = embedCodeInput.trim() ? extractEmbedSrc(embedCodeInput) : "";
      const saveData = { ...form, slug, embedUrl };
      if (editing?.id) {
        await moviesService.update(editing.id, saveData);
        toast({ title: "Movie updated" });
      } else {
        await moviesService.create(saveData);
        toast({ title: "Movie uploaded" });
      }
      setFormOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const filtered = movies.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()));
  const inputClass = "w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-amber-500/50";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Movies ({movies.length})</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg text-sm font-semibold hover:bg-amber-400">
          <Plus className="w-4 h-4" /> Upload Movie
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search movies..." className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-amber-500/50" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/40">Loading movies from database...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-white/40">No movies found. Upload your first movie!</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((m) => (
            <div key={m.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group">
              <div className="aspect-[2/3] bg-white/10 relative">
                {m.poster ? (
                  <img src={m.poster} alt={m.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">No Poster</div>
                )}
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-black text-xs font-bold rounded">⭐ {m.rating}</div>
                {m.isVip && <div className="absolute top-2 left-2 vip-badge px-1.5 py-0.5 rounded text-[10px] font-bold">VIP</div>}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => openEdit(m)} className="p-2 bg-blue-500 rounded-lg"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => deleteMovie(m.id!)} className="p-2 bg-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm truncate">{m.title}</h3>
                <p className="text-xs text-white/50">{m.year} · {m.country} · {m.section}</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {m.genre?.map((g) => (
                    <span key={g} className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-white/60">{g}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-[#12121a] border-white/10 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Movie" : "Upload Movie"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/50 mb-1 block">Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Movie title" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Poster URL</label>
                <input value={form.poster} onChange={(e) => setForm({ ...form, poster: e.target.value })} className={inputClass} placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Rating</label>
                <input value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className={inputClass} placeholder="8.5" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Age Rating</label>
                <select value={form.ageRating} onChange={(e) => setForm({ ...form, ageRating: e.target.value })} className={inputClass}>
                  {["G", "PG", "13+", "16+", "18+"].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Year</label>
                <input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className={inputClass} placeholder="2025" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Country</label>
                <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputClass} placeholder="Chinese Mainland" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Duration</label>
                <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className={inputClass} placeholder="1h 30m" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Section</label>
                <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className={inputClass}>
                  {sections.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.isVip} onChange={(e) => setForm({ ...form, isVip: e.target.checked })} />
                <label className="text-xs text-white/50">VIP Only</label>
              </div>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputClass} placeholder="Movie description..." />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-2 block">Genres</label>
              <div className="flex gap-2 flex-wrap">
                {genres.map((g) => (
                  <button key={g} onClick={() => toggleGenre(g)} className={cn("px-3 py-1 rounded-full text-xs border transition-colors", form.genre.includes(g) ? "border-amber-500 bg-amber-500/20 text-amber-400" : "border-white/10 text-white/50 hover:bg-white/10")}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-2 block">Cast (comma separated)</label>
              <input 
                value={form.actors.join(", ")} 
                onChange={(e) => setForm({ ...form, actors: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} 
                className={inputClass} 
                placeholder="Actor 1, Actor 2, ..." 
              />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Stream Embed Code *</label>
              <p className="text-[11px] text-white/30 mb-1">Paste the full embed code (e.g. &lt;div&gt;&lt;iframe src="..."&gt;&lt;/iframe&gt;&lt;/div&gt;) or just the video URL. This is what plays in the player.</p>
              <textarea
                value={embedCodeInput}
                onChange={(e) => setEmbedCodeInput(e.target.value)}
                rows={4}
                className={inputClass}
                placeholder='<div style="position:relative;padding-top:56.25%;"><iframe src="https://..." ...></iframe></div>'
              />
              {embedCodeInput && (
                <p className="text-[11px] text-amber-400 mt-1">
                  Extracted URL: {extractEmbedSrc(embedCodeInput)}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="text-xs text-white/50">Download Links (by quality)</label>
                  <p className="text-[11px] text-white/30">These are for downloading only, not for streaming.</p>
                </div>
                <button onClick={addStreamLink} className="text-xs text-amber-400 hover:underline">+ Add Link</button>
              </div>
              <div className="space-y-2">
                {(form.streamLinks || []).map((link, i) => (
                  <div key={i} className="flex gap-2 items-center flex-wrap">
                    <select value={link.quality} onChange={(e) => updateStreamLink(i, "quality", e.target.value)} className={cn(inputClass, "w-28")}>
                      <option value="">Quality</option>
                      {["360p", "480p", "720p", "1080p", "2K", "4K"].map((q) => <option key={q} value={q}>{q}</option>)}
                    </select>
                    <input value={link.url} onChange={(e) => updateStreamLink(i, "url", e.target.value)} className={cn(inputClass, "flex-1 min-w-[160px]")} placeholder="Download URL" />
                    <input value={link.fileSize || ""} onChange={(e) => updateStreamLink(i, "fileSize", e.target.value)} className={cn(inputClass, "w-28")} placeholder="Size (e.g. 1.2 GB)" />
                    <button onClick={() => removeStreamLink(i)} className="p-2 text-red-400 hover:bg-red-500/20 rounded"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleSave} disabled={saving} className="w-full py-2.5 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 disabled:opacity-50">
              {saving ? "Saving..." : editing ? "Update Movie" : "Upload Movie"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}