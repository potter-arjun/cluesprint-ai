'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import {
  Bot,
  Trophy,
  Camera,
  Swords,
  Star,
  BarChart2,
  Zap,
  ArrowRight,
  Play,
  CheckCircle,
  Users,
  Calendar,
  ChevronRight,
  Sparkles,
  Shield,
  Globe,
  Twitter,
  Github,
  Linkedin,
  Menu,
  X,
} from 'lucide-react'
import AnimatedCounter from "@/components/shared/AnimatedCounter"

/* ─────────────────── helpers ─────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: 'easeOut' },
  }),
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = true,
}: {
  eyebrow?: string
  title: React.ReactNode
  subtitle?: string
  center?: boolean
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeUp}
      className={center ? 'text-center' : ''}
    >
      {eyebrow && (
        <p className="text-sm font-semibold tracking-widest uppercase text-blue-400 mb-3">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
      )}
    </motion.div>
  )
}

/* ─────────────────── Navigation ─────────────────── */

function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">
            <span className="text-white">ClueSprint</span>
            <span className="gradient-text"> AI</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'How It Works', 'Pricing', 'About'].map((item) => (
            <Link
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm text-slate-400 hover:text-white transition-colors duration-200 font-medium"
            >
              {item}
            </Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200 rounded-lg hover:bg-slate-800"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
              boxShadow: '0 0 16px rgba(37,99,235,0.35)',
            }}
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden absolute top-16 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 px-4 py-4 space-y-2"
        >
          {['Features', 'How It Works', 'Pricing', 'About'].map((item) => (
            <Link
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
            >
              {item}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-700/50 flex gap-2">
            <Link
              href="/login"
              className="flex-1 text-center px-4 py-2 text-sm font-medium text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="flex-1 text-center px-4 py-2 text-sm font-semibold text-white rounded-lg"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
            >
              Get Started
            </Link>
          </div>
        </motion.div>
      )}
    </nav>
  )
}

/* ─────────────────── Hero Section ─────────────────── */

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-900 pt-16">
      {/* Cyber grid */}
      <div className="absolute inset-0 cyber-grid opacity-50" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-900" />

      {/* Animated floating orbs */}
      <motion.div
        className="absolute top-1/4 left-1/5 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(37, 99, 235, 0.15)' }}
        animate={{ y: [0, -25, 0], x: [0, 10, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/5 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(124, 58, 237, 0.15)' }}
        animate={{ y: [0, 20, 0], x: [0, -15, 0], scale: [1, 0.95, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(6, 182, 212, 0.08)' }}
        animate={{ y: [0, -15, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: text */}
        <div className="text-center lg:text-left">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-300 text-sm font-medium mb-8"
          >
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Team Experience
          </motion.div>

          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.65 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6"
          >
            <span className="text-white">Turn the Office</span>
            <br />
            <span className="text-white">Into</span>{' '}
            <span className="gradient-text">an AI-Powered</span>
            <br />
            <span className="gradient-text">Adventure</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.55 }}
            className="text-slate-400 text-lg sm:text-xl leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0"
          >
            ClueSprint AI brings teams together through AI-driven missions, live leaderboards, and
            epic boss battles. Your AI Game Master never sleeps.
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-4"
          >
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-base transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                boxShadow: '0 0 24px rgba(37,99,235,0.5), 0 0 48px rgba(124,58,237,0.2)',
              }}
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-slate-300 border border-slate-600 hover:border-slate-400 hover:text-white transition-all duration-200 hover:bg-slate-800/50"
            >
              <Play className="w-4 h-4 fill-current" />
              Watch Demo
            </button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex items-center gap-6 mt-10 justify-center lg:justify-start flex-wrap"
          >
            {[
              { icon: Shield, text: 'Enterprise Ready' },
              { icon: CheckCircle, text: 'No CC Required' },
              { icon: Globe, text: 'Deploy in Minutes' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-slate-500 text-sm">
                <Icon className="w-3.5 h-3.5 text-slate-500" />
                {text}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: hero mock UI */}
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.7, ease: 'easeOut' }}
          className="hidden lg:block"
        >
          <HeroMockUI />
        </motion.div>
      </div>
    </section>
  )
}

function HeroMockUI() {
  const teams = [
    { rank: 1, name: 'Team Quantum', score: 2840, delta: '+120', color: '#FFD700' },
    { rank: 2, name: 'Neural Nomads', score: 2615, delta: '+95', color: '#C0C0C0' },
    { rank: 3, name: 'Circuit Breakers', score: 2390, delta: '+80', color: '#CD7F32' },
    { rank: 4, name: 'Pixel Pirates', score: 2100, delta: '+60', color: '#60a5fa' },
    { rank: 5, name: 'Data Drifters', score: 1875, delta: '+45', color: '#a78bfa' },
  ]

  return (
    <div
      className="relative"
      style={{ filter: 'drop-shadow(0 0 40px rgba(37,99,235,0.3)) drop-shadow(0 0 80px rgba(124,58,237,0.15))' }}
    >
      {/* Main leaderboard card */}
      <div className="glass-card p-6 rounded-2xl border border-slate-700/60">
        {/* Card header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Live Leaderboard</p>
            <h3 className="text-white font-bold text-lg">The Missing AI</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-medium">LIVE</span>
          </div>
        </div>

        {/* Mission progress */}
        <div className="mb-5 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Mission 4 of 7</span>
            <span className="text-xs text-blue-400 font-medium">57% Complete</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #2563EB, #7C3AED)' }}
              initial={{ width: '0%' }}
              animate={{ width: '57%' }}
              transition={{ delay: 0.8, duration: 1.2, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Team rows */}
        <div className="space-y-2">
          {teams.map((team, i) => (
            <motion.div
              key={team.rank}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                i === 0 ? 'bg-yellow-500/5 border border-yellow-500/20' : 'hover:bg-slate-700/30'
              }`}
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ color: team.color, background: `${team.color}18`, border: `1px solid ${team.color}40` }}
              >
                {team.rank}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{team.name}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-white">{team.score.toLocaleString()}</p>
                <p className="text-xs text-green-400">{team.delta}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between">
          <span className="text-xs text-slate-500">Boss Battle in</span>
          <span
            className="text-sm font-bold font-mono px-3 py-1 rounded"
            style={{
              color: '#06B6D4',
              background: 'rgba(6,182,212,0.1)',
              border: '1px solid rgba(6,182,212,0.3)',
            }}
          >
            12:47
          </span>
        </div>
      </div>

      {/* Floating notification badge */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="absolute -top-4 -right-4 glass-card px-3 py-2 rounded-xl border border-green-500/30 bg-green-500/5"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-semibold whitespace-nowrap">
            New submission +95 pts
          </span>
        </div>
      </motion.div>

      {/* Floating AI badge */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.4, duration: 0.4 }}
        className="absolute -bottom-4 -left-4 glass-card px-3 py-2 rounded-xl border border-purple-500/30 bg-purple-500/5"
      >
        <div className="flex items-center gap-2">
          <Bot className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs text-purple-400 font-semibold whitespace-nowrap">
            AI evaluating...
          </span>
        </div>
      </motion.div>
    </div>
  )
}

/* ─────────────────── Features Section ─────────────────── */

const features = [
  {
    icon: Bot,
    color: '#2563EB',
    bgColor: 'rgba(37,99,235,0.1)',
    borderColor: 'rgba(37,99,235,0.3)',
    title: 'AI Game Master',
    desc: 'Dynamically creates stories, missions, hints and scores every game — no two games are ever the same.',
  },
  {
    icon: Trophy,
    color: '#EAB308',
    bgColor: 'rgba(234,179,8,0.1)',
    borderColor: 'rgba(234,179,8,0.3)',
    title: 'Live Leaderboard',
    desc: 'Real-time rankings update instantly as teams complete missions, keeping every player on edge.',
  },
  {
    icon: Camera,
    color: '#06B6D4',
    bgColor: 'rgba(6,182,212,0.1)',
    borderColor: 'rgba(6,182,212,0.3)',
    title: 'Multi-Media Submissions',
    desc: 'Teams submit photos, videos, and text for AI evaluation with instant creative scoring feedback.',
  },
  {
    icon: Swords,
    color: '#EF4444',
    bgColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
    title: 'Boss Battles',
    desc: 'Epic final rounds that can flip the entire leaderboard — keeping every team in the game until the last second.',
  },
  {
    icon: Star,
    color: '#A855F7',
    bgColor: 'rgba(168,85,247,0.1)',
    borderColor: 'rgba(168,85,247,0.3)',
    title: 'Achievements & Badges',
    desc: 'Unlock rewards for creativity, speed, and teamwork. Every contribution is recognized and celebrated.',
  },
  {
    icon: BarChart2,
    color: '#22C55E',
    bgColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.3)',
    title: 'Analytics Dashboard',
    desc: 'Deep insights into engagement, performance, and creativity — perfect for measuring team-building ROI.',
  },
]

function FeaturesSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="features" className="py-24 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why ClueSprint AI"
          title={
            <>
              Built for the{' '}
              <span className="gradient-text">Future of Work</span>
            </>
          }
          subtitle="Every feature is designed to maximize engagement, creativity, and team connection — powered by AI from start to finish."
        />

        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feat) => (
            <motion.div
              key={feat.title}
              variants={fadeUp}
              className="group glass-card p-6 rounded-xl hover:border-slate-600/80 transition-all duration-300 hover:-translate-y-1"
              style={{
                borderColor: 'rgba(51,65,85,0.5)',
              }}
              whileHover={{
                boxShadow: `0 0 30px ${feat.color}20, 0 4px 24px rgba(0,0,0,0.4)`,
              }}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: feat.bgColor,
                  border: `1px solid ${feat.borderColor}`,
                }}
              >
                <feat.icon className="w-6 h-6" style={{ color: feat.color }} />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{feat.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ─────────────────── How It Works Section ─────────────────── */

const steps = [
  {
    number: '01',
    icon: Calendar,
    title: 'Create Your Event',
    desc: 'Admin sets up teams and the AI generates a unique story, missions, and scoring rubric tailored to your company.',
    color: '#2563EB',
  },
  {
    number: '02',
    icon: Users,
    title: 'Teams Play Live',
    desc: 'Missions activate one by one. Teams submit creative responses — photos, videos, text — all scored by AI in real time.',
    color: '#7C3AED',
  },
  {
    number: '03',
    icon: Zap,
    title: 'AI Judges Everything',
    desc: 'Real-time scoring, AI feedback, live leaderboard updates, and a boss battle finale that flips rankings in the final minutes.',
    color: '#06B6D4',
  },
]

function HowItWorksSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="how-it-works" className="py-24 bg-slate-800/30 relative overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 cyber-grid opacity-20" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="The Process"
          title={
            <>
              How ClueSprint AI{' '}
              <span className="gradient-text">Works</span>
            </>
          }
          subtitle="From setup to epic finale in minutes. No IT required, no complex configuration — just pure game."
        />

        {/* Steps */}
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 relative"
        >
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-cyan-500/40" />
          <div className="hidden md:block absolute top-10 left-0 right-2/3 h-px bg-gradient-to-r from-transparent to-blue-500/40" />

          {steps.map((step, i) => (
            <motion.div key={step.number} variants={fadeUp} custom={i} className="relative">
              {/* Number + icon circle */}
              <div className="flex flex-col items-center md:items-start">
                <div
                  className="relative w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${step.color}20, ${step.color}05)`,
                    border: `2px solid ${step.color}40`,
                    boxShadow: `0 0 24px ${step.color}20`,
                  }}
                >
                  <step.icon className="w-8 h-8" style={{ color: step.color }} />
                  <div
                    className="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                    style={{
                      background: `linear-gradient(135deg, ${step.color}, ${step.color}aa)`,
                      color: '#fff',
                    }}
                  >
                    {i + 1}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 text-center md:text-left">
                  {step.title}
                </h3>
                <p className="text-slate-400 leading-relaxed text-center md:text-left">
                  {step.desc}
                </p>

                {/* Arrow (desktop) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-4 top-8 z-10">
                    <ChevronRight
                      className="w-6 h-6"
                      style={{ color: `${step.color}80` }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ─────────────────── Story Themes Section ─────────────────── */

const themes = [
  {
    emoji: '🤖',
    title: 'The Missing AI',
    desc: 'Your company AI has gone offline. Teams must recover fragments of knowledge hidden throughout the office before time runs out.',
    tag: 'Mystery',
    gradient: 'from-blue-600/20 to-blue-900/20',
    border: 'border-blue-500/30',
    accent: '#2563EB',
    glowClass: 'glow-blue',
  },
  {
    emoji: '⚠️',
    title: 'Rogue Innovation',
    desc: 'An experimental AI has escaped its testing environment. Complete missions and hack terminals to regain control of the system.',
    tag: 'Thriller',
    gradient: 'from-purple-600/20 to-purple-900/20',
    border: 'border-purple-500/30',
    accent: '#7C3AED',
    glowClass: 'glow-purple',
  },
  {
    emoji: '🚀',
    title: 'Future Office 2050',
    desc: 'Teams travel through time solving workplace challenges in this epic sci-fi adventure across alternate corporate timelines.',
    tag: 'Sci-Fi',
    gradient: 'from-cyan-600/20 to-cyan-900/20',
    border: 'border-cyan-500/30',
    accent: '#06B6D4',
    glowClass: 'glow-cyan',
  },
]

function StoryThemesSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-24 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Story Themes"
          title={
            <>
              Every Game Tells a{' '}
              <span className="gradient-text">Different Story</span>
            </>
          }
          subtitle="Our AI Game Master weaves a unique narrative into every event. Choose a theme or let the AI surprise you."
        />

        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {themes.map((theme) => (
            <motion.div
              key={theme.title}
              variants={fadeUp}
              className={`relative group rounded-2xl p-6 bg-gradient-to-br ${theme.gradient} border ${theme.border} transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden`}
              whileHover={{
                boxShadow: `0 0 40px ${theme.accent}30, 0 8px 32px rgba(0,0,0,0.5)`,
              }}
            >
              {/* Background glow blob */}
              <div
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-40"
                style={{ background: theme.accent }}
              />

              <div className="relative z-10">
                {/* Emoji + tag */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{theme.emoji}</span>
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{
                      color: theme.accent,
                      background: `${theme.accent}15`,
                      border: `1px solid ${theme.accent}40`,
                    }}
                  >
                    {theme.tag}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{theme.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-5">{theme.desc}</p>

                <button
                  className="flex items-center gap-1.5 text-sm font-semibold transition-colors duration-200 group-hover:gap-2.5"
                  style={{ color: theme.accent }}
                >
                  Explore Theme
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ─────────────────── Stats Section ─────────────────── */

const stats = [
  { target: 50, suffix: '+', label: 'Companies', icon: Globe },
  { target: 10000, suffix: '+', label: 'Players', icon: Users },
  { target: 500, suffix: '+', label: 'Events Hosted', icon: Calendar },
  { target: 98, suffix: '%', label: 'Would Recommend', icon: Star },
]

function StatsSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-slate-900 to-purple-900/20" />
      <div className="absolute inset-0 cyber-grid opacity-20" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center text-sm font-semibold tracking-widest uppercase text-slate-500 mb-12"
        >
          Trusted by Industry Leaders
        </motion.p>

        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="text-center glass-card py-8 px-4 rounded-xl"
            >
              <stat.icon className="w-6 h-6 mx-auto mb-3 text-slate-500" />
              <div className="text-4xl font-black mb-1">
                <AnimatedCounter
                  value={stat.target}
                  suffix={stat.suffix}
                  className="gradient-text"
                />
              </div>
              <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ─────────────────── Testimonials Section ─────────────────── */

const testimonials = [
  {
    quote:
      'The most engaging team event we\'ve ever run. The AI feedback was hilarious and spot-on. Every single person was glued to the leaderboard.',
    name: 'Sarah M.',
    role: 'Head of People',
    company: 'TechCorp',
    avatar: 'SM',
    color: '#2563EB',
  },
  {
    quote:
      'Our conference session turned into an epic adventure. Every team had a completely different experience — the AI storytelling is genuinely impressive.',
    name: 'James K.',
    role: 'Events Director',
    company: 'Momentum Events',
    avatar: 'JK',
    color: '#7C3AED',
  },
  {
    quote:
      'The boss battle at the end had everyone on their feet. Absolute chaos in the best way. We\'re doing this at every all-hands from now on.',
    name: 'Lisa T.',
    role: 'Innovation Lead',
    company: 'FutureWorks',
    avatar: 'LT',
    color: '#06B6D4',
  },
]

function TestimonialsSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-24 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="What People Are Saying"
          title={
            <>
              Teams Love{' '}
              <span className="gradient-text">ClueSprint AI</span>
            </>
          }
        />

        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              className="glass-card p-6 rounded-xl flex flex-col gap-4 hover:border-slate-600/80 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-slate-300 text-sm leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-slate-700/50">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}88)` }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{t.name}</p>
                  <p className="text-slate-500 text-xs">
                    {t.role}, {t.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ─────────────────── Final CTA Section ─────────────────── */

function CTASection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) setSubmitted(true)
  }

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-slate-900 to-purple-900/30" />
      <div className="absolute inset-0 cyber-grid opacity-30" />

      {/* Orbs */}
      <div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: '#2563EB' }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: '#7C3AED' }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div variants={fadeUp}>
            <Sparkles className="w-10 h-10 mx-auto mb-6 text-blue-400 opacity-80" />
          </motion.div>

          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight"
          >
            Ready to Transform Your{' '}
            <span className="gradient-text">Next Event?</span>
          </motion.h2>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-slate-400 text-lg mb-10 leading-relaxed"
          >
            Join hundreds of companies running unforgettable AI-powered team experiences.
            Set up your first game in under 5 minutes.
          </motion.p>

          {!submitted ? (
            <motion.form
              variants={fadeUp}
              custom={3}
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email"
                required
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl font-bold text-white text-sm transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap"
                style={{
                  background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                  boxShadow: '0 0 20px rgba(37,99,235,0.4)',
                }}
              >
                Get Early Access
              </button>
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-3 text-green-400 text-lg font-semibold"
            >
              <CheckCircle className="w-6 h-6" />
              You&apos;re on the list! We&apos;ll be in touch soon.
            </motion.div>
          )}

          <motion.p
            variants={fadeUp}
            custom={4}
            className="text-slate-600 text-sm mt-4"
          >
            No credit card required &bull; Deploy in minutes
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}

/* ─────────────────── Footer ─────────────────── */

const footerLinks = {
  Product: ['Features', 'How It Works', 'Pricing', 'Changelog'],
  Company: ['About', 'Blog', 'Careers', 'Press'],
  Resources: ['Documentation', 'API Reference', 'Community', 'Status'],
  Legal: ['Privacy', 'Terms', 'Cookies', 'Security'],
}

function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
              >
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-lg">
                <span className="text-white">ClueSprint</span>
                <span className="gradient-text"> AI</span>
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed mb-5">
              Turn the Office into an AI-Powered Adventure. The game master that never sleeps.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-600 transition-all duration-200 hover:bg-slate-700"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white text-sm font-semibold mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-slate-500 hover:text-slate-300 text-sm transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-sm">
            &copy; {new Date().getFullYear()} ClueSprint AI. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-slate-600 text-sm">
            <span>Made with</span>
            <span className="text-red-500">&#9829;</span>
            <span>for teams everywhere</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ─────────────────── Main Page ─────────────────── */

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-900">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <StoryThemesSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  )
}
