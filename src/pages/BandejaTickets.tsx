import { useState } from 'react'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { useTickets } from '../context/TicketsContext'

export interface BandejaTicketsProps {
  onViewDetail: (ticket: Ticket) => void
}

export type Ticket = {
  createdAt: string
  ticketId: string
  applicantName: string
  applicantId: string
  area: string
  location: string
  priority: string
  status: string
  tags: string[]
  description: string
  floor: string
  salon: string
  encargadoId: string
  encargadoName: string
  attachments: string[]
  solutionDescription: string
  solutionObservation: string
  solutionStartAt: string
  solutionEndAt: string
}

export default function BandejaTickets({ onViewDetail }: BandejaTicketsProps) {
  const pageSize = 10
  const [tagQuery, setTagQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState('Todos los estados')
  const [priorityFilter, setPriorityFilter] = useState('Todas las prioridades')
  const [areaFilter, setAreaFilter] = useState('Todas las areas')
  const [currentPage, setCurrentPage] = useState(1)
  const { tickets, loading, error: loadError } = useTickets()

  const areaOptions = [
    'Operaciones',
    'Administracion',
    'Recursos Humanos',
    'Tecnologia / TI',
    'Marketing',
    'Ventas',
    'Calidad',
    'Logistica',
    'Infraestructura',
    'Comunicacion',
    'Otro',
  ]

  const allTags = Array.from(new Set(tickets.flatMap((ticket) => ticket.tags)))

  const filteredTagSuggestions = tagQuery.trim().length
    ? allTags
        .filter((tag) => !selectedTags.includes(tag))
        .filter((tag) => tag.toLowerCase().includes(tagQuery.toLowerCase()))
        .slice(0, 6)
    : []

  const filteredTickets = tickets.filter((ticket) => {
    const statusMatch =
      statusFilter === 'Todos los estados' || ticket.status === statusFilter
    const priorityMatch =
      priorityFilter === 'Todas las prioridades' ||
      ticket.priority.toLowerCase() === priorityFilter.toLowerCase()
    const normalize = (str: string) =>
      str
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    const areaMatch =
      areaFilter === 'Todas las areas' ||
      normalize(ticket.area) === normalize(areaFilter)
    const tagMatch = selectedTags.length
      ? ticket.tags.some((tag) => selectedTags.includes(tag))
      : true

    return statusMatch && priorityMatch && areaMatch && tagMatch
  })

  const normalizeText = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

  const getPriorityClass = (priority: string) => {
    switch (normalizeText(priority)) {
      case 'alta':
        return 'bg-red-100 text-red-800 border border-red-200'
      case 'critica':
        return 'bg-red-200 text-red-900 border border-red-300'
      case 'media':
        return 'bg-amber-100 text-amber-800 border border-amber-200'
      case 'baja':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200'
    }
  }

  const getStatusClass = (status: string) => {
    switch (status.trim().toLowerCase()) {
      case 'pendiente':
        return 'bg-slate-100 text-slate-700 border border-slate-200'
      case 'en progreso':
        return 'bg-blue-100 text-blue-800 border border-blue-200'
      case 'terminado':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
      case 'observado':
        return 'bg-amber-100 text-amber-800 border border-amber-200'
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200'
    }
  }

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * pageSize
  const pageTickets = filteredTickets.slice(pageStart, pageStart + pageSize)

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
  }

  const handleGoToPage = (page: number) => {
    setCurrentPage(page)
  }

  const addSelectedTag = (tag: string) => {
    if (selectedTags.includes(tag)) return
    setSelectedTags((current) => [...current, tag])
    setTagQuery('')
    setCurrentPage(1)
  }

  const removeSelectedTag = (tag: string) => {
    setSelectedTags((current) => current.filter((item) => item !== tag))
    setCurrentPage(1)
  }

  const isSameDay = (value?: string, compareTo?: Date) => {
    if (!value || !compareTo) return false
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return false
    return (
      date.getFullYear() === compareTo.getFullYear() &&
      date.getMonth() === compareTo.getMonth() &&
      date.getDate() === compareTo.getDate()
    )
  }

  const totalTickets = tickets.length
  const highPriorityTickets = tickets.filter(
    (ticket) => ticket.priority.toLowerCase() === 'alta',
  ).length
  const inProgressTickets = tickets.filter(
    (ticket) => ticket.status === 'En progreso',
  ).length
  const resolvedTodayTickets = tickets.filter(
    (ticket) =>
      ticket.status === 'Terminado' &&
      isSameDay(ticket.solutionEndAt, new Date()),
  ).length

  const formatDate = (value?: string) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Tickets')

    const headerRow1 = [
      'N°',
      'FECHA',
      'DATOS DEL SOLICITANTE',
      '',
      'DESCRIPCION DEL PROBLEMA',
      'NIVEL DE PRIORIDAD',
      'DESCRIPCION DE LA SOLUCION',
      'EJECUTIVO RESPONSABLE',
      'FECHA INICIO',
      'FECHA ENTREGA',
      'ESTADO',
      'CONFORMIDAD',
      'OBSERVACIONES',
    ]
    const headerRow2 = [
      '',
      '',
      'APELLIDOS Y NOMBRES',
      'AREA',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]

    worksheet.addRow(headerRow1)
    worksheet.addRow(headerRow2)

    worksheet.mergeCells('A1:A2')
    worksheet.mergeCells('B1:B2')
    worksheet.mergeCells('C1:D1')
    worksheet.mergeCells('E1:E2')
    worksheet.mergeCells('F1:F2')
    worksheet.mergeCells('G1:G2')
    worksheet.mergeCells('H1:H2')
    worksheet.mergeCells('I1:I2')
    worksheet.mergeCells('J1:J2')
    worksheet.mergeCells('K1:K2')
    worksheet.mergeCells('L1:L2')
    worksheet.mergeCells('M1:M2')

    const headerAlignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    } as const
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true }
      cell.alignment = headerAlignment
    })
    worksheet.getRow(2).eachCell((cell) => {
      cell.font = { bold: true }
      cell.alignment = headerAlignment
    })

    worksheet.columns = [
      { width: 6 },
      { width: 14 },
      { width: 30 },
      { width: 18 },
      { width: 48 },
      { width: 20 },
      { width: 40 },
      { width: 22 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 16 },
      { width: 24 },
    ]
    filteredTickets.forEach((ticket, index) => {
      worksheet.addRow([
        index + 1,
        formatDate(ticket.createdAt),
        ticket.applicantName,
        ticket.area,
        ticket.description,
        ticket.priority,
        ticket.solutionDescription || '',
        ticket.encargadoName || '',
        formatDate(ticket.solutionStartAt),
        formatDate(ticket.solutionEndAt),
        ticket.status,
        '',
        ticket.solutionObservation || '',
      ])
    })

    const gridBorder = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    } as const

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = gridBorder
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const today = new Date()
    const dateStamp = today
      .toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      .replaceAll('/', '-')

    saveAs(blob, `registro_atencion_incidencias_${dateStamp}.xlsx`)
  }

  return (
    <div className='space-y-10'>
      <section className='grid grid-cols-1 xl:grid-cols-4 gap-6'>
        <article className='bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/20 shadow-sm flex items-center justify-between'>
          <div>
            <p className='text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1'>
              Total Active
            </p>
            <h3 className='text-2xl font-extrabold text-on-surface'>
              {totalTickets}
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
              Alta prioridad
            </p>
            <h3 className='text-2xl font-extrabold text-error'>
              {highPriorityTickets}
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
              {inProgressTickets}
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
              {resolvedTodayTickets}
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

      <section className='bg-surface-container-low p-4 rounded-full flex flex-col md:flex-row md:flex-nowrap items-center gap-6 border border-outline-variant/30'>
        <div className='flex flex-col md:flex-row md:items-center gap-2 min-w-0'>
          <span className='text-xs font-bold uppercase tracking-wider text-on-surface-variant'>
            Estado:
          </span>
          <select
            className='min-w-0 w-full md:w-auto bg-transparent border-none text-base font-bold text-primary focus:ring-0 cursor-pointer'
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value)
              setCurrentPage(1)
            }}
          >
            <option>Todos los estados</option>
            <option>Pendiente</option>
            <option>En progreso</option>
            <option>Terminado</option>
            <option>Observado</option>
          </select>
        </div>
        <div className='hidden md:block w-px h-4 bg-outline-variant/40' />
        <div className='flex flex-col md:flex-row md:items-center gap-2 min-w-0'>
          <span className='text-xs font-bold uppercase tracking-wider text-on-surface-variant'>
            Prioridad:
          </span>
          <select
            className='min-w-0 w-full md:w-auto bg-transparent border-none text-base font-bold text-primary focus:ring-0 cursor-pointer'
            value={priorityFilter}
            onChange={(event) => {
              setPriorityFilter(event.target.value)
              setCurrentPage(1)
            }}
          >
            <option>Todas las prioridades</option>
            <option>Alta</option>
            <option>Media</option>
            <option>Baja</option>
            <option>Crítica</option>
          </select>
        </div>
        <div className='hidden md:block w-px h-4 bg-outline-variant/40' />
        <div className='flex flex-col md:flex-row md:items-center gap-2 min-w-0'>
          <span className='text-xs font-bold uppercase tracking-wider text-on-surface-variant'>
            Área:
          </span>
          <select
            className='min-w-0 w-full md:w-auto bg-transparent border-none text-base font-bold text-primary focus:ring-0 cursor-pointer'
            value={areaFilter}
            onChange={(event) => {
              setAreaFilter(event.target.value)
              setCurrentPage(1)
            }}
          >
            <option>Todas las areas</option>
            {areaOptions.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>
        <div className='flex flex-col md:flex-row md:items-center gap-2 flex-1 min-w-0'>
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
        <div className='w-full md:w-auto flex justify-end'>
          <button
            type='button'
            onClick={handleExportExcel}
            className='w-10 h-10 flex items-center justify-center bg-primary rounded-full hover:bg-primary/80 shadow-sm transition-colors'
          >
            <span className='material-symbols-outlined text-white text-md'>
              file_download
            </span>
          </button>
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
                  Estado solucion
                </th>
                <th className='py-5 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest'>
                  Solicitante
                </th>
                <th className='py-5 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest'>
                  Etiquetas
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
                    colSpan={9}
                  >
                    Cargando tickets...
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td
                    className='py-8 px-8 text-center text-base text-error'
                    colSpan={9}
                  >
                    {loadError}
                  </td>
                </tr>
              ) : pageTickets.length > 0 ? (
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
                    <td className='py-6 px-6'>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPriorityClass(
                          ticket.priority,
                        )}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className='py-6 px-6'>{ticket.area}</td>
                    <td className='py-6 px-6'>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                          ticket.status,
                        )}`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className='py-6 px-6'>{ticket.applicantName}</td>
                    <td className='py-6 px-6 text-base text-on-surface-variant'>
                      {ticket.tags.join(', ')}
                    </td>
                    <td className='py-6 px-8 text-center'>
                      <button
                        type='button'
                        onClick={() => onViewDetail(ticket)}
                        className='flex items-center gap-2 text-white font-semibold text-base bg-primary p-2 rounded-lg  hover:bg-primary/90 transition'
                      >
                        <span className='material-symbols-outlined text-lg'>
                          visibility
                        </span>
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              ) : tickets.length === 0 ? (
                <tr>
                  <td
                    className='py-8 px-8 text-center text-base text-on-surface-variant'
                    colSpan={9}
                  >
                    No hay tickets registrados.
                  </td>
                </tr>
              ) : (
                <tr>
                  <td
                    className='py-8 px-8 text-center text-base text-on-surface-variant'
                    colSpan={9}
                  >
                    No se encontraron tickets que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='p-6 bg-surface-container-low flex flex-col md:flex-row justify-between items-center border-t border-outline-variant/15'>
          <p className='text-[11px] font-bold text-on-surface-variant uppercase tracking-widest'>
            Mostrando {pageTickets.length} de {filteredTickets.length} tickets
          </p>
          <div className='flex gap-2 mt-4 md:mt-0'>
            <button
              type='button'
              onClick={handlePrevPage}
              disabled={safePage === 1}
              className='p-2 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-outline hover:text-primary hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1
              const isActive = page === safePage
              return (
                <button
                  key={page}
                  type='button'
                  onClick={() => handleGoToPage(page)}
                  className={
                    isActive
                      ? 'w-10 h-10 flex items-center justify-center bg-primary text-on-primary rounded-lg text-xs font-bold shadow-md shadow-primary/20'
                      : 'w-10 h-10 flex items-center justify-center bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-lg text-xs font-bold hover:bg-surface-container-low'
                  }
                >
                  {page}
                </button>
              )
            })}
            <button
              type='button'
              onClick={handleNextPage}
              disabled={safePage === totalPages}
              className='p-2 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-on-surface hover:text-primary hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
