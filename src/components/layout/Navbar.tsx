'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown, LogOut, User, Zap, Star, LayoutDashboard, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User as DbUser } from '@/types/database'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/achievements', label: 'Achievements', icon: Star },
  { href: '/profile', label: 'Profile', icon: User },
]

export function Navbar() {
  const [navUser, setNavUser] = useState<DbUser | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { setLoading(false); return }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      setNavUser(profile ?? null)
      setLoading(false)
    }
    loadUser()
  }, [supabase])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  const initials = navUser?.name
    ? navUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : navUser?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
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
        {navUser && (
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href: rawHref, label }) => {
              const href = rawHref === '/dashboard' && navUser.role === 'admin' ? '/admin' : rawHref
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive(href)
                      ? 'text-blue-400 bg-blue-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )}
                >
                  {label}
                  {isActive(href) && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-400 rounded-full"
                    />
                  )}
                </Link>
              )
            })}
            {navUser.role === 'admin' && (
              <Link
                href="/admin"
                className={cn(
                  'relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5',
                  isActive('/admin')
                    ? 'text-purple-400 bg-purple-500/10'
                    : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
                )}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Panel
              </Link>
            )}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {!loading && navUser ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700/50"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
                >
                  {navUser.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={navUser.avatar_url} alt={initials} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-sm font-semibold text-slate-200 max-w-[110px] truncate">
                    {navUser.name ?? navUser.email}
                  </span>
                  <span className={cn(
                    'text-xs font-semibold uppercase tracking-wide',
                    navUser.role === 'admin' ? 'text-purple-400' : 'text-blue-400'
                  )}>
                    Lv.{navUser.level} {navUser.role}
                  </span>
                </div>
                <ChevronDown className={cn(
                  'w-4 h-4 text-slate-500 transition-transform duration-200',
                  dropdownOpen && 'rotate-180'
                )} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50"
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-700/60 mb-1">
                      <p className="text-white text-sm font-semibold truncate">{navUser.name}</p>
                      <p className="text-slate-500 text-xs truncate">{navUser.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      View Profile
                    </Link>
                    <Link
                      href="/achievements"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Star className="w-4 h-4" />
                      Achievements
                    </Link>
                    {navUser.role === 'admin' && (
                      <>
                        <div className="border-t border-slate-700/60 mt-1 pt-1" />
                        <Link
                          href="/admin"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      </>
                    )}
                    <div className="border-t border-slate-700/60 mt-1 pt-1" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : !loading ? (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
            >
              Sign In
            </Link>
          ) : null}

          {/* Mobile hamburger */}
          {navUser && (
            <button
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile slide-down */}
      <AnimatePresence>
        {mobileOpen && navUser && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-slate-900/98 border-b border-slate-700/50"
          >
            <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                    isActive(href)
                      ? 'text-blue-400 bg-blue-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
              <div className="border-t border-slate-700/50 mt-1 pt-1">
                {navUser.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
