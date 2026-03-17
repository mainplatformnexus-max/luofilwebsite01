import { useState } from "react";
import { Plus, Trash2, Edit, Link } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useCarousels } from "@/hooks/useFirestore";
import { carouselsService, FirestoreCarousel } from "@/lib/firestore";
import { toast } from "@/hooks/use-toast";

const pages = ["Home", "Drama", "Movie", "Anime", "Variety Show", "Ranking"];

export default function AdminCarousels() {
  const { carousels, loading } = useCarousels();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FirestoreCarousel | null>(null);
  const [filterPage, setFilterPage] = useState("all");
  const [form, setForm] = useState({ image: "", title: "", linkTo: "", page: "Home", order: 1, description: "", rating: "", year: "", tags: "" });
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEditing(null); setForm({ image: "", title: "", linkTo: "", page: "Home", order: 1, description: "", rating: "", year: "", tags: "" }); setFormOpen(true); };
  const openEdit = (item: FirestoreCarousel) => {
    setEditing(item);
    setForm({ ...item, tags: item.tags?.join(", ") || "", description: item.description || "", rating: item.rating || "", year: item.year || "" } as any);
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: Omit<FirestoreCarousel, "id"> = {
        image: form.image, title: form.title, linkTo: form.linkTo,
        page: form.page, order: form.order,
        description: form.description, rating: form.rating, year: form.year,
        tags: form.tags ? form.tags.split(",").map(s => s.trim()).filter(Boolean) : [],
      };
      if (editing?.id) {
        await carouselsService.update(editing.id, data);
        toast({ title: "Carousel updated" });
      } else {
        await carouselsService.create(data);
        toast({ title: "Carousel added" });
      }
      setFormOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this carousel?")) return;
    await carouselsService.delete(id);
    toast({ title: "Carousel deleted" });
  };

  const filtered = filterPage === "all" ? carousels : carousels.filter((i) => i.page === filterPage);
  const inputClass = "w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-amber-500/50";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Carousels ({carousels.length})</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg text-sm font-semibold"><Plus className="w-4 h-4" /> Add Carousel</button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterPage("all")} className={cn("px-3 py-1.5 rounded-lg text-xs", filterPage === "all" ? "bg-amber-500 text-black" : "bg-white/5 text-white/60")}>All</button>
        {pages.map((p) => (
          <button key={p} onClick={() => setFilterPage(p)} className={cn("px-3 py-1.5 rounded-lg text-xs", filterPage === p ? "bg-amber-500 text-black" : "bg-white/5 text-white/60")}>{p}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/40">Loading carousels...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-white/40">No carousels found. Add your first carousel!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.sort((a, b) => a.order - b.order).map((item) => (
            <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group">
              <div className="aspect-video bg-white/10 relative">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">No Image</div>
                )}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-xs rounded">{item.page}</div>
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-black text-xs font-bold rounded">#{item.order}</div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => openEdit(item)} className="p-2 bg-blue-500 rounded-lg"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => deleteItem(item.id!)} className="p-2 bg-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm">{item.title}</h3>
                <p className="text-xs text-white/40 flex items-center gap-1"><Link className="w-3 h-3" />{item.linkTo}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-[#12121a] border-white/10 text-white max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Carousel" : "Add Carousel"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-xs text-white/50 mb-1 block">Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} /></div>
            <div><label className="text-xs text-white/50 mb-1 block">Image URL</label><input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className={inputClass} /></div>
            <div><label className="text-xs text-white/50 mb-1 block">Link To</label><input value={form.linkTo} onChange={(e) => setForm({ ...form, linkTo: e.target.value })} className={inputClass} placeholder="/detail/movie-slug" /></div>
            <div><label className="text-xs text-white/50 mb-1 block">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inputClass} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-white/50 mb-1 block">Rating</label><input value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className={inputClass} placeholder="9.5" /></div>
              <div><label className="text-xs text-white/50 mb-1 block">Year</label><input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className={inputClass} placeholder="2025" /></div>
            </div>
            <div><label className="text-xs text-white/50 mb-1 block">Tags (comma separated)</label><input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className={inputClass} placeholder="Romance, Drama, Action" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-white/50 mb-1 block">Display Page</label><select value={form.page} onChange={(e) => setForm({ ...form, page: e.target.value })} className={inputClass}>{pages.map((p) => <option key={p}>{p}</option>)}</select></div>
              <div><label className="text-xs text-white/50 mb-1 block">Order</label><input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })} className={inputClass} /></div>
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full py-2.5 bg-amber-500 text-black font-semibold rounded-lg disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Add Carousel"}</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}