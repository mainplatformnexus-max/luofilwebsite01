import { useState } from "react";
import { Plus, Trash2, X, Loader2, Pencil, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useEpisodes, useSeries } from "@/hooks/useFirestore";
import { episodesService } from "@/lib/firestore";
import { toast } from "@/hooks/use-toast";

const extractEmbedSrc = (input: string): string => {
  const trimmed = input.trim();
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/);
  if (srcMatch) return srcMatch[1];
  return trimmed;
};

const emptyForm = () => ({
  seriesId: "",
  name: "",
  seasonNumber: 1,
  episodeNumber: 1,
  embedCode: "",
  downloadLinks: [] as { quality: string; url: string; fileSize: string }[],
  thumbnail: "",
  duration: "",
});

export default function AdminEpisodes() {
  const { episodes, loading } = useEpisodes();
  const { series } = useSeries();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterSeriesId, setFilterSeriesId] = useState("all");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const openCreate = () => {
    setForm({ ...emptyForm(), seriesId: series[0]?.id || "" });
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (ep: (typeof episodes)[0]) => {
    const existingDownloadLinks = Array.isArray(ep.streamLinks) && ep.streamLinks.length > 0
      ? ep.streamLinks.map((l) => ({ quality: l.quality, url: l.url, fileSize: l.fileSize || "" }))
      : ep.downloadLink
      ? [{ quality: "HD", url: ep.downloadLink, fileSize: "" }]
      : [];
    setForm({
      seriesId: ep.seriesId || series.find((s) => s.title === ep.series)?.id || "",
      name: ep.name || ep.title || "",
      seasonNumber: ep.seasonNumber ?? ep.season ?? 1,
      episodeNumber: ep.episodeNumber ?? ep.episode ?? 1,
      embedCode: ep.streamLink || "",
      downloadLinks: existingDownloadLinks,
      thumbnail: ep.thumbnail || "",
      duration: ep.duration || "",
    });
    setEditingId(ep.id!);
    setFormOpen(true);
  };

  const addDownloadLink = () => setForm((f) => ({ ...f, downloadLinks: [...f.downloadLinks, { quality: "", url: "", fileSize: "" }] }));
  const removeDownloadLink = (i: number) => setForm((f) => ({ ...f, downloadLinks: f.downloadLinks.filter((_, idx) => idx !== i) }));
  const updateDownloadLink = (i: number, field: "quality" | "url" | "fileSize", val: string) =>
    setForm((f) => ({ ...f, downloadLinks: f.downloadLinks.map((l, idx) => idx === i ? { ...l, [field]: val } : l) }));

  const handleSave = async () => {
    if (!form.seriesId) { toast({ title: "Select a series" }); return; }
    if (!form.name) { toast({ title: "Enter episode name" }); return; }
    if (!form.embedCode) { toast({ title: "Enter stream embed code or URL" }); return; }

    const selectedSeries = series.find((s) => s.id === form.seriesId);
    if (!selectedSeries) { toast({ title: "Series not found" }); return; }

    const streamLink = extractEmbedSrc(form.embedCode);

    setSaving(true);
    try {
      const data = {
        seriesId: form.seriesId,
        seriesName: selectedSeries.title,
        name: form.name,
        seasonNumber: form.seasonNumber,
        episodeNumber: form.episodeNumber,
        streamLink,
        downloadLink: form.downloadLinks[0]?.url || "",
        thumbnail: form.thumbnail || "",
        duration: form.duration || "",
        series: selectedSeries.title,
        title: form.name,
        season: form.seasonNumber,
        episode: form.episodeNumber,
        streamLinks: form.downloadLinks.filter((l) => l.url),
      };

      if (editingId) {
        await episodesService.update(editingId, data);
        toast({ title: "Episode updated" });
      } else {
        await episodesService.create(data);
        toast({ title: "Episode added" });
      }
      setFormOpen(false);
    } catch {
      toast({ title: "Failed to save episode", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await episodesService.delete(id);
      toast({ title: "Episode deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
    setDeleting(null);
  };

  const filtered =
    filterSeriesId === "all"
      ? episodes
      : episodes.filter(
          (e) =>
            e.seriesId === filterSeriesId ||
            series.find((s) => s.id === filterSeriesId)?.title === e.series
        );

  const inputClass =
    "w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-amber-500/50";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Episodes</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg text-sm font-semibold hover:bg-amber-400"
        >
          <Plus className="w-4 h-4" /> Add Episode
        </button>
      </div>

      {/* Series filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterSeriesId("all")}
          className={cn("px-3 py-1.5 rounded-lg text-xs", filterSeriesId === "all" ? "bg-amber-500 text-black" : "bg-white/5 text-white/60")}
        >
          All
        </button>
        {series.map((s) => (
          <button
            key={s.id}
            onClick={() => setFilterSeriesId(s.id!)}
            className={cn("px-3 py-1.5 rounded-lg text-xs", filterSeriesId === s.id ? "bg-amber-500 text-black" : "bg-white/5 text-white/60")}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-xl">
        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-white/40">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading episodes...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-white/30 text-sm">No episodes yet. Add a series first, then add episodes.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-left">
                <th className="p-3">Series</th>
                <th className="p-3">Episode Name</th>
                <th className="p-3 text-center">Season</th>
                <th className="p-3 text-center">Ep #</th>
                <th className="p-3 text-center hidden sm:table-cell">Stream</th>
                <th className="p-3 text-center hidden sm:table-cell">Download</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ep) => {
                const epSeason = ep.seasonNumber ?? ep.season ?? 0;
                const epNum = ep.episodeNumber ?? ep.episode ?? 0;
                const epName = ep.name || ep.title || "—";
                const hasStream = !!(ep.streamLink || ep.streamLinks?.length);
                const hasDownload = !!ep.downloadLink;
                return (
                  <tr key={ep.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3 font-medium text-amber-400">{ep.seriesName || ep.series}</td>
                    <td className="p-3 text-white/80">{epName}</td>
                    <td className="p-3 text-center text-white/60">S{epSeason}</td>
                    <td className="p-3 text-center text-white/60">E{epNum}</td>
                    <td className="p-3 text-center hidden sm:table-cell">
                      {hasStream ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-white/20 mx-auto" />
                      )}
                    </td>
                    <td className="p-3 text-center hidden sm:table-cell">
                      {hasDownload ? (
                        <CheckCircle2 className="w-4 h-4 text-blue-400 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-white/20 mx-auto" />
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => openEdit(ep)}
                          className="p-1.5 rounded bg-white/10 text-white/50 hover:text-amber-400"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ep.id!)}
                          disabled={deleting === ep.id}
                          className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        >
                          {deleting === ep.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-[#12121a] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Episode" : "Add Episode"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Series selector */}
            <div>
              <label className="text-xs text-white/50 mb-1 block">Series *</label>
              <select
                value={form.seriesId}
                onChange={(e) => setForm({ ...form, seriesId: e.target.value })}
                className={inputClass}
              >
                <option value="">Select series…</option>
                {series.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>

            {/* Episode name */}
            <div>
              <label className="text-xs text-white/50 mb-1 block">Episode Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="e.g. The Beginning"
              />
            </div>

            {/* Season / Episode number / Duration */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-white/50 mb-1 block">Season</label>
                <input
                  type="number"
                  min={1}
                  value={form.seasonNumber}
                  onChange={(e) => setForm({ ...form, seasonNumber: parseInt(e.target.value) || 1 })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Episode #</label>
                <input
                  type="number"
                  min={1}
                  value={form.episodeNumber}
                  onChange={(e) => setForm({ ...form, episodeNumber: parseInt(e.target.value) || 1 })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Duration</label>
                <input
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className={inputClass}
                  placeholder="45 min"
                />
              </div>
            </div>

            {/* Stream Embed Code */}
            <div>
              <label className="text-xs text-white/50 mb-1 block">Stream Embed Code *</label>
              <p className="text-[11px] text-white/30 mb-1">Paste the full embed code or just the video URL. This plays in the player.</p>
              <textarea
                value={form.embedCode}
                onChange={(e) => setForm({ ...form, embedCode: e.target.value })}
                rows={4}
                className={inputClass}
                placeholder='<div style="position:relative;padding-top:56.25%;"><iframe src="https://..." ...></iframe></div>'
              />
              {form.embedCode && (
                <p className="text-[11px] text-amber-400 mt-1">
                  Extracted URL: {extractEmbedSrc(form.embedCode)}
                </p>
              )}
            </div>

            {/* Download links */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="text-xs text-white/50">Download Links (by quality)</label>
                  <p className="text-[11px] text-white/30">For downloading only, not streaming.</p>
                </div>
                <button onClick={addDownloadLink} className="text-xs text-amber-400 hover:underline">+ Add</button>
              </div>
              <div className="space-y-2">
                {form.downloadLinks.map((link, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select value={link.quality} onChange={(e) => updateDownloadLink(i, "quality", e.target.value)} className={cn(inputClass, "w-24")}>
                      <option value="">Quality</option>
                      {["360p", "480p", "720p", "1080p", "2K", "4K"].map((q) => <option key={q} value={q}>{q}</option>)}
                    </select>
                    <input value={link.url} onChange={(e) => updateDownloadLink(i, "url", e.target.value)} className={cn(inputClass, "flex-1")} placeholder="Download URL" />
                    <input value={link.fileSize} onChange={(e) => updateDownloadLink(i, "fileSize", e.target.value)} className={cn(inputClass, "w-24")} placeholder="e.g. 1.2 GB" />
                    <button onClick={() => removeDownloadLink(i)} className="p-2 text-red-400 hover:bg-red-500/20 rounded"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Thumbnail */}
            <div>
              <label className="text-xs text-white/50 mb-1 block">Thumbnail URL (optional)</label>
              <input
                value={form.thumbnail}
                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                className={inputClass}
                placeholder="https://…/thumb.jpg"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 bg-amber-500 text-black font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-amber-400"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? "Save Changes" : "Add Episode"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
