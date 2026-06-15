'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Sparkles, ChevronRight } from 'lucide-react'
import { AITypingEffect } from '@/components/shared/AITypingEffect'
import { Button } from '@/components/ui/button'

interface StoryIntroProps {
  title: string
  content: string
  keyElements?: string[]
  onComplete: () => void
}

export function StoryIntro({ title, content, keyElements = [], onComplete }: StoryIntroProps) {
  const [phase, setPhase] = useState<'title' | 'content' | 'elements' | 'done'>('title')

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 cyber-grid opacity-20" />
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.1, 0.2] }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        {/* AI Game Master label */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <div className="w-12 h-12 rounded-full bg-blue-600/20 border-2 border-blue-500/40 flex items-center justify-center">
            <Bot className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-left">
            <p className="text-blue-400 font-bold text-sm uppercase tracking-widest">AI Game Master</p>
            <p className="text-slate-400 text-xs">Transmitting story briefing...</p>
          </div>
        </motion.div>

        {/* Story Title */}
        <AnimatePresence>
          {(phase === 'title' || phase === 'content' || phase === 'elements' || phase === 'done') && (
            <motion.h1
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
              onAnimationComplete={() => setPhase('content')}
              className="text-4xl md:text-5xl font-black text-white mb-8"
              style={{
                textShadow: '0 0 30px rgba(37,99,235,0.5)',
              }}
            >
              {title}
            </motion.h1>
          )}
        </AnimatePresence>

        {/* Story Content */}
        {(phase === 'content' || phase === 'elements' || phase === 'done') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-6 rounded-2xl mb-6 text-left"
          >
            <AITypingEffect
              text={content}
              speed={18}
              onComplete={() => setPhase('elements')}
              className="text-slate-300 text-lg leading-relaxed"
              showCursor={phase === 'content'}
            />
          </motion.div>
        )}

        {/* Key Elements */}
        {(phase === 'elements' || phase === 'done') && keyElements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <p className="text-slate-400 text-sm uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Key Mission Elements
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {keyElements.map((element, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  onAnimationComplete={() => { if (i === keyElements.length - 1) setPhase('done') }}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-cyan-600/20 text-cyan-300 border border-cyan-500/30"
                >
                  {element}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Begin Button */}
        <AnimatePresence>
          {phase === 'done' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <Button
                variant="cyber"
                size="xl"
                onClick={onComplete}
                className="gap-2 group"
              >
                Begin The Adventure
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
