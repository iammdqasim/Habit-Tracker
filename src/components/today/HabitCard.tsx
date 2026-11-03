import { useState } from 'react'
import { motion } from 'framer-motion'
import { HabitForm } from '@/components/habit/HabitForm'
import { Menu } from '@/components/ui/menu'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/Icon'
import { useData } from '@/context/DataContext'
import { DAY_ORDER, phaseColor } from '@/lib/constants'
import type { Habit } from '@/lib/types'
import { cn } from '@/lib/utils'

interface HabitCardProps {
  habit: Habit
  index: number
}

export function HabitCard({ habit, index }: HabitCardProps) {
  const { toggleArchive, deleteHabit } = useData()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const remove = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteHabit(habit.id)
      setConfirming(false)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed — try again.')
      setDeleting(false)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        'group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 transition-colors hover:border-slate-300',
        habit.phase ? 'border-l-4' : '',
      )}
      style={habit.phase ? { borderLeftColor: phaseColor(habit.phase) } : undefined}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${habit.color}1a`, color: habit.color }}
          >
            <Icon name={habit.icon} size={15} />
          </span>
          <h3 className="truncate text-sm font-bold text-slate-900">{habit.title}</h3>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {habit.description && (
            <span className="mr-1 truncate text-xs text-slate-500">{habit.description}</span>
          )}
          {DAY_ORDER.filter((d) => habit.scheduledDays.includes(d.wd)).map(({ label, wd }) => (
            <span
              key={wd}
              className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <Menu
        triggerClassName="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        trigger={<Icon name="more" size={16} />}
        items={[
          { label: 'Edit', onClick: () => setEditing(true), icon: 'edit' },
          {
            label: habit.archived ? 'Restore' : 'Archive',
            onClick: () => toggleArchive(habit),
            icon: habit.archived ? 'restore' : 'archive',
          },
          { label: 'Delete', onClick: () => setConfirming(true), icon: 'trash', danger: true },
        ]}
      />

      <Modal
        open={confirming}
        onClose={() => {
          if (!deleting) setConfirming(false)
        }}
        title="Delete habit?"
      >
        <p className="text-sm leading-relaxed text-slate-500">
          Delete <span className="font-semibold text-slate-800">{habit.title}</span>? This removes
          the habit and its saved history. This can't be undone.
        </p>
        {deleteError && (
          <p className="mt-3 text-xs font-medium text-red-600">{deleteError}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirming(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={remove} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>

      <HabitForm open={editing} onClose={() => setEditing(false)} habit={habit} />
    </motion.div>
  )
}