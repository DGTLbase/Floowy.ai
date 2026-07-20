import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import { seoPrerenderPlugin } from "./scripts/prerender-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    mode !== "development" && seoPrerenderPlugin(),
    VitePWA({
      // Retire the service worker for good. A precaching SW was the root cause of
      // users being stuck on stale bundles after a deploy (old login/routing code
      // kept being served from cache). `selfDestroying` ships a sw.js that, on
      // every existing client, unregisters itself and clears all caches — so no
      // browser can ever hold an old version again. Freshness is then handled by
      // Vercel (short-cached index.html) + content-hashed asset filenames.
      // Trade-off: no offline/installable PWA. Flip this back to a normal config
      // (registerType:'autoUpdate' + workbox) if the PWA is wanted again.
      selfDestroying: true,
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false,
      },
      includeAssets: ['favicon.ico', 'favicon.png', 'robots.txt'],
      manifest: {
        name: 'Floowy.ai - AI Marketing Content Platform',
        short_name: 'Floowy.ai',
        description: 'Create marketing content faster with AI power. Generate campaigns, visuals and concepts instantly.',
        theme_color: '#8B5CF6',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // Always ship the latest version: the new service worker activates
        // immediately (skipWaiting), takes control of open tabs (clientsClaim),
        // and deletes the previous precache so no stale assets linger.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg}'],
        // Don't let the SW serve the app shell for non-app URLs: crawler/static
        // files (sitemap, robots) and any path with a file extension.
        navigateFallbackDenylist: [/^\/~oauth/, /^\/sitemap\.xml$/, /^\/robots\.txt$/, /\/[^/]+\.[^/]+$/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
