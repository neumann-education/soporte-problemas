import type { RouteKey, SessionUser } from '../types'
import { getAllowedRoutes } from '../types'

interface SidebarProps {
  currentRoute: RouteKey
  onRouteChange: (route: RouteKey) => void
  isOpen: boolean
  onClose: () => void
  onLogout: () => void
  user: SessionUser
}

const routes: Array<{ key: RouteKey; label: string; icon: string }> = [
  { key: 'bandeja', label: 'Bandeja de Tickets', icon: 'confirmation_number' },
  { key: 'mi-ticket', label: 'Mis tickets', icon: 'receipt_long' },
  { key: 'usuarios', label: 'Listado Usuarios', icon: 'person_search' },
  { key: 'nuevo-ticket', label: 'Nuevo Ticket', icon: 'add_circle' },
]

export default function Sidebar({
  currentRoute,
  onRouteChange,
  isOpen,
  onClose,
  onLogout,
  user,
}: SidebarProps) {
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)

  const allowedRoutes = getAllowedRoutes(user.role)
  const visibleRoutes = routes.filter((item) =>
    allowedRoutes.includes(item.key),
  )

  return (
    <>
      {isOpen && (
        <div
          className='fixed inset-0 z-40 bg-black/40 md:hidden'
          onClick={onClose}
        />
      )}

      <aside className='hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 z-50'>
        <div className='p-6 border-b border-slate-200 dark:border-slate-800'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white'>
              <span className='material-symbols-outlined'>build</span>
            </div>
            <div>
              <h1 className='text-2xl font-black text-violet-700 dark:text-violet-500 tracking-tight'>
                Neumann
              </h1>
              <p className='text-[10px] uppercase tracking-widest text-on-surface-variant font-bold'>
                Soporte TI
              </p>
            </div>
          </div>
        </div>

        <nav className='flex-1 mt-4'>
          {visibleRoutes.map((item) => {
            const active = currentRoute === item.key
            return (
              <button
                key={item.key}
                type='button'
                onClick={() => onRouteChange(item.key)}
                className={`w-full text-left flex items-center gap-3 px-6 py-4 transition-all ${
                  active
                    ? 'bg-primary/30 text-primary font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-primary/20 hover:text-primary'
                }`}
              >
                <span className='material-symbols-outlined'>{item.icon}</span>
                <span className="font-['Manrope'] uppercase tracking-widest text-[11px] font-bold">
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>

        <div className='p-6 mt-auto space-y-3'>
          <button
            type='button'
            onClick={onLogout}
            className='w-full py-3 px-4 bg-slate-100 text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 transition-all'
          >
            <span className='material-symbols-outlined text-sm'>logout</span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[85vw] max-w-xs bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-4 transition-transform duration-200 md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className='mb-6'>
          <div className='flex items-center justify-end mb-4'>
            <button
              type='button'
              aria-label='Cerrar menú'
              onClick={onClose}
              className='p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800'
            >
              <span className='material-symbols-outlined'>close</span>
            </button>
          </div>

          <div className='flex flex-col items-center gap-3   border-slate-200/70 dark:border-slate-800/70  p-1'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-primary-container text-primary font-semibold'>
              {initials}
            </div>
            <div className='text-center'>
              <p className='text-sm font-bold text-on-surface'>{user.name}</p>
              <p className='text-xs uppercase tracking-[0.16em] text-on-surface-variant'>
                {user.role}
              </p>
            </div>
          </div>
        </div>

        <nav className='space-y-1'>
          {visibleRoutes.map((item) => {
            const active = currentRoute === item.key
            return (
              <button
                key={item.key}
                type='button'
                onClick={() => onRouteChange(item.key)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  active
                    ? 'bg-primary/30 text-primary font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary'
                }`}
              >
                <span className='material-symbols-outlined'>{item.icon}</span>
                <span className="font-['Manrope'] uppercase tracking-widest text-[11px] font-bold">
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>

        <div className='mt-6 space-y-3'>
          <button
            type='button'
            onClick={onLogout}
            className='w-full py-2 px-4 bg-slate-100 text-slate-900 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 transition-all'
          >
            <span className='material-symbols-outlined text-sm'>logout</span>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
