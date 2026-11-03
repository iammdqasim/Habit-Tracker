import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/Icon'
import { useData } from '@/context/DataContext'
import { DAY_ORDER } from '@/lib/constants'
import { fmtLong, toDateStr, todayStr } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function CalendarPage() {
  const { dueOn, ready } = useData()
  const today = todayStr()
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selected, setSelected] = useState<string | null>(null)

  const cells = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
    const startOffset = (first.getDay() + 6) % 7
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(first.getFullYear(), first.getMonth(), 1 - startOffset + i)
      return d
    })
  }, [viewMonth])

  const shift = (n: number) =>
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + n, 1))

  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-6 sm:pb-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Overview</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-50">Calendar</h1>
        </div>
        <div className="flex items-center gap-1 rounded-2xl border border-slate-700 bg-slate-900 p-1 shadow-sm shadow-black/20">
          <button
            onClick={() => shift(-1)}
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-xl text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            aria-label="Previous month"
          >
            <Icon name="chevronLeft" size={16} />
          </button>
          <span className="min-w-32 text-center text-sm font-bold text-slate-100">{monthLabel}</span>
          <button
            onClick={() => shift(1)}
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-xl text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            aria-label="Next month"
          >
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </header>

      {ready && (
        <motion.div
          key={viewMonth.toISOString()}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-800 bg-slate-900/80 p-3 shadow-sm shadow-black/20 sm:p-4"
        >
          <div className="mb-2 grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {DAY_ORDER.map((d) => (
              <span key={d.wd}>{d.label}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              const dateStr = toDateStr(d)
              const inMonth = d.getMonth() === viewMonth.getMonth()
              const isToday = dateStr === today
              const hasHabits = dueOn(dateStr).length > 0

              return (
                <button
                  key={i}
                  onClick={() => setSelected(dateStr)}
                  className={cn(
                    'group relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-sm transition-colors hover:border-slate-700 hover:bg-slate-900',
                    !inMonth && 'opacity-40',
                  )}
                >
                  {isToday && (
                    <span className="absolute inset-0 rounded-xl ring-2 ring-inset ring-emerald-500/70" />
                  )}
                  <span className={cn('font-semibold text-slate-200', isToday && 'text-white')}>
                    {d.getDate()}
                  </span>
                  <span
                    className={cn(
                      'mt-1 h-1.5 w-1.5 rounded-full',
                      hasHabits ? 'bg-emerald-500' : 'bg-slate-600 group-hover:bg-slate-500',
                    )}
                  />
                </button>
              )
            })}
          </div>
        </motion.div>
      )}

      <DayDetailModal date={selected} onClose={() => setSelected(null)} />

      <div className="mt-6">
        <Button variant="outline" size="sm" onClick={() => setSelected(today)} className="border-slate-700 bg-slate-900 text-slate-100 hover:border-slate-600 hover:bg-slate-800">
          View today
        </Button>
      </div>
    </div>
  )
}

function DayDetailModal({ date, onClose }: { date: string | null; onClose: () => void }) {
  const { dueOn, habits } = useData()
  if (!date) return null

  const due = dueOn(date)

  return (
    <Modal
      open={Boolean(date)}
      onClose={onClose}
      title={fmtLong(date)}
      className={due.length > 2 ? 'max-h-[85vh] overflow-y-auto' : ''}
    >
      {due.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No habits scheduled for this day.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {due.map((h) => (
            <li key={h.id}>
              <div className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-left">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${h.color}1a`, color: h.color }}
                >
                  <Icon name={h.icon} size={15} />
                </span>
                <span className="text-sm font-medium text-slate-100">{h.title}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {habits.length === 0 && (
        <p className="text-center text-xs text-slate-400">Create habits from the Today tab.</p>
      )}
    </Modal>
  )
}
