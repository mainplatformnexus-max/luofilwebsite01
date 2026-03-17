import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Film, Tv, Star, Image, Trophy,
  Wallet, Activity, CreditCard, MessageSquare, PlayCircle,
  ChevronDown, ChevronRight, Menu, X, Radio
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  {
    label: "Users", icon: Users, path: "/admin/users",
    sub: [
      { label: "All Users", path: "/admin/users" },
      { label: "Active Subscribers", path: "/admin/users/active" },
      { label: "Never Subscribed", path: "/admin/users/inactive" },
    ],
  },
  { label: "Movies", icon: Film, path: "/admin/movies" },
  { label: "Series", icon: Tv, path: "/admin/series" },
  { label: "Episodes", icon: PlayCircle, path: "/admin/episodes" },
  { label: "Live TV", icon: Radio, path: "/admin/live-tv" },
  { label: "Sports", icon: Trophy, path: "/admin/sports" },
  { label: "Celebrity", icon: Star, path: "/admin/celebrity" },
  { label: "Carousels", icon: Image, path: "/admin/carousels" },
  { label: "Ranking", icon: Trophy, path: "/admin/ranking" },
  { label: "Ads / Banners", icon: Image, path: "/admin/ads" },
  { label: "Wallet", icon: Wallet, path: "/admin/wallet" },
  { label: "Activities", icon: Activity, path: "/admin/activities" },
  { label: "Subscription", icon: CreditCard, path: "/admin/subscription" },
  { label: "Comments", icon: MessageSquare, path: "/admin/comments" },
];

export default function AdminSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openSubs, setOpenSubs] = useState<string[]>(["Users"]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSub = (label: string) => {
    setOpenSubs((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const sidebar = (
    <div
      className={cn(
        "h-full bg-[#0a0a0f] border-r border-white/10 flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!collapsed && (
          <span className="text-lg font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
            Admin Panel
          </span>
        )}
        <button
          onClick={() => {
            setCollapsed(!collapsed);
            setMobileOpen(false);
          }}
          className="text-white/60 hover:text-white p-1"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {menuItems.map((item) => (
          <div key={item.label}>
            {item.sub ? (
              <>
                <button
                  onClick={() => toggleSub(item.label)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors",
                    location.pathname.startsWith(item.path) && "text-amber-400"
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {openSubs.includes(item.label) ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </>
                  )}
                </button>
                {!collapsed && openSubs.includes(item.label) && (
                  <div className="ml-6 border-l border-white/10">
                    {item.sub.map((sub) => (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        end
                        className={({ isActive }) =>
                          cn(
                            "block px-4 py-2 text-xs text-white/50 hover:text-white transition-colors",
                            isActive && "text-amber-400 bg-amber-400/5"
                          )
                        }
                      >
                        {sub.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink
                to={item.path}
                end={item.path === "/admin"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors",
                    isActive && "text-amber-400 bg-amber-400/5 border-r-2 border-amber-400"
                  )
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            )}
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-[#0a0a0f] border border-white/10 rounded-md p-2 text-white"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen z-40 lg:relative lg:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {sidebar}
      </aside>
    </>
  );
}
