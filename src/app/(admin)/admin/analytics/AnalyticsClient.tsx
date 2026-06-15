'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import { TrendingUp, Trophy, Target } from 'lucide-react'

const COLORS = ['#2563EB', '#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EF4444']

interface AnalyticsClientProps {
  events: { id: string; name: string; status: string }[] | null
  submissionChart: { date: string; count: number }[]
  topTeams: { team_id: string; total_points: number; teams: unknown }[] | null
  missionBreakdown: { type: string; count: number }[]
}

export function AnalyticsClient({ submissionChart, topTeams, missionBreakdown }: AnalyticsClientProps) {
  const tooltipStyle = {
    backgroundColor: '#1E293B',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#E2E8F0',
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Analytics</h1>
        <p className="text-slate-400">Performance overview across all events</p>
      </div>

      {/* Submissions over time */}
      <div className="glass-card p-6 rounded-2xl border border-slate-700/50">
        <h2 className="text-white font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" /> Submissions Over Time
        </h2>
        {submissionChart.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No submission data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={submissionChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={false} name="Submissions" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mission Types */}
        <div className="glass-card p-6 rounded-2xl border border-slate-700/50">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" /> Mission Types
          </h2>
          {missionBreakdown.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No missions yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={missionBreakdown}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {missionBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Teams */}
        <div className="glass-card p-6 rounded-2xl border border-slate-700/50">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" /> Top Teams (All-Time)
          </h2>
          {!topTeams || topTeams.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No score data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topTeams.slice(0, 8)} layout="vertical">
                <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="team_id"
                  width={80}
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(_, i) => (topTeams[i] as { teams?: { name?: string } })?.teams?.name?.slice(0, 10) ?? 'Team'}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Score']} />
                <Bar dataKey="total_points" fill="#7C3AED" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
