import { useState } from "react";
import { Plus, Trash2, Edit, Eye, EyeOff, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { adsService, FirestoreAd } from "@/lib/firestore";
import { useAds } from "@/hooks/useFirestore";
import { toast } from "@/hooks/use-toast";
import PromoBanner from "@/components/PromoBanner";

export default function AdminAds() {
  const { ads, loading } = useAds();
  const [modalOpen, setModalOpen] = useState(false);
  const [editAd, setEditAd] = useState<FirestoreAd | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    ctaText: "",
    ctaLink: "",
    imageUrl: "",
    page: "Home",
  });

  const openNew = () => {
    setEditAd(null);
    setForm({ title: "", subtitle: "", ctaText: "", ctaLink: "", imageUrl: "", page: "Home" });
    setModalOpen(true);
  };

  const openEdit = (ad: FirestoreAd) => {
    setEditAd(ad);
    setForm({
      title: ad.title,
      subtitle: ad.subtitle,
      ctaText: ad.ctaText,
      ctaLink: ad.ctaLink,
      imageUrl: ad.imageUrl,
      page: ad.page,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editAd && editAd.id) {
        await adsService.update(editAd.id, { ...form });
        toast({ title: "Ad updated" });
      } else {
        await adsService.create({ ...form, active: true });
        toast({ title: "Ad created" });
      }
      setModalOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (ad: FirestoreAd) => {
    if (!ad.id) return;
    await adsService.update(ad.id, { active: !ad.active });
  };

  const deleteAd = async (id: string) => {
    if (!confirm("Delete this ad?")) return;
    await adsService.delete(id);
    toast({ title: "Ad deleted" });
  };

  const inp = "w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 placeholder-white/30";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ads / Promo Banners</h1>
          <p className="text-white/50 text-sm mt-1">Manage promotional banners displayed on the website</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold text-sm"
        >
          <Plus className="w-4 h-4" /> Add New Ad
        </button>
      </div>

      {loading ? (
        <div className="text-white/40 text-sm py-8 text-center">Loading ads...</div>
      ) : ads.length === 0 ? (
        <div className="text-white/40 text-sm py-8 text-center">No ads yet. Create one to get started.</div>
      ) : (
        <div className="grid gap-4">
          {ads.map((ad) => (
            <div key={ad.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
              <div className="w-32 h-16 bg-white/5 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 border border-white/10">
                {ad.imageUrl ? (
                  <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex items-center gap-2 text-white/20">
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-xs">No Image</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm">{ad.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${ad.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {ad.active ? "Active" : "Inactive"}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">{ad.page}</span>
                </div>
                <p className="text-xs text-white/40 mt-0.5">{ad.subtitle} • CTA: {ad.ctaText}</p>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => toggleActive(ad)} className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
                  {ad.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(ad)} className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => ad.id && deleteAd(ad.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#0c0c14] border border-white/10 text-white max-w-lg">
          <DialogTitle>{editAd ? "Edit Ad" : "Create New Ad"}</DialogTitle>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Title *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Enjoy the Best Experience"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Subtitle</label>
              <Input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="e.g. on LUO FILM"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/50 mb-1 block">CTA Text</label>
                <Input
                  value={form.ctaText}
                  onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                  placeholder="e.g. Watch Now"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">CTA Link</label>
                <Input
                  value={form.ctaLink}
                  onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                  placeholder="/download"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Display Page</label>
              <select
                value={form.page}
                onChange={(e) => setForm({ ...form, page: e.target.value })}
                className={inp}
              >
                <option value="Home">Home</option>
                <option value="Drama">Drama</option>
                <option value="Movie">Movie</option>
                <option value="Anime">Anime</option>
                <option value="Variety Show">Variety Show</option>
                <option value="Live TV">Live TV</option>
                <option value="Sport">Sport</option>
                <option value="All Pages">All Pages</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Banner Image URL</label>
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://example.com/banner.jpg"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
              <div className="mt-3">
                <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Live Preview</p>
                {form.imageUrl || form.title ? (
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <PromoBanner
                      title={form.title || undefined}
                      subtitle={form.subtitle || undefined}
                      ctaText={form.ctaText || undefined}
                      ctaLink={form.ctaLink || undefined}
                      imageUrl={form.imageUrl || undefined}
                    />
                  </div>
                ) : (
                  <div className="border border-dashed border-white/20 rounded-xl p-4 text-center">
                    <ImageIcon className="w-6 h-6 mx-auto text-white/20 mb-1" />
                    <p className="text-xs text-white/30">Fill in the fields above to see a live preview</p>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-sm disabled:opacity-60"
            >
              {saving ? "Saving..." : editAd ? "Update Ad" : "Create Ad"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
