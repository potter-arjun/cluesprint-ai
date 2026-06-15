import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatScore(score: number): string {
  return score.toLocaleString()
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function getTeamColor(index: number): string {
  const palette = [
    '#2563EB',
    '#7C3AED',
    '#059669',
    '#DC2626',
    '#D97706',
    '#0891B2',
    '#7C3AED',
    '#DB2777',
    '#65A30D',
    '#EA580C',
  ]
  return palette[index % palette.length]
}

export function getRankSuffix(rank: number): string {
  if (rank === 1) return '1st'
  if (rank === 2) return '2nd'
  if (rank === 3) return '3rd'
  return `${rank}th`
}

export function calculateXP(score: number): number {
  // 10 XP per point, plus a completion bonus of 50 XP when score > 0
  const base = score * 10
  const completionBonus = score > 0 ? 50 : 0
  return base + completionBonus
}

export function getLevel(xp: number): number {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500]
  let level = 1
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) {
      level = i + 1
    } else {
      break
    }
  }
  return level
}

export function getLevelName(level: number): string {
  const names: Record<number, string> = {
    1: 'Rookie',
    2: 'Explorer',
    3: 'Scout',
    4: 'Detective',
    5: 'Agent',
    6: 'Specialist',
    7: 'Expert',
    8: 'Elite',
    9: 'Master',
    10: 'Legend',
  }
  return names[level] ?? 'Legend'
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

export function generateEventCode(): string {
  // Exclude ambiguous characters: 0, O, 1, I, L
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function getMissionTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    discovery: 'camera',
    creative: 'palette',
    puzzle: 'puzzle',
    ai: 'bot',
  }
  return icons[type] ?? 'star'
}

export function getMissionTypeColor(type: string): string {
  const colors: Record<string, string> = {
    discovery: 'neon-cyan',
    creative: 'cyber-purple',
    puzzle: 'electric-blue',
    ai: 'green-500',
  }
  return colors[type] ?? 'gray-400'
}
