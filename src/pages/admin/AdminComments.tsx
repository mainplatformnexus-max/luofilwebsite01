import { useState } from "react";
import { Search, Trash2, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useComments } from "@/hooks/useFirestore";
import { commentsService } from "@/lib/firestore";
import { toast } from "@/hooks/use-toast";

export default function AdminComments() {
  const { comments, loading } = useComments();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "movie" | "series">("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = comments.filter((c) => {
    const matchSearch =
      c.user.toLowerCase().includes(search.toLowerCase()) ||
      c.content.toLowerCase().includes(search.toLowerCase()) ||
      c.contentTitle.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || c.contentType === filterType;
    return matchSearch && matchType;
  });

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await commentsService.delete(id);
      toast({ title: "Comment deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="w-6 h-6 text-amber-400" /> Comments</h1>
        <span className="text-sm text-white/40">{comments.length} total</span>
      </div>

      <div className="flex gap-4 flex-wrap items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search comments..." className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-amber-500/50" />
        </div>
        <div className="flex gap-2">
          {(["all", "movie", "series"] as const).map((t) => (
            <button key={t} onClick={() => setFilterType(t)} className={cn("px-3 py-1.5 rounded-lg text-xs capitalize", filterType === t ? "bg-amber-500 text-black font-semibold" : "bg-white/5 text-white/60")}>{t}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 gap-2 text-white/40"><Loader2 className="w-4 h-4 animate-spin" /> Loading comments...</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-white/30 text-sm">{search ? "No comments match your search." : "No comments yet."}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm">{c.user}</span>
                    <span className="text-xs text-white/40">{c.date || (c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "")}</span>
                    {c.rating != null && (
                      <div className="flex gap-0.5 ml-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className={cn("text-xs", star <= (c.rating || 0) ? "text-amber-400" : "text-white/20")}>★</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-white/80 mb-2">{c.content}</p>
                  <div className="flex items-center gap-2 text-xs text-white/40 flex-wrap">
                    <span className={cn("px-2 py-0.5 rounded-full", c.contentType === "movie" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400")}>{c.contentType}</span>
                    <span>{c.contentTitle}</span>
                    {c.episode && <span>· {c.episode}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(c.id!)}
                  disabled={deleting === c.id}
                  className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 ml-3 flex-shrink-0"
                >
                  {deleting === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
