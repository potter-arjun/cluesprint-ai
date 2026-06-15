'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Star, Trophy, Zap, CheckCircle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types/database'

interface FeedItem {
  id: string
  title: string
  message: string
  type: string
  created_at: string
}

function getIcon(type: string) {
  switch (type) {
    case 'achievement': return <Star className="w-4 h-4 text-yellow-400" />
    case 'score': return <Trophy className="w-4 h-4 text-blue-400" />
    case 'mission_complete': return <CheckCircle className="w-4 h-4 text-green-400" />
    case 'boss_battle': return <Zap className="w-4 h-4 text-purple-400" />
    default: return <Bell className="w-4 h-4 text-cyan-400" />
  }
}

function getColor(type: string) {
  switch (type) {
    case 'achievement': return 'border-yellow-500/30 bg-yellow-500/5'
    case 'score': return 'border-blue-500/30 bg-blue-500/5'
    case 'mission_complete': return 'border-green-500/30 bg-green-500/5'
    case 'boss_battle': return 'border-purple-500/30 bg-purple-500/5'
    default: return 'border-cyan-500/30 bg-cyan-500/5'
  }
}

export function LiveFeed() {
  const [notifications, setNotifications] = useState<FeedItem[]>([])
  const supabase = createClient()

  const addNotification = useCallback((n: FeedItem) => {
    setNotifications(prev => {
      // Avoid duplicates
      if (prev.some(p => p.id === n.id)) return prev
      const updated = [n, ...prev].slice(0, 5)
      return updated
    })
    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(p => p.id !== n.id))
    }, 6000)
  }, [])

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(p => p.id !== id))
  }, [])

  useEffect(() => {
    // Subscribe to realtime notifications
    const channel = supabase
      .channel('live-feed-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const row = payload.new as Notification
          addNotification({
            id: row.id,
            title: row.title,
            message: row.message,
            type: row.type,
            created_at: row.created_at,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, addNotification])

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            layout
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`pointer-events-auto glass-card px-4 py-3 rounded-xl border flex items-start gap-3 shadow-lg ${getColor(n.type)}`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {getIcon(n.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{n.title}</p>
              <p className="text-slate-400 text-xs leading-relaxed mt-0.5 line-clamp-2">{n.message}</p>
            </div>
            <button
              onClick={() => dismiss(n.id)}
              className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
