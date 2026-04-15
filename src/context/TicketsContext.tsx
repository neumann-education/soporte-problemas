import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { Ticket } from '../pages/BandejaTickets'

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxF9tYK9MKuDh07J34mL22ehRP-OgWb7G1ilsU7imTg4EdBiH023mYqrkQI4yjosJOg/exec'

type TicketsContextValue = {
  tickets: Ticket[]
  loading: boolean
  error: string | null
  refresh: () => Promise<Ticket[]>
}

const TicketsContext = createContext<TicketsContextValue | undefined>(undefined)

export function TicketsProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(APPS_SCRIPT_URL)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudieron obtener los tickets.')
      }

      const nextTickets = Array.isArray(result.tickets) ? result.tickets : []
      setTickets(nextTickets)
      return nextTickets
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Error al cargar los tickets.',
      )
      setTickets([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const value = useMemo(
    () => ({ tickets, loading, error, refresh: fetchTickets }),
    [tickets, loading, error, fetchTickets],
  )

  return (
    <TicketsContext.Provider value={value}>{children}</TicketsContext.Provider>
  )
}

export function useTickets() {
  const context = useContext(TicketsContext)
  if (!context) {
    throw new Error('useTickets debe usarse dentro de TicketsProvider.')
  }
  return context
}
