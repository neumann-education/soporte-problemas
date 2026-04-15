import type { RouteKey, SessionUser } from '../types'

interface TopBarProps {
  currentRoute: RouteKey
  onToggleSidebar: () => void
  user: SessionUser
}

const labels: Record<RouteKey, string> = {
  bandeja: 'Bandeja de Tickets',
  detalle: 'Detalle de Soporte',
  login: 'Ingreso',
  'mi-ticket': 'Mi Ticket',
  usuarios: 'Listado Usuarios',
  'nuevo-ticket': 'Nuevo Ticket',
}

export default function TopBar({
  currentRoute,
  onToggleSidebar,
  user,
}: TopBarProps) {
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)

  return (
    <header className='sticky top-0 z-40 bg-white/80 dark:bg-[#1c1b1f]/80 backdrop-blur-xl flex flex-col gap-4 px-4 sm:px-8 py-4 border-b border-[#ccc3d5]/15'>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={onToggleSidebar}
            className='inline-flex items-center justify-center rounded-full bg-white text-on-surface p-2 transition hover:bg-surface-container-high md:hidden'
          >
            <span className='material-symbols-outlined text-base'>menu</span>
          </button>
          <div>
            <h2 className='text-3xl font-extrabold tracking-tight text-on-surface'>
              {labels[currentRoute]}
            </h2>
          </div>
        </div>
        <div className='hidden md:flex items-center gap-3'>
          <div className='flex items-center gap-3'>
            <div className='text-right'>
              <p className='text-xs font-bold text-on-surface'>{user.name}</p>
              <p className='text-[10px] text-on-surface-variant'>{user.role}</p>
            </div>
            <div className='flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/50 bg-primary-container text-primary font-semibold'>
              {initials}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
