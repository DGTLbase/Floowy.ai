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
