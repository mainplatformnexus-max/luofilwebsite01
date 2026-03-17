import { addDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
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
  const snap = await getDocs(collection(db, "activities"));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}
