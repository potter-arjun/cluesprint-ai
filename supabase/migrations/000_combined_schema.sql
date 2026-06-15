-- ============================================================
-- ClueSprint AI — Complete Schema (run this in Supabase SQL Editor)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'player');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('draft', 'active', 'paused', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE mission_type AS ENUM ('discovery', 'creative', 'puzzle', 'ai');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE mission_status AS ENUM ('upcoming', 'active', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE submission_status AS ENUM ('pending', 'reviewing', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE power_up_type AS ENUM ('double_points', 'speed_boost', 'hint_reveal', 'mystery_bonus');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id               UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email            TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  avatar_url       TEXT,
  role             user_role NOT NULL DEFAULT 'player',
  xp               INTEGER NOT NULL DEFAULT 0,
  level            INTEGER NOT NULL DEFAULT 1,
  total_score      INTEGER NOT NULL DEFAULT 0,
  events_played    INTEGER NOT NULL DEFAULT 0,
  missions_completed INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── events ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name                  TEXT NOT NULL,
  description           TEXT,
  venue                 TEXT,
  theme                 TEXT,
  status                event_status NOT NULL DEFAULT 'draft',
  admin_id              UUID REFERENCES public.users(id) ON DELETE SET NULL,
  max_teams             INTEGER NOT NULL DEFAULT 10,
  max_players_per_team  INTEGER NOT NULL DEFAULT 5,
  settings              JSONB NOT NULL DEFAULT '{}',
  join_code             TEXT UNIQUE,
  starts_at             TIMESTAMPTZ,
  ends_at               TIMESTAMPTZ,
  started_at            TIMESTAMPTZ,
  ended_at              TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── stories ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stories (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id       UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  title          TEXT NOT NULL,
  content        TEXT NOT NULL,
  theme          TEXT NOT NULL DEFAULT 'missing_ai',
  key_elements   TEXT[] DEFAULT '{}',
  mission_hints  TEXT[] DEFAULT '{}',
  mood           TEXT,
  ai_generated   BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── teams ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.teams (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id            UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name                TEXT NOT NULL,
  color               TEXT NOT NULL DEFAULT '#2563EB',
  avatar_url          TEXT,
  total_score         INTEGER NOT NULL DEFAULT 0,
  missions_completed  INTEGER NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, name)
);

-- ── team_members ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_members (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id    UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role       TEXT NOT NULL DEFAULT 'member',
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- ── missions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.missions (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id             UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  story_id             UUID REFERENCES public.stories(id) ON DELETE SET NULL,
  title                TEXT NOT NULL,
  description          TEXT NOT NULL,
  instructions         TEXT,
  type                 mission_type NOT NULL DEFAULT 'discovery',
  status               mission_status NOT NULL DEFAULT 'upcoming',
  difficulty           TEXT NOT NULL DEFAULT 'medium',
  order_index          INTEGER NOT NULL DEFAULT 0,
  points               INTEGER NOT NULL DEFAULT 100,
  time_limit_seconds   INTEGER,
  estimated_minutes    INTEGER,
  is_boss_battle       BOOLEAN NOT NULL DEFAULT false,
  evaluation_criteria  TEXT,
  hints                TEXT[] DEFAULT '{}',
  activated_at         TIMESTAMPTZ,
  completed_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── submissions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.submissions (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mission_id      UUID REFERENCES public.missions(id) ON DELETE CASCADE NOT NULL,
  team_id         UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  event_id        UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  content         TEXT,
  media_urls      TEXT[] DEFAULT '{}',
  status          submission_status NOT NULL DEFAULT 'pending',
  score           INTEGER,
  feedback_id     UUID,
  override_notes  TEXT,
  override_score  INTEGER,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(mission_id, team_id)
);

-- ── ai_feedback ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id  UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  accuracy       INTEGER NOT NULL DEFAULT 0 CHECK (accuracy   >= 0 AND accuracy   <= 10),
  creativity     INTEGER NOT NULL DEFAULT 0 CHECK (creativity >= 0 AND creativity <= 10),
  teamwork       INTEGER NOT NULL DEFAULT 0 CHECK (teamwork   >= 0 AND teamwork   <= 10),
  speed          INTEGER NOT NULL DEFAULT 0 CHECK (speed      >= 0 AND speed      <= 10),
  presentation   INTEGER NOT NULL DEFAULT 0 CHECK (presentation >= 0 AND presentation <= 10),
  fun_factor     INTEGER NOT NULL DEFAULT 0 CHECK (fun_factor >= 0 AND fun_factor <= 10),
  total_score    INTEGER NOT NULL DEFAULT 0,
  feedback       TEXT NOT NULL DEFAULT '',
  narrative      TEXT,
  highlights     TEXT[] DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── scores ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scores (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id         UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  event_id        UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  mission_id      UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  submission_id   UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
  base_points     INTEGER NOT NULL DEFAULT 0,
  speed_bonus     INTEGER NOT NULL DEFAULT 0,
  power_up_bonus  INTEGER NOT NULL DEFAULT 0,
  total_points    INTEGER NOT NULL DEFAULT 0,
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── badges ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.badges (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name            TEXT NOT NULL UNIQUE,
  description     TEXT NOT NULL,
  icon            TEXT NOT NULL DEFAULT 'trophy',
  color           TEXT NOT NULL DEFAULT '#F59E0B',
  criteria        JSONB NOT NULL DEFAULT '{}',
  condition_type  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── team_badges ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_badges (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id    UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  badge_id   UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, badge_id)
);

-- ── achievements ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.achievements (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  badge_id   UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  event_id   UUID REFERENCES public.events(id) ON DELETE SET NULL,
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ── power_ups ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.power_ups (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id      UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  type          power_up_type NOT NULL,
  team_id       UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  is_active     BOOLEAN NOT NULL DEFAULT false,
  activated_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── notifications ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id   UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  type       TEXT NOT NULL DEFAULT 'announcement',
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  data       JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── boss_battles ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.boss_battles (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id    UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  mission_id  UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'pending',
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── leaderboard_snapshots ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id            UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  team_id             UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  rank                INTEGER NOT NULL,
  score               INTEGER NOT NULL,
  missions_completed  INTEGER NOT NULL DEFAULT 0,
  snapshot_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── audit_logs ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id        UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action         TEXT NOT NULL,
  resource_type  TEXT,
  resource_id    UUID,
  details        JSONB DEFAULT '{}',
  ip_address     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_events_status          ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_admin_id        ON public.events(admin_id);
CREATE INDEX IF NOT EXISTS idx_teams_event_id         ON public.teams(event_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id   ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id   ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_missions_event_id      ON public.missions(event_id);
CREATE INDEX IF NOT EXISTS idx_missions_status        ON public.missions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_mission_id ON public.submissions(mission_id);
CREATE INDEX IF NOT EXISTS idx_submissions_team_id    ON public.submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_scores_team_id         ON public.scores(team_id);
CREATE INDEX IF NOT EXISTS idx_scores_event_id        ON public.scores(event_id);
CREATE INDEX IF NOT EXISTS idx_scores_user_id         ON public.scores(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_event_id ON public.notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_event_id   ON public.leaderboard_snapshots(event_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id   ON public.achievements(user_id);

-- ── Triggers ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER users_updated_at     BEFORE UPDATE ON public.users     FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER events_updated_at    BEFORE UPDATE ON public.events    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER teams_updated_at     BEFORE UPDATE ON public.teams     FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER missions_updated_at  BEFORE UPDATE ON public.missions  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER submissions_updated_at BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'player')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Leaderboard function
CREATE OR REPLACE FUNCTION public.get_event_leaderboard(p_event_id UUID)
RETURNS TABLE (
  team_id           UUID,
  team_name         TEXT,
  team_color        TEXT,
  total_score       INTEGER,
  missions_completed BIGINT,
  rank              BIGINT
) AS $$
  SELECT
    t.id,
    t.name,
    t.color,
    COALESCE(SUM(s.total_points), 0)::INTEGER,
    COUNT(DISTINCT sub.id) FILTER (WHERE sub.status = 'approved'),
    RANK() OVER (ORDER BY COALESCE(SUM(s.total_points), 0) DESC)
  FROM public.teams t
  LEFT JOIN public.scores s   ON s.team_id = t.id AND s.event_id = p_event_id
  LEFT JOIN public.submissions sub ON sub.team_id = t.id
  WHERE t.event_id = p_event_id
  GROUP BY t.id, t.name, t.color
  ORDER BY 4 DESC;
$$ LANGUAGE SQL STABLE;

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE public.users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feedback          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_badges          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_ups            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boss_battles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs           ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "users_select_own"   ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_select_admin" ON public.users FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "users_update_own"   ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert_self"  ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Events
CREATE POLICY "events_select" ON public.events FOR SELECT USING (
  status IN ('active', 'completed') OR admin_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "events_all_admin" ON public.events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Teams
CREATE POLICY "teams_select" ON public.teams FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "teams_all_admin" ON public.teams FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "teams_insert_auth" ON public.teams FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Team members
CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "team_members_insert" ON public.team_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "team_members_delete" ON public.team_members FOR DELETE USING (user_id = auth.uid());

-- Stories, Missions, AI Feedback, Scores, Badges, Notifications, Boss Battles, Power Ups, Leaderboard
CREATE POLICY "stories_select"       ON public.stories              FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "stories_admin"        ON public.stories              FOR ALL    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "missions_select"      ON public.missions             FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "missions_admin"       ON public.missions             FOR ALL    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ai_feedback_select"   ON public.ai_feedback          FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ai_feedback_admin"    ON public.ai_feedback          FOR ALL    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "scores_select"        ON public.scores               FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "scores_admin"         ON public.scores               FOR ALL    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "badges_select"        ON public.badges               FOR SELECT USING (true);
CREATE POLICY "team_badges_select"   ON public.team_badges          FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "notifications_select" ON public.notifications        FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "notifications_admin"  ON public.notifications        FOR ALL    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "boss_battles_select"  ON public.boss_battles         FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "power_ups_select"     ON public.power_ups            FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "leaderboard_select"   ON public.leaderboard_snapshots FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "audit_logs_admin"     ON public.audit_logs           FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Submissions
CREATE POLICY "submissions_select" ON public.submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = submissions.team_id AND user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "submissions_insert" ON public.submissions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = submissions.team_id AND user_id = auth.uid())
);
CREATE POLICY "submissions_update_admin" ON public.submissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Achievements
CREATE POLICY "achievements_select_own"   ON public.achievements FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "achievements_select_admin" ON public.achievements FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ── Seed Badges ──────────────────────────────────────────────
INSERT INTO public.badges (name, description, icon, color, criteria) VALUES
  ('First Blood',     'First team to submit in the event',               'zap',     '#EF4444', '{"type":"first_submission"}'),
  ('Perfect Score',   'Achieve a perfect score on any mission',          'star',    '#F59E0B', '{"type":"perfect_score","score":60}'),
  ('Speed Demon',     'Submit within 2 minutes of mission activation',   'timer',   '#06B6D4', '{"type":"speed_submission","seconds":120}'),
  ('Creative Genius', 'Score 9+ on creativity',                          'palette', '#7C3AED', '{"type":"creativity_score","min":9}'),
  ('Boss Slayer',     'Win the boss battle round',                       'sword',   '#DC2626', '{"type":"boss_battle_winner"}'),
  ('Team Spirit',     'Have all team members submit',                    'users',   '#059669', '{"type":"full_team_submission"}'),
  ('AI Whisperer',    'Complete an AI mission with top marks',           'bot',     '#2563EB', '{"type":"ai_mission_top"}'),
  ('Explorer',        'Complete 5 discovery missions',                   'compass', '#D97706', '{"type":"missions_completed","type_filter":"discovery","count":5}')
ON CONFLICT (name) DO NOTHING;
