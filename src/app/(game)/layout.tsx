import { Navbar } from '@/components/layout/Navbar'
import { LiveFeed } from '@/components/layout/LiveFeed'

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-slate-900">
      {/* Cyber grid background overlay */}
      <div className="fixed inset-0 cyber-grid opacity-30 pointer-events-none" />
      {/* Ambient gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/5 via-transparent to-purple-900/5 pointer-events-none" />

      <Navbar />

      <main className="relative z-10 pt-16">
        {children}
      </main>

      {/* Live feed notifications — bottom right */}
      <LiveFeed />
    </div>
  )
}
