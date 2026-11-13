import { describe, expect, it } from 'vitest'
import { computeStreaks } from './streak'
import { completionTone, computeStats, dayStatus, isDone } from './stats'
import { normalizePhases, phaseIncludes } from './constants'
import type { Completion, Habit } from './types'

describe('computeStreaks', () => {
  it('counts consecutive successful days back from today', () => {
    expect(computeStreaks(['all', 'all', 'all'])).toEqual({ current: 3, longest: 3 })
  })

  it('anchors on yesterday when today is not done yet', () => {
    expect(computeStreaks(['all', 'all', 'all', 'missed'])).toEqual({ current: 3, longest: 3 })
  })

  it('a past missed day resets the current streak to 0', () => {
    expect(computeStreaks(['all', 'all', 'missed', 'missed', 'neutral'])).toEqual({
      current: 0,
      longest: 2,
    })
  })

  it('tracks longest across gaps', () => {
    expect(computeStreaks(['all', 'all', 'all', 'missed', 'all', 'all', 'neutral', 'all'])).toEqual({
      current: 3,
      longest: 3,
    })
  })

  it('neutral days never break a run', () => {
    expect(
      computeStreaks(['missed', 'all', 'all', 'neutral', 'all', 'all', 'neutral', 'neutral', 'missed']),
    ).toEqual({ current: 4, longest: 4 })
  })

  it('partial day breaks a run', () => {
    expect(computeStreaks(['all', 'all', 'partial', 'neutral'])).toEqual({ current: 0, longest: 2 })
  })

  it('empty history => zero streaks', () => {
    expect(computeStreaks([])).toEqual({ current: 0, longest: 0 })
  })
})

const habit = (id: string, days: number[]): Habit => ({
  id,
  title: id,
  color: '#10b981',
  icon: 'target',
  scheduledDays: days,
  createdAt: '2026-08-01T00:00:00.000Z',
  archived: false,
})

const done = (habitId: string, date: string) => ({ habitId, date, completedAt: 'x' })

describe('completionTone', () => {
  it('uses green for full completion, yellow for 30-99%, and red for under 30%', () => {
    expect(completionTone(0, 2)).toBe('red')
    expect(completionTone(1, 2)).toBe('yellow')
    expect(completionTone(2, 2)).toBe('green')
    expect(completionTone(0, 0)).toBe('neutral')
  })
})

describe('dayStatus', () => {
  const habits = [habit('a', [0, 2, 4]), habit('b', [0, 3])] // Sun, Tue, Thu / Sun, Wed

  it('neutral when nothing scheduled that day', () => {
    expect(dayStatus('2026-08-07', habits, [])).toBe('neutral') // Friday
  })

  it('missed when scheduled but nothing done', () => {
    expect(dayStatus('2026-08-11', habits, [])).toBe('missed') // Tuesday
  })

  it('partial when some done', () => {
    expect(dayStatus('2026-08-09', habits, [done('a', '2026-08-09')])).toBe('partial') // Sunday, 2 due
  })

  it('all when every scheduled habit done', () => {
    expect(dayStatus('2026-08-09', habits, [done('a', '2026-08-09'), done('b', '2026-08-09')])).toBe(
      'all',
    )
  })

  it('neutral before a habit was created', () => {
    const late = { ...habit('c', [0, 1, 2, 3, 4, 5, 6]), createdAt: '2026-08-10T00:00:00.000Z' }
    expect(dayStatus('2026-08-09', [late], [])).toBe('neutral')
  })
})

describe('multi-phase habits', () => {
  it('normalizes both single and multiple-phase values', () => {
    expect(normalizePhases('morning')).toEqual(['morning'])
    expect(normalizePhases(['morning', 'evening'])).toEqual(['morning', 'evening'])
    expect(normalizePhases(undefined)).toEqual([])
  })

  it('recognizes a habit that belongs to multiple phases', () => {
    expect(phaseIncludes(['morning', 'afternoon'], 'afternoon')).toBe(true)
    expect(phaseIncludes(['morning', 'afternoon'], 'evening')).toBe(false)
  })

  it('keeps completion separate by phase for the same habit', () => {
    const completions: Completion[] = [
      { habitId: 'habit-1', date: '2026-08-09', completedAt: 'x', phase: 'morning' },
    ]
    expect(isDone(completions, 'habit-1', '2026-08-09', 'morning')).toBe(true)
    expect(isDone(completions, 'habit-1', '2026-08-09', 'evening')).toBe(false)
  })
})

describe('computeStats', () => {
  it('weekend-only habit: neutral weekdays never block the streak', () => {
    const weekend = [habit('w', [0, 6])]
    const completions = [
      done('w', '2026-08-01'), // Sat
      done('w', '2026-08-02'), // Sun
      done('w', '2026-08-08'), // Sat
      done('w', '2026-08-09'), // Sun
    ]
    const stats = computeStats(weekend, completions, '2026-08-13')
    expect(stats.currentStreak).toBe(4)
    expect(stats.longestStreak).toBe(4)
    expect(stats.successRate30).toBe(100)
  })

  it('includes today in the streak once completed', () => {
    const daily = [habit('d', [0, 1, 2, 3, 4, 5, 6])]
    const completions = [done('d', '2026-08-12'), done('d', '2026-08-13')]
    const stats = computeStats(daily, completions, '2026-08-13')
    expect(stats.currentStreak).toBe(2)
    expect(stats.longestStreak).toBe(2)
  })

  it('a missed day resets the current streak once it is in the past', () => {
    const daily = [habit('d', [0, 1, 2, 3, 4, 5, 6])]
    const completions = [
      done('d', '2026-08-08'),
      done('d', '2026-08-09'),
      done('d', '2026-08-11'),
      done('d', '2026-08-12'),
    ]
    const stats = computeStats(daily, completions, '2026-08-14') // Aug 13 missed, in the past
    expect(stats.currentStreak).toBe(0)
    expect(stats.longestStreak).toBe(2)
  })

  it('archived habits are ignored', () => {
    const archived = { ...habit('a', [0, 1, 2, 3, 4, 5, 6]), archived: true }
    const completions = [done('a', '2026-08-12'), done('a', '2026-08-11')]
    const stats = computeStats([archived], completions, '2026-08-13')
    expect(stats.currentStreak).toBe(0)
    expect(stats.totalCompletions).toBe(0)
  })

  it('per-habit completion rate counts only scheduled days', () => {
    const mwf = [habit('m', [1, 3, 5])] // Mon, Wed, Fri
    const completions = [
      done('m', '2026-08-10'), // Mon
      done('m', '2026-08-12'), // Wed
    ]
    const stats = computeStats(mwf, completions, '2026-08-13')
    const rate = stats.habits[0]
    expect(rate.scheduled).toBe(5) // Aug 3, 5, 7, 10, 12
    expect(rate.completed).toBe(2)
    expect(rate.rate).toBe(40)
  })

  it('one tick moves the discipline score (never frozen)', () => {
    const daily = [
      habit('a', [0, 1, 2, 3, 4, 5, 6]),
      habit('b', [0, 1, 2, 3, 4, 5, 6]),
      habit('c', [0, 1, 2, 3, 4, 5, 6]),
    ]
    const before = computeStats(daily, [], '2026-08-13')
    const after = computeStats(daily, [done('a', '2026-08-13')], '2026-08-13')
    expect(after.disciplineScore).toBeGreaterThan(before.disciplineScore)
    expect(after.successRate30).toBeGreaterThan(0)
  })

  it('success rate gives partial days partial credit', () => {
    const two = [habit('a', [0, 1, 2, 3, 4, 5, 6]), habit('b', [0, 1, 2, 3, 4, 5, 6])]
    const stats = computeStats(two, [done('a', '2026-08-13')], '2026-08-13')
    // 1 of 2 habits ticked today => 1/26 habit-days in the window, not 0%
    expect(stats.successRate30).toBe(4)
  })
})
