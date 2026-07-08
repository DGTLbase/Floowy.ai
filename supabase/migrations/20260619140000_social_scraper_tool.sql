-- ============================================================================
-- Social Scraper tool (ported from sweet-planning-guide). Adds project-based
-- social-media / ads scraping tables. Excludes the source project's stub
-- `profiles` table and its `handle_new_user` (floowy has its own, richer ones).
-- ============================================================================

-- projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  niche TEXT,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own projects" ON public.projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own projects" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_projects_user ON public.projects(user_id);

-- scrape_runs
CREATE TABLE public.scrape_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  apify_run_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  video_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scrape_runs TO authenticated;
GRANT ALL ON public.scrape_runs TO service_role;
ALTER TABLE public.scrape_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own runs" ON public.scrape_runs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own runs" ON public.scrape_runs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own runs" ON public.scrape_runs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_runs_project ON public.scrape_runs(project_id);

-- videos
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scrape_run_id UUID REFERENCES public.scrape_runs(id) ON DELETE SET NULL,
  tiktok_id TEXT,
  tiktok_url TEXT,
  author_username TEXT,
  author_name TEXT,
  caption TEXT,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  likes INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  plays BIGINT NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  posted_at TIMESTAMPTZ,
  thumbnail_url TEXT,
  video_url TEXT,
  raw_data JSONB,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own videos" ON public.videos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own videos" ON public.videos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own videos" ON public.videos FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own videos" ON public.videos FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_videos_project ON public.videos(project_id);
CREATE UNIQUE INDEX idx_videos_project_tiktok ON public.videos(project_id, tiktok_id) WHERE tiktok_id IS NOT NULL;

-- generic updated_at trigger fn (idempotent; floowy-compatible)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ===== from 20260528051238_4a75c718-5704-4a54-a94e-77c953c244dd.sql =====

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- ===== from 20260528052129_4049d9bf-e2cc-4f7c-8194-a435f2ff86a7.sql =====
DELETE FROM public.videos a USING public.videos b WHERE a.ctid < b.ctid AND a.project_id = b.project_id AND a.tiktok_id = b.tiktok_id AND a.tiktok_id IS NOT NULL; ALTER TABLE public.videos ADD CONSTRAINT videos_project_tiktok_unique UNIQUE (project_id, tiktok_id);
-- ===== from 20260528053312_06dd004a-315b-43e2-88ca-916c1332f27c.sql =====
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS video_analysis jsonb, ADD COLUMN IF NOT EXISTS comments_analysis jsonb, ADD COLUMN IF NOT EXISTS analysis_updated_at timestamptz;
-- ===== from 20260528061851_80d8b649-61d8-42a9-b46d-e26f4a6fb9d2.sql =====
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS comments_apify_run_id text,
  ADD COLUMN IF NOT EXISTS comments_analysis_status text,
  ADD COLUMN IF NOT EXISTS comments_analysis_error text;
-- ===== from 20260611124714_53f265ef-9c9f-4920-aee8-cbaa03fba942.sql =====
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS usernames text[] NOT NULL DEFAULT '{}'::text[];
-- ===== from 20260611132331_bdae81dd-48ce-45bc-b090-456db5b65f80.sql =====
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'post' CHECK (source_type IN ('post','ad'));
-- ===== from 20260615123314_ccd32d5e-6743-4d4c-a2c2-41ffab6d113a.sql =====

CREATE TABLE public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  scrape_run_id uuid REFERENCES public.scrape_runs(id) ON DELETE SET NULL,
  source text,
  ad_id text,
  ad_url text,
  video_url text,
  thumbnail_url text,
  advertiser_name text,
  advertiser_business_id text,
  ad_text text,
  countries text[] NOT NULL DEFAULT '{}'::text[],
  search_term text,
  ad_type text,
  first_shown_date timestamptz,
  last_shown_date timestamptz,
  impressions bigint,
  duration_seconds integer,
  ctr numeric,
  likes integer NOT NULL DEFAULT 0,
  raw_data jsonb,
  video_analysis jsonb,
  analysis_updated_at timestamptz,
  scraped_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ads_project_ad_uniq ON public.ads(project_id, ad_id) WHERE ad_id IS NOT NULL;
CREATE INDEX ads_project_scraped_at_idx ON public.ads(project_id, scraped_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ads TO authenticated;
GRANT ALL ON public.ads TO service_role;

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ads" ON public.ads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own ads" ON public.ads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own ads" ON public.ads FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own ads" ON public.ads FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== from 20260615124028_e56dcf52-4009-4f9e-8ac3-2f57c9cc59f7.sql =====

DROP INDEX IF EXISTS public.ads_project_ad_uniq;
ALTER TABLE public.ads ADD CONSTRAINT ads_project_ad_uniq UNIQUE (project_id, ad_id);

-- ===== from 20260617085753_8f65698a-b522-4fc2-9e59-dd790d384828.sql =====

-- 1) Add platform column to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'tiktok';

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_platform_check;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_platform_check
  CHECK (platform IN ('tiktok','instagram','facebook','meta_ads'));

-- 2) Instagram posts
CREATE TABLE IF NOT EXISTS public.instagram_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  scrape_run_id uuid REFERENCES public.scrape_runs(id) ON DELETE SET NULL,
  ig_id text,
  url text,
  owner_username text,
  owner_full_name text,
  caption text,
  hashtags text[] DEFAULT '{}',
  likes integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  plays integer DEFAULT 0,
  video_url text,
  thumbnail_url text,
  duration_seconds integer,
  posted_at timestamptz,
  product_type text,
  scraped_at timestamptz NOT NULL DEFAULT now(),
  virality_score numeric,
  video_analysis jsonb,
  comment_analysis jsonb,
  analysis_status text DEFAULT 'pending',
  analyzed_at timestamptz,
  raw_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT instagram_posts_project_ig_id_key UNIQUE (project_id, ig_id)
);
CREATE INDEX IF NOT EXISTS instagram_posts_project_idx ON public.instagram_posts(project_id);
CREATE INDEX IF NOT EXISTS instagram_posts_user_idx ON public.instagram_posts(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.instagram_posts TO authenticated;
GRANT ALL ON public.instagram_posts TO service_role;

ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own instagram_posts" ON public.instagram_posts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own instagram_posts" ON public.instagram_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own instagram_posts" ON public.instagram_posts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own instagram_posts" ON public.instagram_posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER instagram_posts_updated_at
  BEFORE UPDATE ON public.instagram_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Facebook posts
CREATE TABLE IF NOT EXISTS public.facebook_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  scrape_run_id uuid REFERENCES public.scrape_runs(id) ON DELETE SET NULL,
  fb_id text,
  url text,
  page_name text,
  page_url text,
  page_id text,
  text text,
  reactions_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  shares integer DEFAULT 0,
  posted_at timestamptz,
  media_type text,
  media_url text,
  thumbnail_url text,
  source text, -- 'page' | 'search'
  search_term text,
  scraped_at timestamptz NOT NULL DEFAULT now(),
  virality_score numeric,
  video_analysis jsonb,
  comment_analysis jsonb,
  analysis_status text DEFAULT 'pending',
  analyzed_at timestamptz,
  raw_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT facebook_posts_project_fb_id_key UNIQUE (project_id, fb_id)
);
CREATE INDEX IF NOT EXISTS facebook_posts_project_idx ON public.facebook_posts(project_id);
CREATE INDEX IF NOT EXISTS facebook_posts_user_idx ON public.facebook_posts(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.facebook_posts TO authenticated;
GRANT ALL ON public.facebook_posts TO service_role;

ALTER TABLE public.facebook_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own facebook_posts" ON public.facebook_posts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own facebook_posts" ON public.facebook_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own facebook_posts" ON public.facebook_posts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own facebook_posts" ON public.facebook_posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER facebook_posts_updated_at
  BEFORE UPDATE ON public.facebook_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Meta Ads
CREATE TABLE IF NOT EXISTS public.meta_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  scrape_run_id uuid REFERENCES public.scrape_runs(id) ON DELETE SET NULL,
  ad_archive_id text,
  page_name text,
  page_id text,
  page_url text,
  ad_creative_bodies text[] DEFAULT '{}',
  ad_creative_link_titles text[] DEFAULT '{}',
  ad_creative_link_descriptions text[] DEFAULT '{}',
  ad_snapshot_url text,
  platforms text[] DEFAULT '{}',
  start_date timestamptz,
  end_date timestamptz,
  countries text[] DEFAULT '{}',
  impressions_lower bigint,
  impressions_upper bigint,
  spend_lower numeric,
  spend_upper numeric,
  currency text,
  cta_type text,
  link_url text,
  image_urls text[] DEFAULT '{}',
  video_urls text[] DEFAULT '{}',
  search_term text,
  scraped_at timestamptz NOT NULL DEFAULT now(),
  ad_analysis jsonb,
  analysis_status text DEFAULT 'pending',
  analyzed_at timestamptz,
  raw_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT meta_ads_project_archive_key UNIQUE (project_id, ad_archive_id)
);
CREATE INDEX IF NOT EXISTS meta_ads_project_idx ON public.meta_ads(project_id);
CREATE INDEX IF NOT EXISTS meta_ads_user_idx ON public.meta_ads(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_ads TO authenticated;
GRANT ALL ON public.meta_ads TO service_role;

ALTER TABLE public.meta_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own meta_ads" ON public.meta_ads
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own meta_ads" ON public.meta_ads
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own meta_ads" ON public.meta_ads
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own meta_ads" ON public.meta_ads
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER meta_ads_updated_at
  BEFORE UPDATE ON public.meta_ads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== from 20260617111934_ab62544b-e1d2-48da-9d2c-87346d9edd72.sql =====

ALTER TABLE public.instagram_posts
  ADD COLUMN IF NOT EXISTS comments_apify_run_id text,
  ADD COLUMN IF NOT EXISTS comments_analysis_status text,
  ADD COLUMN IF NOT EXISTS comments_analysis_error text;

ALTER TABLE public.facebook_posts
  ADD COLUMN IF NOT EXISTS comments_apify_run_id text,
  ADD COLUMN IF NOT EXISTS comments_analysis_status text,
  ADD COLUMN IF NOT EXISTS comments_analysis_error text;

-- ===== from 20260617152740_1a766b16-4e53-40c6-ab6f-98571d1d41e6.sql =====
create or replace function public._strip_dpa_placeholders(arr text[])
returns text[]
language sql
immutable
set search_path = public
as $$
  select coalesce(
    array_agg(cleaned) filter (where cleaned is not null and cleaned <> ''),
    '{}'::text[]
  )
  from (
    select btrim(regexp_replace(elem, '\{\{[^}]+\}\}', '', 'g')) as cleaned
    from unnest(coalesce(arr, '{}'::text[])) as elem
  ) t;
$$;

update public.meta_ads
set
  ad_creative_bodies = public._strip_dpa_placeholders(ad_creative_bodies),
  ad_creative_link_titles = public._strip_dpa_placeholders(ad_creative_link_titles),
  ad_creative_link_descriptions = public._strip_dpa_placeholders(ad_creative_link_descriptions);

drop function public._strip_dpa_placeholders(text[]);