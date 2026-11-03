import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TodayPage } from '@/pages/Today'
import { CalendarPage } from '@/pages/Calendar'
import { ProfilePage } from '@/pages/Profile'
import { useAuth } from '@/context/AuthContext'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

type View = 'today' | 'calendar' | 'profile'

const NAV: { id: View; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: 'bolt' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'profile', label: 'Profile', icon: 'chart' },
]

export function Shell() {
  const [view, setView] = useState<View>('today')
  const { user, signOutUser } = useAuth()

  return (
    <div className="flex min-h-dvh bg-slate-100/80">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-slate-200 bg-white/90 p-5 shadow-[12px_0_30px_-20px_rgba(15,23,42,0.25)] backdrop-blur-xl lg:flex">
        <div className="mb-8 flex items-center gap-3 px-1 pt-1">
          <LogoMark />
          <div>
            <span className="block text-[17px] font-bold tracking-tight text-slate-900">Discipline</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-400">
              Habit OS
            </span>
          </div>
        </div>

        <nav className="space-y-1.5">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={cn(
                'flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                view === item.id
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-xl border transition-colors',
                  view === item.id
                    ? 'border-white/30 bg-white/10 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-500',
                )}
              >
                <Icon name={item.icon} size={16} />
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-3 shadow-sm shadow-slate-900/5">
            <div className="flex items-center gap-3">
              <Avatar email={user?.email ?? '?'} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {user?.displayName ?? 'Habit keeper'}
                </p>
                <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={signOutUser}
              className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
            >
              <Icon name="logout" size={13} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:pl-72">
        <main>
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {view === 'today' && <TodayPage />}
              {view === 'calendar' && <CalendarPage />}
              {view === 'profile' && <ProfilePage />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-3 bg-white/95 backdrop-blur-xl">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-all duration-200',
                view === item.id ? 'text-emerald-600' : 'text-slate-400',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-xl',
                  view === item.id ? 'bg-emerald-100 text-emerald-600' : 'bg-transparent',
                )}
              >
                <Icon name={item.icon} size={19} />
              </span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

export function LogoMark() {
  return (
    <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-600 shadow-sm shadow-emerald-600/30">
      <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
        <path d="M10 7v18M10 7l12 9-12 9" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function Avatar({ email }: { email: string }) {
  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
      {(email || '?').charAt(0).toUpperCase()}
    </div>
  )
}