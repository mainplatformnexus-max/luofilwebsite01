import { Download, Lock, Crown, Loader2, CheckCircle2, AlertCircle, FileVideo } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { UserSubscription } from "@/hooks/useFirestore";
import { useState } from "react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  streamLinks: { quality: string; url: string; fileSize?: string }[];
  subscription: UserSubscription | null;
  onUpgrade: () => void;
  isAdmin?: boolean;
}

type DownloadState = "idle" | "downloading" | "success" | "error";

const WORKER = "https://download.mainplatform-nexus.workers.dev/";

function getRawUrl(url: string): string {
  try {
    if (url.startsWith(WORKER)) {
      const inner = new URL(url).searchParams.get("url");
      if (inner) return inner;
    }
  } catch { /* ignore */ }
  return url;
}

const downloadVideoFile = (
  url: string,
  fileName: string,
  onStart: () => void,
  onEnd: () => void,
  _onError: (msg: string) => void,
  onSuccess: (name: string) => void
) => {
  onStart();
  const rawUrl = getRawUrl(url);
  const backendUrl = `${WORKER}?url=${encodeURIComponent(rawUrl)}&filename=${encodeURIComponent(fileName)}&download=1`;
  const link = document.createElement("a");
  link.href = backendUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  onSuccess(fileName);
  onEnd();
};

export default function DownloadModal({ open, onOpenChange, title, streamLinks, subscription, onUpgrade, isAdmin }: Props) {
  const userTier = subscription?.tier ?? 0;
  const hasAny = isAdmin || userTier >= 1;

  const [states, setStates] = useState<Record<string, DownloadState>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  const setLinkState = (url: string, state: DownloadState, msg = "") => {
    setStates((prev) => ({ ...prev, [url]: state }));
    setMessages((prev) => ({ ...prev, [url]: msg }));
  };

  const handleDownload = (url: string, quality: string) => {
    const ext = url.includes(".m3u8") ? ".m3u8" : url.match(/\.(mp4|mkv|webm|mov)/i)?.[1] ? `.${url.match(/\.(mp4|mkv|webm|mov)/i)![1]}` : ".mp4";
    const fileName = `${title} vj. paul ug (www.luofilm.site)${ext}`;

    downloadVideoFile(
      url,
      fileName,
      () => setLinkState(url, "downloading"),
      () => {},
      (msg) => setLinkState(url, "error", msg),
      () => setLinkState(url, "success")
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0c0c14] border border-white/10 text-white max-w-md">
        <DialogTitle className="flex items-center gap-2 text-lg font-bold">
          <Download className="w-5 h-5 text-amber-400" /> Download
        </DialogTitle>
        <p className="text-xs text-white/50 -mt-2 line-clamp-1">{title}</p>

        {!hasAny ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
              <Crown className="w-7 h-7 text-amber-400" />
            </div>
            <p className="font-semibold">Subscription Required</p>
            <p className="text-sm text-white/50">You need an active subscription to download content.</p>
            <button
              onClick={onUpgrade}
              className="px-6 py-2.5 bg-amber-500 text-black font-bold rounded-lg text-sm hover:bg-amber-400"
            >
              Subscribe Now
            </button>
          </div>
        ) : streamLinks.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <FileVideo className="w-10 h-10 mx-auto text-white/20" />
            <p className="text-sm text-white/40">No download sources available for this content.</p>
          </div>
        ) : (
          <div className="space-y-2 mt-1">
            {streamLinks.map((link, i) => {
              const state = states[link.url] || "idle";
              const errMsg = messages[link.url] || "";
              const isDownloading = state === "downloading";

              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileVideo className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{link.quality}</p>
                      {link.fileSize && (
                        <p className="text-xs text-white/40">{link.fileSize}</p>
                      )}
                      {state === "success" && (
                        <p className="text-xs text-green-400 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Download started
                        </p>
                      )}
                      {state === "error" && (
                        <p className="text-xs text-red-400 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3" /> {errMsg || "Download failed"}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    data-testid={`download-btn-${i}`}
                    onClick={() => handleDownload(link.url, link.quality)}
                    disabled={isDownloading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed shrink-0 ml-3"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Loading…</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}

            {subscription && (
              <p className="text-[10px] text-white/30 text-center pt-1">
                Your plan: <span className="text-amber-400">{subscription.plan}</span>
                {subscription.endDate && ` · Expires: ${subscription.endDate}`}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
