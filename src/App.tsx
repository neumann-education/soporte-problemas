import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import BandejaTickets from './pages/BandejaTickets'
import type { Ticket } from './pages/BandejaTickets'
import DetalleSoporte from './pages/DetalleSoporte'
import MiTicket from './pages/MiTicket'
import NuevoTicket from './pages/NuevoTicket'
import ListadoUsuarios from './pages/ListadoUsuarios'
import Login from './pages/Login'
import type { RouteKey, SessionUser } from './types'
import { getAllowedRoutes, getDefaultRoute } from './types'
import { useTickets } from './context/TicketsContext'
import { Toaster } from 'react-hot-toast'

function App() {
  const [route, setRoute] = useState<RouteKey>('bandeja')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const { loading: ticketsLoading, tickets } = useTickets()

  const allowedRoutes = sessionUser ? getAllowedRoutes(sessionUser.role) : []

  useEffect(() => {
    const storedUser = sessionStorage.getItem('sessionUser')
    const storedRoute = sessionStorage.getItem('sessionRoute')
    const storedTicket = sessionStorage.getItem('selectedTicket')
    if (storedUser) {
      try {
        setSessionUser(JSON.parse(storedUser))
      } catch {
        sessionStorage.removeItem('sessionUser')
      }
    }
    if (storedTicket) {
      try {
        setSelectedTicket(JSON.parse(storedTicket))
      } catch {
        sessionStorage.removeItem('selectedTicket')
      }
    }
    if (storedRoute) {
      setRoute(storedRoute as RouteKey)
    }
    setIsHydrated(true)
  }, [])

  const handleLogout = () => {
    setSidebarOpen(false)
    setRoute('login')
    setSessionUser(null)
    setSelectedTicket(null)
    sessionStorage.removeItem('sessionUser')
    sessionStorage.removeItem('sessionRoute')
    sessionStorage.removeItem('selectedTicket')
    console.log('Cerrar sesión')
  }

  const handleLogin = (user: SessionUser) => {
    setSessionUser(user)
    sessionStorage.setItem('sessionUser', JSON.stringify(user))
    setRoute(getDefaultRoute(user.role))
  }

  const handleViewDetail = (ticket: Ticket) => {
    if (!allowedRoutes.includes('detalle')) {
      return
    }
    setSelectedTicket(ticket)
    setRoute('detalle')
    setSidebarOpen(false)
  }

  useEffect(() => {
    if (!sessionUser) return
    sessionStorage.setItem('sessionRoute', route)
  }, [route, sessionUser])

  useEffect(() => {
    if (!sessionUser) return
    if (selectedTicket) {
      sessionStorage.setItem('selectedTicket', JSON.stringify(selectedTicket))
    } else {
      sessionStorage.removeItem('selectedTicket')
    }
  }, [selectedTicket, sessionUser])

  useEffect(() => {
    if (!sessionUser) return
    if (allowedRoutes.length === 0) return
    if (!allowedRoutes.includes(route)) {
      setRoute(getDefaultRoute(sessionUser.role))
    }
  }, [allowedRoutes, route, sessionUser])

  useEffect(() => {
    if (!selectedTicket || ticketsLoading || tickets.length === 0) return
    const latestTicket = tickets.find(
      (ticket) => ticket.ticketId === selectedTicket.ticketId,
    )
    if (latestTicket && latestTicket !== selectedTicket) {
      setSelectedTicket(latestTicket)
    }
  }, [selectedTicket, tickets, ticketsLoading])

  const getCurrentPage = () => {
    switch (route) {
      case 'login':
        return <Login onLogin={handleLogin} />
      case 'detalle':
        return <DetalleSoporte ticket={selectedTicket} />
      case 'mi-ticket':
        return <MiTicket onViewDetail={handleViewDetail} />
      case 'nuevo-ticket':
        return <NuevoTicket onTicketCreated={handleViewDetail} />
      case 'usuarios':
        return <ListadoUsuarios />
      default:
        return <BandejaTickets onViewDetail={handleViewDetail} />
    }
  }

  if (!isHydrated || ticketsLoading) {
    return (
      <div className='fixed inset-0 z-50 overflow-hidden bg-[#f4f0ff] text-slate-900 flex items-center justify-center'>
        <div className='pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full bg-[#a78bfa]/50 blur-3xl' />
        <div className='pointer-events-none absolute bottom-[-120px] right-[-60px] h-72 w-72 rounded-full bg-[#f0abfc]/50 blur-3xl' />

        <div className='relative z-10 w-[92vw] max-w-md rounded-[2.5rem] border border-violet-900/10 bg-white/90 p-8 shadow-[0_30px_80px_rgba(76,29,149,0.18)] backdrop-blur'>
          <div className='flex items-center gap-3'>
            <div className='h-12 w-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/30'>
              <span className='material-symbols-outlined'>architecture</span>
            </div>
            <div>
              <p className='text-xs uppercase tracking-[0.35em] text-violet-700 font-semibold'>
                Neumann
              </p>
              <h1 className='text-2xl font-extrabold tracking-tight'>
                Soporte TI
              </h1>
            </div>
          </div>

          <div className='mt-8 rounded-3xl bg-violet-950 text-white p-6'>
            <p className='mt-2 text-xl font-bold'>Preparando tus tickets</p>
            <div className='mt-5 flex items-center gap-4'>
              <svg
                viewBox='0 0 24 24'
                className='h-12 w-12 flex-none animate-spin text-violet-200'
                aria-hidden='true'
              >
                <circle
                  className='text-violet-400/30'
                  cx='12'
                  cy='12'
                  r='9'
                  stroke='currentColor'
                  strokeWidth='3'
                  fill='none'
                />
                <path
                  d='M12 3a9 9 0 0 1 9 9'
                  stroke='currentColor'
                  strokeWidth='3'
                  strokeLinecap='round'
                  fill='none'
                />
              </svg>
              <div className='flex-1'>
                <div className='h-2 w-full rounded-full bg-white/10 overflow-hidden'>
                  <div className='h-full w-2/3 rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-200 to-amber-200 animate-pulse' />
                </div>
                <p className='mt-2 text-xs text-violet-200'>
                  Sincronizando sesion y detalle.
                </p>
              </div>
            </div>
          </div>

          <div className='mt-6 flex items-center justify-between text-xs text-slate-500'>
            <span>Servicio seguro</span>
            <span className='flex items-center gap-2'>
              <span className='h-2 w-2 rounded-full bg-violet-500 animate-pulse' />
              Conectando
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (!sessionUser) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className='min-h-screen bg-background text-on-surface font-body'>
      <Toaster position='top-center' />

      <Sidebar
        currentRoute={route}
        onRouteChange={(routeKey) => {
          setRoute(routeKey)
          setSidebarOpen(false)
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        user={sessionUser}
      />
      <div className='min-h-screen md:ml-64 transition-all duration-200'>
        <TopBar
          currentRoute={route}
          onToggleSidebar={() => setSidebarOpen(true)}
          user={sessionUser}
        />
        <main className='w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8  mx-auto'>
          {getCurrentPage()}
        </main>
      </div>
    </div>
  )
}

export default App
