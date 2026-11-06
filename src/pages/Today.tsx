import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { HabitCard } from '@/components/today/HabitCard'
import { ProgressRing } from '@/components/today/ProgressRing'
import { Confetti } from '@/components/today/Confetti'
import { HabitForm } from '@/components/habit/HabitForm'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/Icon'
import { useData } from '@/context/DataContext'
import { getPhaseSettings, normalizePhases, phaseIncludes } from '@/lib/constants'
import { cn, fmtLong, todayStr } from '@/lib/utils'

type Filter = 'all' | 'morning' | 'afternoon' | 'evening' | 'unassigned'

export function TodayPage() {
  const { dueOn, isDoneOn, setCompleted, habits, stats, ready, error } = useData()
  const today = todayStr()
  const due = dueOn(today)
  const doneCount = due.filter((h) => isDoneOn(h.id, today)).length
  const allDone = due.length > 0 && doneCount === due.length
  const pct = due.length ? Math.round((doneCount / due.length) * 100) : 0

  const [formOpen, setFormOpen] = useState(false)
  const [bursts, setBursts] = useState(1)
  const wasAllDone = useRef(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [hideDone, setHideDone] = useState(false)
  const [search, setSearch] = useState('')
  const phases = getPhaseSettings()
  const focusPct = due.length ? Math.round((doneCount / due.length) * 100) : 0

  useEffect(() => {
    if (allDone && !wasAllDone.current) setBursts((b) => b + 1)
    wasAllDone.current = allDone
  }, [allDone])

  const toggle = (habitId: string, phase?: 'morning' | 'afternoon' | 'evening') =>
    setCompleted(habitId, today, !isDoneOn(habitId, today, phase), phase)

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()

    let list = due
    if (filter === 'unassigned') list = list.filter((h) => normalizePhases(h.phase).length === 0)
    else if (filter !== 'all') list = list.filter((h) => phaseIncludes(h.phase, filter))
    if (term) {
      list = list.filter((h) => {
        const haystack = `${h.title} ${h.description ?? ''}`.toLowerCase()
        return haystack.includes(term)
      })
    }
    if (hideDone) list = list.filter((h) => !isDoneOn(h.id, today))
    return list
  }, [due, filter, hideDone, isDoneOn, search, today])

  const grouped = phases.map((p) => {
    const habitsInPhase = visible.filter((h) => phaseIncludes(h.phase, p.id))
    const doneInPhase = habitsInPhase.filter((h) => isDoneOn(h.id, today, p.id)).length
    return { ...p, habits: habitsInPhase, done: doneInPhase }
  })
  const unassigned = visible.filter((h) => normalizePhases(h.phase).length === 0)

  return (
    <div className="relative mx-auto max-w-2xl px-4 pb-28 pt-6 sm:pb-10">
      {allDone && <Confetti key={bursts} />}

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          <Icon name="alert" size={16} />
          {error}
        </div>
      )}

      <header className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {fmtLong(today)}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {allDone ? 'Perfect day.' : 'Discipline.'}
          </h1>
        </div>
        {stats.currentStreak > 0 && (
          <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-700">
            <Icon name="flame" size={15} />
            {stats.currentStreak} day{stats.currentStreak === 1 ? '' : 's'}
          </div>
        )}
      </header>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <InsightCard label="Today" value={`${doneCount}/${due.length || 0}`} accent="emerald" />
        <InsightCard label="Streak" value={`${stats.currentStreak}d`} accent="amber" />
        <InsightCard label="Focus" value={`${focusPct}%`} accent="sky" />
      </div>

      <motion.div
        key={pct}
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8 flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-8 shadow-sm shadow-slate-900/5"
      >
        <ProgressRing value={pct} />
      </motion.div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-700">
          {due.length === 0
            ? 'Nothing scheduled today'
            : `${doneCount} of ${due.length} done`}
        </h2>
        <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
          <Icon name="plus" size={15} strokeWidth={2.2} />
          New habit
        </Button>
      </div>

      {due.length > 0 && (
        <div className="mb-5 space-y-3">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm shadow-slate-900/5">
            <Icon name="search" size={15} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search habits"
              className="w-full border-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-700"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
              <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
                All
              </FilterChip>
              {phases.map((p) => (
                <FilterChip
                  key={p.id}
                  active={filter === p.id}
                  onClick={() => setFilter(p.id)}
                  dot={p.color}
                >
                  {p.label}
                </FilterChip>
              ))}
              <FilterChip
                active={filter === 'unassigned'}
                onClick={() => setFilter('unassigned')}
              >
                Unassigned
              </FilterChip>
            </div>

            <button
              onClick={() => setHideDone((v) => !v)}
              aria-pressed={hideDone}
              className={cn(
                'ml-auto shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200',
                hideDone
                  ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200',
              )}
            >
              {hideDone ? 'Showing open' : 'Hide completed'}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {grouped.map((phase) => (
          <div key={phase.id}>
            {phase.habits.length > 0 && (
              <>
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ background: phase.color }}
                  />
                  <div>
                    <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                      <Icon
                        name={phase.id === 'morning' ? 'sun' : phase.id === 'afternoon' ? 'sparkles' : 'moon'}
                        size={15}
                      />
                      {phase.label}
                    </h3>
                    <p className="text-[10px] font-medium text-slate-400">{phase.timeRange}</p>
                  </div>
                  <span className="ml-auto text-xs font-semibold text-slate-400">
                    {phase.done}/{phase.habits.length}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {phase.habits.map((h, i) => (
                    <HabitCard
                      key={`${h.id}-${phase.id}`}
                      habit={h}
                      index={i}
                      done={isDoneOn(h.id, today, phase.id)}
                      onToggle={() => toggle(h.id, phase.id)}
                      phase={phase.id}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ))}

        {unassigned.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-slate-300" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Unassigned</h3>
                <p className="text-[10px] font-medium text-slate-400">Edit habit to assign a phase</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {unassigned.map((h, i) => (
                <HabitCard
                  key={h.id}
                  habit={h}
                  index={i}
                  done={isDoneOn(h.id, today)}
                  onToggle={() => toggle(h.id)}
                />
              ))}
            </div>
          </div>
        )}

        {habits.length === 0 && ready && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Icon name="target" size={26} />
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-900">No habits yet</h3>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
              Build a habit like a notebook entry — pick the days you're committing to.
            </p>
            <Button className="mt-6 shadow-sm shadow-emerald-900/20" onClick={() => setFormOpen(true)}>
              Start your first habit
            </Button>
          </div>
        )}

        {due.length === 0 && habits.length > 0 && (
          <p className="rounded-2xl border border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
            Rest day. Nothing scheduled for today — see you tomorrow.
          </p>
        )}

        {due.length > 0 && visible.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">Nothing to show</p>
            <p className="mt-1 text-xs text-slate-500">
              {hideDone
                ? 'Every habit in this filter is already completed. Nice work.'
                : 'No habits match this filter.'}
            </p>
          </div>
        )}
      </div>

      <HabitForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}

function InsightCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: 'emerald' | 'amber' | 'sky'
}) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    sky: 'bg-sky-50 text-sky-700',
  }

  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/5', colors[accent])}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-bold tabular-nums">{value}</p>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  dot,
  children,
}: {
  active: boolean
  onClick: () => void
  dot?: string
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200',
        active
          ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200',
      )}
    >
      {dot && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: dot, opacity: active ? 1 : 0.6 }}
        />
      )}
      {children}
    </button>
  )
}