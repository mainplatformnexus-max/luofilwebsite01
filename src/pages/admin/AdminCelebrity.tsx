import { useState } from "react";
import { Plus, Edit, Trash2, Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCelebrities } from "@/hooks/useFirestore";
import { celebritiesService } from "@/lib/firestore";
import { toast } from "@/hooks/use-toast";

type CelebForm = { name: string; photo: string; bio: string; nationality: string; birthYear: string; knownFor: string };

export default function AdminCelebrity() {
  const { celebrities, loading } = useCelebrities();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CelebForm>({ name: "", photo: "", bio: "", nationality: "", birthYear: "", knownFor: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", photo: "", bio: "", nationality: "", birthYear: "", knownFor: "" });
    setFormOpen(true);
  };

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setForm({ name: c.name || "", photo: c.photo || "", bio: c.bio || "", nationality: c.nationality || "", birthYear: c.birthYear || "", knownFor: Array.isArray(c.knownFor) ? c.knownFor.join(", ") : (c.knownFor || "") });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast({ title: "Name is required" }); return; }
    setSaving(true);
    const data = { name: form.name, photo: form.photo, bio: form.bio, nationality: form.nationality, birthYear: form.birthYear, knownFor: form.knownFor.split(",").map((s) => s.trim()).filter(Boolean) };
    try {
      if (editingId) {
        await celebritiesService.update(editingId, data);
        toast({ title: "Celebrity updated" });
      } else {
        await celebritiesService.create(data);
        toast({ title: "Celebrity added" });
      }
      setFormOpen(false);
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await celebritiesService.delete(id);
      toast({ title: "Celebrity deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
    setDeleting(null);
  };

  const inputClass = "w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-amber-500/50";
  const filtered = celebrities.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Celebrities</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add Celebrity
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-amber-500/50" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 gap-2 text-white/40"><Loader2 className="w-4 h-4 animate-spin" /> Loading celebrities...</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-white/30 text-sm">{search ? "No matches found." : "No celebrities yet. Add the first one."}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group">
              <div className="aspect-square bg-white/10 relative">
                {c.photo ? (
                  <img src={c.photo} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-white/20">{c.name[0]}</div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => openEdit(c)} className="p-2 bg-blue-500 rounded-lg"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(c.id!)} disabled={deleting === c.id} className="p-2 bg-red-500 rounded-lg">
                    {deleting === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm">{c.name}</h3>
                <p className="text-xs text-white/50">{[c.nationality, c.birthYear].filter(Boolean).join(" · ") || "—"}</p>
                {c.knownFor && c.knownFor.length > 0 && (
                  <p className="text-xs text-white/30 mt-1 truncate">{c.knownFor.join(", ")}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-[#12121a] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Edit Celebrity" : "Add Celebrity"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-xs text-white/50 mb-1 block">Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
            <div><label className="text-xs text-white/50 mb-1 block">Photo URL</label><input value={form.photo} onChange={(e) => setForm({ ...form, photo: e.target.value })} className={inputClass} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-white/50 mb-1 block">Nationality</label><input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} className={inputClass} /></div>
              <div><label className="text-xs text-white/50 mb-1 block">Birth Year</label><input value={form.birthYear} onChange={(e) => setForm({ ...form, birthYear: e.target.value })} className={inputClass} /></div>
            </div>
            <div><label className="text-xs text-white/50 mb-1 block">Bio</label><textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className={inputClass} /></div>
            <div><label className="text-xs text-white/50 mb-1 block">Known For (comma separated)</label><input value={form.knownFor} onChange={(e) => setForm({ ...form, knownFor: e.target.value })} className={inputClass} /></div>
            <button onClick={handleSave} disabled={saving} className="w-full py-2.5 bg-amber-500 text-black font-semibold rounded-lg flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editingId ? "Update" : "Add Celebrity"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
