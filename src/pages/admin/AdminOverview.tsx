import { useMemo } from "react";
import { Users, Film, Tv, CreditCard, TrendingUp, Eye, Radio, Trophy } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { useMovies, useSeries, useUsers, useLiveChannels, useSportContent } from "@/hooks/useFirestore";

const PLAN_COLORS: Record<string, string> = {
  "Standard": "#3b82f6",
  "Pro": "#8b5cf6",
  "Classic": "#06b6d4",
  "Premium": "#10b981",
  "VIP": "#f59e0b",
  "Ultra": "#ef4444",
  "Other": "#6b7280",
};

const revenueData = [
  { month: "Jan", revenue: 4200000 }, { month: "Feb", revenue: 5100000 },
  { month: "Mar", revenue: 4800000 }, { month: "Apr", revenue: 6200000 },
  { month: "May", revenue: 7100000 }, { month: "Jun", revenue: 6800000 },
  { month: "Jul", revenue: 8200000 }, { month: "Aug", revenue: 7500000 },
  { month: "Sep", revenue: 9100000 }, { month: "Oct", revenue: 8800000 },
  { month: "Nov", revenue: 10200000 }, { month: "Dec", revenue: 11500000 },
];

function isActiveSub(sub: any): boolean {
  if (!sub) return false;
  if (typeof sub === "string") return true;
  if (!sub.endDate) return !!sub.plan;
  return new Date(sub.endDate) > new Date();
}

export default function AdminOverview() {
  const { movies } = useMovies();
  const { series } = useSeries();
  const { users } = useUsers();
  const { channels } = useLiveChannels();
  const { sports } = useSportContent();

  const activeSubscribers = users.filter((u) => isActiveSub(u.subscription));

  const subsByPlan = useMemo(() => {
    const counts: Record<string, number> = {};
    activeSubscribers.forEach((u) => {
      const plan = u.subscription?.plan || u.subscriptionPlan || "Other";
      const key = plan.includes("VIP") ? "VIP"
        : plan.includes("Ultra") ? "Ultra"
        : plan.includes("Premium") ? "Premium"
        : plan.includes("Pro") ? "Pro"
        : plan.includes("Classic") ? "Classic"
        : plan.includes("Standard") ? "Standard"
        : "Other";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: PLAN_COLORS[name] || "#6b7280",
    }));
  }, [activeSubscribers]);

  const userGrowth = useMemo(() => {
    if (users.length === 0) return [];
    const now = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyCounts: Record<string, number> = {};
    users.forEach((u) => {
      if (u.createdAt) {
        const d = new Date(u.createdAt);
        const key = months[d.getMonth()];
        monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
      }
    });
    let cumulative = 0;
    return months.slice(0, now.getMonth() + 1).map((month) => {
      cumulative += monthlyCounts[month] || 0;
      return { month, users: cumulative };
    });
  }, [users]);

  const stats = [
    { label: "Total Users", value: users.length.toLocaleString(), icon: Users, change: `${users.length} total`, color: "from-blue-500 to-blue-600" },
    { label: "Active Subscribers", value: activeSubscribers.length.toLocaleString(), icon: CreditCard, change: `${activeSubscribers.length} active`, color: "from-amber-500 to-yellow-500" },
    { label: "Total Movies", value: movies.length.toLocaleString(), icon: Film, change: `+${movies.length}`, color: "from-green-500 to-emerald-500" },
    { label: "Total Series", value: series.length.toLocaleString(), icon: Tv, change: `+${series.length}`, color: "from-purple-500 to-pink-500" },
    { label: "Live TV Channels", value: channels.length.toLocaleString(), icon: Radio, change: `${channels.length} channels`, color: "from-red-500 to-rose-500" },
    { label: "Sport Content", value: sports.length.toLocaleString(), icon: Trophy, change: `${sports.length} items`, color: "from-orange-500 to-amber-500" },
    { label: "Total Content", value: (movies.length + series.length + channels.length + sports.length).toLocaleString(), icon: Eye, change: "all content", color: "from-cyan-500 to-blue-500" },
    { label: "Growth Rate", value: users.length > 0 ? `${Math.min(100, Math.floor((activeSubscribers.length / users.length) * 100))}%` : "0%", icon: TrendingUp, change: "sub rate", color: "from-teal-500 to-green-500" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${s.color}`}>
                <s.icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs text-green-400">{s.change}</span>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-white/50">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Revenue (UGX)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="month" stroke="#ffffff40" fontSize={11} />
              <YAxis stroke="#ffffff40" fontSize={11} tickFormatter={(v) => `${v / 1000000}M`} />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid #ffffff20", borderRadius: 8 }}
                labelStyle={{ color: "#fff" }}
                formatter={(value: number) => [`UGX ${value.toLocaleString()}`, "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">User Growth (Real Data)</h3>
          {userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="month" stroke="#ffffff40" fontSize={11} />
                <YAxis stroke="#ffffff40" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "#1a1a2e", border: "1px solid #ffffff20", borderRadius: 8 }}
                  labelStyle={{ color: "#fff" }}
                />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-white/30 text-sm">
              No user data yet
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Subscriptions by Plan (Real Data)</h3>
          {subsByPlan.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={subsByPlan}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {subsByPlan.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1a1a2e", border: "1px solid #ffffff20", borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-white/30 text-sm">
              No subscription data yet
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Recent Users (Real Data)</h3>
          <div className="space-y-3">
            {users.slice(0, 5).map((u, i) => (
              <div key={u.id || i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm font-medium">{u.name || u.displayName || u.email}</p>
                  <p className="text-xs text-white/50">{u.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/40">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}</p>
                  {u.subscription && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">Subscribed</span>
                  )}
                </div>
              </div>
            ))}
            {users.length === 0 && <p className="text-xs text-white/40">No users yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
