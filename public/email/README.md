# Email assets

## press-logos.png  (REQUIRED for Flow E + email footers)

Save the supplied press/"as featured on" logo strip here as **`press-logos.png`**.

- Referenced by emails as an absolute URL: `https://floowy.ai/email/press-logos.png`
  (see `PRESS_LOGOS_IMG` in `supabase/functions/_shared/email.ts`).
- Logos: RTL · Videoland · TEDx · FD · Global Search Awards · Fonk 150.
- Recommended: ~1040×180px (renders at max 520px wide, retina), transparent or
  white background, greyscale. Keep it light — it's shown at ~70% opacity.

Until this file exists, the emails fall back to the `alt` text
("As featured on RTL · Videoland · TEDx · FD · Global Search Awards · Fonk 150").

The file deploys with the frontend (Vercel serves `public/` at the site root).
