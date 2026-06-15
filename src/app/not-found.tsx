'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, AlertTriangle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-slate-900 flex items-center justify-center overflow-hidden">
      {/* Cyber grid background */}
      <div className="absolute inset-0 cyber-grid opacity-40" />

      {/* Animated radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[600px] h-[600px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #2563EB 0%, #7C3AED 50%, transparent 70%)',
            animation: 'pulse-glow 3s ease-in-out infinite',
          }}
        />
      </div>

      {/* Scan line effect */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 1 }}
      >
        <div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
          style={{ animation: 'scan-line 4s linear infinite' }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* 404 glitch number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring', bounce: 0.3 }}
          className="mb-6"
        >
          <h1
            className="glitch text-[10rem] font-black leading-none select-none neon-text-blue"
            data-text="404"
            style={{ letterSpacing: '-0.05em' }}
          >
            404
          </h1>
        </motion.div>

        {/* Warning icon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex items-center justify-center gap-3 mb-4"
        >
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Page Not Found</h2>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="text-slate-400 text-lg mb-10 leading-relaxed"
        >
          The AI couldn&apos;t find what you&apos;re looking for.
          <br />
          <span className="text-slate-500 text-base">
            This page may have been moved, deleted, or perhaps it never existed in this timeline.
          </span>
        </motion.p>

        {/* Glitch terminal box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="glass-card p-4 mb-8 text-left font-mono text-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
            <span className="ml-2 text-slate-500 text-xs">ai-game-master.log</span>
          </div>
          <p className="text-green-400">
            <span className="text-slate-500">$</span> AI_SEARCH --deep --path=&quot;unknown&quot;
          </p>
          <p className="text-slate-400 mt-1">
            <span className="text-blue-400">[INFO]</span> Scanning all known game dimensions...
          </p>
          <p className="text-slate-400 mt-1">
            <span className="text-amber-400">[WARN]</span> Route not found in current dimension
          </p>
          <p className="text-red-400 mt-1">
            <span className="text-red-500">[ERROR]</span> 404 — Mission location does not exist
          </p>
          <p className="text-cyan-400 mt-1 animate-pulse">
            <span className="text-slate-500">$</span> <span className="border-r-2 border-cyan-400 pr-1">_</span>
          </p>
        </motion.div>

        {/* Back to home button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.5 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
              boxShadow: '0 0 20px rgba(37,99,235,0.4), 0 0 40px rgba(124,58,237,0.2)',
            }}
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </motion.div>

        {/* Floating orbs */}
        <motion.div
          className="absolute top-10 left-10 w-24 h-24 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: '#2563EB' }}
          animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: '#7C3AED' }}
          animate={{ y: [0, 15, 0], scale: [1, 0.95, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}
