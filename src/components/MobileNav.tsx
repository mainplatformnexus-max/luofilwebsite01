import { useState, useEffect } from "react";
import { Home, Film, Menu, User, PlayCircle, Layers, Tv, Radio, Activity, Trophy, ChevronRight, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

const drawerItems = [
  { label: "For You", path: "/", icon: Home },
  { label: "Drama", path: "/drama", icon: Film },
  { label: "Movie", path: "/movie", icon: PlayCircle },
  { label: "Anime", path: "/anime", icon: Layers },
  { label: "Variety Show", path: "/variety-show", icon: Tv },
  { label: "Live TV Channel", path: "/live-tv", icon: Radio },
  { label: "Sport", path: "/sport", icon: Activity },
  { label: "Rankings", path: "/ranking", icon: Trophy },
];

const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const isActive = (path: string) => location.pathname === path;

  const initials = user
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : null;

  const goTo = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden h-16 flex items-stretch"
        style={{
          background: "hsl(225 24% 8% / 0.97)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Home */}
        <button
          onClick={() => navigate("/")}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${isActive("/") ? "text-primary" : "text-white/40"}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </button>

        {/* Movies */}
        <button
          onClick={() => navigate("/movie")}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${isActive("/movie") ? "text-primary" : "text-white/40"}`}
        >
          <Film className="w-5 h-5" />
          <span className="text-[10px] font-medium">Movies</span>
        </button>

        {/* Drama */}
        <button
          onClick={() => navigate("/drama")}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${isActive("/drama") ? "text-primary" : "text-white/40"}`}
        >
          <Tv className="w-5 h-5" />
          <span className="text-[10px] font-medium">Drama</span>
        </button>

        {/* Profile / Me */}
        <button
          onClick={() => navigate("/profile")}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${isActive("/profile") ? "text-primary" : "text-white/40"}`}
        >
          {user && initials ? (
            <div className={`w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-black font-bold text-[9px] ${isActive("/profile") ? "ring-2 ring-primary ring-offset-1 ring-offset-[#0c0d17]" : ""}`}>
              {initials}
            </div>
          ) : (
            <User className="w-5 h-5" />
          )}
          <span className="text-[10px] font-medium">Me</span>
        </button>

        {/* More */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5"
        >
          <Menu className="w-5 h-5 text-white/40" />
          <span className="text-[10px] font-medium text-white/40">More</span>
        </button>
      </nav>

      {/* More Drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative w-[280px] h-full bg-[#0c0d17] border-r border-white/10 flex flex-col z-10 animate-in slide-in-from-left duration-250">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <img src={logo} alt="LUO FILM" className="h-7 w-7 object-contain" />
                <span className="text-sm font-bold bg-gradient-to-r from-fuchsia-500 to-purple-500 bg-clip-text text-transparent">
                  LUO FILM
                </span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer nav items */}
            <div className="flex-1 overflow-y-auto py-2">
              {drawerItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => goTo(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors ${
                      active
                        ? "text-primary bg-primary/10 border-r-2 border-primary"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${active ? "text-primary" : "text-white/40"}`} />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronRight className={`w-4 h-4 ${active ? "text-primary" : "text-white/20"}`} />
                  </button>
                );
              })}
            </div>

            {/* Drawer footer: profile or login */}
            <div className="border-t border-white/10 p-4 pb-20">
              {user ? (
                <button
                  onClick={() => goTo("/profile")}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-black font-bold text-xs flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-white/40">View Profile</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30" />
                </button>
              ) : (
                <button
                  onClick={() => goTo("/")}
                  className="w-full py-2.5 rounded-xl text-white text-sm font-bold tracking-wide"
                  style={{ background: "linear-gradient(to right, #d946ef, #a855f7)" }}
                >
                  LOG IN
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNav;
