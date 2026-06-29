import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { legalDocs, legalToHtml } from "../src/content/legal";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const staticRoutes = JSON.parse(
  readFileSync(join(__dirname, "seo-routes.json"), "utf-8"),
);

const SITE_URL = "https://floowy.ai";
const DEFAULT_OG = "https://storage.googleapis.com/gpt-engineer-file-uploads/jiw4ULwE27QKeFTbZfvzJa8DA213/social-images/social-1764335311016-Screenshot 2025-11-28 210811.png";

const SUPABASE_URL = "https://wjihknoszyjwmpotsnda.supabase.co";
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaWhrbm9zenlqd21wb3RzbmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzQyNTYsImV4cCI6MjA5NzAxMDI1Nn0.s8HRjZxX8OBKwrJ4d2fpAiryKz8n27AlxQGV3hkUHjs";

type Breadcrumb = { name: string; url: string };
type RouteMeta = {
  path: string;
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  breadcrumbs?: Breadcrumb[];
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function organizationLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Floowy",
    alternateName: "Floowy.ai",
    url: SITE_URL,
    logo: `${SITE_URL}/floowy-logo.png`,
    description:
      "Create marketing content faster with AI power. Generate campaigns, visuals and concepts instantly and scale your brand's creative production.",
    sameAs: [
      "https://www.linkedin.com/company/floowy-ai",
      "https://twitter.com/floowy_ai",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      url: `${SITE_URL}/contact`,
    },
  });
}

function breadcrumbLd(items: Breadcrumb[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  });
}

function articleLd(data: { headline: string; description: string; datePublished?: string; dateModified?: string; image?: string; url: string }): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.headline,
    description: data.description,
    image: data.image ? [data.image] : undefined,
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
    mainEntityOfPage: data.url,
    author: { "@type": "Organization", name: "Floowy" },
    publisher: {
      "@type": "Organization",
      name: "Floowy",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/floowy-logo.png` },
    },
  });
}

function bakeHead(html: string, meta: RouteMeta, extraJsonLd: string[] = []): string {
  const canonical = `${SITE_URL}${meta.path === "/" ? "" : meta.path}`;
  const ogImage = meta.ogImage || DEFAULT_OG;
  const title = escapeHtml(meta.title);
  const desc = escapeHtml(meta.description);
  const url = escapeHtml(canonical);
  const og = escapeHtml(ogImage);

  // Replace title
  let out = html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title data-rh="true">${title}</title>`);
  // Replace description
  out = out.replace(
    /<meta\s+name="description"[^>]*>/i,
    `<meta name="description" content="${desc}" data-rh="true">`,
  );
  // Replace canonical
  out = out.replace(
    /<link\s+rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${url}" data-rh="true">`,
  );

  // Inject OG/Twitter + JSON-LD before </head>
  const injection = [
    meta.keywords ? `<meta name="keywords" content="${escapeHtml(meta.keywords)}">` : "",
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${desc}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${og}">`,
    `<meta property="og:type" content="website">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${desc}">`,
    `<meta name="twitter:image" content="${og}">`,
    `<script type="application/ld+json">${organizationLd()}</script>`,
    meta.breadcrumbs && meta.breadcrumbs.length > 0
      ? `<script type="application/ld+json">${breadcrumbLd(meta.breadcrumbs)}</script>`
      : "",
    ...extraJsonLd.map((s) => `<script type="application/ld+json">${s}</script>`),
  ]
    .filter(Boolean)
    .join("\n    ");

  // Strip any existing OG / twitter tags so we don't duplicate
  out = out.replace(/\s*<meta\s+(?:property|name)="(?:og:[^"]+|twitter:[^"]+)"[^>]*>/gi, "");

  out = out.replace(/<\/head>/i, `    ${injection}\n  </head>`);
  return out;
}

/**
 * Inject crawlable body content into the empty SPA shell for a route. The app
 * uses createRoot().render() (not hydration), so React replaces #root's children
 * on load — users see the normal page, while no-JS crawlers (e.g. Google's OAuth
 * verifier) read the baked-in content.
 */
function bakeBody(html: string, bodyHtml: string): string {
  return html.replace(
    /<div id="root">\s*<\/div>/i,
    `<div id="root">${bodyHtml}</div>`,
  );
}

function writeRoute(distDir: string, routePath: string, html: string) {
  const cleanPath = routePath.replace(/^\//, "");
  const filePath = cleanPath === "" ? join(distDir, "index.html") : join(distDir, cleanPath, "index.html");
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, html, "utf-8");
}

function faqLd(items: Array<{ question?: string; answer?: string; q?: string; a?: string }>): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items
      .map((it) => ({ q: it.question ?? it.q, a: it.answer ?? it.a }))
      .filter((it) => it.q && it.a)
      .map((it) => ({
        "@type": "Question",
        name: it.q,
        acceptedAnswer: { "@type": "Answer", text: it.a },
      })),
  });
}

function writeSitemap(distDir: string, urls: Array<{ path: string; lastmod?: string }>): void {
  // De-dupe by path and build absolute, valid loc URLs.
  const seen = new Set<string>();
  const entries = urls
    .filter((u) => (seen.has(u.path) ? false : (seen.add(u.path), true)))
    .map((u) => {
      const loc = `${SITE_URL}${u.path === "/" ? "" : u.path}`;
      const lastmod = u.lastmod ? `\n    <lastmod>${new Date(u.lastmod).toISOString().slice(0, 10)}</lastmod>` : "";
      return `  <url>\n    <loc>${escapeHtml(loc)}</loc>${lastmod}\n  </url>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
  writeFileSync(join(distDir, "sitemap.xml"), xml, "utf-8");
  console.log(`[prerender] sitemap.xml written with ${seen.size} URLs`);
}

async function fetchSlugs(table: "blog_posts" | "cases" | "industry_pages"): Promise<Array<Record<string, any>>> {
  try {
    const fields =
      table === "blog_posts"
        ? "slug,title,meta_title,meta_description,excerpt,cover_image_url,published_at,updated_at"
        : table === "cases"
        ? "slug,client_name,subtitle,meta_title,meta_description,hero_image_url,og_image_url,published_at,updated_at"
        : "slug,industry_name,meta_title,meta_description,meta_keywords,hero_image_url,og_image_url,faq_items,published_at,updated_at";
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=${fields}&is_published=eq.true`,
      {
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
      },
    );
    if (!res.ok) {
      console.warn(`[prerender] ${table} fetch failed: ${res.status}`);
      return [];
    }
    return (await res.json()) as Array<Record<string, any>>;
  } catch (err) {
    console.warn(`[prerender] ${table} fetch error`, err);
    return [];
  }
}

export function seoPrerenderPlugin(): Plugin {
  return {
    name: "floowy-seo-prerender",
    apply: "build",
    enforce: "post",
    async closeBundle() {
      const distDir = join(process.cwd(), "dist");
      const indexPath = join(distDir, "index.html");
      if (!existsSync(indexPath)) {
        console.warn("[prerender] dist/index.html not found, skipping");
        return;
      }
      const baseHtml = readFileSync(indexPath, "utf-8");

      // URLs collected here become the sitemap (static + all dynamic slugs).
      const urls: Array<{ path: string; lastmod?: string }> = [];

      const routes: RouteMeta[] = staticRoutes as RouteMeta[];
      let count = 0;
      for (const route of routes) {
        let html = bakeHead(baseHtml, route);
        // Legal pages: bake the full policy text into the static HTML so crawlers
        // (and Google's OAuth privacy-policy verifier) read it without JS.
        const legal = legalDocs[route.path];
        if (legal) html = bakeBody(html, legalToHtml(legal));
        writeRoute(distDir, route.path, html);
        urls.push({ path: route.path });
        count++;
      }

      // Dynamic blog posts
      const blogPosts = await fetchSlugs("blog_posts");
      for (const post of blogPosts) {
        const slug = post.slug as string;
        if (!slug) continue;
        const path = `/blog/${slug}`;
        urls.push({ path, lastmod: (post.updated_at || post.published_at) as string | undefined });
        const title = (post.meta_title as string) || (post.title as string) || "Floowy Blog";
        const description =
          (post.meta_description as string) ||
          (post.excerpt as string) ||
          "Read the latest from the Floowy AI content creation blog.";
        const ogImage = (post.cover_image_url as string) || undefined;
        const meta: RouteMeta = {
          path,
          title: `${title} | Floowy`,
          description,
          ogImage,
          breadcrumbs: [
            { name: "Home", url: SITE_URL },
            { name: "Blog", url: `${SITE_URL}/blog` },
            { name: post.title as string, url: `${SITE_URL}${path}` },
          ],
        };
        const article = articleLd({
          headline: post.title as string,
          description,
          datePublished: post.published_at as string,
          dateModified: post.updated_at as string,
          image: ogImage,
          url: `${SITE_URL}${path}`,
        });
        writeRoute(distDir, path, bakeHead(baseHtml, meta, [article]));
        count++;
      }

      // Dynamic cases
      const cases = await fetchSlugs("cases");
      for (const c of cases) {
        const slug = c.slug as string;
        if (!slug) continue;
        const path = `/cases/${slug}`;
        urls.push({ path, lastmod: (c.updated_at || c.published_at) as string | undefined });
        const title = (c.meta_title as string) || `${c.client_name} | Floowy Case Study`;
        const description =
          (c.meta_description as string) ||
          (c.subtitle as string) ||
          `See how ${c.client_name} scales content with Floowy AI.`;
        const ogImage = (c.og_image_url as string) || (c.hero_image_url as string) || undefined;
        const meta: RouteMeta = {
          path,
          title,
          description,
          ogImage,
          breadcrumbs: [
            { name: "Home", url: SITE_URL },
            { name: "Cases", url: `${SITE_URL}/cases` },
            { name: c.client_name as string, url: `${SITE_URL}${path}` },
          ],
        };
        writeRoute(distDir, path, bakeHead(baseHtml, meta));
        count++;
      }

      // Dynamic industry pages
      const industries = await fetchSlugs("industry_pages");
      for (const ind of industries) {
        const slug = ind.slug as string;
        if (!slug) continue;
        const path = `/industries/${slug}`;
        const title = (ind.meta_title as string) || `${ind.industry_name} | Floowy`;
        const description =
          (ind.meta_description as string) ||
          `AI content creation for ${ind.industry_name} — scale visuals with Floowy.`;
        const ogImage = (ind.og_image_url as string) || (ind.hero_image_url as string) || undefined;
        const meta: RouteMeta = {
          path,
          title,
          description,
          keywords: (ind.meta_keywords as string) || undefined,
          ogImage,
          breadcrumbs: [
            { name: "Home", url: SITE_URL },
            { name: "Industries", url: `${SITE_URL}/industries` },
            { name: ind.industry_name as string, url: `${SITE_URL}${path}` },
          ],
        };
        const faq = Array.isArray(ind.faq_items) && ind.faq_items.length > 0 ? [faqLd(ind.faq_items)] : [];
        writeRoute(distDir, path, bakeHead(baseHtml, meta, faq));
        urls.push({ path, lastmod: (ind.updated_at || ind.published_at) as string | undefined });
        count++;
      }

      // Generate sitemap.xml from every URL we just produced (overwrites the
      // static one copied from public/), so new content is always discoverable.
      writeSitemap(distDir, urls);

      console.log(`[prerender] Generated ${count} static HTML files + sitemap for SEO`);
    },
  };
}