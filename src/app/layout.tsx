import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: { default: 'ClueSprint AI', template: '%s | ClueSprint AI' },
  description: 'Turn the Office into an AI-Powered Adventure — Team-based AI game master for corporate events',
  keywords: ['team building', 'scavenger hunt', 'AI game', 'corporate events', 'office game'],
  openGraph: {
    title: 'ClueSprint AI',
    description: 'Turn the Office into an AI-Powered Adventure',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className + ' bg-slate-900 text-white antialiased'}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
