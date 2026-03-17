import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, orderBy, where, onSnapshot, serverTimestamp, setDoc,
  Timestamp, limit as firestoreLimit
} from "firebase/firestore";
import { db } from "./firebase";

// ============ TYPES ============
// Unified type that covers both Lovable (name/posterUrl/streamLink) and Replit field names
export interface FirestoreMovie {
  id?: string;
  // display fields (normalized from either format)
  title: string;
  slug: string;
  poster: string;
  rating: string;
  ageRating: string;
  year: string;
  country: string;
  genre: string[];
  description: string;
  section: string;
  actors: string[];
  duration: string;
  isVip: boolean;
  embedUrl?: string;
  streamLinks: { quality: string; url: string; fileSize?: string }[];
  // original Lovable field names preserved for round-trip compatibility
  name?: string;
  posterUrl?: string;
  streamLink?: string;
  downloadLink?: string;
  isHotDrama?: boolean;
  isOriginal?: boolean;
  isAgent?: boolean;
  agentMarkedAt?: string | null;
  categories?: string[];
  displayOrder?: number;
  isPopular?: boolean;
  isComingSoon?: boolean;
  isTopTen?: boolean;
  createdAt?: any;
}

export interface FirestoreSeries {
  id?: string;
  title: string;
  slug: string;
  poster: string;
  rating: string;
  year: string;
  seasons: number;
  episodes: string;
  description: string;
  genre: string[];
  actors: string[];
  section: string;
  country: string;
  isVip: boolean;
  gradient?: string;
  streamLinks?: { quality: string; url: string; fileSize?: string }[];
  // original Lovable field names
  name?: string;
  posterUrl?: string;
  streamLink?: string;
  downloadLink?: string;
  isHotDrama?: boolean;
  isOriginal?: boolean;
  isAgent?: boolean;
  agentMarkedAt?: string | null;
  categories?: string[];
  displayOrder?: number;
  isPopular?: boolean;
  isComingSoon?: boolean;
  isTopTen?: boolean;
  createdAt?: any;
}

export interface FirestoreCarousel {
  id?: string;
  image: string;
  title: string;
  linkTo: string;
  page: string;
  order: number;
  isActive?: boolean;
  description?: string;
  rating?: string;
  year?: string;
  tags?: string[];
  createdAt?: any;
}

export interface FirestoreCelebrity {
  id?: string;
  name: string;
  photo: string;
  bio?: string;
  nationality?: string;
  birthYear?: string;
  knownFor?: string[];
  createdAt?: any;
}

export interface FirestoreEpisode {
  id?: string;
  // --- New format fields ---
  seriesId?: string;       // Firestore doc ID of the series
  seriesName?: string;     // series display name
  name?: string;           // episode display name
  seasonNumber?: number;
  episodeNumber?: number;
  streamLink?: string;     // single stream URL
  downloadLink?: string;   // dedicated download URL
  isAgent?: boolean;
  agentMarkedAt?: string | null;
  // --- Legacy / backward-compat fields ---
  series: string;          // series title (may be empty for new format)
  season: number;
  episode: number;
  title: string;
  thumbnail: string;
  duration: string;
  streamLinks: { quality: string; url: string; fileSize?: string }[];
  createdAt?: any;
}

export interface FirestoreComment {
  id?: string;
  user: string;
  userId?: string;
  content: string;
  contentTitle: string;
  contentType: "movie" | "series";
  contentId?: string;
  episode?: string;
  rating?: number;
  date?: string;
  createdAt?: any;
}

// ============ HELPERS ============
const toSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const toArray = (val: any): string[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string" && val.trim()) return val.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
};

const safeSlug = (data: any): string => {
  // prefer stored slug, then generate from title or name, fallback to doc id
  if (data.slug) {
    const s = toSlug(data.slug);
    if (s) return s;
  }
  const nameOrTitle = data.title || data.name || "";
  const generated = toSlug(nameOrTitle);
  return generated || data.id || "";
};

const toStreamLinks = (data: any): { quality: string; url: string }[] => {
  // already an array (Replit format)
  if (Array.isArray(data.streamLinks) && data.streamLinks.length > 0) {
    return data.streamLinks;
  }
  // single string (Lovable format)
  if (typeof data.streamLink === "string" && data.streamLink.trim()) {
    return [{ quality: "HD", url: data.streamLink.trim() }];
  }
  return [];
};

const normalizeMovie = (data: any): FirestoreMovie => {
  const title = data.title || data.name || "";
  const poster = data.poster || data.posterUrl || "";
  return {
    ...data,
    title,
    poster,
    slug: safeSlug({ ...data, title }),
    genre: toArray(data.genre),
    actors: toArray(data.actors),
    streamLinks: toStreamLinks(data),
    embedUrl: data.embedUrl || "",
    ageRating: data.ageRating || "13+",
    section: data.section || "",
    country: data.country || "",
    duration: data.duration || "",
    isVip: data.isVip || false,
    rating: String(data.rating || ""),
    year: String(data.year || ""),
    // preserve original fields
    name: data.name,
    posterUrl: data.posterUrl,
    streamLink: data.streamLink,
    downloadLink: data.downloadLink,
    isHotDrama: data.isHotDrama || false,
    isOriginal: data.isOriginal || false,
    isAgent: data.isAgent || false,
    agentMarkedAt: data.agentMarkedAt || null,
    categories: Array.isArray(data.categories) ? data.categories : [],
    displayOrder: data.displayOrder || 0,
    isPopular: data.isPopular || false,
    isComingSoon: data.isComingSoon || false,
    isTopTen: data.isTopTen || false,
  };
};

const normalizeSeries = (data: any): FirestoreSeries => {
  const title = data.title || data.name || "";
  const poster = data.poster || data.posterUrl || "";
  return {
    ...data,
    title,
    poster,
    slug: safeSlug({ ...data, title }),
    genre: toArray(data.genre),
    actors: toArray(data.actors),
    streamLinks: toStreamLinks(data),
    ageRating: data.ageRating || "13+",
    section: data.section || "",
    country: data.country || "",
    episodes: data.episodes || "",
    seasons: data.seasons || 1,
    isVip: data.isVip || false,
    rating: String(data.rating || ""),
    year: String(data.year || ""),
    // preserve original fields
    name: data.name,
    posterUrl: data.posterUrl,
    streamLink: data.streamLink,
    downloadLink: data.downloadLink,
    isHotDrama: data.isHotDrama || false,
    isOriginal: data.isOriginal || false,
    isAgent: data.isAgent || false,
    agentMarkedAt: data.agentMarkedAt || null,
    categories: Array.isArray(data.categories) ? data.categories : [],
    displayOrder: data.displayOrder || 0,
    isPopular: data.isPopular || false,
    isComingSoon: data.isComingSoon || false,
    isTopTen: data.isTopTen || false,
  };
};

// ============ GENERIC CRUD ============
async function getAll<T>(collectionName: string): Promise<T[]> {
  const snap = await getDocs(collection(db, collectionName));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
}

async function getById<T>(collectionName: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(db, collectionName, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as T;
}

function stripUndefined(obj: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (v !== null && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
      clean[k] = stripUndefined(v);
    } else if (Array.isArray(v)) {
      clean[k] = v.map((item) =>
        item !== null && typeof item === "object" ? stripUndefined(item) : item
      );
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

async function create<T extends Record<string, any>>(collectionName: string, data: T): Promise<string> {
  const ref = await addDoc(collection(db, collectionName), stripUndefined({
    ...data,
    createdAt: new Date().toISOString().split("T")[0],
  }));
  return ref.id;
}

async function update(collectionName: string, id: string, data: Record<string, any>): Promise<void> {
  const { id: _id, ...rest } = data as any;
  await updateDoc(doc(db, collectionName, id), stripUndefined(rest));
}

async function remove(collectionName: string, id: string): Promise<void> {
  await deleteDoc(doc(db, collectionName, id));
}

function subscribe<T>(collectionName: string, callback: (items: T[]) => void): () => void {
  return onSnapshot(collection(db, collectionName), (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
    callback(items);
  });
}

// ============ MOVIES ============
export const moviesService = {
  getAll: async () => {
    const snap = await getDocs(collection(db, "movies"));
    return snap.docs.map((d) => normalizeMovie({ id: d.id, ...d.data() }));
  },
  getById: async (id: string) => {
    const snap = await getDoc(doc(db, "movies", id));
    if (!snap.exists()) return null;
    return normalizeMovie({ id: snap.id, ...snap.data() });
  },
  create: async (data: Omit<FirestoreMovie, "id">) => {
    const titleSlug = toSlug(data.slug || data.title || data.name || "");
    const id = await create("movies", { ...data, slug: titleSlug });
    if (!titleSlug) await update("movies", id, { slug: id });
    return id;
  },
  update: (id: string, data: Partial<FirestoreMovie>) => update("movies", id, data),
  delete: (id: string) => remove("movies", id),
  subscribe: (cb: (items: FirestoreMovie[]) => void) =>
    onSnapshot(collection(db, "movies"), (snap) => {
      cb(snap.docs.map((d) => normalizeMovie({ id: d.id, ...d.data() })));
    }),
};

// ============ SERIES ============
export const seriesService = {
  getAll: async () => {
    const snap = await getDocs(collection(db, "series"));
    return snap.docs.map((d) => normalizeSeries({ id: d.id, ...d.data() }));
  },
  getById: async (id: string) => {
    const snap = await getDoc(doc(db, "series", id));
    if (!snap.exists()) return null;
    return normalizeSeries({ id: snap.id, ...snap.data() });
  },
  create: async (data: Omit<FirestoreSeries, "id">) => {
    const titleSlug = toSlug(data.slug || data.title || data.name || "");
    const id = await create("series", { ...data, slug: titleSlug });
    if (!titleSlug) await update("series", id, { slug: id });
    return id;
  },
  update: (id: string, data: Partial<FirestoreSeries>) => update("series", id, data),
  delete: (id: string) => remove("series", id),
  subscribe: (cb: (items: FirestoreSeries[]) => void) =>
    onSnapshot(collection(db, "series"), (snap) => {
      cb(snap.docs.map((d) => normalizeSeries({ id: d.id, ...d.data() })));
    }),
};

// ============ CAROUSELS ============
export const carouselsService = {
  getAll: () => getAll<FirestoreCarousel>("carousels"),
  getByPage: async (page: string) => {
    const snap = await getDocs(collection(db, "carousels"));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as FirestoreCarousel))
      .filter((c) => !c.page || c.page === page || c.isActive)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  },
  create: (data: Omit<FirestoreCarousel, "id">) => create("carousels", data),
  update: (id: string, data: Partial<FirestoreCarousel>) => update("carousels", id, data),
  delete: (id: string) => remove("carousels", id),
  subscribe: (cb: (items: FirestoreCarousel[]) => void) => subscribe<FirestoreCarousel>("carousels", cb),
};

// ============ CELEBRITIES ============
export const celebritiesService = {
  getAll: () => getAll<FirestoreCelebrity>("celebrities"),
  create: (data: Omit<FirestoreCelebrity, "id">) => create("celebrities", data),
  update: (id: string, data: Partial<FirestoreCelebrity>) => update("celebrities", id, data),
  delete: (id: string) => remove("celebrities", id),
  subscribe: (cb: (items: FirestoreCelebrity[]) => void) => subscribe<FirestoreCelebrity>("celebrities", cb),
};

// ============ EPISODES ============
export const episodesService = {
  getAll: () => getAll<FirestoreEpisode>("episodes"),
  create: (data: Omit<FirestoreEpisode, "id">) => create("episodes", data),
  update: (id: string, data: Partial<FirestoreEpisode>) => update("episodes", id, data),
  delete: (id: string) => remove("episodes", id),
  subscribe: (cb: (items: FirestoreEpisode[]) => void) => subscribe<FirestoreEpisode>("episodes", cb),
  /**
   * Real-time listener that returns only episodes belonging to a given series.
   * Matches against: series title, series id, seriesId field, or series slug.
   */
  subscribeEpisodesBySeries: (
    seriesTitle: string,
    seriesId: string,
    seriesSlug: string,
    cb: (items: FirestoreEpisode[]) => void
  ): (() => void) => {
    const norm = (s: string) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
    const nt = norm(seriesTitle);
    const ni = norm(seriesId);
    const ns = norm(seriesSlug);
    return onSnapshot(collection(db, "episodes"), (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as FirestoreEpisode))
        .filter((e) => {
          if (!e.series && !e.seriesId && !e.seriesName) return false;
          const es = norm(e.series || "");
          const esName = norm(e.seriesName || "");
          const eid = norm(e.seriesId || "");
          return (
            (nt && (es === nt || esName === nt)) ||
            (ni && (es === ni || eid === ni || e.seriesId === seriesId)) ||
            (ns && (es === ns || esName === ns))
          );
        })
        .sort((a, b) => {
          const sa = a.seasonNumber ?? a.season ?? 0;
          const sb = b.seasonNumber ?? b.season ?? 0;
          if (sa !== sb) return sa - sb;
          const ea = a.episodeNumber ?? a.episode ?? 0;
          const eb = b.episodeNumber ?? b.episode ?? 0;
          return ea - eb;
        });
      cb(items);
    });
  },
};

// ============ COMMENTS ============
export const commentsService = {
  getAll: () => getAll<FirestoreComment>("comments"),
  create: (data: Omit<FirestoreComment, "id">) => create("comments", { ...data, date: new Date().toISOString().split("T")[0] }),
  delete: (id: string) => remove("comments", id),
  subscribe: (cb: (items: FirestoreComment[]) => void) => subscribe<FirestoreComment>("comments", cb),
};

// ============ ADS ============
export interface FirestoreAd {
  id?: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  active: boolean;
  page: string;
  createdAt?: any;
}

export const adsService = {
  getAll: () => getAll<FirestoreAd>("ads"),
  create: (data: Omit<FirestoreAd, "id">) => create("ads", data),
  update: (id: string, data: Partial<FirestoreAd>) => update("ads", id, data),
  delete: (id: string) => remove("ads", id),
  subscribe: (cb: (items: FirestoreAd[]) => void) => subscribe<FirestoreAd>("ads", cb),
};

// ============ USERS (admin) ============
export const usersService = {
  getAll: () => getAll<any>("users"),
  getById: (id: string) => getById<any>("users", id),
  update: (id: string, data: any) => update("users", id, data),
  delete: (id: string) => remove("users", id),
  subscribe: (cb: (items: any[]) => void) => subscribe<any>("users", cb),
};

// ============ TRANSACTIONS (Wallet) ============
export interface FirestoreTransaction {
  id?: string;
  type: "income" | "withdrawal";
  amount: number;
  description: string;
  method: string;
  status: "completed" | "pending" | "failed";
  userId?: string;
  userName?: string;
  plan?: string;
  date?: string;
  createdAt?: any;
}

export const transactionsService = {
  getAll: () => getAll<FirestoreTransaction>("transactions"),
  create: (data: Omit<FirestoreTransaction, "id">) => create("transactions", { ...data, date: new Date().toISOString().split("T")[0] }),
  update: (id: string, data: Partial<FirestoreTransaction>) => update("transactions", id, data),
  delete: (id: string) => remove("transactions", id),
  subscribe: (cb: (items: FirestoreTransaction[]) => void) => subscribe<FirestoreTransaction>("transactions", cb),
};

// ============ ACTIVITIES ============
export interface FirestoreActivity {
  id?: string;
  userId?: string;
  user: string;
  action: string;
  target: string;
  device?: string;
  ip?: string;
  createdAt?: any;
}

export const activitiesService = {
  getAll: () => getAll<FirestoreActivity>("activities"),
  create: (data: Omit<FirestoreActivity, "id">) => create("activities", data),
  subscribe: (cb: (items: FirestoreActivity[]) => void) => subscribe<FirestoreActivity>("activities", cb),
};

// ============ LIVE TV CHANNELS ============
export interface FirestoreLiveChannel {
  id?: string;
  title: string;
  slug: string;
  thumbnail: string;
  streamUrl: string;
  category: string;
  country: string;
  isLive: boolean;
  isVip: boolean;
  order: number;
  description?: string;
  createdAt?: any;
}

export const liveChannelsService = {
  getAll: () => getAll<FirestoreLiveChannel>("liveChannels"),
  create: async (data: Omit<FirestoreLiveChannel, "id">) => {
    const slug = toSlug(data.slug || data.title);
    return create("liveChannels", { ...data, slug });
  },
  update: (id: string, data: Partial<FirestoreLiveChannel>) => update("liveChannels", id, data),
  delete: (id: string) => remove("liveChannels", id),
  subscribe: (cb: (items: FirestoreLiveChannel[]) => void) => subscribe<FirestoreLiveChannel>("liveChannels", cb),
};

// ============ SPORT CONTENT ============
export interface FirestoreSportContent {
  id?: string;
  title: string;
  slug: string;
  thumbnail: string;
  streamUrl: string;
  category: string;
  country: string;
  isLive: boolean;
  isVip: boolean;
  order: number;
  description?: string;
  tags?: string[];
  createdAt?: any;
}

export const sportContentService = {
  getAll: () => getAll<FirestoreSportContent>("sportContent"),
  create: async (data: Omit<FirestoreSportContent, "id">) => {
    const slug = toSlug(data.slug || data.title);
    return create("sportContent", { ...data, slug });
  },
  update: (id: string, data: Partial<FirestoreSportContent>) => update("sportContent", id, data),
  delete: (id: string) => remove("sportContent", id),
  subscribe: (cb: (items: FirestoreSportContent[]) => void) => subscribe<FirestoreSportContent>("sportContent", cb),
};

// ============ CONTENT (combined for frontend) ============
export const contentService = {
  getAllContent: async () => {
    const [movies, series] = await Promise.all([
      moviesService.getAll(),
      seriesService.getAll(),
    ]);
    return { movies, series };
  },
  getBySlug: async (slug: string) => {
    const movies = await moviesService.getAll();
    const movie = movies.find((m) => m.slug === slug);
    if (movie) return { type: "movie" as const, data: movie };

    const series = await seriesService.getAll();
    const show = series.find((s) => s.slug === slug);
    if (show) return { type: "series" as const, data: show };

    return null;
  },
};
