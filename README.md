# ⚡ ClueSprint AI

> **Turn the Office into an AI-Powered Adventure**

ClueSprint AI is a production-ready SaaS platform for running AI-powered team-based exploration games at corporate events, conferences, and innovation days. An AI Game Master dynamically generates stories, missions, hints, and cinematic endings — making every game unique.

---

## 🎮 What It Does

- **AI Game Master** — OpenAI GPT-4o creates unique storylines, mission sets, context-aware hints, real-time evaluation, and cinematic game-ending narrations
- **Live Multiplayer** — Supabase Realtime powers live leaderboards, score updates, and mission activations with zero-refresh experience
- **Multi-Media Submissions** — Teams submit photos, videos, and text; AI evaluates each one with 6-dimensional scoring
- **Boss Battles** — Dramatic final rounds that can flip the entire leaderboard
- **Gamification** — XP, levels, badges, achievements, and power-ups keep engagement high
- **Admin Dashboard** — Full event lifecycle management, live monitoring, analytics, and AI-assisted content generation

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │          Next.js 15 App (App Router)             │   │
│  │  Landing | Auth | Game Screens | Admin Dashboard │   │
│  └──────────────────┬──────────────────────────────┘   │
│                     │ API Routes                         │
│  ┌──────────────────▼──────────────────────────────┐   │
│  │              Supabase                            │   │
│  │  PostgreSQL + Auth + Storage + Realtime          │   │
│  └──────────────────┬──────────────────────────────┘   │
│                     │                                    │
│  ┌──────────────────▼──────────────────────────────┐   │
│  │              OpenAI GPT-4o                       │   │
│  │  Story Gen | Mission Gen | Evaluation | Narrator │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | TailwindCSS v3, ShadCN UI, Framer Motion |
| Backend | Next.js Route Handlers, Supabase Edge Functions |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Email, Google, Microsoft) |
| Storage | Supabase Storage (photos, videos) |
| Realtime | Supabase Realtime (WebSockets) |
| AI | OpenAI GPT-4o (chat + vision) |
| Deployment | Vercel + Supabase |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key

### 1. Clone & Install

```bash
git clone https://github.com/your-org/cluesprint-ai
cd cluesprint-ai
npm install
```

### 2. Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Or run directly in Supabase SQL editor:
# Copy contents of supabase/migrations/001_initial_schema.sql
```

### 4. Supabase Storage Buckets

In your Supabase dashboard, create two storage buckets:
- `submissions` — public access, 50MB file limit
- `avatars` — public access, 5MB file limit

### 5. OAuth Setup (Optional)

In Supabase Auth settings, enable:
- Google OAuth (add Client ID + Secret)
- Microsoft/Azure OAuth (add Client ID + Secret + Tenant URL)

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, Register, Forgot Password
│   ├── (game)/              # Player-facing game screens
│   │   ├── dashboard/       # Player home
│   │   ├── events/[id]/     # Lobby, Story, Mission, Submit, Leaderboard
│   │   │   ├── boss-battle/ # Final boss battle screen
│   │   │   └── results/     # Game over & celebration
│   │   ├── profile/
│   │   └── achievements/
│   ├── (admin)/             # Admin-only screens
│   │   └── admin/
│   │       ├── (dashboard)  # Overview + live monitor
│   │       ├── events/      # Event management
│   │       ├── analytics/   # Charts & insights
│   │       └── missions/    # Mission management
│   └── api/                 # Route handlers
│       ├── events/
│       ├── teams/
│       ├── missions/
│       ├── submissions/
│       ├── leaderboard/
│       ├── ai/              # AI endpoints
│       └── auth/
├── components/
│   ├── ui/                  # ShadCN base components
│   ├── game/                # Mission card, leaderboard, submission uploader...
│   ├── admin/               # Event form, team manager, submission review...
│   ├── shared/              # Typing effect, countdown timer, glass card...
│   └── layout/              # Navbar, sidebar, footer
├── lib/
│   ├── ai/                  # OpenAI service layer
│   │   ├── story-generator.ts
│   │   ├── mission-generator.ts
│   │   ├── submission-evaluator.ts
│   │   ├── hint-generator.ts
│   │   └── final-narrator.ts
│   ├── supabase/            # Client, server, admin, storage
│   ├── game/                # Scoring, achievements logic
│   └── utils.ts
├── hooks/                   # useRealtime, useLeaderboard, useMission, useTeam
├── types/                   # database.ts, game.ts, ai.ts
└── middleware.ts             # Auth protection + role routing
```

---

## 🎯 Core Game Flow

```
Admin Creates Event
       ↓
AI Generates Story (GPT-4o)
       ↓
Admin Sets Up Teams & Players Join
       ↓
Admin Starts Game → Story Intro Screen
       ↓
┌─────── GAME LOOP ────────┐
│  Admin Activates Mission  │
│         ↓                │
│  Teams Read Mission       │
│         ↓                │
│  Teams Submit Response    │
│  (photo/video/text)       │
│         ↓                │
│  AI Evaluates (GPT-4o)    │
│         ↓                │
│  Scores Update Live       │
│         ↓                │
│  Leaderboard Updates      │
└──────────────────────────┘
       ↓
Boss Battle (Final Round)
       ↓
AI Generates Final Narration
       ↓
Winner Announced 🏆
```

---

## 🤖 AI Scoring Rubric

Each submission receives 6 scores (0-10 each), max 60 total:

| Dimension | What It Measures |
|-----------|-----------------|
| **Accuracy** | How well the submission meets the mission brief |
| **Creativity** | Originality and imagination |
| **Teamwork** | Evidence of team collaboration |
| **Speed** | Submission time relative to time limit |
| **Presentation** | Quality and effort in the submission |
| **Fun Factor** | Entertainment and energy value |

Boss Battle scores are scaled to 50-100 points (high stakes).

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# or via CLI:
vercel env add OPENAI_API_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL
# ... etc
```

### Supabase Production

1. Create a new Supabase project for production
2. Run the migration: `supabase db push --linked`
3. Set up storage buckets (`submissions`, `avatars`)
4. Configure OAuth providers
5. Update `NEXT_PUBLIC_SUPABASE_URL` and keys in Vercel

---

## 🔐 Security

- Row Level Security (RLS) on all Supabase tables
- Admin routes protected by role check in middleware
- Service role key never exposed to client
- File uploads validated server-side (type + size)
- All API inputs validated with Zod schemas
- Auth tokens handled by Supabase SSR (httpOnly cookies)

---

## 📊 User Roles

| Role | Access |
|------|--------|
| **Player** | Join events, submit missions, view own team, see leaderboard |
| **Admin** | Everything + create/manage events, activate missions, review submissions, override scores |

---

## 🎮 Mission Types

| Type | Description | Submission |
|------|-------------|------------|
| **Discovery** | Find physical things representing concepts | Photo |
| **Creative** | Act, draw, pitch, or build something | Photo or Video |
| **Puzzle** | Riddles, logic problems, word puzzles | Text |
| **AI** | Use AI tools, then improve the output | Text |
| **Boss Battle** | Epic final challenge (any type) | Any |

---

## 📄 License

MIT © 2025 ClueSprint AI
