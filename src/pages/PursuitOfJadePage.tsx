import Navbar from "@/components/Navbar";
import { useNavigate } from "react-router-dom";
import { showsData } from "@/data/shows";
import { Play, Star, Share2, Bookmark, ChevronRight, Volume2, VolumeX, Maximize, SkipForward, Pause, Settings } from "lucide-react";
import { useState } from "react";

const episodes = [
  { num: 1, title: "Pursuit of Jade EP 1", hasPreview: false, isVip: false },
  { num: 2, title: "Pursuit of Jade EP 2", hasPreview: false, isVip: false },
  { num: 3, title: "Pursuit of Jade EP 3", hasPreview: true, isVip: false },
  { num: 4, title: "Pursuit of Jade EP 4", hasPreview: true, isVip: false },
  { num: 5, title: "Pursuit of Jade EP 5", hasPreview: true, isVip: false },
  { num: 6, title: "Pursuit of Jade EP 6", hasPreview: true, isVip: false },
  { num: 7, title: "Pursuit of Jade EP 7", hasPreview: true, isVip: false },
  { num: 8, title: "Pursuit of Jade EP 8", hasPreview: true, isVip: false },
  { num: 9, title: "Pursuit of Jade EP 9", hasPreview: true, isVip: false },
  { num: 10, title: "Pursuit of Jade EP 10", hasPreview: true, isVip: false },
  { num: 11, title: "Pursuit of Jade EP 11", hasPreview: true, isVip: false },
  { num: 12, title: "Pursuit of Jade EP 12", hasPreview: true, isVip: false },
  { num: 13, title: "Pursuit of Jade EP 13", hasPreview: true, isVip: false },
  { num: 14, title: "Pursuit of Jade EP 14", hasPreview: true, isVip: false },
  { num: 15, title: "Pursuit of Jade EP 15", hasPreview: true, isVip: false },
  { num: 16, title: "Pursuit of Jade EP 16", hasPreview: true, isVip: false },
  { num: 17, title: "Pursuit of Jade EP 17", hasPreview: true, isVip: false },
  { num: 18, title: "Pursuit of Jade EP 18", hasPreview: true, isVip: true },
  { num: 19, title: "Pursuit of Jade EP 19", hasPreview: true, isVip: true },
  { num: 20, title: "Pursuit of Jade EP 20", hasPreview: true, isVip: true },
  { num: 21, title: "Pursuit of Jade EP 21", hasPreview: true, isVip: true },
  { num: 22, title: "Pursuit of Jade EP 22", hasPreview: true, isVip: true },
  { num: 23, title: "Pursuit of Jade EP 23", hasPreview: true, isVip: true },
  { num: 24, title: "Pursuit of Jade EP 24", hasPreview: true, isVip: true },
];

const topPickSidebar = [
  { title: 'Trailer: "Pursuit of Jade" Heart-throbbing trailer', gradient: "linear-gradient(135deg, #d4a574, #b8860b)" },
  { title: "Pursuit of Jade EP 1", gradient: "linear-gradient(135deg, #8b6914, #c9a84c)" },
  { title: "Pursuit of Jade EP 2", gradient: "linear-gradient(135deg, #a0845c, #d4b896)" },
  { title: "Pursuit of Jade EP 3 Preview", gradient: "linear-gradient(135deg, #9c7a3c, #c4a264)" },
  { title: "Pursuit of Jade EP 3", gradient: "linear-gradient(135deg, #8b7355, #b8a080)" },
  { title: "Pursuit of Jade EP 4 Preview", gradient: "linear-gradient(135deg, #a68b5b, #cdb888)" },
  { title: "Pursuit of Jade EP 4", gradient: "linear-gradient(135deg, #917448, #bfa06c)" },
];

const latestEpisodes = [
  { title: "Pursuit of Jade EP 24", gradient: "linear-gradient(135deg, #b8860b, #daa520)" },
  { title: "Pursuit of Jade EP 23", gradient: "linear-gradient(135deg, #8b6914, #c9a84c)" },
  { title: "Pursuit of Jade EP 22", gradient: "linear-gradient(135deg, #a0845c, #d4b896)" },
  { title: "Pursuit of Jade EP 21", gradient: "linear-gradient(135deg, #9c7a3c, #c4a264)" },
];

const behindTheScenes = [
  { title: 'Zhang Linghe and Tian Xiwei chat about "Pursuit of Jade"', gradient: "linear-gradient(135deg, #d4a574, #e8c9a0)" },
  { title: '"Pursuit of Jade" Zheng & Changyu\'s childish moments', gradient: "linear-gradient(135deg, #c9956c, #e0b894)" },
  { title: '"Pursuit of Jade" Changning: Sweet Moments on Set', gradient: "linear-gradient(135deg, #b8860b, #d4a520)" },
  { title: '"Pursuit of Jade" Xie Zheng and Changyu show affection', gradient: "linear-gradient(135deg, #a07840, #c8a868)" },
  { title: '"Pursuit of Jade" The hilarious business scene', gradient: "linear-gradient(135deg, #917448, #bfa06c)" },
  { title: '"Pursuit of Jade" On-the-spot Pulse Diagnosis', gradient: "linear-gradient(135deg, #8b6914, #c9a84c)" },
  { title: '"Pursuit of Jade" Unlocking the Skill of Slaughtering Pigs', gradient: "linear-gradient(135deg, #a0845c, #d4b896)" },
  { title: '"Pursuit of Jade" Take a break, Your Lordship', gradient: "linear-gradient(135deg, #9c7a3c, #c4a264)" },
];

const castCollections = [
  { name: "Series of Zhang Ling He", gradient: "linear-gradient(135deg, #6366f1, #a78bfa)" },
  { name: "Collection of Tian Xiwei", gradient: "linear-gradient(135deg, #ec4899, #f9a8d4)" },
];

const youMayAlsoLike = [
  { title: "How Dare You!?", gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)" },
  { title: "Fated Hearts", gradient: "linear-gradient(135deg, #3b82f6, #93c5fd)" },
  { title: "Legend of the Female General", gradient: "linear-gradient(135deg, #e8455a, #f49097)" },
  { title: "Glory", gradient: "linear-gradient(135deg, #8b5cf6, #c4b5fd)" },
  { title: "The Unclouded Soul", gradient: "linear-gradient(135deg, #10b981, #6ee7b7)" },
  { title: "Coroner's Diary", gradient: "linear-gradient(135deg, #14b8a6, #5eead4)" },
  { title: "Story of Kunning Palace", gradient: "linear-gradient(135deg, #ef4444, #fca5a5)" },
];

const trendingNow = [
  { title: "How Dare You!?", gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)" },
  { title: "Love Between Lines", gradient: "linear-gradient(135deg, #ec4899, #f9a8d4)" },
  { title: "SPEED AND LOVE", gradient: "linear-gradient(135deg, #e8455a, #f49097)" },
  { title: "Shine on Me", gradient: "linear-gradient(135deg, #6366f1, #a78bfa)" },
  { title: "Duang with You (UNCUT)", gradient: "linear-gradient(135deg, #10b981, #6ee7b7)" },
  { title: "Tide of Love 2", gradient: "linear-gradient(135deg, #3b82f6, #93c5fd)" },
  { title: "The Earth 4 Elements", gradient: "linear-gradient(135deg, #8b5cf6, #c4b5fd)" },
];

const PursuitOfJadePage = () => {
  const navigate = useNavigate();
  const [activeEp, setActiveEp] = useState(1);
  const show = showsData.find((s) => s.slug === "pursuit-of-jade") || showsData[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner - warm ancient Chinese theme */}
      <div className="relative w-full overflow-hidden" style={{ paddingTop: "56px" }}>
        <div
          className="relative w-full"
          style={{
            height: "400px",
            background: "linear-gradient(135deg, #d4a574 0%, #c4956c 20%, #b8860b 40%, #a07840 60%, #c9a84c 80%, #e8c9a0 100%)",
          }}
        >
          {/* Decorative overlay pattern */}
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.3) 0%, transparent 70%)" }} />

          {/* Title overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <h1
              className="text-[72px] font-bold italic tracking-wide"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                color: "hsl(142 61% 45%)",
                textShadow: "0 4px 20px rgba(0,0,0,0.5)",
              }}
            >
              Pursuit of Jade
            </h1>
          </div>
        </div>
      </div>

      {/* Video Player + Top Pick Sidebar */}
      <div className="px-14 mt-0">
        <div className="flex gap-0">
          {/* Main Player */}
          <div className="flex-1">
            <div
              className="relative w-full bg-black"
              style={{ aspectRatio: "16/9" }}
            >
              {/* Player placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 cursor-pointer transition-transform hover:scale-110"
                    style={{ background: "hsl(142 61% 45%)" }}
                    onClick={() => navigate(`/play/${show.slug}`)}
                  >
                    <Play className="w-7 h-7 text-black fill-black ml-1" />
                  </div>
                  <p className="text-muted-foreground text-sm">Click to play</p>
                </div>
              </div>

              {/* Player Controls Bar */}
              <div className="absolute bottom-0 left-0 right-0 z-30">
                {/* Progress bar */}
                <div className="px-3 pb-1">
                  <div className="h-1 rounded-full bg-muted-foreground/30 cursor-pointer group">
                    <div className="h-full rounded-full w-[2%] relative" style={{ background: "hsl(142 61% 45%)" }}>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "hsl(142 61% 45%)" }} />
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between px-3 pb-2">
                  <div className="flex items-center gap-3">
                    <button className="text-foreground/80 hover:text-foreground"><Pause className="w-5 h-5" /></button>
                    <button className="text-foreground/80 hover:text-foreground"><SkipForward className="w-5 h-5" /></button>
                    <span className="text-xs text-foreground/60">00:03 / 01:48</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="text-xs text-foreground/60 hover:text-foreground">360P</button>
                    <button className="text-xs text-foreground/60 hover:text-foreground">Subtitle</button>
                    <button className="text-xs text-foreground/60 hover:text-foreground">1.0X</button>
                    <button className="text-foreground/60 hover:text-foreground"><Volume2 className="w-4 h-4" /></button>
                    <button className="text-foreground/60 hover:text-foreground"><Maximize className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Pick Sidebar */}
          <div className="w-[300px] flex-shrink-0 bg-card" style={{ maxHeight: "calc((100vw - 112px - 300px) * 9 / 16)" }}>
            <div className="p-3">
              <h3 className="text-sm font-bold text-foreground mb-3">Top Pick!</h3>
            </div>
            <div className="overflow-y-auto scrollbar-hidden" style={{ maxHeight: "calc(100% - 48px)" }}>
              {topPickSidebar.map((item, i) => (
                <div
                  key={i}
                  className="flex gap-2 px-3 py-1.5 cursor-pointer hover:bg-accent transition-colors group"
                  onClick={() => navigate(`/play/${show.slug}`)}
                >
                  <div className="w-[120px] h-[68px] rounded flex-shrink-0 relative overflow-hidden" style={{ background: item.gradient }}>
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-5 h-5 text-foreground fill-foreground" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug line-clamp-3 flex-1">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section: Latest Episodes */}
      <div className="px-14 mt-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 px-1 flex items-center">
            <img
              src="https://u6.iqiyipic.com/intl_lang/20260305/46/ce/intl_lang_7e6ae8954ba6a474723b62e39895_default.png"
              alt="Latest Episodes"
              className="h-6 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.parentElement!.innerHTML = '<span class="section-title">Latest Episodes</span>';
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {latestEpisodes.map((ep, i) => (
            <div
              key={i}
              className="cursor-pointer group"
              onClick={() => navigate(`/play/${show.slug}`)}
            >
              <div className="w-full aspect-video rounded-lg overflow-hidden relative" style={{ background: ep.gradient }}>
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "hsl(142 61% 45%)" }}>
                    <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                  </div>
                </div>
              </div>
              <p className="text-sm text-foreground mt-2 truncate">{ep.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section: Behind the Scenes */}
      <div className="px-14 mt-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 px-1 flex items-center">
            <img
              src="https://u8.iqiyipic.com/intl_lang/20260305/49/a9/intl_lang_f62a511b4fb4919b6302b0666e6a_default.png"
              alt="Behind the Scenes"
              className="h-6 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.parentElement!.innerHTML = '<span class="section-title">Behind the Scenes</span>';
              }}
            />
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hidden pb-2">
          {behindTheScenes.map((item, i) => (
            <div key={i} className="flex-shrink-0 w-[260px] cursor-pointer group">
              <div className="w-full aspect-video rounded-lg overflow-hidden relative" style={{ background: item.gradient }}>
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "hsl(142 61% 45%)" }}>
                    <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section: Cast Collections */}
      <div className="px-14 mt-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 px-1 flex items-center">
            <img
              src="https://u1.iqiyipic.com/intl_lang/20260305/13/96/intl_lang_92da5bc44e95a0d1ee73a9a0b66c_default.png"
              alt="Cast"
              className="h-6 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.parentElement!.innerHTML = '<span class="section-title">Cast Collections</span>';
              }}
            />
          </div>
        </div>
        <div className="flex gap-4">
          {castCollections.map((cast, i) => (
            <div key={i} className="w-[260px] cursor-pointer group">
              <div className="w-full aspect-video rounded-lg overflow-hidden relative" style={{ background: cast.gradient }}>
                <div className="absolute inset-0 flex items-end p-3" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 60%)" }}>
                  <p className="text-sm text-foreground font-medium">{cast.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section: You May Also Like */}
      <div className="px-14 mt-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 px-1 flex items-center">
            <img
              src="https://u5.iqiyipic.com/intl_lang/20260305/2d/03/intl_lang_13b80920493abecd30eeeccda249_default.png"
              alt="You May Also Like"
              className="h-6 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.parentElement!.innerHTML = '<span class="section-title">You May Also Like</span>';
              }}
            />
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hidden pb-2">
          {youMayAlsoLike.map((item, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[260px] cursor-pointer group"
              onClick={() => {
                const found = showsData.find((s) => s.title === item.title);
                if (found) navigate(`/detail/${found.slug}`);
              }}
            >
              <div className="w-full aspect-video rounded-lg overflow-hidden relative" style={{ background: item.gradient }}>
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "hsl(142 61% 45%)" }}>
                    <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                  </div>
                </div>
              </div>
              <p className="text-sm text-foreground mt-2 truncate">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section: Trending Now */}
      <div className="px-14 mt-10 mb-16">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 px-1 flex items-center">
            <img
              src="https://u6.iqiyipic.com/intl_lang/20260305/58/a4/intl_lang_0640863a4d19a3d463e97b5be4ca_default.png"
              alt="Trending Now"
              className="h-6 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.parentElement!.innerHTML = '<span class="section-title">Trending Now</span>';
              }}
            />
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hidden pb-2">
          {trendingNow.map((item, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[260px] cursor-pointer group"
              onClick={() => {
                const found = showsData.find((s) => s.title === item.title);
                if (found) navigate(`/detail/${found.slug}`);
              }}
            >
              <div className="w-full aspect-video rounded-lg overflow-hidden relative" style={{ background: item.gradient }}>
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "hsl(142 61% 45%)" }}>
                    <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                  </div>
                </div>
              </div>
              <p className="text-sm text-foreground mt-2 truncate">{item.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PursuitOfJadePage;
