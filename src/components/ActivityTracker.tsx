import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { trackActivity } from "@/lib/activityTracker";

const PAGE_LABELS: Record<string, string> = {
  "/": "Home",
  "/drama": "Drama",
  "/movie": "Movies",
  "/anime": "Anime",
  "/variety-show": "Variety Shows",
  "/ranking": "Rankings",
  "/live-tv": "Live TV",
  "/sport": "Sports",
  "/search": "Search",
  "/profile": "Profile",
};

function getPageLabel(pathname: string): string {
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname];
  if (pathname.startsWith("/play/")) return `Play: ${pathname.replace("/play/", "").replace(/-/g, " ")}`;
  if (pathname.startsWith("/detail/")) return `Detail: ${pathname.replace("/detail/", "").replace(/-/g, " ")}`;
  if (pathname.startsWith("/admin")) return `Admin: ${pathname.replace("/admin/", "").replace(/-/g, " ")}`;
  return pathname;
}

function getClickLabel(el: Element): string | null {
  const interactable = el.closest("button, a, [data-track], [data-testid]");
  if (!interactable) return null;

  const testId = (interactable as HTMLElement).dataset?.testid;
  const track = (interactable as HTMLElement).dataset?.track;
  const text = interactable.textContent?.trim().slice(0, 60) || "";
  const href = (interactable as HTMLAnchorElement).href || "";

  if (track) return track;
  if (testId) return testId.replace(/-/g, " ");
  if (href && !href.includes(window.location.origin)) return `External: ${href.slice(0, 60)}`;
  if (text) return text;
  return null;
}

export default function ActivityTracker() {
  const location = useLocation();
  const { user } = useAuth();
  const lastPath = useRef<string>("");

  const userRef = useRef<{ id: string; name: string } | null>(null);
  useEffect(() => {
    userRef.current = user ? { id: user.id, name: user.name || user.email || "User" } : null;
  }, [user]);

  useEffect(() => {
    const path = location.pathname;
    if (path === lastPath.current) return;
    lastPath.current = path;

    const label = getPageLabel(path);
    trackActivity({
      userId: userRef.current?.id,
      user: userRef.current?.name || "Guest",
      action: "Browsed",
      target: label,
      page: path,
    });
  }, [location.pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element;
      const label = getClickLabel(target);
      if (!label) return;

      const ignoredPatterns = /profile|avatar|logo|nav|menu|sidebar|modal-close|sr-only/i;
      if (ignoredPatterns.test(label)) return;

      trackActivity({
        userId: userRef.current?.id,
        user: userRef.current?.name || "Guest",
        action: "Clicked",
        target: label,
        page: window.location.pathname,
      });
    };

    document.addEventListener("click", handleClick, { capture: true, passive: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  return null;
}
