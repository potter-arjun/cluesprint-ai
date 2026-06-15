'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col bg-slate-900 overflow-hidden">
      {/* Cyber-grid background */}
      <div className="absolute inset-0 cyber-grid pointer-events-none" />

      {/* Gradient orb — top-left blue */}
      <motion.div
        className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(37,99,235,0.25) 0%, rgba(37,99,235,0.08) 50%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{ y: [0, -24, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Gradient orb — bottom-right purple */}
      <motion.div
        className="absolute -bottom-32 -right-32 w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(124,58,237,0.22) 0%, rgba(124,58,237,0.07) 50%, transparent 70%)',
          filter: 'blur(48px)',
        }}
        animate={{ y: [0, 24, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />

      {/* Logo — top-left */}
      <header className="relative z-10 px-6 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity"
        >
          <span className="text-2xl">⚡</span>
          <span className="gradient-text">ClueSprint AI</span>
        </Link>
      </header>

      {/* Centered content */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        {children}
      </main>
    </div>
  )
}
