-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'player');
CREATE TYPE event_status AS ENUM ('draft', 'active', 'paused', 'completed');
CREATE TYPE mission_type AS ENUM ('discovery', 'creative', 'puzzle', 'ai');
CREATE TYPE mission_status AS ENUM ('upcoming', 'active', 'completed');
CREATE TYPE submission_status AS ENUM ('pending', 'reviewing', 'approved', 'rejected');
CREATE TYPE power_up_type AS ENUM ('double_points', 'speed_boost', 'hint_reveal', 'mystery_bonus');

-- users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'player',
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- events table
CREATE TABLE public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status event_status NOT NULL DEFAULT 'draft',
  admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  max_teams INTEGER NOT NULL DEFAULT 10,
  max_players_per_team INTEGER NOT NULL DEFAULT 5,
  settings JSONB NOT NULL DEFAULT '{}',
  join_code TEXT UNIQUE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- stories table
CREATE TABLE public.stories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'missing_ai',
  key_elements TEXT[] DEFAULT '{}',
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- teams table
CREATE TABLE public.teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#2563EB',
  avatar_url TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, name)
);

-- team_members table
CREATE TABLE public.team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- missions table
CREATE TABLE public.missions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT,
  type mission_type NOT NULL DEFAULT 'discovery',
  status mission_status NOT NULL DEFAULT 'upcoming',
  order_index INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 100,
  time_limit_seconds INTEGER,
  is_boss_battle BOOLEAN NOT NULL DEFAULT false,
  evaluation_criteria TEXT,
  hints TEXT[] DEFAULT '{}',
  activated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- submissions table
CREATE TABLE public.submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  media_urls TEXT[] DEFAULT '{}',
  status submission_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(mission_id, team_id)
);

-- ai_feedback table
CREATE TABLE public.ai_feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  accuracy_score INTEGER NOT NULL DEFAULT 0 CHECK (accuracy_score >= 0 AND accuracy_score <= 10),
  creativity_score INTEGER NOT NULL DEFAULT 0 CHECK (creativity_score >= 0 AND creativity_score <= 10),
  teamwork_score INTEGER NOT NULL DEFAULT 0 CHECK (teamwork_score >= 0 AND teamwork_score <= 10),
  speed_score INTEGER NOT NULL DEFAULT 0 CHECK (speed_score >= 0 AND speed_score <= 10),
  presentation_score INTEGER NOT NULL DEFAULT 0 CHECK (presentation_score >= 0 AND presentation_score <= 10),
  fun_factor_score INTEGER NOT NULL DEFAULT 0 CHECK (fun_factor_score >= 0 AND fun_factor_score <= 10),
  total_score INTEGER NOT NULL DEFAULT 0,
  feedback_text TEXT NOT NULL DEFAULT '',
  narrative TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- scores table
CREATE TABLE public.scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
  points INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- badges table
CREATE TABLE public.badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  color TEXT NOT NULL DEFAULT '#F59E0B',
  criteria JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- team_badges table
CREATE TABLE public.team_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, badge_id)
);

-- achievements table
CREATE TABLE public.achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'star',
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- power_ups table
CREATE TABLE public.power_ups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  type power_up_type NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'announcement',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- boss_battles table
CREATE TABLE public.boss_battles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- leaderboard_snapshots table
CREATE TABLE public.leaderboard_snapshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  missions_completed INTEGER NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- audit_logs table
CREATE TABLE public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_admin_id ON public.events(admin_id);
CREATE INDEX idx_teams_event_id ON public.teams(event_id);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_missions_event_id ON public.missions(event_id);
CREATE INDEX idx_missions_status ON public.missions(status);
CREATE INDEX idx_submissions_mission_id ON public.submissions(mission_id);
CREATE INDEX idx_submissions_team_id ON public.submissions(team_id);
CREATE INDEX idx_scores_team_id ON public.scores(team_id);
CREATE INDEX idx_scores_event_id ON public.scores(event_id);
CREATE INDEX idx_notifications_event_id ON public.notifications(event_id);
CREATE INDEX idx_leaderboard_event_id ON public.leaderboard_snapshots(event_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER missions_updated_at BEFORE UPDATE ON public.missions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Handle new user signup
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Calculate team total score function
CREATE OR REPLACE FUNCTION public.calculate_team_score(p_team_id UUID, p_event_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(points), 0)::INTEGER
  FROM public.scores
  WHERE team_id = p_team_id AND event_id = p_event_id;
$$ LANGUAGE SQL STABLE;

-- Get leaderboard function
CREATE OR REPLACE FUNCTION public.get_event_leaderboard(p_event_id UUID)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  team_color TEXT,
  total_score INTEGER,
  missions_completed BIGINT,
  rank BIGINT
) AS $$
  SELECT
    t.id as team_id,
    t.name as team_name,
    t.color as team_color,
    COALESCE(SUM(s.points), 0)::INTEGER as total_score,
    COUNT(DISTINCT sub.id) FILTER (WHERE sub.status = 'approved') as missions_completed,
    RANK() OVER (ORDER BY COALESCE(SUM(s.points), 0) DESC) as rank
  FROM public.teams t
  LEFT JOIN public.scores s ON s.team_id = t.id AND s.event_id = p_event_id
  LEFT JOIN public.submissions sub ON sub.team_id = t.id
  WHERE t.event_id = p_event_id
  GROUP BY t.id, t.name, t.color
  ORDER BY total_score DESC;
$$ LANGUAGE SQL STABLE;

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boss_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: can read own, admins read all
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Events: authenticated users can read active events
CREATE POLICY "Anyone can view active events" ON public.events FOR SELECT USING (
  status IN ('active', 'completed') OR admin_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage events" ON public.events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Teams: event participants can read
CREATE POLICY "Participants can view teams" ON public.teams FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND (status = 'active' OR status = 'completed')) OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage teams" ON public.teams FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Team members
CREATE POLICY "View team members" ON public.team_members FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Join teams" ON public.team_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Leave teams" ON public.team_members FOR DELETE USING (user_id = auth.uid());

-- Stories
CREATE POLICY "View stories for active events" ON public.stories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage stories" ON public.stories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Missions
CREATE POLICY "View missions" ON public.missions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage missions" ON public.missions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Submissions
CREATE POLICY "Teams view own submissions" ON public.submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = submissions.team_id AND user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Teams create submissions" ON public.submissions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = submissions.team_id AND user_id = auth.uid())
);
CREATE POLICY "Admins update submissions" ON public.submissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- AI Feedback
CREATE POLICY "View ai feedback" ON public.ai_feedback FOR SELECT USING (auth.uid() IS NOT NULL);

-- Scores
CREATE POLICY "View scores" ON public.scores FOR SELECT USING (auth.uid() IS NOT NULL);

-- Badges
CREATE POLICY "View badges" ON public.badges FOR SELECT USING (true);

-- Team badges
CREATE POLICY "View team badges" ON public.team_badges FOR SELECT USING (auth.uid() IS NOT NULL);

-- Achievements
CREATE POLICY "View own achievements" ON public.achievements FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins view all achievements" ON public.achievements FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Notifications
CREATE POLICY "View event notifications" ON public.notifications FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage notifications" ON public.notifications FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Boss battles
CREATE POLICY "View boss battles" ON public.boss_battles FOR SELECT USING (auth.uid() IS NOT NULL);

-- Power ups
CREATE POLICY "View power ups" ON public.power_ups FOR SELECT USING (auth.uid() IS NOT NULL);

-- Leaderboard snapshots
CREATE POLICY "View leaderboard" ON public.leaderboard_snapshots FOR SELECT USING (auth.uid() IS NOT NULL);

-- Audit logs - admins only
CREATE POLICY "Admins view audit logs" ON public.audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Seed default badges
INSERT INTO public.badges (name, description, icon, color, criteria) VALUES
  ('First Blood', 'First team to submit in the event', 'zap', '#EF4444', '{"type": "first_submission"}'),
  ('Perfect Score', 'Achieve a perfect score on any mission', 'star', '#F59E0B', '{"type": "perfect_score", "score": 60}'),
  ('Speed Demon', 'Submit within 2 minutes of mission activation', 'timer', '#06B6D4', '{"type": "speed_submission", "seconds": 120}'),
  ('Creative Genius', 'Score 9+ on creativity', 'palette', '#7C3AED', '{"type": "creativity_score", "min": 9}'),
  ('Boss Slayer', 'Win the boss battle round', 'sword', '#DC2626', '{"type": "boss_battle_winner"}'),
  ('Team Spirit', 'Have all team members submit', 'users', '#059669', '{"type": "full_team_submission"}'),
  ('AI Whisperer', 'Complete an AI mission with top marks', 'bot', '#2563EB', '{"type": "ai_mission_top"}'),
  ('Explorer', 'Complete 5 discovery missions', 'compass', '#D97706', '{"type": "missions_completed", "type_filter": "discovery", "count": 5}');
