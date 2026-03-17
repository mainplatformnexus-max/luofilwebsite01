import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Search, Trash2, ShieldOff, Eye, Ban, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useUsers } from "@/hooks/useFirestore";
import { usersService } from "@/lib/firestore";
import { toast } from "@/hooks/use-toast";

const subscriptionPlans = [
  "1 Day Standard - UGX 2,500", "1 Day Pro - UGX 5,000",
  "3 Day Classic - UGX 5,000", "3 Day Premium - UGX 10,000",
  "1 Week Standard - UGX 10,000", "1 Week Premium - UGX 20,000",
  "1 Month Premium - UGX 20,000", "1 Month Ultra - UGX 35,000",
  "VIP Monthly - UGX 50,000",
];

function calcEndDate(planName: string): string {
  const now = new Date();
  if (planName.startsWith("1 Day"))   now.setDate(now.getDate() + 1);
  else if (planName.startsWith("3 Day")) now.setDate(now.getDate() + 3);
  else if (planName.startsWith("1 Week")) now.setDate(now.getDate() + 7);
  else now.setDate(now.getDate() + 30);
  return now.toISOString();
}

function getSubPlan(sub: any): string | null {
  if (!sub) return null;
  if (typeof sub === "string") return sub;
  return sub.plan || null;
}

function getSubStatus(sub: any): string {
  if (!sub) return "none";
  if (typeof sub === "string") return "active";
  return sub.status || "active";
}

function getSubExpiry(sub: any): string {
  if (!sub) return "N/A";
  if (typeof sub === "string") return "N/A";
  if (sub.endDate) {
    try {
      const d = new Date(sub.endDate);
      return d.toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" });
    } catch { return sub.endDate; }
  }
  return "N/A";
}

export default function AdminUsers() {
  const location = useLocation();
  const filter = location.pathname.includes("/active") ? "active" : location.pathname.includes("/inactive") ? "inactive" : "all";
  const { users, loading } = useUsers();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [subTarget, setSubTarget] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState("");

  const hasSub = (u: any) => !!getSubPlan(u.subscription);

  const filtered = users.filter((u) => {
    const matchSearch = (u.name || "").toLowerCase().includes(search.toLowerCase()) || (u.email || "").toLowerCase().includes(search.toLowerCase());
    if (filter === "active") return matchSearch && hasSub(u);
    if (filter === "inactive") return matchSearch && !hasSub(u);
    return matchSearch;
  });

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    await usersService.delete(id);
    toast({ title: "User deleted" });
  };

  const toggleBlock = async (user: any) => {
    await usersService.update(user.id, { status: user.status === "blocked" ? "active" : "blocked" });
    toast({ title: user.status === "blocked" ? "User unblocked" : "User blocked" });
  };

  const deactivateSub = async (id: string) => {
    await usersService.update(id, { subscription: null, subscriptionExpiry: null });
    toast({ title: "Subscription deactivated" });
  };

  const confirmActivate = async () => {
    if (!subTarget || !selectedPlan) return;
    const planName = selectedPlan.split(" - ")[0];
    const now = new Date().toISOString();
    const endDate = calcEndDate(planName);
    const subObject = {
      plan: planName,
      status: "active",
      activatedAt: now,
      startDate: now,
      endDate,
      internalRef: "admin-manual",
      providerTxId: "admin-manual",
      provider: "admin",
      downloadsUsed: 0,
      deviceIds: [],
    };
    await usersService.update(subTarget.id, {
      subscription: subObject,
      subscriptionExpiry: endDate,
    });
    setSubDialogOpen(false);
    setSelectedPlan("");
    toast({ title: `${planName} activated for ${subTarget.name || subTarget.email}` });
  };

  const tabClass = (f: string) => cn(
    "px-4 py-2 text-sm rounded-lg transition-colors",
    filter === f ? "bg-amber-500 text-black font-semibold" : "bg-white/5 text-white/60 hover:bg-white/10"
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Users Management ({users.length})</h1>

      <div className="flex gap-2 flex-wrap">
        <a href="/admin/users" className={tabClass("all")}>All Users ({users.length})</a>
        <a href="/admin/users/active" className={tabClass("active")}>Active Subscribers ({users.filter((u) => hasSub(u)).length})</a>
        <a href="/admin/users/inactive" className={tabClass("inactive")}>No Subscription ({users.filter((u) => !hasSub(u)).length})</a>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-amber-500/50" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/40">Loading users from Firebase...</div>
      ) : (
        <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50">
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Phone</th>
                <th className="text-left p-3">Subscription</th>
                <th className="text-left p-3">Expires</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const plan = getSubPlan(user.subscription);
                const expiry = getSubExpiry(user.subscription);
                return (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3 font-medium">{user.name || "—"}</td>
                    <td className="p-3 text-white/60">{user.email}</td>
                    <td className="p-3 text-white/60">{user.phone || "—"}</td>
                    <td className="p-3">
                      {plan ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400">{plan}</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-white/10 text-white/40">None</span>
                      )}
                    </td>
                    <td className="p-3 text-white/50 text-xs">{plan ? expiry : "—"}</td>
                    <td className="p-3">
                      <span className={cn("px-2 py-1 rounded-full text-xs", user.status === "blocked" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400")}>
                        {user.status || "active"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        <button onClick={() => { setSelectedUser(user); setDetailsOpen(true); }} className="p-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30" title="Details"><Eye className="w-3.5 h-3.5" /></button>
                        {plan ? (
                          <button onClick={() => deactivateSub(user.id)} className="p-1.5 rounded bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" title="Deactivate Sub"><ShieldOff className="w-3.5 h-3.5" /></button>
                        ) : (
                          <button onClick={() => { setSubTarget(user); setSubDialogOpen(true); }} className="p-1.5 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30" title="Activate Sub"><CheckCircle className="w-3.5 h-3.5" /></button>
                        )}
                        <button onClick={() => toggleBlock(user)} className="p-1.5 rounded bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30" title="Block/Unblock"><Ban className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteUser(user.id)} className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-white/40">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-[#12121a] border-white/10 text-white max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Name", selectedUser.name || "—"],
                  ["Email", selectedUser.email],
                  ["Phone", selectedUser.phone || "—"],
                  ["User ID", selectedUser.id],
                  ["Plan", getSubPlan(selectedUser.subscription) || "None"],
                  ["Sub Status", getSubStatus(selectedUser.subscription)],
                  ["Expires", getSubExpiry(selectedUser.subscription)],
                  ["Account Status", selectedUser.status || "active"],
                  ["Joined", selectedUser.createdAt || "N/A"],
                  ["Downloads Used", typeof selectedUser.subscription === "object" && selectedUser.subscription
                    ? String(selectedUser.subscription.downloadsUsed ?? 0)
                    : "N/A"],
                  ["Devices Registered", typeof selectedUser.subscription === "object" && selectedUser.subscription
                    ? String((selectedUser.subscription.deviceIds || []).length)
                    : "N/A"],
                  ["Provider", typeof selectedUser.subscription === "object" && selectedUser.subscription
                    ? (selectedUser.subscription.provider || "N/A")
                    : "N/A"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-white/40 text-xs">{label}</p>
                    <p className="font-medium break-all">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent className="bg-[#12121a] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>Select Subscription Plan for {subTarget?.name || subTarget?.email}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {subscriptionPlans.map((plan) => (
              <button key={plan} onClick={() => setSelectedPlan(plan)} className={cn("w-full text-left px-4 py-3 rounded-lg text-sm border transition-colors", selectedPlan === plan ? "border-amber-500 bg-amber-500/10 text-amber-400" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10")}>{plan}</button>
            ))}
            <button onClick={confirmActivate} disabled={!selectedPlan} className="w-full mt-4 py-2.5 rounded-lg bg-amber-500 text-black font-semibold disabled:opacity-40">Activate Plan</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
