-- Tanzania Forums - Complete Database Schema
-- Paste this entire file into the Supabase SQL Editor and run it.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'fact_checker', 'member');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned');
CREATE TYPE content_status AS ENUM ('published', 'hidden', 'deleted', 'pending');
CREATE TYPE language_code AS ENUM ('en', 'sw');
CREATE TYPE report_status AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');
CREATE TYPE fact_check_verdict AS ENUM ('true', 'false', 'misleading', 'unverified', 'satire');
CREATE TYPE moderation_action AS ENUM ('approve', 'hide', 'delete', 'warn', 'escalate');
CREATE TYPE notification_channel AS ENUM ('email', 'whatsapp', 'sms');

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role user_role NOT NULL DEFAULT 'member',
  status user_status NOT NULL DEFAULT 'active',
  reputation INTEGER NOT NULL DEFAULT 0,
  preferred_language language_code NOT NULL DEFAULT 'en',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  notification_prefs JSONB NOT NULL DEFAULT '{"email": true, "whatsapp": false, "sms": false}'::jsonb,
  privacy_settings JSONB NOT NULL DEFAULT '{"show_email": false, "show_activity": true}'::jsonb,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_handle ON public.users(handle);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_users_reputation ON public.users(reputation DESC);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_sw TEXT NOT NULL,
  description_en TEXT,
  description_sw TEXT,
  rules_en TEXT,
  rules_sw TEXT,
  icon TEXT,
  color TEXT DEFAULT '#0d9488',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  thread_count INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  ai_moderation_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ai_sensitivity NUMERIC(3,2) NOT NULL DEFAULT 0.70,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_sort ON public.categories(sort_order);

-- ============================================================
-- CATEGORY MODERATORS
-- ============================================================
CREATE TABLE public.category_moderators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES public.users(id),
  UNIQUE(category_id, user_id)
);

-- ============================================================
-- THREADS
-- ============================================================
CREATE TABLE public.threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  language language_code NOT NULL DEFAULT 'en',
  status content_status NOT NULL DEFAULT 'published',
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  view_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  reaction_count INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ai_summary TEXT,
  ai_summary_generated_at TIMESTAMPTZ,
  has_verified_sources BOOLEAN NOT NULL DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

CREATE INDEX idx_threads_category ON public.threads(category_id);
CREATE INDEX idx_threads_author ON public.threads(author_id);
CREATE INDEX idx_threads_status ON public.threads(status);
CREATE INDEX idx_threads_last_activity ON public.threads(last_activity_at DESC);
CREATE INDEX idx_threads_language ON public.threads(language);
CREATE INDEX idx_threads_featured ON public.threads(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_threads_pinned ON public.threads(is_pinned) WHERE is_pinned = TRUE;

-- ============================================================
-- POSTS
-- ============================================================
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  language language_code NOT NULL DEFAULT 'en',
  status content_status NOT NULL DEFAULT 'published',
  is_answer BOOLEAN NOT NULL DEFAULT FALSE,
  reaction_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  ai_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  ai_flag_reason TEXT,
  ai_flag_confidence NUMERIC(4,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_thread ON public.posts(thread_id);
CREATE INDEX idx_posts_author ON public.posts(author_id);
CREATE INDEX idx_posts_parent ON public.posts(parent_id);
CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_ai_flagged ON public.posts(ai_flagged) WHERE ai_flagged = TRUE;

-- ============================================================
-- REACTIONS
-- ============================================================
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reaction_target CHECK (
    (post_id IS NOT NULL AND thread_id IS NULL) OR
    (post_id IS NULL AND thread_id IS NOT NULL)
  ),
  UNIQUE(user_id, post_id, reaction_type),
  UNIQUE(user_id, thread_id, reaction_type)
);

CREATE INDEX idx_reactions_post ON public.reactions(post_id);
CREATE INDEX idx_reactions_thread ON public.reactions(thread_id);
CREATE INDEX idx_reactions_user ON public.reactions(user_id);

-- ============================================================
-- FOLLOWS
-- ============================================================
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  following_category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT follow_target CHECK (
    (following_user_id IS NOT NULL AND following_category_id IS NULL) OR
    (following_user_id IS NULL AND following_category_id IS NOT NULL)
  ),
  UNIQUE(follower_id, following_user_id),
  UNIQUE(follower_id, following_category_id)
);

CREATE INDEX idx_follows_follower ON public.follows(follower_id);

-- ============================================================
-- BOOKMARKS
-- ============================================================
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, thread_id)
);

CREATE INDEX idx_bookmarks_user ON public.bookmarks(user_id);

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status report_status NOT NULL DEFAULT 'open',
  priority INTEGER NOT NULL DEFAULT 0,
  resolved_by UUID REFERENCES public.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT report_target CHECK (
    (post_id IS NOT NULL)::int + (thread_id IS NOT NULL)::int + (user_id IS NOT NULL)::int = 1
  )
);

CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_priority ON public.reports(priority DESC);

-- ============================================================
-- MODERATION LOG
-- ============================================================
CREATE TABLE public.moderation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID NOT NULL REFERENCES public.users(id),
  action moderation_action NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_moderation_log_actor ON public.moderation_log(actor_id);
CREATE INDEX idx_moderation_log_created ON public.moderation_log(created_at DESC);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_hash TEXT,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_actor ON public.audit_log(actor_id);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at DESC);

-- ============================================================
-- FACT CHECKS (JamiiCheck)
-- ============================================================
CREATE TABLE public.fact_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim TEXT NOT NULL,
  verdict fact_check_verdict NOT NULL,
  explanation TEXT NOT NULL,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  author_id UUID NOT NULL REFERENCES public.users(id),
  language language_code NOT NULL DEFAULT 'en',
  status content_status NOT NULL DEFAULT 'published',
  linked_thread_ids UUID[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fact_checks_verdict ON public.fact_checks(verdict);
CREATE INDEX idx_fact_checks_status ON public.fact_checks(status);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES public.users(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  category_id UUID REFERENCES public.categories(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SITE SETTINGS
-- ============================================================
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

-- ============================================================
-- AI USAGE LOG
-- ============================================================
CREATE TABLE public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_type TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  latency_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_created ON public.ai_usage_log(created_at DESC);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER threads_updated_at BEFORE UPDATE ON public.threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER fact_checks_updated_at BEFORE UPDATE ON public.fact_checks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate unique handle
CREATE OR REPLACE FUNCTION generate_unique_handle()
RETURNS TEXT AS $$
DECLARE
  new_handle TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    new_handle := 'user_' || lower(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.users WHERE handle = new_handle) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN new_handle;
END;
$$ LANGUAGE plpgsql;

-- Handle new user signup (first user becomes admin)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
  new_role user_role;
  new_handle TEXT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users;
  
  IF user_count = 0 THEN
    new_role := 'admin';
  ELSE
    new_role := 'member';
  END IF;
  
  new_handle := generate_unique_handle();
  
  INSERT INTO public.users (id, handle, display_name, avatar_url, role)
  VALUES (
    NEW.id,
    new_handle,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', new_handle),
    NEW.raw_user_meta_data->>'avatar_url',
    new_role
  );
  
  -- Audit log for bootstrap admin
  IF new_role = 'admin' THEN
    INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id, metadata)
    VALUES (NEW.id, 'bootstrap_admin', 'user', NEW.id, '{"note": "First user auto-promoted to admin"}'::jsonb);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update thread stats on post insert
CREATE OR REPLACE FUNCTION update_thread_on_post()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
    UPDATE public.threads
    SET reply_count = reply_count + 1,
        last_activity_at = NOW()
    WHERE id = NEW.thread_id;
    
    UPDATE public.categories
    SET post_count = post_count + 1
    WHERE id = (SELECT category_id FROM public.threads WHERE id = NEW.thread_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_update_thread
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_thread_on_post();

-- Update category thread count
CREATE OR REPLACE FUNCTION update_category_on_thread()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
    UPDATE public.categories
    SET thread_count = thread_count + 1
    WHERE id = NEW.category_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER threads_update_category
  AFTER INSERT ON public.threads
  FOR EACH ROW EXECUTE FUNCTION update_category_on_thread();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public profiles are viewable" ON public.users
  FOR SELECT USING (status = 'active');

CREATE POLICY "Categories are public" ON public.categories
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Published threads are public" ON public.threads
  FOR SELECT USING (status = 'published');

CREATE POLICY "Published posts are public" ON public.posts
  FOR SELECT USING (status = 'published');

CREATE POLICY "Published fact checks are public" ON public.fact_checks
  FOR SELECT USING (status = 'published');

CREATE POLICY "Active announcements are public" ON public.announcements
  FOR SELECT USING (is_active = TRUE AND (ends_at IS NULL OR ends_at > NOW()));

CREATE POLICY "Category moderators are public" ON public.category_moderators
  FOR SELECT USING (TRUE);

-- Authenticated write policies
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can create threads" ON public.threads
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own threads" ON public.threads
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authenticated users can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can manage own reactions" ON public.reactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own follows" ON public.follows
  FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Admin policies
-- Run as the database owner. The role lookup bypasses users RLS to avoid
-- recursively evaluating the policy on the same table.
CREATE OR REPLACE FUNCTION public.is_forum_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_forum_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_forum_admin() TO anon, authenticated;

CREATE POLICY "Admins full access users" ON public.users
  FOR ALL USING ((SELECT public.is_forum_admin()))
  WITH CHECK ((SELECT public.is_forum_admin()));

CREATE POLICY "Admins full access threads" ON public.threads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "Admins full access posts" ON public.posts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "Admins full access reports" ON public.reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "Admins full access moderation" ON public.moderation_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "Admins full access audit" ON public.audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins full access settings" ON public.site_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins full access categories" ON public.categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Fact checkers manage fact checks" ON public.fact_checks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'fact_checker'))
  );

CREATE POLICY "Admins view AI logs" ON public.ai_usage_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- SEED DATA: Default Categories
-- ============================================================
INSERT INTO public.categories (slug, name_en, name_sw, description_en, description_sw, icon, color, sort_order) VALUES
  ('siasa', 'Politics', 'Siasa', 'Political discussions, governance, and policy in Tanzania and East Africa.', 'Majadiliano ya kisiasa, utawala, na sera nchini Tanzania na Afrika Mashariki.', 'landmark', '#0d9488', 1),
  ('uhusiano-mapenzi', 'Relationships & Love', 'Uhusiano & Mapenzi', 'Advice, stories, and discussions about relationships and dating.', 'Ushauri, hadithi, na majadiliano kuhusu uhusiano na mapenzi.', 'heart', '#e11d48', 2),
  ('uchumi-biashara', 'Economy & Business', 'Uchumi na Biashara', 'Business opportunities, economy, entrepreneurship, and finance.', 'Fursa za biashara, uchumi, ujasiriamali, na fedha.', 'trending-up', '#d97706', 3),
  ('tech-gadgets', 'Tech & Gadgets', 'Tech & Gadgets', 'Technology news, gadgets, software, and digital innovation.', 'Habari za teknolojia, vifaa, programu, na uvumbuzi wa kidijitali.', 'cpu', '#6366f1', 4),
  ('jamiicheck', 'JamiiCheck', 'JamiiCheck', 'Fact-checking claims circulating in Tanzanian communities.', 'Kukagua ukweli wa madai yanayozunguka katika jamii za Tanzania.', 'shield-check', '#059669', 5),
  ('afya', 'Health', 'Afya', 'Health tips, medical discussions, and wellness.', 'Vidokezo vya afya, majadiliano ya matibabu, na ustawi.', 'heart-pulse', '#dc2626', 6),
  ('elimu', 'Education', 'Elimu', 'Education, scholarships, universities, and learning resources.', 'Elimu, ufadhili, vyuo vikuu, na rasilimali za kujifunza.', 'graduation-cap', '#2563eb', 7),
  ('burudani', 'Entertainment', 'Burudani', 'Music, movies, sports, and culture.', 'Muziki, filamu, michezo, na utamaduni.', 'clapperboard', '#9333ea', 8);

-- Default site settings
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', '"Tanzania Forums"'),
  ('site_tagline', '"Tanzania''s open forum for ideas, truth, and community."'),
  ('default_language', '"en"'),
  ('ai_summary_threshold', '20'),
  ('ai_moderation_enabled', 'true'),
  ('registration_open', 'true');

-- ============================================================
-- DONE
-- ============================================================
-- After running this SQL:
-- 1. Go to Authentication > Providers and ensure Google is enabled
-- 2. Set the Site URL and Redirect URLs in Authentication > URL Configuration
-- 3. The first Google sign-in will automatically become Admin
