export interface PlanLimits {
  downloadLimit: number;
  maxQuality: "720p" | "1080p" | "2K" | "4K";
  deviceLimit: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  "1 Day Standard":  { downloadLimit: 5,   maxQuality: "720p",  deviceLimit: 1  },
  "1 Day Pro":       { downloadLimit: -1,  maxQuality: "1080p", deviceLimit: 2  },
  "3 Day Classic":   { downloadLimit: 10,  maxQuality: "720p",  deviceLimit: 1  },
  "3 Day Premium":   { downloadLimit: -1,  maxQuality: "1080p", deviceLimit: 2  },
  "1 Week Standard": { downloadLimit: 10,  maxQuality: "720p",  deviceLimit: 1  },
  "1 Week Premium":  { downloadLimit: -1,  maxQuality: "2K",    deviceLimit: 2  },
  "1 Month Premium": { downloadLimit: -1,  maxQuality: "1080p", deviceLimit: 4  },
  "1 Month Ultra":   { downloadLimit: -1,  maxQuality: "4K",    deviceLimit: 4  },
  "VIP Monthly":     { downloadLimit: -1,  maxQuality: "4K",    deviceLimit: -1 },
};

export function getPlanLimits(planName: string): PlanLimits {
  if (!planName) return { downloadLimit: 0, maxQuality: "720p", deviceLimit: 0 };
  return PLAN_LIMITS[planName] || { downloadLimit: 0, maxQuality: "720p", deviceLimit: 0 };
}

const QUALITY_RANK: Record<string, number> = {
  "480p": 0, "SD": 0,
  "720p": 1, "HD": 1,
  "1080p": 2, "FHD": 2,
  "2K": 3, "QHD": 3,
  "4K": 4, "UHD": 4,
};

function qualityRank(q: string): number {
  const u = q.toUpperCase();
  if (u.includes("4K") || u.includes("UHD")) return 4;
  if (u.includes("2K") || u.includes("QHD")) return 3;
  if (u.includes("1080") || u.includes("FHD")) return 2;
  if (u.includes("720") || u.includes("HD")) return 1;
  if (u.includes("480") || u.includes("SD")) return 0;
  return 1;
}

export function filterLinksByQuality(
  links: { quality: string; url: string; fileSize?: string }[],
  maxQuality: "720p" | "1080p" | "2K" | "4K"
): { quality: string; url: string; fileSize?: string }[] {
  const maxRank = QUALITY_RANK[maxQuality] ?? 1;
  return links.filter((l) => qualityRank(l.quality) <= maxRank);
}

export function isQualityLocked(
  quality: string,
  maxQuality: "720p" | "1080p" | "2K" | "4K"
): boolean {
  const maxRank = QUALITY_RANK[maxQuality] ?? 1;
  return qualityRank(quality) > maxRank;
}

export function getOrCreateDeviceId(): string {
  const KEY = "luofilm_device_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(KEY, id);
  }
  return id;
}
