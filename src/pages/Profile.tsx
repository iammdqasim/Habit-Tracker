import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ProgressRing } from '@/components/today/ProgressRing'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/Icon'
import { useData } from '@/context/DataContext'
import { dayStatus } from '@/lib/stats'
import { addDays, cn, fmtShort, todayStr } from '@/lib/utils'
import type { Completion, DayStatus, Habit } from '@/lib/types'

export function ProfilePage() {
  const { stats, habits, completions, toggleArchive, deleteHabit } = useData()
  const today = todayStr()
  const [archiveError, setArchiveError] = useState('')

  const chartData = useMemo(() => {
    const toValue = (date: string): number | null => {
      const st = dayStatus(date, habits, completions)
      if (st === 'neutral') return null
      if (st === 'all') return 1
      if (st === 'partial') return 0.5
      return 0
    }
    return Array.from({ length: 30 }, (_, i) => {
      const date = addDays(today, i - 29)
      return { label: fmtShort(date), value: toValue(date) }
    })
  }, [habits, completions, today])

  const archived = habits.filter((h) => h.archived)

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-6 sm:pb-10">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Progress</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-50">Profile</h1>
      </header>

      <div className="mb-4 flex items-center gap-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm shadow-black/20">
        <ProgressRing value={stats.disciplineScore} label="score" suffix="" size={116} />
        <div>
          <p className="text-sm font-bold text-slate-100">Discipline score</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            A blend of your streak and consistency — the higher the better.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Current streak" value={`${stats.currentStreak}`} sub="days" accent />
        <StatCard label="Longest streak" value={`${stats.longestStreak}`} sub="days" />
        <StatCard label="Active habits" value={habits.filter((h) => !h.archived).length.toLocaleString()} sub="tracked" />
        <StatCard label="Success rate" value={`${stats.successRate30}`} sub="last 30 days" />
      </div>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm shadow-black/20">
        <h2 className="mb-4 text-sm font-bold text-slate-200">Consistency — last 30 days</h2>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
              <defs>
                <linearGradient id="gradSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis domain={[0, 1]} ticks={[0, 1]} hide />
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 12,
                  fontSize: 12,
                  color: '#e2e8f0',
                  boxShadow: '0 10px 30px -12px rgb(15 23 42 / 0.25)',
                }}
                labelStyle={{ color: '#cbd5e1' }}
                formatter={(value) => {
                  if (value == null) return 'No habits'
                  if (value === 1) return 'Full schedule'
                  if (value === 0.5) return 'Partial schedule'
                  return 'Off track'
                }}
              />
              <Area
                type="stepAfter"
                dataKey="value"
                stroke="#34d399"
                strokeWidth={2}
                fill="url(#gradSuccess)"
                connectNulls={false}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <StreakHeatmap habits={habits} completions={completions} />

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm shadow-black/20">
        <h2 className="mb-4 text-sm font-bold text-slate-200">Habit breakdown</h2>
        {stats.habits.length === 0 ? (
          <p className="text-sm text-slate-400">No active habits yet.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {stats.habits.map(({ habit, rate, scheduled }) => (
              <li key={habit.id}>
                <div className="mb-1.5 flex items-center gap-2 text-sm">
                  <span
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                    style={{ background: `${habit.color}1a`, color: habit.color }}
                  >
                    <Icon name={habit.icon} size={15} />
                  </span>
                  <span className="flex-1 truncate font-semibold text-slate-100">{habit.title}</span>
                  <span className="tabular-nums text-xs text-slate-400">{scheduled} scheduled</span>
                  <span className="w-10 text-right text-xs font-bold tabular-nums" style={{ color: habit.color }}>
                    {rate}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${rate}%`, background: habit.color }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {archived.length > 0 && (
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm shadow-black/20">
          <h2 className="mb-3 text-sm font-bold text-slate-200">Archived ({archived.length})</h2>
          {archiveError && <p className="mb-3 text-xs font-medium text-red-400">{archiveError}</p>}
          <ul className="flex flex-col gap-2">
            {archived.map((h: Habit) => (
              <li key={h.id} className="flex items-center gap-2 text-sm text-slate-400">
                <span style={{ color: h.color }}>
                  <Icon name={h.icon} size={16} />
                </span>
                <span className="flex-1 truncate line-through">{h.title}</span>
                <Button variant="ghost" size="sm" onClick={() => toggleArchive(h)}>
                  Restore
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:bg-red-950/70"
                  onClick={async () => {
                    setArchiveError('')
                    try {
                      await deleteHabit(h.id)
                    } catch (err) {
                      setArchiveError(
                        err instanceof Error ? err.message : 'Delete failed — try again.',
                      )
                    }
                  }}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub: string
  accent?: boolean
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm shadow-black/20">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p
        className={
          accent ? 'mt-1 text-2xl font-bold tabular-nums text-amber-400' : 'mt-1 text-2xl font-bold tabular-nums text-slate-100'
        }
      >
        {value}
      </p>
      <p className="text-[10px] text-slate-400">{sub}</p>
    </div>
  )
}

const HEATMAP_WEEKS = 17
const HEATMAP_DAYS = HEATMAP_WEEKS * 7

const HEATMAP_COLORS: Record<DayStatus, string> = {
  all: 'bg-emerald-500',
  partial: 'bg-amber-500/70',
  missed: 'bg-zinc-700',
  neutral: 'bg-zinc-800/70',
}

function StreakHeatmap({ habits, completions }: { habits: Habit[]; completions: Completion[] }) {
  const today = todayStr()

  const cells = useMemo(() => {
    return Array.from({ length: HEATMAP_DAYS }, (_, i) => {
      const date = addDays(today, i - (HEATMAP_DAYS - 1))
      const status = dayStatus(date, habits, completions)
      return { date, status, isToday: date === today }
    })
  }, [habits, completions, today])

  return (
    <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm shadow-black/20">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-bold text-slate-200">Consistency heatmap</h2>
        <span className="text-[10px] text-slate-500">last {HEATMAP_WEEKS} weeks</span>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
          {cells.map((c) => (
            <div
              key={c.date}
              title={`${fmtShort(c.date)} — ${c.status}`}
              className={cn(
                'h-3 w-3 rounded-[3px] transition-colors',
                HEATMAP_COLORS[c.status],
                c.isToday && 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-950',
              )}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-slate-500">
        <span>Less</span>
        <span className="h-3 w-3 rounded-[3px] bg-zinc-800/70" />
        <span className="h-3 w-3 rounded-[3px] bg-zinc-700" />
        <span className="h-3 w-3 rounded-[3px] bg-amber-500/70" />
        <span className="h-3 w-3 rounded-[3px] bg-emerald-500" />
        <span>More</span>
      </div>
    </section>
  )
}
