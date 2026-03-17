import { useState } from "react";
import { Search, ShieldOff, ChevronUp, Trash2, Eye, Loader2, Crown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useUsers } from "@/hooks/useFirestore";
import { usersService } from "@/lib/firestore";
import { toast } from "@/hooks/use-toast";

const plans = [
  "1 Day Standard - UGX 2,500", "1 Day Pro - UGX 5,000",
  "3 Day Classic - UGX 5,000", "3 Day Premium - UGX 10,000",
  "1 Week Standard - UGX 10,000", "1 Week Premium - UGX 20,000",
  "1 Month Premium - UGX 20,000", "1 Month Ultra - UGX 35,000",
  "VIP Monthly - UGX 50,000",
];

const planPrices: Record<string, number> = {
  "1 Day Standard": 2500, "1 Day Pro": 5000, "3 Day Classic": 5000, "3 Day Premium": 10000,
  "1 Week Standard": 10000, "1 Week Premium": 20000, "1 Month Premium": 20000,
  "1 Month Ultra": 35000, "VIP Monthly": 50000,
};

const planDurations: Record<string, number> = {
  "1 Day Standard": 1, "1 Day Pro": 1, "3 Day Classic": 3, "3 Day Premium": 3,
  "1 Week Standard": 7, "1 Week Premium": 7, "1 Month Premium": 30,
  "1 Month Ultra": 30, "VIP Monthly": 30,
};

function getSubStatus(endDate?: string): "active" | "expired" | "none" {
  if (!endDate) return "none";
  return new Date(endDate) > new Date() ? "active" : "expired";
}

export default function AdminSubscription() {
  const { users, loading } = useUsers();
  const [search, setSearch] = useState("");
  const [upgradeTarget, setUpgradeTarget] = useState<any | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [detailsUser, setDetailsUser] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const subscribers = users.map((u) => ({
    ...u,
    sub: u.subscription || null,
    status: getSubStatus(u.subscription?.endDate),
  }));

  const filtered = subscribers.filter((s) =>
    (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.sub?.plan || "").toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = subscribers.filter((s) => s.status === "active").length;
  const expiredCount = subscribers.filter((s) => s.status === "expired").length;
  const totalRevenue = subscribers.reduce((sum, s) => sum + (planPrices[s.sub?.plan || ""] || 0), 0);

  const confirmUpgrade = async () => {
    if (!upgradeTarget || !selectedPlan) return;
    setSaving(true);
    try {
      const planName = selectedPlan.split(" - ")[0];
      const days = planDurations[planName] || 30;
      const startDate = new Date().toISOString().split("T")[0];
      const endDate = new Date(Date.now() + days * 86400000).toISOString().split("T")[0];
      await usersService.upsert(upgradeTarget.id, {
        subscription: { plan: planName, startDate, endDate, status: "active", activatedAt: new Date().toISOString(), downloadsUsed: 0, deviceIds: [] },
      });
      toast({ title: `Subscription updated to ${planName}` });
      setUpgradeTarget(null);
      setSelectedPlan("");
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
    setSaving(false);
  };

  const deactivate = async (userId: string) => {
    try {
      await usersService.update(userId, { subscription: null });
      toast({ title: "Subscription revoked" });
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Crown className="w-6 h-6 text-amber-400" /> Subscription Management</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-xs text-white/50">Total Active</p><p className="text-2xl font-bold text-green-400">{activeCount}</p></div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-xs text-white/50">Expired</p><p className="text-2xl font-bold text-red-400">{expiredCount}</p></div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-xs text-white/50">Total Revenue</p><p className="text-2xl font-bold text-amber-400">UGX {totalRevenue.toLocaleString()}</p></div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-xs text-white/50">Total Users</p><p className="text-2xl font-bold">{users.length}</p></div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users or plans..." className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-amber-500/50" />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-white/40"><Loader2 className="w-4 h-4 animate-spin" /> Loading users...</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-white/30 text-sm">No users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50">
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Email</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Start</th>
                <th className="p-3">End</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3 font-medium">{u.name || "—"}</td>
                  <td className="p-3 text-white/60 text-xs">{u.email || "—"}</td>
                  <td className="p-3 text-center">
                    {u.sub ? (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400">{u.sub.plan}</span>
                    ) : (
                      <span className="text-white/30 text-xs">No plan</span>
                    )}
                  </td>
                  <td className="p-3 text-center text-white/50 text-xs">{u.sub?.startDate || "—"}</td>
                  <td className="p-3 text-center text-white/50 text-xs">{u.sub?.endDate || "—"}</td>
                  <td className="p-3 text-center">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs",
                      u.status === "active" ? "bg-green-500/20 text-green-400" :
                      u.status === "expired" ? "bg-red-500/20 text-red-400" :
                      "bg-white/10 text-white/30"
                    )}>
                      {u.status === "none" ? "No sub" : u.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => setDetailsUser(u)} className="p-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setUpgradeTarget(u)} className="p-1.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"><ChevronUp className="w-3.5 h-3.5" /></button>
                      {u.sub && (
                        <button onClick={() => deactivate(u.id!)} className="p-1.5 rounded bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"><ShieldOff className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={!!upgradeTarget} onOpenChange={() => { setUpgradeTarget(null); setSelectedPlan(""); }}>
        <DialogContent className="bg-[#12121a] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>Grant / Change Plan for {upgradeTarget?.name || upgradeTarget?.email}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {plans.map((p) => (
              <button key={p} onClick={() => setSelectedPlan(p)} className={cn("w-full text-left px-4 py-3 rounded-lg text-sm border", selectedPlan === p ? "border-amber-500 bg-amber-500/10 text-amber-400" : "border-white/10 bg-white/5 text-white/70")}>{p}</button>
            ))}
            <button onClick={confirmUpgrade} disabled={!selectedPlan || saving} className="w-full mt-4 py-2.5 bg-amber-500 text-black font-semibold rounded-lg disabled:opacity-40 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Confirm
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailsUser} onOpenChange={() => setDetailsUser(null)}>
        <DialogContent className="bg-[#12121a] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
          {detailsUser && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Name", detailsUser.name || "—"],
                ["Email", detailsUser.email || "—"],
                ["Phone", detailsUser.phone || "—"],
                ["Plan", detailsUser.sub?.plan || "No Plan"],
                ["Start", detailsUser.sub?.startDate || "—"],
                ["End", detailsUser.sub?.endDate || "—"],
                ["Status", detailsUser.status],
                ["Joined", detailsUser.createdAt ? new Date(detailsUser.createdAt).toLocaleDateString() : "—"],
              ].map(([l, v]) => (
                <div key={l}><p className="text-white/40 text-xs">{l}</p><p className="font-medium">{v}</p></div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
