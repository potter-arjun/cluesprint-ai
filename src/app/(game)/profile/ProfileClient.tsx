'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  Trophy,
  Target,
  Star,
  Zap,
  Users,
  BarChart2,
  CheckCircle,
  Loader2,
  Camera,
  Flag,
  Shield,
  Bot,
  Palette,
  Edit3,
  Save,
  X,
  Medal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User } from '@/types/database'
import { toast } from 'sonner'

// ─── Helpers ──────────────────────────────────────────────────

function getLevelXP(level: number) {
  return level * 1000
}

function getLevelTitle(level: number) {
  if (level >= 20) return 'Legendary'
  if (level >= 15) return 'Master'
  if (level >= 10) return 'Expert'
  if (level >= 7) return 'Elite'
  if (level >= 5) return 'Veteran'
  if (level >= 3) return 'Skilled'
  return 'Rookie'
}

function getAchievementIcon(icon: string) {
  const map: Record<string, React.ReactNode> = {
    flag: <Flag className="w-4 h-4" />,
    star: <Star className="w-4 h-4" />,
    zap: <Zap className="w-4 h-4" />,
    palette: <Palette className="w-4 h-4" />,
    users: <Users className="w-4 h-4" />,
    bot: <Bot className="w-4 h-4" />,
    shield: <Shield className="w-4 h-4" />,
    camera: <Camera className="w-4 h-4" />,
  }
  return map[icon] ?? <Star className="w-4 h-4" />
}

function getRarityColor(rarity: string) {
  switch (rarity) {
    case 'legendary': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
    case 'epic': return 'text-purple-400 bg-purple-400/10 border-purple-400/30'
    case 'rare': return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
    default: return 'text-slate-300 bg-slate-400/10 border-slate-400/30'
  }
}

// ─── Props ────────────────────────────────────────────────────

interface AchievementWithBadge {
  id: string
  earned_at: string
  badges: {
    id: string
    name: string
    description: string
    icon: string
  } | null
}

interface UserStats {
  eventsPlayed: number
  missionsCompleted: number
  totalScore: number
  avgScore: number
  totalXP: number
  currentLevel: number
  achievements: number
  badgesEarned: number
}

interface Props {
  user: User
  achievements: AchievementWithBadge[]
  stats: UserStats
}

// ─── Stat Cell ────────────────────────────────────────────────

function StatCell({ label, value, icon: Icon, color }: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:border-slate-600/60 transition-colors">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: color + '18', border: `1px solid ${color}33` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-white font-bold text-lg leading-tight">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        <p className="text-slate-500 text-xs">{label}</p>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────

export function ProfileClient({ user, achievements, stats }: Props) {
  const supabase = createClient()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user.name || '')
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? '')
  const fileRef = useRef<HTMLInputElement>(null)

  const xpNeeded = getLevelXP(user.level)
  const xpPercent = Math.min((user.xp / xpNeeded) * 100, 100)
  const levelTitle = getLevelTitle(user.level)

  async function handleSave() {
    if (!name.trim()) {
      toast.error('Name cannot be empty')
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('users')
      .update({ name: name.trim(), avatar_url: avatarUrl || null })
      .eq('id', user.id)

    if (error) {
      toast.error('Failed to save profile')
    } else {
      toast.success('Profile updated!')
      setIsEditing(false)
    }
    setSaving(false)
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Max 2MB.')
      return
    }
    setAvatarUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(urlData.publicUrl)
      toast.success('Avatar uploaded!')
    } catch {
      toast.error('Upload failed')
    } finally {
      setAvatarUploading(false)
    }
  }

  const joinedDate = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-700/50"
      >
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="relative group flex-shrink-0">
            <div
              className="w-24 h-24 rounded-2xl border-2 border-blue-500/40 flex items-center justify-center text-4xl font-black text-white overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name?.charAt(0)?.toUpperCase() ?? 'P'
              )}
            </div>
            {isEditing && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={avatarUploading}
                className="absolute inset-0 rounded-2xl bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {avatarUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-6 h-6" />
                    <span className="text-xs mt-1">Change</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3 mb-4">
                <div>
                  <Label className="text-slate-400 text-xs mb-1.5">Display Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-slate-800/50 border-slate-600 text-white focus:border-blue-500/50 max-w-sm"
                    maxLength={60}
                  />
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">{user.name || 'Player'}</h1>
                <p className="text-slate-400 text-sm mb-2">{user.email}</p>
              </>
            )}

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{ background: 'linear-gradient(135deg, #2563EB22, #7C3AED22)', color: '#93c5fd', border: '1px solid #2563EB44' }}
              >
                Level {user.level} {levelTitle}
              </span>
              <Badge variant="secondary" className="capitalize text-xs">{user.role}</Badge>
              <span className="text-slate-500 text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Joined {joinedDate}
              </span>
            </div>

            {/* XP Progress */}
            <div className="max-w-sm">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-blue-400" />
                  {user.xp.toLocaleString()} XP
                </span>
                <span>Level {user.level + 1} at {xpNeeded.toLocaleString()} XP</span>
              </div>
              <Progress value={xpPercent} className="h-2.5 bg-slate-700" />
              <p className="text-slate-500 text-xs mt-1">{Math.round(xpPercent)}% complete</p>
            </div>
          </div>

          {/* Edit / Save buttons */}
          <div className="flex gap-2 flex-shrink-0">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  size="sm"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" />Save</>}
                </Button>
                <Button
                  onClick={() => { setIsEditing(false); setName(user.name || '') }}
                  size="sm"
                  variant="outline"
                  className="border-slate-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:text-white hover:border-slate-500"
              >
                <Edit3 className="w-4 h-4 mr-1.5" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-400" />
          Player Statistics
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCell label="Events Played" value={stats.eventsPlayed} icon={Calendar} color="#06B6D4" />
          <StatCell label="Missions Done" value={stats.missionsCompleted} icon={Target} color="#7C3AED" />
          <StatCell label="Total Score" value={stats.totalScore} icon={Trophy} color="#2563EB" />
          <StatCell label="Avg Score" value={stats.avgScore} icon={BarChart2} color="#10B981" />
          <StatCell label="Total XP" value={stats.totalXP} icon={Zap} color="#F59E0B" />
          <StatCell label="Current Level" value={`Lv. ${stats.currentLevel}`} icon={Star} color="#EF4444" />
          <StatCell label="Achievements" value={stats.achievements} icon={CheckCircle} color="#8B5CF6" />
          <StatCell label="Badges Earned" value={stats.badgesEarned} icon={Medal} color="#F97316" />
        </div>
      </motion.section>

      {/* Achievements Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Achievements Earned
          </h2>
          <span className="text-slate-400 text-sm">{achievements.length} unlocked</span>
        </div>

        {achievements.length === 0 ? (
          <div className="glass-card p-10 rounded-xl border border-slate-700/50 text-center">
            <Star className="w-12 h-12 mx-auto mb-3 text-slate-600 opacity-60" />
            <p className="text-slate-400 font-medium">No achievements yet</p>
            <p className="text-slate-500 text-sm mt-1">Play events and complete missions to earn achievements</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {achievements.map((ach, i) => (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.06 }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium cursor-default',
                  getRarityColor('common')
                )}
                title={`${ach.badges?.description ?? ''} • Earned ${new Date(ach.earned_at).toLocaleDateString()}`}
              >
                {getAchievementIcon(ach.badges?.icon ?? 'star')}
                <span>{ach.badges?.name ?? 'Achievement'}</span>
                <span className="text-xs opacity-60 ml-1">
                  {new Date(ach.earned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>
    </div>
  )
}
