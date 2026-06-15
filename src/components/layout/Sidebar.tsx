'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Target,
  BarChart3,
  Settings,
  Zap,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User as DbUser } from '@/types/database'

const navSections = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Manage',
    items: [
      { href: '/admin/events', label: 'Events', icon: Calendar, exact: false },
      { href: '/admin/teams', label: 'Teams', icon: Users, exact: false },
      { href: '/admin/missions', label: 'Missions', icon: Target, exact: false },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, exact: false },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: Settings, exact: false },
    ],
  },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState<DbUser | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      setUser(profile ?? null)
    }
    loadUser()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative flex flex-col h-full bg-slate-900 border-r border-slate-700/50 overflow-hidden shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-700/50 shrink-0">
        <Link href="/admin" className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-bold text-sm bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap overflow-hidden"
              >
                ClueSprint AI
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-6 px-2">
        {navSections.map((section) => (
          <div key={section.label}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500"
                >
                  {section.label}
                </motion.p>
              )}
            </AnimatePresence>

            <ul className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact)
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      title={collapsed ? label : undefined}
                      className={cn(
                        'group flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors relative',
                        active
                          ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800 border-l-2 border-transparent'
                      )}
                    >
                      <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200')} />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="whitespace-nowrap overflow-hidden"
                          >
                            {label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom user section */}
      <div className="shrink-0 border-t border-slate-700/50 p-2 space-y-1">
        <div className={cn('flex items-center gap-2 px-2 py-2 rounded-lg', collapsed && 'justify-center')}>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt={initials} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <p className="text-xs font-medium text-slate-200 truncate">
                  {user?.name ?? user?.email ?? 'Loading...'}
                </p>
                <p className="text-[10px] text-purple-400 font-semibold uppercase tracking-wide">Admin</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign Out' : undefined}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute top-[72px] -right-3 w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-600 transition-colors z-10"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  )
}
