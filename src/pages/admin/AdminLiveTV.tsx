import { useState } from "react";
import { Plus, Trash2, Edit, Radio, Signal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useLiveChannels } from "@/hooks/useFirestore";
import { liveChannelsService, FirestoreLiveChannel } from "@/lib/firestore";
import { toast } from "@/hooks/use-toast";

const categories = ["News", "Entertainment", "Sports", "Music", "Kids", "Documentary", "Religious", "General"];

const emptyForm = {
  title: "", slug: "", thumbnail: "", streamUrl: "", category: "General",
  country: "", isLive: true, isVip: false, order: 1, description: "",
};

export default function AdminLiveTV() {
  const { channels, loading } = useLiveChannels();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FirestoreLiveChannel | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState("all");

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, order: channels.length + 1 });
    setFormOpen(true);
  };

  const openEdit = (ch: FirestoreLiveChannel) => {
    setEditing(ch);
    setForm({
      title: ch.title, slug: ch.slug, thumbnail: ch.thumbnail, streamUrl: ch.streamUrl,
      category: ch.category, country: ch.country, isLive: ch.isLive, isVip: ch.isVip,
      order: ch.order, description: ch.description || "",
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.streamUrl) {
      toast({ title: "Title and Stream URL are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const data = { ...form, slug };
      if (editing?.id) {
        await liveChannelsService.update(editing.id, data);
        toast({ title: "Channel updated" });
      } else {
        await liveChannelsService.create(data);
        toast({ title: "Channel added" });
      }
      setFormOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const deleteChannel = async (id: string) => {
    if (!confirm("Delete this channel?")) return;
    await liveChannelsService.delete(id);
    toast({ title: "Channel deleted" });
  };

  const filtered = filterCat === "all" ? channels : channels.filter((c) => c.category === filterCat);
  const inp = "w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 text-white placeholder-white/30";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="w-6 h-6 text-red-400" /> Live TV Channels ({channels.length})
          </h1>
          <p className="text-white/50 text-sm mt-1">Manage live TV channels displayed on the website</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Channel
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterCat("all")}
          className={cn("px-3 py-1.5 rounded-lg text-xs", filterCat === "all" ? "bg-amber-500 text-black" : "bg-white/5 text-white/60")}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={cn("px-3 py-1.5 rounded-lg text-xs", filterCat === c ? "bg-amber-500 text-black" : "bg-white/5 text-white/60")}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/40">Loading channels...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-white/40">
          <Radio className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No channels found. Add your first Live TV channel!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ch) => (
            <div key={ch.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group">
              <div className="aspect-video bg-white/10 relative">
                {ch.thumbnail ? (
                  <img src={ch.thumbnail} alt={ch.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Radio className="w-10 h-10 text-white/20" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  {ch.isLive && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">
                      <Signal className="w-2.5 h-2.5" /> LIVE
                    </span>
                  )}
                  {ch.isVip && (
                    <span className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded">VIP</span>
                  )}
                </div>
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 text-white/70 text-[10px] rounded">{ch.category}</div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => openEdit(ch)} className="p-2 bg-blue-500 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => ch.id && deleteChannel(ch.id)} className="p-2 bg-red-500 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm">{ch.title}</h3>
                <p className="text-xs text-white/40 mt-0.5">{ch.country} • Order #{ch.order}</p>
                {ch.description && <p className="text-xs text-white/30 mt-1 line-clamp-1">{ch.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-[#12121a] border-white/10 text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Channel" : "Add Live TV Channel"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Channel Name *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inp} placeholder="e.g. NTV Uganda" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Thumbnail URL (Image)</label>
              <input value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} className={inp} placeholder="https://..." />
              {form.thumbnail && (
                <img src={form.thumbnail} alt="preview" className="mt-2 h-24 rounded object-cover w-full" referrerPolicy="no-referrer" />
              )}
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Stream URL * (m3u8, mp4, or embed URL)</label>
              <input value={form.streamUrl} onChange={(e) => setForm({ ...form, streamUrl: e.target.value })} className={inp} placeholder="https://stream.example.com/live.m3u8" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/50 mb-1 block">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inp}>
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Country</label>
                <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inp} placeholder="Uganda" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/50 mb-1 block">Display Order</label>
                <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })} className={inp} />
              </div>
              <div className="flex flex-col gap-2 pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isLive} onChange={(e) => setForm({ ...form, isLive: e.target.checked })} className="accent-red-500" />
                  <span className="text-sm">Is Live</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isVip} onChange={(e) => setForm({ ...form, isVip: e.target.checked })} className="accent-amber-500" />
                  <span className="text-sm">VIP Only</span>
                </label>
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inp} placeholder="Short description..." />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 bg-amber-500 text-black font-semibold rounded-lg disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Update Channel" : "Add Channel"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
