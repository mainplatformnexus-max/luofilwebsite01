import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useFirestore";
import { useMovies, useSeries } from "@/hooks/useFirestore";
import {
  User,
  LogOut,
  Crown,
  Clock,
  Heart,
  Settings,
  ChevronRight,
  Play,
  Star,
  Shield,
} from "lucide-react";
import VipPlansModal from "@/components/VipPlansModal";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { subscription, hasActive } = useSubscription(user?.id);
  const { movies } = useMovies();
  const { series } = useSeries();
  const [vipOpen, setVipOpen] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 pt-[56px]">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-10 h-10 text-primary" />
          </div>
          <p className="text-foreground font-semibold text-lg">Not logged in</p>
          <p className="text-muted-foreground text-sm text-center">
            Please log in to view your profile
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const watchLaterSlugs: string[] = (() => {
    try {
      return JSON.parse(localStorage.getItem("watchLater") || "[]");
    } catch {
      return [];
    }
  })();

  const allContent = [...movies, ...series];
  const watchLaterItems = watchLaterSlugs
    .map((slug) => allContent.find((c) => c.slug === slug))
    .filter(Boolean) as typeof allContent;

  const likedSlugs = allContent
    .filter((c) => {
      try {
        return JSON.parse(localStorage.getItem(`liked_${c.slug}`) || "false");
      } catch {
        return false;
      }
    })
    .map((c) => c);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-[56px] pb-10 max-w-2xl mx-auto px-4">

        {/* Profile Header */}
        <div className="relative mt-6 mb-6">
          <div className="h-24 rounded-2xl bg-gradient-to-r from-primary/30 via-purple-500/20 to-amber-500/20" />
          <div className="absolute -bottom-8 left-4 flex items-end gap-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-black font-bold text-xl border-4 border-background">
              {initials}
            </div>
          </div>
        </div>

        <div className="mt-10 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
              <p className="text-sm text-muted-foreground">{user.phone}</p>
              {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
            </div>
            {isAdmin && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold border border-primary/30">
                <Shield className="w-3 h-3" /> Admin
              </span>
            )}
          </div>
        </div>

        {/* Subscription Card */}
        <div className={`rounded-xl p-4 mb-4 border ${hasActive ? "bg-amber-500/10 border-amber-500/30" : "bg-secondary border-border"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasActive ? "bg-amber-500/20" : "bg-muted"}`}>
                <Crown className={`w-5 h-5 ${hasActive ? "text-amber-400" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className={`font-semibold text-sm ${hasActive ? "text-amber-400" : "text-foreground"}`}>
                  {hasActive ? subscription?.plan || "VIP Active" : "No Active Plan"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {hasActive
                    ? subscription?.endDate
                      ? `Expires: ${new Date(subscription.endDate).toLocaleDateString()}`
                      : "Active subscription"
                    : "Subscribe to unlock all content"}
                </p>
              </div>
            </div>
            {!hasActive && (
              <button
                onClick={() => setVipOpen(true)}
                className="px-3 py-1.5 bg-amber-500 text-black font-bold text-xs rounded-lg hover:bg-amber-400"
              >
                Subscribe
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-secondary rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{watchLaterItems.length}</p>
              <p className="text-xs text-muted-foreground">Watch Later</p>
            </div>
          </div>
          <div className="bg-secondary rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{likedSlugs.length}</p>
              <p className="text-xs text-muted-foreground">Liked</p>
            </div>
          </div>
        </div>

        {/* Watch Later */}
        {watchLaterItems.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Watch Later
            </h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hidden pb-1">
              {watchLaterItems.map((item, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[100px] cursor-pointer group"
                  onClick={() => navigate(`/play/${item.slug}`)}
                >
                  <div className="relative rounded-lg overflow-hidden aspect-[2/3] bg-muted">
                    {item.poster ? (
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <Play className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                  </div>
                  <p className="text-[11px] text-foreground mt-1 line-clamp-2 leading-tight">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liked Content */}
        {likedSlugs.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" /> Liked
            </h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hidden pb-1">
              {likedSlugs.map((item, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[100px] cursor-pointer group"
                  onClick={() => navigate(`/play/${item.slug}`)}
                >
                  <div className="relative rounded-lg overflow-hidden aspect-[2/3] bg-muted">
                    {item.poster ? (
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <Play className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                  </div>
                  <p className="text-[11px] text-foreground mt-1 line-clamp-2 leading-tight">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className="bg-secondary rounded-xl overflow-hidden mb-4">
          {[
            { label: "Subscription & Plans", icon: Crown, action: () => setVipOpen(true) },
            { label: "Favorites", icon: Star, action: () => {} },
            { label: "Settings", icon: Settings, action: () => {} },
            ...(isAdmin ? [{ label: "Admin Panel", icon: Shield, action: () => navigate("/admin") }] : []),
          ].map((item, i, arr) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm text-foreground hover:bg-primary/10 transition-colors ${i < arr.length - 1 ? "border-b border-border" : ""}`}
            >
              <item.icon className="w-4 h-4 text-muted-foreground" />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-semibold"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>

      <MobileNav />
      <VipPlansModal open={vipOpen} onOpenChange={setVipOpen} />
    </div>
  );
};

export default ProfilePage;
