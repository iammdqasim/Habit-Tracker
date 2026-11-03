import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

interface MenuItem {
  label: string
  onClick: () => void
  icon?: string
  danger?: boolean
}

interface MenuProps {
  trigger: ReactNode
  items: MenuItem[]
  align?: 'left' | 'right'
  triggerClassName?: string
}

export function Menu({ trigger, items, align = 'right', triggerClassName }: MenuProps) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={triggerClassName}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Habit actions"
      >
        {trigger}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={close} />
            <motion.div
              role="menu"
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className={cn(
                'absolute z-50 mt-1 min-w-44 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-1 shadow-xl shadow-black/30',
                align === 'right' ? 'right-0' : 'left-0',
              )}
            >
              {items.map((item) => (
                <button
                  key={item.label}
                  role="menuitem"
                  onClick={() => {
                    close()
                    item.onClick()
                  }}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors',
                    item.danger
                      ? 'text-red-400 hover:bg-red-950/60'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white',
                  )}
                >
                  {item.icon && <Icon name={item.icon} size={15} />}
                  {item.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}