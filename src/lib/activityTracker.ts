import { addDoc, collection, getDocs, deleteDoc, writeBatch, query, limit } from "firebase/firestore";
import { db } from "./firebase";

function getDevice(): string {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua) && !/tablet|ipad/i.test(ua)) return "Mobile";
  if (/tablet|ipad/i.test(ua)) return "Tablet";
  return "Desktop";
}

export interface TrackPayload {
  userId?: string;
  user?: string;
  action: string;
  target: string;
  page?: string;
  extra?: string;
}

export async function trackActivity(payload: TrackPayload): Promise<void> {
  try {
    const now = new Date();
    await addDoc(collection(db, "activities"), {
      userId: payload.userId || "",
      user: payload.user || "Guest",
      action: payload.action,
      target: payload.target,
      page: payload.page || window.location.pathname,
      extra: payload.extra || "",
      device: getDevice(),
      createdAt: now.toISOString(),
      createdAtMs: now.getTime(),
    });
  } catch {
    // silently fail — never block UX
  }
}

export async function clearAllActivities(): Promise<void> {
  const BATCH_SIZE = 400;
  while (true) {
    const snap = await getDocs(query(collection(db, "activities"), limit(BATCH_SIZE)));
    if (snap.empty) break;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    if (snap.docs.length < BATCH_SIZE) break;
  }
}
