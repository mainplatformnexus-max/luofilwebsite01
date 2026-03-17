import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Play, MessageSquare, Clock, Share2, Monitor, Smartphone, ChevronRight, Star, ArrowLeft, Download, Send, Trash2, Lock, HardDrive, Film, Flame, Wifi, CheckCircle2 } from "lucide-react";
import { subscribeMovies, subscribeSeries, getEpisodesBySeries, subscribeComments, addComment, deleteComment, addWatchLater, subscribeWatchLater, deleteWatchLater, subscribeEpisodes, getUserByUid } from "@/lib/firebaseServices";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { EpisodeItem, CommentItem, WatchLaterItem, UserItem } from "@/data/adminData";
import MuxPlayer from "@mux/mux-player-react";
import SportPlayer from "@/components/SportPlayer";
import ArtPlayerComponent from "@/components/ArtPlayerComponent";
import OfflineVideoPlayerComponent from "@/components/OfflineVideoPlayerComponent";
import Badge18Plus from "@/components/Badge18Plus";
import DownloadBadge from "@/components/DownloadBadge";
import QualityBadge from "@/components/QualityBadge";
import { useState, useEffect, useCallback } from "react";
import LogoLoader from "@/components/LogoLoader";
import type { Drama } from "@/data/dramas";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import SubscribeModal from "@/components/SubscribeModal";
import { useVideoCache } from "@/hooks/useVideoCache";
import { videoCacheService } from "@/lib/videoCacheService";
import { getPlaybackUrl } from "@/lib/offlinePlayerUtils";
import { autoCacheService } from "@/lib/autoCacheService";
import { networkDetection } from "@/lib/networkDetection";
import { trackWatchedMovie } from "@/hooks/useNotifications";

// ==================== SPORT WATCH ====================
const SportWatch = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    matchId?: string;
    playPath?: string;
    playSource?: { title: string; path: string }[];
    homeTeam?: string;
    awayTeam?: string;
    highlights?: { title: string; path: string; cover?: { url: string } }[];
    isLive?: boolean;
  } | null;

  const [activeChannel, setActiveChannel] = useState(-1);
  const [highlightUrl, setHighlightUrl] = useState<string | null>(null);

  const playPath = state?.playPath || "";
  const playSource = state?.playSource || [];
  const highlights = state?.highlights || [];
  const title = state?.homeTeam && state?.awayTeam
    ? `${state.homeTeam} vs ${state.awayTeam}`
    : "Live Sport";

  const isPlayingHighlight = !!highlightUrl;
  const selectedSource = activeChannel >= 0 && !isPlayingHighlight ? playSource[activeChannel] : null;
  const isIframeSource = selectedSource?.path?.includes("http") && !selectedSource?.path?.includes(".m3u8");
  const currentVideoUrl = isPlayingHighlight
    ? highlightUrl!
    : activeChannel === -1
      ? playPath
      : (isIframeSource ? "" : selectedSource?.path || "");
  const iframeUrl = !isPlayingHighlight && isIframeSource ? selectedSource?.path : "";

  return (
    <div className="min-h-screen bg-background">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 px-4 py-2.5 text-muted-foreground hover:text-foreground text-xs transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 min-w-0">
          <div className="relative w-full bg-black" style={{ aspectRatio: "16/9", maxHeight: "520px" }}>
            {iframeUrl ? (
              <iframe src={iframeUrl} className="w-full h-full border-0" allowFullScreen allow="autoplay; encrypted-media; fullscreen" title="Live Stream" />
            ) : currentVideoUrl ? (
              <div className="w-full h-full">
                <MuxPlayer
                  key={currentVideoUrl}
                  src={currentVideoUrl}
                  playInline
                  autoPlay={state?.isLive && !isPlayingHighlight}
                  metadata={{
                    video_id: state?.matchId || "live-sport",
                    video_title: title,
                  }}
                  className="w-full h-full"
                  style={{ aspectRatio: "16/9" }}
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Play className="w-10 h-10 opacity-30" />
                <p className="text-sm">No stream available. Select a channel below.</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border overflow-x-auto">
            {playPath && (
              <button onClick={() => { setActiveChannel(-1); setHighlightUrl(null); }}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${activeChannel === -1 && !highlightUrl ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                🔴 Main Stream
              </button>
            )}
            {playSource.map((src, i) => (
              <button key={i} onClick={() => { setActiveChannel(i); setHighlightUrl(null); }}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${activeChannel === i ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {src.title || `Channel ${i + 1}`}
              </button>
            ))}
          </div>
          <div className="px-4 py-3">
            <h1 className="text-foreground text-lg font-bold mb-2">{title}</h1>
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-bold">LIVE SPORT</span>
              {currentVideoUrl && <span className="text-primary">● {isPlayingHighlight ? "Highlight" : "Stream"} active</span>}
            </div>
          </div>
          {highlights.length > 0 && (
            <div className="px-4 py-3 border-t border-border">
              <h2 className="text-foreground text-base font-bold mb-3">Highlights</h2>
              <div className="space-y-2">
                {highlights.map((h, i) => (
                  <div key={i} className="flex gap-3 p-2 rounded cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => { if (h.path) { setHighlightUrl(h.path); setActiveChannel(-2); } }}>
                    {h.cover?.url && <img src={h.cover.url} alt={h.title} className="w-24 h-14 object-cover rounded" />}
                    <div className="flex-1">
                      <p className="text-foreground text-xs font-medium line-clamp-2">{h.title}</p>
                      <Play className="w-3 h-3 text-primary mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== HELPER: Check if user has active subscription ====================
const checkUserSubscription = (userDoc: UserItem | null): boolean => {
  if (!userDoc) return false;
  if (!userDoc.subscription || !userDoc.subscriptionExpiry) return false;
  const expiry = new Date(userDoc.subscriptionExpiry);
  return expiry.getTime() > Date.now() && userDoc.status !== "blocked";
};

// ==================== HELPER: Download video file ====================
const downloadVideoFile = async (
  url: string,
  fileName: string,
  onStart: () => void,
  onEnd: () => void,
  onError: (msg: string) => void,
  onSuccess: (name: string) => void
) => {
  onStart();
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    onSuccess(fileName);
  } catch (err) {
    // Fallback to direct download if fetch fails (e.g. CORS)
    try {
      const backendUrl = `https://download.mainplatform-nexus.workers.dev/?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(fileName)}`;
      const link = document.createElement("a");
      link.href = backendUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onSuccess(fileName);
    } catch (e) {
      onError("Download failed. Please try again or use a different browser.");
    }
  }
  onEnd();
};

// ==================== DRAMA WATCH ====================
const Watch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"episodes" | "highlights">("episodes");
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<EpisodeItem | null>(null);
  const [recommended, setRecommended] = useState<Drama[]>([]);
  const [drama, setDrama] = useState<Drama | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [watchLaterItems, setWatchLaterItems] = useState<WatchLaterItem[]>([]);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [subscribeMode, setSubscribeMode] = useState<"user" | "agent">("user");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userDoc, setUserDoc] = useState<UserItem | null>(null);
  const [isCaching, setIsCaching] = useState(false);
  const [cacheProgress, setCacheProgress] = useState(0);
  const [playingOffline, setPlayingOffline] = useState(false);
  const [cachedVideoUrl, setCachedVideoUrl] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState(networkDetection.getNetworkStatus());
  const isSport = id?.startsWith("sport-");
  const { downloadVideo } = useVideoCache();
  const offlineState = location.state as { isOffline?: boolean; cacheId?: string } | null;

  const firebaseState = location.state as {
    firebaseId?: string;
    title?: string;
    image?: string;
    streamLink?: string;
    downloadLink?: string;
    episodes?: string;
    genre?: string;
    rating?: number;
    description?: string;
    actors?: string;
    isVip?: boolean;
    isHotDrama?: boolean;
    isOriginal?: boolean;
    isAgent?: boolean;
    agentMarkedAt?: string | null;
    targetEpisodeNumber?: number;
    targetEpisodeId?: string;
  } | null;

  // Check user subscription status
  useEffect(() => {
    if (!user) { setUserDoc(null); return; }
    getUserByUid(user.uid).then(doc => setUserDoc(doc));
  }, [user]);

  const hasSubscription = checkUserSubscription(userDoc);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = networkDetection.subscribe((status) => {
      setNetworkStatus(status);
    });
    return unsubscribe;
  }, []);

  // Reset states when id changes (fix: player not changing on recommended click)
  useEffect(() => {
    setDrama(null);
    setCurrentEpisode(null);
    setEpisodes([]);
    setComments([]);
    setShowComments(false);
    setIsLoading(true);
  }, [id]);

  // Load content from Firestore or Cache
  useEffect(() => {
    if (isSport || !id) return;

    const loadContent = async () => {
      setIsLoading(true);
      
      // Check if offline mode (coming from Downloads page)
      if (offlineState?.isOffline && offlineState?.cacheId) {
        const cached = await videoCacheService.getVideo(offlineState.cacheId);
        if (cached) {
          // Try to load actual downloaded blob for true offline playback
          let playUrl = cached.url;
          try {
            const blob = await videoCacheService.getVideoBlob(offlineState.cacheId);
            if (blob && blob.size > 0) {
              playUrl = URL.createObjectURL(blob);
              setCachedVideoUrl(playUrl);
            }
          } catch {
            // No blob — stream from online URL
          }
          setDrama({
            id: 9999,
            title: cached.title,
            image: cached.posterUrl || "/placeholder.svg",
            streamLink: playUrl,
            firebaseId: cached.id,
            genre: "",
            rating: 0,
            description: "Cached video",
            isVip: false,
            isHotDrama: false,
            isOriginal: false,
          });
          setPlayingOffline(true);
          setIsLoading(false);
          return;
        }
      }

      // Check for cached video for current content
      if (drama?.firebaseId || id) {
        const videoId = drama?.firebaseId || id;
        const playbackInfo = await getPlaybackUrl({
          videoId,
          onlineUrl: drama?.streamLink,
        });
        if (playbackInfo.isCached) {
          setCachedVideoUrl(playbackInfo.url);
          setPlayingOffline(true);
        }
      }

      if (firebaseState?.firebaseId) {
        setDrama({
          id: Number(id) || 9999,
          title: firebaseState.title || "Unknown",
          image: firebaseState.image || "/placeholder.svg",
          episodes: firebaseState.episodes,
          streamLink: firebaseState.streamLink,
          genre: firebaseState.genre,
          rating: firebaseState.rating,
          description: firebaseState.description,
          actors: firebaseState.actors,
          isVip: firebaseState.isVip,
          isHotDrama: firebaseState.isHotDrama,
          isOriginal: firebaseState.isOriginal,
          firebaseId: firebaseState.firebaseId,
          isAgent: firebaseState.isAgent,
          agentMarkedAt: firebaseState.agentMarkedAt,
          downloadLink: firebaseState.downloadLink,
        });
      } else {
        try {
          const seriesDoc = await getDoc(doc(db, "series", id));
          if (seriesDoc.exists()) {
            const s = seriesDoc.data();
            setDrama({
              id: 9999, title: s.name || "Unknown", image: s.posterUrl || "/placeholder.svg",
              episodes: `${s.totalEpisodes || 0} Episodes`, genre: s.genre, rating: s.rating,
              description: s.description, actors: s.actors, isVip: s.isVip,
              isHotDrama: s.isHotDrama, isOriginal: s.isOriginal, firebaseId: id,
            });
          } else {
            const movieDoc = await getDoc(doc(db, "movies", id));
            if (movieDoc.exists()) {
              const m = movieDoc.data();
              setDrama({
                id: 9999, title: m.name || "Unknown", image: m.posterUrl || "/placeholder.svg",
                streamLink: m.streamLink, downloadLink: m.downloadLink, genre: m.genre,
                rating: m.rating, description: m.description, actors: m.actors,
                isVip: m.isVip, isHotDrama: m.isHotDrama, isOriginal: m.isOriginal,
                firebaseId: id, isAgent: m.isAgent, agentMarkedAt: m.agentMarkedAt,
              });
            }
          }
        } catch (err) {
          console.error("Error loading content:", err);
        }
      }
      setIsLoading(false);
    };

    loadContent();

    if (!offlineState?.isOffline) {
      const unsub1 = subscribeMovies((movies) => {
        setRecommended(movies.filter(m => !m.isAgent).slice(0, 7).map((m, i) => ({
          id: i + 6000, title: m.name, image: m.posterUrl || "/placeholder.svg",
          firebaseId: m.id, streamLink: m.streamLink, genre: m.genre,
          rating: m.rating, description: m.description, downloadLink: m.downloadLink,
        })));
      });
      return () => { unsub1(); };
    }
  }, [id, isSport, offlineState?.isOffline, offlineState?.cacheId]);

  // Subscribe to episodes for this content
  useEffect(() => {
    const contentId = firebaseState?.firebaseId || id;
    if (!contentId || isSport) return;
    const targetEpNum = firebaseState?.targetEpisodeNumber;
    const targetEpId = firebaseState?.targetEpisodeId;
    const unsub = subscribeEpisodes((allEps) => {
      const filtered = allEps
        .filter(ep => ep.seriesId === contentId)
        .sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
      setEpisodes(filtered);
      if (!currentEpisode && filtered.length > 0) {
        // Pre-select the episode that was clicked on the homepage
        const target =
          (targetEpId && filtered.find(ep => ep.id === targetEpId)) ||
          (targetEpNum && filtered.find(ep => ep.episodeNumber === targetEpNum)) ||
          filtered.find(ep => ep.streamLink) ||
          filtered[0];
        if (target) setCurrentEpisode(target);
      }
    });
    return unsub;
  }, [id, firebaseState?.firebaseId, firebaseState?.targetEpisodeNumber, firebaseState?.targetEpisodeId, isSport]);

  // Subscribe to comments
  useEffect(() => {
    if (!id) return;
    const contentId = firebaseState?.firebaseId || id;
    const unsub = subscribeComments(contentId, setComments);
    return unsub;
  }, [id, firebaseState?.firebaseId]);

  // Subscribe to watch later
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeWatchLater(user.uid, setWatchLaterItems);
    return unsub;
  }, [user]);

  // Track last watched for notification subscription promo
  useEffect(() => {
    if (drama?.image && drama.firebaseId) {
      trackWatchedMovie(drama.image, drama.firebaseId);
    }
  }, [drama?.firebaseId]);

  // Dynamic SEO implementation - Update meta tags on mount and when content changes
  useEffect(() => {
    if (!drama) return;

    const episodeText = currentEpisode ? ` - Episode ${currentEpisode.episodeNumber}` : "";
    const pageTitle = `${drama.title}${episodeText} | Watch on LUO FILM`;
    const description = drama.description 
      ? (drama.description.length > 150 ? drama.description.substring(0, 157) + "..." : drama.description)
      : `Stream ${drama.title}${episodeText} in high quality on LUO FILM.`;
    
    const image = drama.image.startsWith('http') ? drama.image : `https://luofilm.site${drama.image}`;

    // Update document title
    document.title = pageTitle;
    
    // Update or create meta tags by ID (these must exist in index.html)
    const updateMetaById = (elementId: string, content: string) => {
      const el = document.getElementById(elementId);
      if (el) {
        el.setAttribute("content", content);
      }
    };

    // Update main meta tags
    updateMetaById("og-title", pageTitle);
    updateMetaById("og-desc", description);
    updateMetaById("og-image", image);
    updateMetaById("twitter-title", pageTitle);
    updateMetaById("twitter-desc", description);
    updateMetaById("twitter-image", image);
    
    // Also update via query selector for backup
    document.querySelectorAll('meta[property="og:title"]').forEach(el => el.setAttribute("content", pageTitle));
    document.querySelectorAll('meta[property="og:description"]').forEach(el => el.setAttribute("content", description));
    document.querySelectorAll('meta[property="og:image"]').forEach(el => el.setAttribute("content", image));
    document.querySelectorAll('meta[property="og:url"]').forEach(el => el.setAttribute("content", window.location.href));
    document.querySelectorAll('meta[property="og:type"]').forEach(el => el.setAttribute("content", "video.other"));
    
    document.querySelectorAll('meta[name="twitter:title"]').forEach(el => el.setAttribute("content", pageTitle));
    document.querySelectorAll('meta[name="twitter:description"]').forEach(el => el.setAttribute("content", description));
    document.querySelectorAll('meta[name="twitter:image"]').forEach(el => el.setAttribute("content", image));
    document.querySelectorAll('meta[name="twitter:card"]').forEach(el => el.setAttribute("content", "summary_large_image"));
    document.querySelectorAll('meta[name="description"]').forEach(el => el.setAttribute("content", description));

    return () => {
      document.title = "LUO FILM";
      // Reset to defaults on unmount
      updateMetaById("og-title", "LUO FILM");
      updateMetaById("og-desc", "Watch and Download Luo Translated Movies, Live TV, and Sports on LUO FILM.");
      updateMetaById("og-image", "https://luofilm.site/logo.png");
    };
  }, [drama, currentEpisode]);

  if (isSport) return <SportWatch />;

  if (isLoading || (!drama && firebaseState?.firebaseId)) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><LogoLoader text="Loading content..." /></div>;
  }

  if (!drama) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Film className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">Content not found</p>
        <button onClick={() => navigate(-1)} className="text-primary text-xs hover:underline">Go back</button>
      </div>
    );
  }

  // Check if content is agent-only
  const isAgentContent = drama.isAgent;
  const agentMarkedDate = drama.agentMarkedAt ? new Date(drama.agentMarkedAt) : null;
  const daysSinceMarked = agentMarkedDate ? Math.floor((Date.now() - agentMarkedDate.getTime()) / (1000 * 60 * 60 * 24)) : 999;
  const isStillOnAgent = isAgentContent && daysSinceMarked < 5;

  const actorList = drama.actors ? drama.actors.split(",").map(a => {
    const trimmed = a.trim();
    const parts = trimmed.split("|");
    return { name: parts[0]?.trim() || "", image: parts[1]?.trim() || "" };
  }).filter(a => a.name) : [];
  const genreList = drama.genre ? drama.genre.split(",").map(g => g.trim()).filter(Boolean) : [];

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) {
      if (!user) toast({ title: "Login required", description: "Please login to comment", variant: "destructive" });
      return;
    }
    try {
      const contentId = firebaseState?.firebaseId || id || "";
      await addComment({
        contentId,
        userId: user.uid,
        userName: user.displayName || user.email || "User",
        text: newComment.trim(),
        createdAt: new Date().toISOString(),
      } as any);
      setNewComment("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleWatchLater = async () => {
    if (!user) {
      toast({ title: "Login required", description: "Please login to save", variant: "destructive" });
      return;
    }
    const contentId = firebaseState?.firebaseId || id || "";
    const existing = watchLaterItems.find(w => w.contentId === contentId);
    if (existing) {
      await deleteWatchLater(existing.id);
      toast({ title: "Removed from Watch Later" });
    } else {
      await addWatchLater({
        userId: user.uid,
        contentId,
        contentTitle: drama.title,
        contentImage: drama.image,
        contentType: "movie",
        createdAt: new Date().toISOString(),
      } as any);
      toast({ title: "Added to Watch Later" });
    }
  };

  const isInWatchLater = watchLaterItems.some(w => w.contentId === (firebaseState?.firebaseId || id));

  const handleShare = async () => {
    const url = window.location.href;
    const isSeries = !!episodes.length || !!drama.episodes;
    const episodeText = currentEpisode ? ` - Episode ${currentEpisode.episodeNumber}` : "";
    const pageTitle = `${drama.title}${episodeText}`;
    const text = `Watch "${pageTitle}" on LUO FILM`;
    
    if (navigator.share) {
      try {
        await navigator.share({ 
          title: pageTitle, 
          text: text, 
          url: url 
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Share it with friends" });
    }
  };

  const handleDirectDownload = () => {
    if (!user) {
      toast({ title: "Login required", description: "Please login to download", variant: "destructive" });
      return;
    }
    if (!hasValidSubscription) {
      toast({ title: "Subscription required", description: "Subscribe to download content", variant: "destructive" });
      setShowSubscribe(true);
      return;
    }
    // Direct browser download using backend proxy (original method)
    const baseName = (drama.title || "Video").replace(/[/\\?%*:|"<>]/g, '-');
    const fileName = (currentEpisode
      ? `${baseName}_E${currentEpisode.episodeNumber}`
      : baseName) + " vj. paul ug (www.luofilm.site).mp4";
    
    const downloadUrl = currentEpisode?.downloadLink || currentEpisode?.streamLink || (drama as any).downloadLink || drama.streamLink;
    if (!downloadUrl) {
      toast({ title: "No download available", variant: "destructive" });
      return;
    }

    const backendUrl = `https://download.mainplatform-nexus.workers.dev/?url=${encodeURIComponent(downloadUrl)}&filename=${encodeURIComponent(fileName)}&download=1`;
    
    setIsDownloading(true);
    toast({ title: "Starting Download", description: `Fetching ${fileName}...` });

    const link = document.createElement("a");
    link.href = backendUrl;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      setIsDownloading(false);
      toast({ title: "Download initiated", description: "Check your browser's download manager." });
    }, 1000);
  };

  const handleCacheDownload = async () => {
    if (!user) {
      toast({ title: "Login required", description: "Please login to cache content", variant: "destructive" });
      return;
    }
    if (!hasValidSubscription) {
      toast({ title: "Subscription required", description: "Subscribe to cache content", variant: "destructive" });
      setShowSubscribe(true);
      return;
    }
    
    // Prefer direct downloadLink (MP4) over streamLink (m3u8) for offline caching
    const videoUrl =
      currentEpisode?.downloadLink || currentEpisode?.streamLink ||
      (drama as any).downloadLink || drama.streamLink;
    if (!videoUrl) {
      toast({ title: "Error", description: "No downloadable video available", variant: "destructive" });
      return;
    }

    // Warn if URL is a streaming-only format that can't truly be cached
    const isStreamOnly = /\.m3u8|rtmp:|rtsp:|manifest/i.test(videoUrl) && !/\.mp4/i.test(videoUrl);
    if (isStreamOnly) {
      toast({
        title: "Stream-Only Content",
        description: "This video uses a live stream format and requires an internet connection to play. The video info has been saved to Downloads for quick access.",
        variant: "default",
      });
      // Still save metadata so it shows in Downloads as a shortcut
      const contentId = firebaseState?.firebaseId || id || "";
      const videoTitle = currentEpisode
        ? `${drama.title} - S${currentEpisode.seasonNumber || 1} EP${currentEpisode.episodeNumber}`
        : drama.title;
      await videoCacheService.addVideo({
        id: contentId,
        title: videoTitle,
        url: videoUrl,
        posterUrl: drama.image,
        type: episodes.length > 0 ? 'series' : 'movie',
        size: 0,
        progress: 100,
        status: 'completed',
        quality: 'original',
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      }).catch(() => {});
      return;
    }

    setIsCaching(true);
    setCacheProgress(0);
    try {
      const contentId = firebaseState?.firebaseId || id || "";
      const videoTitle = currentEpisode 
        ? `${drama.title} - S${currentEpisode.seasonNumber || 1} EP${currentEpisode.episodeNumber}`
        : drama.title;
      
      await downloadVideo(
        contentId,
        videoUrl,
        videoTitle,
        drama.image,
        episodes.length > 0 ? 'series' : 'movie',
        'original',
        (progress) => setCacheProgress(progress)
      );
      toast({ title: "Saved for Offline", description: "Watch anytime from your Downloads — even without internet." });
    } catch (error: any) {
      // If download fails, try saving with proxy URL
      try {
        const proxyUrl = `https://download.mainplatform-nexus.workers.dev/?url=${encodeURIComponent(videoUrl)}&filename=${encodeURIComponent(drama.title + '.mp4')}`;
        const contentId = firebaseState?.firebaseId || id || "";
        await downloadVideo(
          contentId + '_proxy',
          proxyUrl,
          drama.title,
          drama.image,
          episodes.length > 0 ? 'series' : 'movie',
          'original',
          (progress) => setCacheProgress(progress)
        );
        toast({ title: "Saved for Offline", description: "Watch anytime from your Downloads." });
      } catch {
        toast({
          title: "Download Failed",
          description: "This video cannot be saved offline. This may be due to content protection. Try a different video.",
          variant: "destructive"
        });
      }
    } finally {
      setIsCaching(false);
      setCacheProgress(0);
    }
  };

  const handleDownload = handleDirectDownload;

  const handleWatchOnTV = () => {
    toast({ title: "Watch on TV", description: "Open the LUO FILM TV app and scan the QR code or enter the code shown on your TV" });
  };

  const handleWatchOnApp = () => {
    toast({ title: "Install LUO FILM App", description: "Add to home screen from your browser menu for the best experience" });
  };

  // Require subscription to play & download (Admins bypass)
  const isAdmin = userDoc?.role === "admin" || user?.email === "mainplatform.nexus@gmail.com";
  const hasValidSubscription = isAdmin || hasSubscription;
  // Bypass subscription gate when playing from Downloads (user already downloaded it)
  const requiresSubscription = (!user || !hasValidSubscription) && !offlineState?.isOffline;

  return (
    <div className="min-h-screen bg-background">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 px-4 py-2.5 text-muted-foreground hover:text-foreground text-xs transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 min-w-0">
          {/* Video Player */}
          <div className="relative w-full max-h-[480px] aspect-video bg-black">
            {requiresSubscription ? (
              <div className="w-full h-full relative">
                <img src={drama.image} alt={drama.title} className="w-full h-full object-cover blur-sm" />
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                  <Lock className="w-12 h-12 text-primary" />
                  <p className="text-foreground text-sm font-bold">
                    {!user ? "Login & Subscribe to Watch" : "Subscribe to Watch"}
                  </p>
                  <p className="text-muted-foreground text-xs text-center px-8">
                    {isStillOnAgent ? "This is exclusive Agent content. Subscribe to Agent plan to watch." : "Get a subscription plan to enjoy unlimited streaming"}
                  </p>
                  <button onClick={() => { setSubscribeMode(isStillOnAgent ? "agent" : "user"); setShowSubscribe(true); }}
                    className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-xs font-bold hover:bg-primary/90">
                    {isStillOnAgent ? "Get Agent Plan" : "Subscribe Now"}
                  </button>
                </div>
              </div>
            ) : (currentEpisode?.streamLink || drama.streamLink) ? (
              playingOffline && cachedVideoUrl ? (
                <div className="relative">
                  <OfflineVideoPlayerComponent
                    key={`offline-${currentEpisode?.streamLink || drama.streamLink}`}
                    videoId={currentEpisode?.id || drama.firebaseId || id || ""}
                    onlineUrl={currentEpisode?.streamLink || drama.streamLink || ""}
                    posterUrl={drama.image}
                    title={currentEpisode ? `${drama.title} - Episode ${currentEpisode.episodeNumber}` : drama.title}
                    onOfflineDetected={setPlayingOffline}
                  />
                  {/* Auto-cache on WiFi when video plays */}
                  {networkDetection.isWifi() && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground text-center py-1">
                      <Wifi className="w-3 h-3 text-green-500" /> Auto-caching video on WiFi...
                    </div>
                  )}
                </div>
              ) : (
                <ArtPlayerComponent
                  key={currentEpisode?.streamLink || drama.streamLink || ""}
                  src={currentEpisode?.streamLink || drama.streamLink || ""}
                  poster={drama.image}
                  title={currentEpisode ? `${drama.title} - Episode ${currentEpisode.episodeNumber}` : drama.title}
                  onVideoPlay={() => {
                    const videoId = currentEpisode?.id || drama.firebaseId || id;
                    const videoUrl = currentEpisode?.streamLink || drama.streamLink;
                    const videoTitle = currentEpisode ? `${drama.title} - Episode ${currentEpisode.episodeNumber}` : drama.title;
                    if (videoId && videoUrl && networkDetection.isWifi()) {
                      autoCacheService.onVideoPlay(videoId, videoUrl, videoTitle, drama.image);
                    }
                  }}
                />
              )
            ) : (
              <>
                <img src={drama.image} alt={drama.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Play className="w-12 h-12 opacity-40 mx-auto mb-2" />
                    <p className="text-xs">No stream link available</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-1.5 px-4 py-2">
            <button onClick={handleShare} className="flex-1 flex flex-col items-center gap-0.5 bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded py-1.5 hover:from-blue-500/30 hover:to-blue-600/30 transition-all active:scale-95">
              <Share2 className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[7px] font-bold text-blue-400">Share</span>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex-1 flex flex-col items-center gap-0.5 bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded py-1.5 hover:from-purple-500/30 hover:to-purple-600/30 transition-all active:scale-95">
              <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-[7px] font-bold text-purple-400">{comments.length}</span>
            </button>
            <button onClick={handleDownload} disabled={isDownloading} className="flex-1 flex flex-col items-center gap-0.5 bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded py-1.5 hover:from-orange-500/30 hover:to-orange-600/30 transition-all active:scale-95 disabled:opacity-40">
              <Download className={`w-3.5 h-3.5 text-orange-500 ${isDownloading ? "animate-pulse" : ""}`} />
              <span className="text-[7px] font-bold text-orange-400">{isDownloading ? "DL..." : "Download"}</span>
            </button>
            <button onClick={handleCacheDownload} disabled={isCaching} className="flex-1 flex flex-col items-center gap-0.5 bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded py-1.5 hover:from-green-500/30 hover:to-green-600/30 transition-all active:scale-95 disabled:opacity-40 relative">
              {isCaching && (
                <div className="absolute inset-0 rounded overflow-hidden">
                  <div className="h-full bg-green-500/10 transition-all" style={{ width: `${cacheProgress}%` }} />
                </div>
              )}
              <HardDrive className={`w-3.5 h-3.5 text-green-500 relative z-10 ${isCaching ? "animate-pulse" : ""}`} />
              <span className="text-[7px] font-bold text-green-400 relative z-10">{isCaching ? `${cacheProgress}%` : "Download"}</span>
            </button>
          </div>

          {/* Episodes Grid - Mobile only */}
          {(drama.episodes || episodes.length > 0) && (
            <div className="lg:hidden px-4 pb-3">
              <div className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-foreground text-xs font-semibold">Episodes</h3>
                  <span className="text-muted-foreground text-[10px]">{episodes.length} episodes</span>
                </div>
                {episodes.length > 0 ? (
                  <div className="grid grid-cols-8 gap-1.5">
                    {episodes.map((ep) => (
                      <button
                        key={ep.id}
                        onClick={() => { if (ep.streamLink) setCurrentEpisode(ep); }}
                        className={`flex flex-col items-center justify-center rounded-lg border text-[10px] font-medium py-1.5 transition-colors
                          ${currentEpisode?.id === ep.id
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border bg-secondary/40 text-foreground hover:bg-secondary"
                          }`}
                      >
                        {ep.episodeNumber}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-[10px] text-center py-3">No episodes available</p>
                )}
              </div>
            </div>
          )}

          {/* Comments Section */}
          {showComments && (
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-foreground text-sm font-bold mb-3">Comments ({comments.length})</h3>
              <div className="flex gap-2 mb-3">
                <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={user ? "Write a comment..." : "Login to comment"}
                  className="flex-1 h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()} disabled={!user} />
                <button onClick={handleAddComment} disabled={!user || !newComment.trim()} className="h-9 px-3 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-40">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-2 p-2 bg-secondary/30 rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
                      {c.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-[11px] font-medium">{c.userName}</span>
                        <span className="text-muted-foreground text-[9px]">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-muted-foreground text-[11px] mt-0.5">{c.text}</p>
                    </div>
                    {user && c.userId === user.uid && (
                      <button onClick={() => deleteComment(c.id)} className="text-muted-foreground hover:text-destructive p-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {comments.length === 0 && <p className="text-muted-foreground text-xs text-center py-4">No comments yet. Be the first!</p>}
              </div>
            </div>
          )}

          {/* Title & Meta with Badges */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h1 className="text-foreground text-lg font-bold">{drama.title}</h1>
                  {drama.isVip && <Badge18Plus className="!w-10 !h-10" />}
                </div>
                {drama.episodes && <span className="text-muted-foreground text-sm">{drama.episodes}</span>}
              </div>
              <div className="flex items-center gap-2">
                {drama.downloadLink && <DownloadBadge showTooltip={false} />}
                {drama.isHotDrama && <QualityBadge quality="4K" />}
              </div>
            </div>
            {drama.rating && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                  <span className="text-accent text-sm font-bold">{drama.rating}</span>
                </div>
                <span className="text-primary text-xs cursor-pointer hover:underline">Rate now</span>
              </div>
            )}

            {/* Badges */}
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              {drama.rank && <span className="bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">TOP {drama.rank}</span>}
              {drama.isHotDrama && <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">Hot</span>}
              {drama.isOriginal && <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">Original</span>}
              {drama.isVip && <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">VIP</span>}
              {isStillOnAgent && <span className="bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"><Flame className="w-2.5 h-2.5 inline" /> Agent Exclusive</span>}
            </div>

            {/* Genre Tags */}
            {genreList.length > 0 && (
              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                {genreList.map((tag) => (
                  <span key={tag} className="bg-secondary text-secondary-foreground text-[10px] px-2 py-0.5 rounded cursor-pointer hover:bg-muted">{tag}</span>
                ))}
              </div>
            )}

            {/* Description */}
            {drama.description && (
              <div className="mb-4">
                <p className="text-muted-foreground text-xs leading-relaxed">
                  <span className="text-foreground font-medium">Description: </span>
                  {drama.description}
                </p>
              </div>
            )}

            {/* Cast */}
            {actorList.length > 0 && (
              <div className="mb-6">
                <h3 className="text-foreground text-sm font-bold mb-2">Cast</h3>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  {actorList.map((actor, i) => (
                    <div key={i} className="flex flex-col items-center flex-shrink-0 w-16">
                      {actor.image ? (
                        <img src={actor.image} alt={actor.name} className="w-12 h-12 rounded-full object-cover mb-1 border-2 border-border" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-1 border-2 border-border">
                          <span className="text-foreground text-xs font-bold">{actor.name.charAt(0)}</span>
                        </div>
                      )}
                      <span className="text-foreground text-[10px] text-center line-clamp-1">{actor.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended */}
            {recommended.length > 0 && (
              <div>
                <h2 className="text-foreground text-base font-bold mb-3">Recommended</h2>
                <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2">
                  {recommended.map((d) => (
                    <div key={d.firebaseId || d.id} className="flex-shrink-0 w-[120px] cursor-pointer group"
                      onClick={() => navigate(`/watch/${d.firebaseId}`, {
                        state: {
                          firebaseId: d.firebaseId, title: d.title, image: d.image,
                          streamLink: d.streamLink, genre: d.genre, rating: d.rating,
                          description: d.description, downloadLink: d.downloadLink,
                        },
                        replace: false,
                      })}>
                      <div className="relative rounded-md overflow-hidden mb-1.5 aspect-[2/3]">
                        <img src={d.image} alt={d.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <h3 className="text-foreground text-[11px] font-medium line-clamp-1">{d.title}</h3>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Only for series on desktop */}
        {(drama.episodes || episodes.length > 0) && (
          <div className="hidden lg:block w-[300px] border-l border-border flex-shrink-0">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-foreground font-bold text-sm">{drama.title}</h2>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              <button onClick={() => setActiveTab("episodes")}
                className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${activeTab === "episodes" ? "text-foreground border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
                Episodes
              </button>
              <button onClick={() => setActiveTab("highlights")}
                className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${activeTab === "highlights" ? "text-foreground border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
                Highlights
              </button>
            </div>

            {/* Episode Grid */}
            <div className="overflow-y-auto max-h-[400px] scrollbar-thin p-3">
              {episodes.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground text-[11px]">Episodes 1-{episodes.length}</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {episodes.map((ep) => (
                      <button
                        key={ep.id}
                        onClick={() => { if (ep.streamLink) setCurrentEpisode(ep); }}
                        className={`relative flex flex-col items-center justify-center rounded border text-[11px] font-medium py-2 px-1 transition-colors
                          ${currentEpisode?.id === ep.id
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border bg-secondary/40 text-foreground hover:bg-secondary hover:border-muted-foreground/40"
                          }`}
                      >
                        <span>{ep.episodeNumber}</span>
                        {ep.streamLink && <span className="text-[8px] text-muted-foreground mt-0.5">Play</span>}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-muted-foreground text-xs">
                  {drama.episodes ? `${drama.episodes}` : "No episodes available"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <SubscribeModal open={showSubscribe} onClose={() => setShowSubscribe(false)} mode={subscribeMode} />
    </div>
  );
};

export default Watch;
