import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import { Tv, Signal, Radio, Lock, Crown } from "lucide-react";
import { useLiveChannels, useSubscription, useAds } from "@/hooks/useFirestore";
import { useAuth } from "@/contexts/AuthContext";
import VipPlansModal from "@/components/VipPlansModal";
import PromoBanner from "@/components/PromoBanner";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const categories = ["All", "News", "Entertainment", "Sports", "Music", "Kids", "Documentary", "Religious", "General"];

const LiveTVPage = () => {
  const { channels, loading } = useLiveChannels();
  const { user, isAdmin } = useAuth();
  const { subscription, hasActive } = useSubscription(user?.id);
  const navigate = useNavigate();
  const [filterCat, setFilterCat] = useState("All");
  const [vipOpen, setVipOpen] = useState(false);

  const canAccessLiveTV = isAdmin || (hasActive && (subscription?.limits?.liveTv ?? false));
  const hasAnySubscription = hasActive;
  const { ads } = useAds("Live TV");

  const filtered = filterCat === "All" ? channels : channels.filter((c) => c.category === filterCat);

  const handlePlay = (ch: any) => {
    if (!canAccessLiveTV) { setVipOpen(true); return; }
    navigate(`/play/${ch.slug}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div style={{ marginTop: "48px" }} className="pt-3 md:pt-6 pb-16 px-2 md:px-4 max-w-7xl mx-auto">

        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="p-1.5 md:p-2 rounded-lg bg-red-500/20">
            <Radio className="w-4 h-4 md:w-6 md:h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-base md:text-2xl font-bold text-foreground leading-tight">Live TV Channel</h1>
            <p className="text-muted-foreground text-[11px] md:text-sm">Watch live channels anytime, anywhere</p>
          </div>
        </div>

        {/* Paywall banner */}
        {!canAccessLiveTV && (
          <div className="mb-3 md:mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 md:p-4 flex items-center gap-3">
            <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4 md:w-6 md:h-6 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-400">
                {!hasAnySubscription ? "Subscription Required" : "Plan Upgrade Required"}
              </p>
              <p className="text-xs text-white/60 mt-0.5">
                {!hasAnySubscription
                  ? "Subscribe to unlock Live TV channels."
                  : `Your ${subscription?.plan} plan does not include Live TV. Upgrade to 1 Day Pro or higher.`}
              </p>
            </div>
            <button
              onClick={() => setVipOpen(true)}
              className="px-3 py-1.5 md:px-4 md:py-2 bg-amber-500 text-black font-bold text-xs rounded-lg hover:bg-amber-400 shrink-0"
            >
              {!hasAnySubscription ? "Subscribe" : "Upgrade"}
            </button>
          </div>
        )}

        {ads[0] && <PromoBanner {...ads[0]} />}

        <div className="flex gap-1.5 md:gap-2 mb-3 md:mb-6 overflow-x-auto scrollbar-hidden pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-2.5 py-1 md:px-4 md:py-1.5 rounded-full text-[11px] md:text-sm whitespace-nowrap transition-colors flex-shrink-0 ${
                filterCat === cat
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-video bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 md:py-20 gap-3">
            <Tv className="w-10 h-10 md:w-16 md:h-16 text-primary opacity-40" />
            <h2 className="text-base md:text-xl font-semibold text-foreground">No channels yet</h2>
            <p className="text-muted-foreground text-xs md:text-sm text-center max-w-xs">
              Live TV channels will appear here once added by the admin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
            {filtered.map((ch) => (
              <div
                key={ch.id}
                onClick={() => handlePlay(ch)}
                className="group cursor-pointer rounded-lg md:rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-primary/50 transition-all hover:scale-[1.02] relative"
              >
                <div className="aspect-video relative bg-white/10">
                  {ch.thumbnail ? (
                    <img
                      src={ch.thumbnail}
                      alt={ch.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Tv className="w-5 h-5 md:w-8 md:h-8 text-white/20" />
                    </div>
                  )}
                  {!canAccessLiveTV && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Lock className="w-4 h-4 md:w-6 md:h-6 text-amber-400" />
                    </div>
                  )}
                  {canAccessLiveTV && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Signal className="w-5 h-5 md:w-8 md:h-8 text-white" />
                    </div>
                  )}
                  <div className="absolute top-1 left-1 md:top-2 md:left-2 flex gap-0.5 md:gap-1">
                    {ch.isLive && (
                      <span className="flex items-center gap-0.5 px-1 py-0.5 bg-red-500 text-white text-[8px] md:text-[9px] font-bold rounded">
                        <Signal className="w-1.5 h-1.5 md:w-2 md:h-2" /> LIVE
                      </span>
                    )}
                    {ch.isVip && (
                      <span className="flex items-center gap-0.5 px-1 py-0.5 bg-amber-500 text-black text-[8px] md:text-[9px] font-bold rounded">
                        <Lock className="w-1.5 h-1.5 md:w-2 md:h-2" /> VIP
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-1.5 md:p-2">
                  <p className="text-[10px] md:text-xs font-semibold text-foreground line-clamp-1">{ch.title}</p>
                  <p className="text-[9px] md:text-[10px] text-muted-foreground mt-0.5">{ch.category}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <MobileNav />
      <VipPlansModal open={vipOpen} onOpenChange={setVipOpen} />
    </div>
  );
};

export default LiveTVPage;
