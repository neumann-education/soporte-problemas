import { useEffect, useMemo, useState } from 'react'
import type { Ticket } from './BandejaTickets'
import { useTickets } from '../context/TicketsContext'

export interface MiTicketProps {
  onViewDetail: (ticket: Ticket) => void
}

export default function MiTicket({ onViewDetail }: MiTicketProps) {
  const [sessionUser, setSessionUser] = useState<{
    id: string
    name: string
    email: string
    role: string
    cargo: string
  } | null>(null)
  const [tagQuery, setTagQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState('Todos los estados')
  const [priorityFilter, setPriorityFilter] = useState('Todas las prioridades')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const { tickets, loading, error: loadError } = useTickets()

  useEffect(() => {
    const storedUser = sessionStorage.getItem('sessionUser')
    if (storedUser) {
      try {
        setSessionUser(JSON.parse(storedUser))
      } catch {
        sessionStorage.removeItem('sessionUser')
      }
    }
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, priorityFilter, selectedTags])

  const myTickets = useMemo(() => {
    if (!sessionUser) return []
    return tickets.filter((ticket) => ticket.applicantId === sessionUser.id)
  }, [sessionUser, tickets])

  const allTags = Array.from(
    new Set(myTickets.flatMap((ticket) => ticket.tags)),
  )

  const filteredTagSuggestions = tagQuery.trim().length
    ? allTags
        .filter((tag) => !selectedTags.includes(tag))
        .filter((tag) => tag.toLowerCase().includes(tagQuery.toLowerCase()))
        .slice(0, 6)
    : []

  const filteredTickets = myTickets.filter((ticket) => {
    const statusMatch =
      statusFilter === 'Todos los estados' || ticket.status === statusFilter
    const priorityMatch =
      priorityFilter === 'Todas las prioridades' ||
      ticket.priority.toLowerCase() === priorityFilter.toLowerCase()
    const tagMatch = selectedTags.length
      ? ticket.tags.some((tag) => selectedTags.includes(tag))
      : true

    return statusMatch && priorityMatch && tagMatch
  })

  const totalPages = Math.ceil(filteredTickets.length / pageSize)
  const pageTickets = filteredTickets.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  const addSelectedTag = (tag: string) => {
    if (selectedTags.includes(tag)) return
    setSelectedTags((current) => [...current, tag])
    setTagQuery('')
  }

  const removeSelectedTag = (tag: string) => {
    setSelectedTags((current) => current.filter((item) => item !== tag))
  }

  const highPriorityCount = myTickets.filter(
    (ticket) => ticket.priority.toLowerCase() === 'alta',
  ).length
  const inProgressCount = myTickets.filter(
    (ticket) => ticket.status === 'En progreso',
  ).length
  const resolvedCount = myTickets.filter(
    (ticket) => ticket.status === 'Terminado',
  ).length
  return (
    <div className='space-y-10'>
      <section className='grid grid-cols-1 xl:grid-cols-4 gap-6'>
        <article className='bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/20 shadow-sm flex items-center justify-between'>
          <div>
            <p className='text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1'>
              Mis tickets activos
            </p>
            <h3 className='text-2xl font-extrabold text-on-surface'>
              {myTickets.length}
            </h3>
          </div>
          <div className='p-3 bg-primary-fixed rounded-xl text-primary'>
            <span
              className='material-symbols-outlined'
              style={{ fontVariationSettings: `'FILL' 1` }}
            >
              confirmation_number
            </span>
          </div>
        </article>
        <article className='bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/20 shadow-sm flex items-center justify-between'>
          <div>
            <p className='text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1'>
              Prioridad alta
            </p>
            <h3 className='text-2xl font-extrabold text-error'>
              {highPriorityCount}
            </h3>
          </div>
          <div className='p-3 bg-error-container rounded-xl text-error'>
            <span
              className='material-symbols-outlined'
              style={{ fontVariationSettings: `'FILL' 1` }}
            >
              priority_high
            </span>
          </div>
        </article>
        <article className='bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/20 shadow-sm flex items-center justify-between'>
          <div>
            <p className='text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1'>
              En progreso
            </p>
            <h3 className='text-2xl font-extrabold text-on-primary-fixed-variant'>
              {inProgressCount}
            </h3>
          </div>
          <div className='p-3 bg-secondary-container rounded-xl text-on-secondary-fixed-variant'>
            <span
              className='material-symbols-outlined'
              style={{ fontVariationSettings: `'FILL' 1` }}
            >
              pending
            </span>
          </div>
        </article>
        <article className='bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/20 shadow-sm flex items-center justify-between'>
          <div>
            <p className='text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1'>
              Resueltos hoy
            </p>
            <h3 className='text-2xl font-extrabold text-tertiary'>
              {resolvedCount}
            </h3>
          </div>
          <div className='p-3 bg-tertiary-container/10 rounded-xl text-tertiary'>
            <span
              className='material-symbols-outlined'
              style={{ fontVariationSettings: `'FILL' 1` }}
            >
              check_circle
            </span>
          </div>
        </article>
      </section>

      <section className='bg-surface-container-low p-4 rounded-full flex flex-col md:flex-row items-center gap-6 border border-outline-variant/30'>
        <div className='flex items-center gap-2'>
          <span className='text-xs font-bold uppercase tracking-wider text-on-surface-variant'>
            Estado:
          </span>
          <select
            className='bg-transparent border-none text-base font-bold text-primary focus:ring-0 cursor-pointer'
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option>Todos los estados</option>
            <option>Pendiente</option>
            <option>En progreso</option>
            <option>Terminado</option>
            <option>Observado</option>
          </select>
        </div>
        <div className='w-px h-4 bg-outline-variant/40' />
        <div className='flex items-center gap-2'>
          <span className='text-xs font-bold uppercase tracking-wider text-on-surface-variant'>
            Prioridad:
          </span>
          <select
            className='bg-transparent border-none text-base font-bold text-primary focus:ring-0 cursor-pointer'
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
            <option>Todas las prioridades</option>
            <option>Alta</option>
            <option>Media</option>
            <option>Baja</option>
            <option>Crítica</option>
          </select>
        </div>
        <div className='w-px h-4 bg-outline-variant/40' />
        <div className='flex items-center gap-2 flex-1 min-w-0'>
          <span className='text-xs font-bold uppercase tracking-wider text-on-surface-variant'>
            Etiquetas:
          </span>
          <div className='relative w-full'>
            <input
              type='text'
              value={tagQuery}
              onChange={(event) => setTagQuery(event.target.value)}
              placeholder='Buscar etiquetas...'
              className='min-w-0 w-full bg-transparent border border-outline-variant/20 rounded-full px-4 py-2 text-base text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20'
            />

            {filteredTagSuggestions.length > 0 && (
              <div className='absolute left-0 right-0 z-20 mt-2 rounded-3xl border border-outline-variant/30 bg-white p-3 shadow-xl'>
                <p className='text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2'>
                  Etiquetas sugeridas
                </p>
                <div className='flex flex-wrap gap-2'>
                  {filteredTagSuggestions.map((tag) => (
                    <button
                      key={tag}
                      type='button'
                      onClick={() => addSelectedTag(tag)}
                      className='rounded-full border border-outline-variant/50 px-3 py-2 text-base text-on-surface hover:border-primary hover:text-primary transition'
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {selectedTags.length > 0 && (
        <div className='mt-4 flex flex-wrap gap-2'>
          {selectedTags.map((tag) => (
            <button
              key={tag}
              type='button'
              onClick={() => removeSelectedTag(tag)}
              className='inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-base font-semibold text-primary transition hover:bg-primary/20'
            >
              {tag}
              <span className='text-xs'>×</span>
            </button>
          ))}
        </div>
      )}

      <section className='bg-surface-container-lowest rounded-[28px] overflow-hidden shadow-sm border border-outline-variant/20'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse'>
            <thead className='bg-surface-container-low'>
              <tr>
                <th className='py-5 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest'>
                  Fecha
                </th>
                <th className='py-5 px-8 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest'>
                  Ticket
                </th>
                <th className='py-5 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest'>
                  Asunto
                </th>
                <th className='py-5 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest'>
                  Prioridad
                </th>
                <th className='py-5 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest'>
                  Área
                </th>
                <th className='py-5 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest'>
                  Estado
                </th>
                <th className='py-5 px-8 text-right text-[11px] font-bold text-on-surface-variant uppercase tracking-widest'>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-outline-variant/10'>
              {loading ? (
                <tr>
                  <td
                    className='py-8 px-8 text-center text-base text-on-surface-variant'
                    colSpan={7}
                  >
                    Cargando tickets...
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td
                    className='py-8 px-8 text-center text-base text-error'
                    colSpan={7}
                  >
                    {loadError}
                  </td>
                </tr>
              ) : !sessionUser ? (
                <tr>
                  <td
                    className='py-8 px-8 text-center text-base text-on-surface-variant'
                    colSpan={7}
                  >
                    No hay sesion activa.
                  </td>
                </tr>
              ) : filteredTickets.length > 0 ? (
                pageTickets.map((ticket, index) => (
                  <tr
                    key={ticket.ticketId}
                    className={`hover:bg-[#f1ecf2]/30 transition-colors group ${
                      index % 2 === 1 ? 'bg-surface-container-low/20' : ''
                    }`}
                  >
                    <td className='py-6 px-6 text-base text-on-surface-variant'>
                      {new Date(ticket.createdAt).toLocaleString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className='py-6 px-8 font-semibold'>
                      {ticket.ticketId}
                    </td>
                    <td className='py-6 px-6'>{ticket.description}</td>
                    <td className='py-6 px-6 text-base text-on-surface-variant font-medium'>
                      {ticket.priority}
                    </td>
                    <td className='py-6 px-6'>{ticket.area}</td>
                    <td className='py-6 px-6'>{ticket.status}</td>
                    <td className='py-6 px-8 text-right'>
                      <button
                        type='button'
                        onClick={() => onViewDetail(ticket)}
                        className='text-primary font-semibold text-base'
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              ) : myTickets.length === 0 ? (
                <tr>
                  <td
                    className='py-8 px-8 text-center text-base text-on-surface-variant'
                    colSpan={7}
                  >
                    No tienes tickets registrados.
                  </td>
                </tr>
              ) : (
                <tr>
                  <td
                    className='py-8 px-8 text-center text-base text-on-surface-variant'
                    colSpan={7}
                  >
                    No se encontraron tickets que coincidan con el filtro de
                    etiquetas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='p-6 bg-surface-container-low flex flex-col md:flex-row justify-between items-center border-t border-outline-variant/15'>
          <p className='text-[11px] font-bold text-on-surface-variant uppercase tracking-widest'>
            Mostrando {pageTickets.length} de {filteredTickets.length} ticket(s)
          </p>
          {totalPages > 1 && (
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className='px-3 py-1 text-sm font-medium text-primary disabled:text-on-surface-variant disabled:cursor-not-allowed'
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    type='button'
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm font-medium rounded ${
                      currentPage === page
                        ? 'bg-primary text-on-primary'
                        : 'text-primary hover:bg-primary/10'
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                type='button'
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className='px-3 py-1 text-sm font-medium text-primary disabled:text-on-surface-variant disabled:cursor-not-allowed'
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
