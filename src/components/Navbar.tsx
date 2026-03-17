import { useState, useRef, useEffect } from "react";
import { Search, Shield, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import VipPlansModal from "./VipPlansModal";
import AuthModal from "./AuthModal";
import ProfileDropdown from "./ProfileDropdown";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

const navItems = [
  { label: "FOR YOU", path: "/" },
  { label: "DRAMA", path: "/drama" },
  { label: "MOVIE", path: "/movie" },
  { label: "ANIME", path: "/anime" },
  { label: "VARIETY SHOW", path: "/variety-show" },
  { label: "LIVE TV CHANNEL", path: "/live-tv" },
  { label: "SPORT", path: "/sport" },
  { label: "RANKINGS", path: "/ranking" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const [vipOpen, setVipOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 50);
    }
  }, [mobileSearchOpen]);

  const handleSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    setMobileSearchOpen(false);
    setSearchQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, q: string) => {
    if (e.key === "Enter") handleSearch(q);
    if (e.key === "Escape") { setMobileSearchOpen(false); setSearchQuery(""); }
  };

  return (
    <>
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50 h-[48px]" style={{ width: "100%", margin: 0, padding: "0 4px" }}>
        <div className="flex items-center h-full w-full">

          {/* Mobile search overlay */}
          {mobileSearchOpen ? (
            <div className="flex items-center w-full gap-2 md:hidden">
              <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <input
                ref={mobileInputRef}
                type="text"
                placeholder="Search movies, series, genre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, searchQuery)}
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-foreground/40 outline-none"
              />
              <button
                onClick={() => { setMobileSearchOpen(false); setSearchQuery(""); }}
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleSearch(searchQuery)}
                className="text-[10px] font-semibold text-primary flex-shrink-0 px-1"
              >
                GO
              </button>
            </div>
          ) : (
            <>
              {/* Brand */}
              <div
                className="flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                onClick={() => navigate("/")}
              >
                <img src={logo} alt="LUO FILM" className="h-7 w-7 object-contain" />
                <span className="text-sm font-bold bg-gradient-to-r from-fuchsia-500 to-purple-500 bg-clip-text text-transparent tracking-tight">
                  LUO FILM
                </span>
              </div>

              {/* Mobile: search icon only */}
              <button
                onClick={() => setMobileSearchOpen(true)}
                className="md:hidden ml-2 flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Desktop nav */}
              <div className="hidden md:flex items-center justify-evenly flex-1">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    className={`px-3 py-1 text-[11px] font-semibold tracking-wide transition-colors whitespace-nowrap ${
                      location.pathname === item.path ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-1.5 ml-auto">
                {/* Desktop search */}
                <div className="hidden sm:flex items-center gap-2 bg-secondary/50 rounded px-2 py-1 w-[160px] lg:w-[200px]">
                  <input
                    ref={desktopInputRef}
                    type="text"
                    placeholder="Search..."
                    onKeyDown={(e) => handleKeyDown(e, (e.target as HTMLInputElement).value)}
                    className="bg-transparent text-xs text-foreground/60 placeholder:text-foreground/40 outline-none w-full"
                  />
                  <button onClick={() => handleSearch(desktopInputRef.current?.value || "")}>
                    <Search className="w-3.5 h-3.5 text-foreground/60 flex-shrink-0 hover:text-primary transition-colors" />
                  </button>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => navigate("/admin")}
                    className="flex items-center gap-1 px-1.5 py-1 text-foreground/80 hover:text-primary transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span className="text-[11px] hidden sm:inline">Admin</span>
                  </button>
                )}

                <button onClick={() => setVipOpen(true)} className="vip-badge flex items-center gap-1 px-2 py-1 rounded font-bold text-[10px] h-6">
                  <svg width="12" height="12" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.7 1.5l3.9 4.9c.2.2.4.3.7.2l4.2-1.3c.5-.2 1 .1 1.1.6 0 .1 0 .3 0 .4l-1.6 12.7c-.1.6-.5 1-1.1 1.1-2.8.3-5.7.5-8.5.5s-5.7-.2-8.5-.5c-.6-.1-1-.5-1.1-1.1L.3 6.3c-.1-.5.2-1 .7-1.1.1 0 .3 0 .4 0l4.2 1.3c.3.1.5 0 .7-.2L10 1.5c.4-.5 1.1-.6 1.5-.1l.2.1z" fill="#111319"/>
                  </svg>
                  VIP
                </button>

                {user ? (
                  <ProfileDropdown />
                ) : (
                  <button
                    onClick={() => setAuthOpen(true)}
                    className="px-2.5 py-1 rounded-md text-white text-[10px] font-bold tracking-wide transition-opacity hover:opacity-90 h-6 flex items-center"
                    style={{ background: "linear-gradient(to right, #d946ef, #a855f7)" }}
                  >
                    LOG IN
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </nav>

      <VipPlansModal open={vipOpen} onOpenChange={setVipOpen} />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
};

export default Navbar;
