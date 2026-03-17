import { Search, Loader2, Trash2, RefreshCw } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useActivities, useUsers } from "@/hooks/useFirestore";
import { clearAllActivities } from "@/lib/activityTracker";
import { toast } from "@/hooks/use-toast";

const actionTypes = ["All", "Browsed", "Watched", "Downloaded", "Searched", "Subscribed", "Commented", "Clicked", "Rated", "Signed Up", "Shared", "Login", "Logout"];

const actionColors: Record<string, string> = {
  Watched: "bg-blue-500/20 text-blue-400",
  Downloaded: "bg-green-500/20 text-green-400",
  Searched: "bg-purple-500/20 text-purple-400",
  Subscribed: "bg-amber-500/20 text-amber-400",
  Commented: "bg-pink-500/20 text-pink-400",
  Clicked: "bg-cyan-500/20 text-cyan-400",
  Browsed: "bg-white/10 text-white/60",
  Rated: "bg-yellow-500/20 text-yellow-400",
  "Signed Up": "bg-emerald-500/20 text-emerald-400",
  Shared: "bg-indigo-500/20 text-indigo-400",
  Login: "bg-teal-500/20 text-teal-400",
  Logout: "bg-red-500/20 text-red-400",
};

export default function AdminActivities() {
  const { activities, loading } = useActivities();
  const { users } = useUsers();
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("All");
  const [clearing, setClearing] = useState(false);

  const userMap = useMemo(() => {
    const byId: Record<string, { email: string; phone: string }> = {};
    const byName: Record<string, { email: string; phone: string }> = {};
    const byEmail: Record<string, { email: string; phone: string }> = {};
    for (const u of users) {
      const entry = { email: u.email || "", phone: u.phone || "" };
      if (u.id) byId[u.id] = entry;
      if (u.name) byName[u.name.toLowerCase()] = entry;
      if (u.email) byEmail[u.email.toLowerCase()] = entry;
    }
    return { byId, byName, byEmail };
  }, [users]);

  const getContact = (a: any) => {
    if (a.userId && userMap.byId[a.userId]) return userMap.byId[a.userId];
    if (a.user && userMap.byName[a.user.toLowerCase()]) return userMap.byName[a.user.toLowerCase()];
    if (a.email && userMap.byEmail[a.email.toLowerCase()]) return userMap.byEmail[a.email.toLowerCase()];
    return null;
  };

  const filtered = activities.filter((a) => {
    const contact = getContact(a);
    const matchSearch =
      (a.user || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.target || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.page || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.extra || "").toLowerCase().includes(search.toLowerCase()) ||
      (contact?.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (contact?.phone || "").toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction === "All" || a.action === filterAction;
    return matchSearch && matchAction;
  });

  const formatTime = (a: any) => {
    if (a.createdAtMs) {
      return new Date(a.createdAtMs).toLocaleString();
    }
    if (a.createdAt?.seconds) {
      return new Date(a.createdAt.seconds * 1000).toLocaleString();
    }
    if (typeof a.createdAt === "string" && a.createdAt.includes("T")) {
      return new Date(a.createdAt).toLocaleString();
    }
    return a.createdAt || a.time || "—";
  };

  const handleClearAll = async () => {
    if (!window.confirm("Delete ALL activity records? This cannot be undone.")) return;
    setClearing(true);
    try {
      await clearAllActivities();
      toast({ title: "All activities cleared" });
    } catch {
      toast({ title: "Failed to clear activities", variant: "destructive" });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">User Activities</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {activities.length.toLocaleString()} total records — latest first
          </p>
        </div>
        <button
          onClick={handleClearAll}
          disabled={clearing || activities.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-semibold hover:bg-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {clearing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          {clearing ? "Clearing..." : "Clear All"}
        </button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, email, phone, page or target..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {actionTypes.map((t) => (
          <button
            key={t}
            onClick={() => setFilterAction(t)}
            className={cn("px-3 py-1.5 rounded-lg text-xs", filterAction === t ? "bg-amber-500 text-black font-semibold" : "bg-white/5 text-white/60")}
          >
            {t}
            {t !== "All" && (
              <span className="ml-1 opacity-60">
                ({activities.filter((a) => a.action === t).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-white/40">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading activities...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-white/30 text-sm">
            {activities.length === 0
              ? "No activities recorded yet. User interactions will appear here automatically."
              : "No activities match your search."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-xs">
                <th className="text-left p-3">Time</th>
                <th className="text-left p-3">User</th>
                <th className="text-left p-3">Contact</th>
                <th className="p-3 text-center">Action</th>
                <th className="text-left p-3">Target</th>
                <th className="text-left p-3">Page</th>
                <th className="text-left p-3">Extra</th>
                <th className="p-3 text-center">Device</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const contact = getContact(a);
                return (
                  <tr key={a.id} className="border-b border-white/5 hover:bg-white/5 text-xs">
                    <td className="p-3 text-white/50 whitespace-nowrap">{formatTime(a)}</td>
                    <td className="p-3 font-medium text-white/90 max-w-[120px] truncate">{a.user || "Guest"}</td>
                    <td className="p-3">
                      {contact ? (
                        <div className="space-y-0.5">
                          {contact.email && <div className="text-white/60">{contact.email}</div>}
                          {contact.phone && <div className="text-amber-400/80 font-medium">{contact.phone}</div>}
                        </div>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs whitespace-nowrap", actionColors[a.action] || "bg-white/10 text-white/60")}>
                        {a.action}
                      </span>
                    </td>
                    <td className="p-3 text-white/70 max-w-[160px] truncate">{a.target || "—"}</td>
                    <td className="p-3 text-white/40 max-w-[120px] truncate">{(a as any).page || "—"}</td>
                    <td className="p-3 text-white/40 max-w-[160px] truncate">{(a as any).extra || "—"}</td>
                    <td className="p-3 text-center text-white/50">{a.device || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
