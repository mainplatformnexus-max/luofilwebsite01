import { useState, useEffect, useRef } from "react";
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  moviesService, seriesService, carouselsService, celebritiesService, usersService, adsService,
  liveChannelsService, sportContentService, transactionsService, activitiesService,
  episodesService, commentsService,
  FirestoreMovie, FirestoreSeries, FirestoreCarousel, FirestoreCelebrity, FirestoreAd,
  FirestoreLiveChannel, FirestoreSportContent, FirestoreTransaction, FirestoreActivity,
  FirestoreEpisode, FirestoreComment
} from "@/lib/firestore";
import { getPlanLimits, getOrCreateDeviceId, PlanLimits } from "@/lib/planLimits";

export interface UserSubscription {
  plan: string;
  startDate: string;
  endDate: string;
  status: "active" | "expired";
  tier: number;
  downloadsUsed: number;
  deviceIds: string[];
  limits: PlanLimits;
}

function getPlanTier(plan: string): number {
  const p = (plan || "").toLowerCase();
  if (p.includes("vip")) return 4;
  if (p.includes("ultra")) return 3;
  if (p.includes("premium") || p.includes("pro")) return 2;
  if (p.includes("standard") || p.includes("classic")) return 1;
  return 0;
}

export function useSubscription(userId?: string) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [deviceAllowed, setDeviceAllowed] = useState(true);
  const [loading, setLoading] = useState(true);
  const registeredRef = useRef(false);

  useEffect(() => {
    registeredRef.current = false;
    if (!userId) { setSubscription(null); setLoading(false); return; }

    const ref = doc(db, "users", userId);
    const unsub = onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const sub = data.subscription;
        if (sub && sub.endDate) {
          const isActive = new Date(sub.endDate) > new Date();
          const tier = getPlanTier(sub.plan || "");
          const limits = getPlanLimits(sub.plan || "");
          const downloadsUsed: number = sub.downloadsUsed ?? 0;
          const deviceIds: string[] = sub.deviceIds ?? [];

          setSubscription({
            plan: sub.plan || "",
            startDate: sub.startDate || "",
            endDate: sub.endDate,
            status: isActive ? "active" : "expired",
            tier,
            downloadsUsed,
            deviceIds,
            limits,
          });

          if (isActive && !registeredRef.current) {
            registeredRef.current = true;
            const deviceId = getOrCreateDeviceId();
            if (deviceIds.includes(deviceId)) {
              setDeviceAllowed(true);
            } else if (limits.deviceLimit === -1 || deviceIds.length < limits.deviceLimit) {
              setDeviceAllowed(true);
              try {
                await updateDoc(ref, { "subscription.deviceIds": arrayUnion(deviceId) });
              } catch { /* ignore */ }
            } else {
              setDeviceAllowed(false);
            }
          } else if (!isActive) {
            setDeviceAllowed(true);
          }
        } else {
          setSubscription(null);
          setDeviceAllowed(true);
        }
      } else {
        setSubscription(null);
        setDeviceAllowed(true);
      }
      setLoading(false);
    });
    return unsub;
  }, [userId]);

  const incrementDownload = async () => {
    if (!userId) return;
    const ref = doc(db, "users", userId);
    try {
      const current = subscription?.downloadsUsed ?? 0;
      await updateDoc(ref, { "subscription.downloadsUsed": current + 1 });
    } catch { /* ignore */ }
  };

  const hasActive = !!subscription && subscription.status === "active";
  return { subscription, loading, hasActive, deviceAllowed, incrementDownload };
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<FirestoreTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = transactionsService.subscribe((items) => {
      setTransactions(items.sort((a, b) => (b.createdAt || b.date || "").localeCompare(a.createdAt || a.date || "")));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { transactions, loading };
}

export function useActivities() {
  const [activities, setActivities] = useState<FirestoreActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = activitiesService.subscribe((items) => {
      setActivities(
        items.sort((a, b) => {
          const aMs = (a as any).createdAtMs || (typeof a.createdAt === "string" && a.createdAt.includes("T") ? new Date(a.createdAt).getTime() : 0);
          const bMs = (b as any).createdAtMs || (typeof b.createdAt === "string" && b.createdAt.includes("T") ? new Date(b.createdAt).getTime() : 0);
          return bMs - aMs;
        })
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  return { activities, loading };
}

export function useMovies() {
  const [movies, setMovies] = useState<FirestoreMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = moviesService.subscribe((items) => {
      setMovies(items);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { movies, loading };
}

export function useSeries() {
  const [series, setSeries] = useState<FirestoreSeries[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = seriesService.subscribe((items) => {
      setSeries(items);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { series, loading };
}

export function useCarousels(page?: string) {
  const [carousels, setCarousels] = useState<FirestoreCarousel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = carouselsService.subscribe((items) => {
      const filtered = page ? items.filter((c) => c.page === page) : items;
      setCarousels(filtered.sort((a, b) => (a.order || 0) - (b.order || 0)));
      setLoading(false);
    });
    return unsub;
  }, [page]);

  return { carousels, loading };
}

export function useCelebrities() {
  const [celebrities, setCelebrities] = useState<FirestoreCelebrity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = celebritiesService.subscribe((items) => {
      setCelebrities(items);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { celebrities, loading };
}

export function useAds(page?: string) {
  const [ads, setAds] = useState<FirestoreAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = adsService.subscribe((items) => {
      const filtered = page ? items.filter((a) => a.active && (a.page === page || a.page === "All Pages")) : items;
      setAds(filtered);
      setLoading(false);
    });
    return unsub;
  }, [page]);

  return { ads, loading };
}

export function useUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = usersService.subscribe((items) => {
      setUsers(items);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { users, loading };
}

export function useLiveChannels() {
  const [channels, setChannels] = useState<FirestoreLiveChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = liveChannelsService.subscribe((items) => {
      setChannels(items.sort((a, b) => (a.order || 0) - (b.order || 0)));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { channels, loading };
}

export function useSportContent() {
  const [sports, setSports] = useState<FirestoreSportContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = sportContentService.subscribe((items) => {
      setSports(items.sort((a, b) => (a.order || 0) - (b.order || 0)));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { sports, loading };
}

export function useEpisodes() {
  const [episodes, setEpisodes] = useState<FirestoreEpisode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = episodesService.subscribe((items) => {
      setEpisodes(items.sort((a, b) => {
        if (a.series !== b.series) return a.series.localeCompare(b.series);
        if (a.season !== b.season) return a.season - b.season;
        return a.episode - b.episode;
      }));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { episodes, loading };
}

/**
 * Subscribe to episodes for a specific series.
 * Matches against the episode's `series` field (title or id) and `seriesId` field.
 */
export function useEpisodesBySeries(seriesTitle: string, seriesId: string, seriesSlug: string) {
  const [episodes, setEpisodes] = useState<FirestoreEpisode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!seriesTitle && !seriesId && !seriesSlug) {
      setEpisodes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = episodesService.subscribeEpisodesBySeries(
      seriesTitle,
      seriesId,
      seriesSlug,
      (items) => {
        setEpisodes(items);
        setLoading(false);
      }
    );
    return unsub;
  }, [seriesTitle, seriesId, seriesSlug]);

  return { episodes, loading };
}

export function useComments() {
  const [comments, setComments] = useState<FirestoreComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = commentsService.subscribe((items) => {
      setComments(items.sort((a, b) => (b.createdAt || b.date || "").localeCompare(a.createdAt || a.date || "")));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { comments, loading };
}
