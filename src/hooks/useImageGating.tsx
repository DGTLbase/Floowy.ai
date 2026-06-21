import { useEffect, useRef, useState } from "react";
import { useSubscriptionStatus } from "./useSubscriptionStatus";
import { applyWatermarkIfFree, applyWatermarkClient } from "@/lib/watermark";

/**
 * useImageGating
 *
 * Centralizes the "free user → watermarked preview + paywall on
 * download/edit" logic shared by every generator page.
 *
 * - `displayUrl(clean)` returns the URL to actually render in the UI.
 *   Paid/admin users always see the clean URL; free users see a
 *   server-side watermarked variant (lazily fetched and cached).
 * - `gate(action)` returns a click handler that runs `action` for paid
 *   users and instead opens the unlock dialog for free users.
 * - `unlockOpen` / `setUnlockOpen` are wired into `<UnlockDialog />`.
 */
export function useImageGating(opts?: { isAdmin?: boolean; urls?: string[] }) {
  const { isPaid } = useSubscriptionStatus();
  const canExport = isPaid || !!opts?.isAdmin;

  const [unlockOpen, setUnlockOpen] = useState(false);
  const [watermarkedUrls, setWatermarkedUrls] = useState<Record<string, string>>({});
  const inFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (canExport) return;
    const urls = opts?.urls ?? [];
    urls.forEach((url) => {
      if (!url) return;
      if (watermarkedUrls[url]) return;
      if (inFlight.current.has(url)) return;
      inFlight.current.add(url);
      // Instant client-side watermark first so the preview is never clean.
      applyWatermarkClient(url).then((wmFast) => {
        if (wmFast) {
          setWatermarkedUrls((prev) =>
            prev[url] ? prev : { ...prev, [url]: wmFast },
          );
        }
      });
      // Then upgrade to the persisted server-side watermark when ready.
      applyWatermarkIfFree(url).then((wm) => {
        if (wm) setWatermarkedUrls((prev) => ({ ...prev, [url]: wm }));
      });
    });
  }, [canExport, opts?.urls, watermarkedUrls]);

  const displayUrl = (clean: string | null | undefined) => {
    if (!clean) return clean ?? "";
    if (canExport) return clean;
    return watermarkedUrls[clean] ?? clean;
  };

  const gate = <T extends (...args: any[]) => any>(action: T) => {
    return ((...args: Parameters<T>) => {
      if (!canExport) {
        setUnlockOpen(true);
        return;
      }
      return action(...args);
    }) as T;
  };

  return {
    canExport,
    isPaid,
    displayUrl,
    gate,
    unlockOpen,
    setUnlockOpen,
  };
}