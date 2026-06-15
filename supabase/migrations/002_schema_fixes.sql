-- Align schema with component and API expectations

-- events: add theme and venue columns
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS theme TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS venue TEXT;

-- users: add cached stat columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS events_played INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS missions_completed INTEGER NOT NULL DEFAULT 0;

-- teams: rename score → total_score, add missions_completed
ALTER TABLE public.teams RENAME COLUMN score TO total_score;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS missions_completed INTEGER NOT NULL DEFAULT 0;

-- team_members: add role
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';

-- ai_feedback: rename _score suffix columns to clean names, rename feedback_text, add highlights
ALTER TABLE public.ai_feedback RENAME COLUMN accuracy_score TO accuracy;
ALTER TABLE public.ai_feedback RENAME COLUMN creativity_score TO creativity;
ALTER TABLE public.ai_feedback RENAME COLUMN teamwork_score TO teamwork;
ALTER TABLE public.ai_feedback RENAME COLUMN speed_score TO speed;
ALTER TABLE public.ai_feedback RENAME COLUMN presentation_score TO presentation;
ALTER TABLE public.ai_feedback RENAME COLUMN fun_factor_score TO fun_factor;
ALTER TABLE public.ai_feedback RENAME COLUMN feedback_text TO feedback;
ALTER TABLE public.ai_feedback ADD COLUMN IF NOT EXISTS highlights TEXT[] DEFAULT '{}';
