import type { Completion, DayStatus, Habit, Phase, Stats } from './types'
import { addDays, isScheduled, todayStr } from './utils'
import { computeStreaks } from './streak'

export function isDone(
  completions: readonly Completion[],
  habitId: string,
  date: string,
  phase?: Phase,
): boolean {
  const completionSet = new Set(
    completions
      .filter((c) => c.habitId === habitId && c.date === date)
      .map((c) => c.phase ?? '__all__'),
  )

  if (phase == null) return completionSet.size > 0
  return completionSet.has(phase) || completionSet.has('__all__')
}

export function completionTone(done: number, total: number): 'green' | 'yellow' | 'red' | 'neutral' {
  if (total <= 0) return 'neutral'
  const percent = (done / total) * 100
  if (percent >= 100) return 'green'
  if (percent >= 30) return 'yellow'
  return 'red'
}

export function activeHabits(habits: readonly Habit[]): Habit[] {
  return habits.filter((h) => !h.archived)
}

/**
 * Status of a single day. A habit only counts from its creation date
 * onward, so calendar cells before a habit existed read as 'neutral'.
 */
export function dayStatus(
  date: string,
  habits: readonly Habit[],
  completions: readonly Completion[],
): DayStatus {
  const due = habits.filter(
    (h) => !h.archived && h.createdAt.slice(0, 10) <= date && isScheduled(h, date),
  )
  if (due.length === 0) return 'neutral'
  const done = due.filter((h) => isDone(completions, h.id, date)).length
  if (done === due.length) return 'all'
  if (done > 0) return 'partial'
  return 'missed'
}

/** Derive all stats from raw habits + completions. Pure — unit-testable. */
export function computeStats(
  habits: readonly Habit[],
  completions: readonly Completion[],
  today: string = todayStr(),
): Stats {
  const active = activeHabits(habits)

  // Timeline runs from the earliest habit creation to today.
  const start = active.reduce(
    (min, h) => (h.createdAt.slice(0, 10) < min ? h.createdAt.slice(0, 10) : min),
    today,
  )
  const statuses: DayStatus[] = []
  for (let d = start; d <= today; d = addDays(d, 1)) {
    statuses.push(dayStatus(d, active, completions))
  }
  const { current, longest } = computeStreaks(statuses)

  // 30-day rate per scheduled habit-day, so a single tick always moves the score.
  // ponytail: day-level all-or-nothing gave partial days zero credit — score looked frozen
  let sched30 = 0
  let ok30 = 0
  for (let i = 29; i >= 0; i--) {
    const d = addDays(today, -i)
    for (const h of active) {
      if (h.createdAt.slice(0, 10) > d || !isScheduled(h, d)) continue
      sched30++
      if (isDone(completions, h.id, d)) ok30++
    }
  }
  const successRate30 = sched30 ? Math.round((ok30 / sched30) * 100) : 0

  const totalCompletions = completions.filter((c) => active.some((h) => h.id === c.habitId)).length

  const rateList = active.map((h) => {
    let scheduled = 0
    let completed = 0
    let d = h.createdAt.slice(0, 10)
    while (d <= today) {
      if (isScheduled(h, d)) {
        scheduled++
        if (isDone(completions, h.id, d)) completed++
      }
      d = addDays(d, 1)
    }
    return {
      habit: h,
      completed,
      scheduled,
      rate: scheduled ? Math.round((completed / scheduled) * 100) : 0,
    }
  })

  // ponytail: simple gamified heuristic; tweak weights to taste
  const disciplineScore = Math.min(
    100,
    Math.round(
      Math.min(current, 30) * 1.5 + successRate30 * 0.4 + Math.min(totalCompletions, 100) * 0.15,
    ),
  )

  return {
    currentStreak: current,
    longestStreak: longest,
    totalCompletions,
    successRate30,
    disciplineScore,
    habits: rateList,
  }
}
