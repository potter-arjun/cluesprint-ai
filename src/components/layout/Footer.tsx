'use client'
import Link from 'next/link'
import { Zap } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex flex-col items-center sm:items-start gap-1">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-sm bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                ClueSprint AI
              </span>
            </div>
            <p className="text-xs text-slate-500">Turn the Office into an AI-Powered Adventure</p>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-5">
            <Link
              href="/privacy"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/support"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Support
            </Link>
          </nav>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-600">
            &copy; 2025 ClueSprint AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
