# Development Guidelines

## Sitemap Maintenance

**IMPORTANT:** Whenever a new public-facing page or route is added to the application, the `public/sitemap.xml` file **must** be updated to include the new URL.

### Rules:
1. Add a new `<url>` entry for every new public page (landing pages, blog posts, knowledge base articles, case studies, etc.)
2. Do **not** add admin routes, protected tool routes (`/tool/*`), or internal pages (`/settings`, `/my-generations`, `/editor`, `/onboarding`, `/home`, `/payment`, etc.)
3. Use the correct `<priority>` value:
   - `1.0` — Homepage
   - `0.9` — Main studio landing pages, pricing
   - `0.8` — Blog index, cases, industries, knowledge base, request demo
   - `0.7` — Individual blog posts, case studies, KB articles, contact, community, custom models
   - `0.6` — About pages (our-story, our-mission, team)
   - `0.5` — Auth
   - `0.3` — Legal pages (privacy, terms)
4. Set `<changefreq>` appropriately (`weekly`, `monthly`, `yearly`)
5. Set `<lastmod>` to the current date

### Example entry:
```xml
<url>
  <loc>https://floowy.ai/new-page</loc>
  <lastmod>2026-04-01</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```
