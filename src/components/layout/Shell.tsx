import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TodayPage } from '@/pages/Today'
import { CalendarPage } from '@/pages/Calendar'
import { ProfilePage } from '@/pages/Profile'
import { useAuth } from '@/context/AuthContext'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

type View = 'today' | 'calendar' | 'profile'
type Theme = 'light' | 'dark'

const NAV: { id: View; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: 'bolt' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'profile', label: 'Profile', icon: 'chart' },
]

const THEME_KEY = 'discipline-theme'

export function Shell() {
  const [view, setView] = useState<View>('today')
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark'
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const { user, signOutUser } = useAuth()
  const isDark = theme === 'dark'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
    localStorage.setItem(THEME_KEY, theme)
  }, [isDark, theme])

  return (
    <div className={cn('flex min-h-dvh transition-colors duration-300', isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100/80 text-slate-900')}>
      <aside className={cn('fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r p-5 shadow-[12px_0_30px_-20px_rgba(15,23,42,0.25)] backdrop-blur-xl lg:flex', isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/90')}>
        <div className="mb-8 flex items-center justify-between gap-3 px-1 pt-1">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <span className={cn('block text-[17px] font-bold tracking-tight', isDark ? 'text-slate-50' : 'text-slate-900')}>Discipline</span>
              <span className={cn('text-[10px] font-medium uppercase tracking-[0.22em]', isDark ? 'text-slate-400' : 'text-slate-400')}>Habit OS</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className={cn(
              'grid h-9 w-9 place-items-center rounded-xl border transition-colors',
              isDark ? 'border-slate-700 bg-slate-800 text-amber-300 hover:border-slate-600' : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300',
            )}
          >
            <span className="text-base leading-none">{isDark ? '☀' : '☾'}</span>
          </button>
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
                  : isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-xl border transition-colors',
                  view === item.id
                    ? 'border-white/30 bg-white/10 text-white'
                    : isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-500',
                )}
              >
                <Icon name={item.icon} size={16} />
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          <div className={cn('rounded-3xl border p-3 shadow-sm', isDark ? 'border-slate-800 bg-slate-950/80 shadow-black/30' : 'border-slate-200 bg-gradient-to-br from-slate-50 via-white to-emerald-50 shadow-slate-900/5')}>
            <div className="flex items-center gap-3">
              <Avatar email={user?.email ?? '?'} />
              <div className="min-w-0">
                <p className={cn('truncate text-sm font-semibold', isDark ? 'text-slate-100' : 'text-slate-800')}>
                  {user?.displayName ?? 'Habit keeper'}
                </p>
                <p className={cn('truncate text-[11px]', isDark ? 'text-slate-400' : 'text-slate-500')}>{user?.email}</p>
              </div>
            </div>
            <button
              onClick={signOutUser}
              className={cn('mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-colors', isDark ? 'border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-600 hover:text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900')}
            >
              <Icon name="logout" size={13} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:pl-72">
        <main className={cn('min-h-dvh', isDark ? 'bg-slate-950' : 'bg-slate-100/80')}>
          <div className="mx-auto max-w-2xl px-4 pt-4 lg:px-6">
            <div className="mb-3 flex justify-end lg:hidden">
              <button
                type="button"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold',
                  isDark ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-white text-slate-700',
                )}
              >
                <span>{isDark ? '☀' : '☾'}</span>
                {isDark ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
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

      <nav className={cn('fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden', isDark ? 'border-slate-800 bg-slate-900/85' : 'border-slate-200 bg-white/85')}>
        <div className={cn('grid grid-cols-3 backdrop-blur-xl', isDark ? 'bg-slate-900/95' : 'bg-white/95')}>
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-all duration-200',
                view === item.id ? 'text-emerald-600' : isDark ? 'text-slate-400' : 'text-slate-400',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-xl',
                  view === item.id ? 'bg-emerald-100 text-emerald-600' : isDark ? 'bg-slate-800 text-slate-300' : 'bg-transparent',
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