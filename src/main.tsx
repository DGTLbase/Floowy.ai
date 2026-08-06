import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Aggressively clear all caches and service workers on every load
// to ensure users always see the latest published version
(async () => {
  try {
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));
    }
    // Delete all Cache Storage entries
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch {
    // Silently ignore errors
  }
})();

// Build version check — detects new deploys and forces a hard reload
// so users always get the freshest version of the site.
(() => {
  const VERSION_KEY = "app_build_version";
  const CHECK_INTERVAL_MS = 60_000; // check every 60s while tab is open

  const getCurrentVersion = async (): Promise<string | null> => {
    try {
      // Cache-bust the request itself so we always hit the server
      const res = await fetch(`/index.html?_v=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) return null;
      const html = await res.text();
      // Use the hashed main script tag as a build fingerprint
      const match =
        html.match(/src="(\/assets\/[^"]+\.js)"/) ||
        html.match(/src="(\/src\/main\.tsx[^"]*)"/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  const hardReload = () => {
    try {
      // Preserve scroll-free fresh load
      const url = new URL(window.location.href);
      url.searchParams.set("_r", Date.now().toString());
      window.location.replace(url.toString());
    } catch {
      window.location.reload();
    }
  };

  // Expose reload globally so the dialog can call it
  (window as any).__floowyReload = hardReload;

  const checkForUpdate = async () => {
    const stored = localStorage.getItem(VERSION_KEY);
    const current = await getCurrentVersion();
    if (!current) return;
    if (!stored) {
      localStorage.setItem(VERSION_KEY, current);
      return;
    }
    if (stored !== current) {
      localStorage.setItem(VERSION_KEY, current);
      // Notify the app instead of force-reloading; dialog will prompt user.
      window.dispatchEvent(new CustomEvent("app:new-version"));
    }
  };

  // Initial check shortly after load
  setTimeout(checkForUpdate, 3_000);
  // Periodic checks while the tab is open
  setInterval(checkForUpdate, CHECK_INTERVAL_MS);
  // Re-check when the tab becomes visible again (user returning later)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkForUpdate();
  });
})();

// Recover a stale tab after a deploy.
//
// THE FAILURE THIS FIXES
// Route chunks are content-hashed, so a deploy replaces them. A tab opened
// before the deploy is still running the old build, and the moment the user
// navigates to a lazy route it asks for a chunk filename that no longer exists.
// The result is a spinner that never resolves: Suspense is waiting on an import
// that can never settle, and the user sees the app "loading" forever.
//
// (Until vercel.json excluded /assets/ from the SPA catch-all, this was worse
// still — the missing chunk came back as index.html with a 200, so the browser
// tried to parse HTML as a module rather than reporting a clean 404.)
//
// A dead chunk means the running build is gone, and the only recovery is to
// fetch the new one. Reload once, guarded by a cooldown so a genuinely broken
// deploy degrades to a single failed load instead of a reload loop.
(() => {
  const RELOAD_KEY = "app_chunk_reload_at";
  const COOLDOWN_MS = 30_000;

  const recover = (reason: string) => {
    let last = 0;
    try {
      last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    } catch {
      // Storage blocked (private mode): fall through and allow one reload.
    }
    if (Date.now() - last < COOLDOWN_MS) return;
    try {
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    } catch {
      // Without storage we cannot rate-limit; the visibility guard below still
      // keeps this from firing in a tight loop.
    }
    console.warn(`[floowy] stale build detected (${reason}) — reloading`);
    const fn = (window as unknown as { __floowyReload?: () => void }).__floowyReload;
    if (typeof fn === "function") fn();
    else window.location.reload();
  };

  // Vite fires this when a preloaded route chunk fails to load.
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    recover("chunk preload failed");
  });

  // Direct dynamic imports reject instead, and land here.
  window.addEventListener("unhandledrejection", (event) => {
    const message = String(
      (event.reason as { message?: string })?.message ?? event.reason ?? "",
    );
    if (
      /dynamically imported module|Importing a module script failed|error loading dynamically imported/i
        .test(message)
    ) {
      recover("dynamic import failed");
    }
  });
})();

// Globally disable right-click context menu on all images so watermarked
// previews (and other generated images) can't be saved via the browser
// context menu. Download buttons still work for paid users.
document.addEventListener(
  "contextmenu",
  (e) => {
    const target = e.target as HTMLElement | null;
    if (target && target.tagName === "IMG") {
      e.preventDefault();
    }
  },
  { capture: true },
);

createRoot(document.getElementById("root")!).render(<App />);
