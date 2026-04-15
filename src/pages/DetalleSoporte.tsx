import { useEffect, useState } from 'react'
import { useTickets } from '../context/TicketsContext'
import type { Ticket } from './BandejaTickets'

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxF9tYK9MKuDh07J34mL22ehRP-OgWb7G1ilsU7imTg4EdBiH023mYqrkQI4yjosJOg/exec'

export default function DetalleSoporte({ ticket }: { ticket?: Ticket | null }) {
  const [sessionUser, setSessionUser] = useState<{
    id: string
    name: string
    email: string
    role: string
    cargo: string
  } | null>(null)
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(
    ticket ?? null,
  )
  const [solutionModalOpen, setSolutionModalOpen] = useState(false)
  const [solutionDescription, setSolutionDescription] = useState('')
  const [solutionObservation, setSolutionObservation] = useState('')
  const [observedModalOpen, setObservedModalOpen] = useState(false)
  const [observedReason, setObservedReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [attachmentPreview, setAttachmentPreview] = useState<{
    url: string
    name: string
    mode: 'img' | 'iframe'
    orientation: 'portrait' | 'landscape' | 'square'
  } | null>(null)
  const [attachmentPreviewUrls, setAttachmentPreviewUrls] = useState<string[]>(
    [],
  )
  const [attachmentOrientations, setAttachmentOrientations] = useState<
    Array<'portrait' | 'landscape' | 'square'>
  >([])

  const getDriveFileId = (url: string) => {
    const driveIdMatch = url.match(/\/d\/([^\/\?#]+)/)
    if (driveIdMatch) return driveIdMatch[1]

    try {
      const parsedUrl = new URL(url)
      return parsedUrl.searchParams.get('id')
    } catch {
      return null
    }
  }

  const getDrivePreviewUrl = (url: string) => {
    const fileId = getDriveFileId(url)
    // return fileId ? `https://lh3.com/d/${fileId}` : url
    return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : url
  }

  const getDriveOriginalUrl = (url: string) => {
    const fileId = getDriveFileId(url)
    return fileId ? `https://drive.google.com/file/d/${fileId}/view` : url
  }

  const getAttachmentName = (url: string) => {
    const fileId = getDriveFileId(url)
    return fileId ? `Adjunto ${fileId.slice(0, 8)}` : 'Adjunto'
  }

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
    setCurrentTicket(ticket ?? null)
  }, [ticket])

  if (!currentTicket) {
    return (
      <div>
        <div className='rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-10 text-center'>
          <p className='text-lg font-semibold text-on-surface'>
            Selecciona un ticket para ver el detalle.
          </p>
          <p className='mt-3 text-sm text-on-surface-variant'>
            Vuelve a la bandeja de tickets y elige uno para abrir su vista de
            detalle.
          </p>
        </div>
      </div>
    )
  }

  const current = currentTicket
  console.log('Current ticket:', current)
  useEffect(() => {
    let isMounted = true
    const timeouts: number[] = []
    const objectUrls: string[] = []
    setAttachmentPreviewUrls(Array(current.attachments.length).fill(''))
    setAttachmentOrientations(
      Array(current.attachments.length).fill('landscape'),
    )

    current.attachments.forEach((url, index) => {
      const previewUrl = getDrivePreviewUrl(url)
      const timeoutId = window.setTimeout(async () => {
        if (!isMounted) return
        try {
          const response = await fetch(previewUrl)
          if (!response.ok) throw new Error('No se pudo cargar la miniatura')
          const blob = await response.blob()
          const objectUrl = URL.createObjectURL(blob)
          objectUrls.push(objectUrl)

          const img = new Image()
          img.onload = () => {
            if (!isMounted) return
            const orientation =
              img.naturalHeight > img.naturalWidth
                ? 'portrait'
                : img.naturalWidth > img.naturalHeight
                  ? 'landscape'
                  : 'square'
            setAttachmentOrientations((prev) => {
              const next = [...prev]
              next[index] = orientation
              return next
            })
          }
          img.src = objectUrl

          if (!isMounted) return
          setAttachmentPreviewUrls((prev) => {
            const next = [...prev]
            next[index] = objectUrl
            return next
          })
        } catch {
          if (!isMounted) return
          setAttachmentPreviewUrls((prev) => {
            const next = [...prev]
            next[index] = previewUrl
            return next
          })
        }
      }, index * 1000)
      timeouts.push(timeoutId)
    })

    return () => {
      isMounted = false
      timeouts.forEach(window.clearTimeout)
      objectUrls.forEach(URL.revokeObjectURL)
    }
  }, [current.attachments])

  useEffect(() => {
    if (attachmentPreview) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
    return undefined
  }, [attachmentPreview])

  const formatDateTime = (value: string) => {
    if (!value) return '—'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return '—'
    return parsed.toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusMeta = (status: string) => {
    switch (status) {
      case 'En progreso':
        return {
          label: 'En progreso',
          description: 'El encargado ya esta atendiendo el ticket.',
          containerClass:
            'bg-secondary-container/30 border-secondary-container/60',
          badgeClass: 'bg-secondary-container text-secondary',
          dotClass: 'bg-secondary',
        }
      case 'Terminado':
        return {
          label: 'Terminado',
          description: 'Se registro la solucion y el ticket esta cerrado.',
          containerClass:
            'bg-tertiary-container/30 border-tertiary-container/60',
          badgeClass: 'bg-tertiary-container text-green-100',
          dotClass: 'bg-green-500',
        }
      case 'Observado':
        return {
          label: 'Observado',
          description: 'Se requiere una revision adicional.',
          containerClass: 'bg-error-container/20 border-error-container/60',
          badgeClass: 'bg-error-container text-on-error-container',
          dotClass: 'bg-error',
        }
      default:
        return {
          label: 'Pendiente',
          description: 'Aun no se inicio la atencion.',
          containerClass: 'bg-surface-container-high border-outline-variant/40',
          badgeClass: 'bg-surface-container-highest text-on-surface',
          dotClass: 'bg-outline',
        }
    }
  }

  const { refresh: refreshTickets } = useTickets()

  const statusMeta = getStatusMeta(current.status || 'Pendiente')
  const isSolicitante =
    sessionUser?.role?.trim().toLowerCase() === 'solicitante'

  const handleStartAttention = async () => {
    if (!sessionUser) {
      setActionError('No hay una sesion activa.')
      return
    }

    if (isSolicitante) {
      setActionError('No tienes permisos para iniciar la atencion.')
      return
    }

    setActionLoading(true)
    setActionError('')

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'start_attention',
          ticketId: current.ticketId,
          encargadoId: sessionUser.id,
          encargadoName: sessionUser.name,
        }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo iniciar la atencion.')
      }

      const now = new Date().toISOString()
      setCurrentTicket((prev) =>
        prev
          ? {
              ...prev,
              status: 'En progreso',
              solutionStartAt: now,
              encargadoId: sessionUser.id,
              encargadoName: sessionUser.name,
            }
          : prev,
      )
      await refreshTickets()
    } catch (error: unknown) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Error al iniciar la atencion.',
      )
    } finally {
      setActionLoading(false)
    }
  }

  const openObservedModal = () => {
    if (!sessionUser) {
      setActionError('No hay una sesion activa.')
      return
    }

    if (isSolicitante) {
      setActionError('No tienes permisos para marcar el ticket como observado.')
      return
    }

    setObservedReason(current.solutionObservation || '')
    setObservedModalOpen(true)
  }

  const handleMarkObserved = async () => {
    if (!observedReason.trim()) {
      setActionError(
        'La observación es obligatoria para marcar el ticket como observado.',
      )
      return
    }

    setActionLoading(true)
    setActionError('')

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'mark_observed',
          ticketId: current.ticketId,
          solutionObservation: observedReason.trim(),
          encargadoId: sessionUser?.id,
          encargadoName: sessionUser?.name,
        }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || 'No se pudo marcar el ticket como observado.',
        )
      }

      setCurrentTicket((prev) =>
        prev
          ? {
              ...prev,
              status: 'Observado',
              solutionObservation: observedReason.trim(),
              encargadoId: sessionUser?.id || prev.encargadoId,
              encargadoName: sessionUser?.name || prev.encargadoName,
            }
          : prev,
      )
      await refreshTickets()
      setObservedModalOpen(false)
    } catch (error: unknown) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Error al marcar el ticket como observado.',
      )
    } finally {
      setActionLoading(false)
    }
  }

  const openSolutionModal = () => {
    if (isSolicitante) {
      setActionError('No tienes permisos para registrar la solucion.')
      return
    }
    setSolutionDescription(current.solutionDescription || '')
    setSolutionObservation(current.solutionObservation || '')
    setSolutionModalOpen(true)
  }

  const handleRegisterSolution = async () => {
    if (!sessionUser) {
      setActionError('No hay una sesion activa.')
      return
    }

    if (isSolicitante) {
      setActionError('No tienes permisos para registrar la solucion.')
      return
    }

    if (!solutionDescription.trim()) {
      setActionError('La descripcion de la solucion es obligatoria.')
      return
    }

    setActionLoading(true)
    setActionError('')

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'register_solution',
          ticketId: current.ticketId,
          solutionDescription: solutionDescription.trim(),
          solutionObservation: solutionObservation.trim(),
          encargadoId: sessionUser.id,
          encargadoName: sessionUser.name,
        }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo registrar la solucion.')
      }

      const now = new Date().toISOString()
      setCurrentTicket((prev) =>
        prev
          ? {
              ...prev,
              status: 'Terminado',
              solutionDescription: solutionDescription.trim(),
              solutionObservation: solutionObservation.trim(),
              solutionEndAt: now,
              encargadoId: sessionUser.id,
              encargadoName: sessionUser.name,
            }
          : prev,
      )
      await refreshTickets()
      setSolutionModalOpen(false)
    } catch (error: unknown) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Error al registrar la solucion.',
      )
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4'>
        <div className='flex-1'>
          <nav className='flex items-center text-xs font-label text-on-surface-variant mb-2'>
            <span>Tickets</span>
            <span className='material-symbols-outlined text-xs mx-2'>
              chevron_right
            </span>
            <span className='text-primary font-semibold'>
              {current.ticketId}
            </span>
          </nav>
          <h2 className='text-3xl font-extrabold font-headline text-on-surface tracking-tight'>
            {current.description}
          </h2>
          <p className='mt-2 text-sm text-on-surface-variant'>
            Creado el {formatDateTime(current.createdAt)}
          </p>
        </div>
        <div className='w-full md:w-auto flex flex-col sm:flex-row gap-3 md:justify-end'>
          {!isSolicitante &&
            (current.status?.toLowerCase() === 'en progreso' ||
              current.status?.toLowerCase() === 'observado') && (
              <button
                type='button'
                onClick={openSolutionModal}
                disabled={actionLoading}
                className='w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-surface-container-high text-on-surface-variant font-semibold text-sm hover:bg-surface-container-highest transition-colors active:scale-95 disabled:opacity-60'
              >
                <span className='material-symbols-outlined text-lg'>
                  edit_note
                </span>
                Registrar solución
              </button>
            )}
          {!isSolicitante &&
            current.status?.toLowerCase() === 'en progreso' && (
              <button
                type='button'
                onClick={openObservedModal}
                disabled={actionLoading}
                className='w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-amber-100 text-amber-900 font-semibold text-sm border border-amber-200 hover:bg-amber-200 transition-all active:scale-95 disabled:opacity-60'
              >
                <span className='material-symbols-outlined text-lg'>
                  report_problem
                </span>
                Marcar observado
              </button>
            )}
          {!isSolicitante &&
            current.status?.toLowerCase() !== 'en progreso' &&
            current.status?.toLowerCase() !== 'terminado' &&
            current.status?.toLowerCase() !== 'observado' && (
              <button
                type='button'
                onClick={handleStartAttention}
                disabled={actionLoading}
                className='w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-primary text-on-primary font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 disabled:opacity-60'
              >
                <span className='material-symbols-outlined text-lg'>
                  play_arrow
                </span>
                Iniciar atención
              </button>
            )}
        </div>
      </div>

      {actionError && (
        <div className='mb-6 rounded-2xl border border-error-container/40 bg-error-container/20 p-3 text-sm text-error'>
          {actionError}
        </div>
      )}

      <div className='grid grid-cols-12 gap-8'>
        <div className='col-span-12 lg:col-span-7 space-y-8'>
          <section className='space-y-8'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-outline-variant/10'>
                <label className='text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2 block'>
                  Solicitante
                </label>
                <div className='flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-primary font-semibold'>
                    {current.applicantName
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <span className='text-sm font-semibold'>
                    {current.applicantName}
                  </span>
                </div>
              </div>
              <div className='bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-outline-variant/10'>
                <label className='text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2 block'>
                  Área
                </label>
                <span className='text-sm font-semibold flex items-center gap-2 text-on-surface'>
                  <span className='material-symbols-outlined text-primary text-lg'>
                    corporate_fare
                  </span>
                  {current.area}
                </span>
              </div>
              <div className='bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-outline-variant/10'>
                <label className='text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2 block'>
                  Prioridad
                </label>
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-error-container text-on-error-container'>
                  <span className='w-1.5 h-1.5 rounded-full bg-error mr-2' />
                  {current.priority.toUpperCase()}
                </span>
              </div>

              <div
                className={`p-5 rounded-3xl shadow-sm border ${statusMeta.containerClass}`}
              >
                <label className='text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2 block'>
                  Estado actual
                </label>
                <div className='flex items-center gap-2'>
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${statusMeta.badgeClass}`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${statusMeta.dotClass}`}
                    />
                    {statusMeta.label}
                  </span>
                </div>
                <p className='mt-2 text-xs text-on-surface-variant'>
                  {statusMeta.description}
                </p>
              </div>
              <div className='bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-outline-variant/10'>
                <label className='text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2 block'>
                  Inicio de atencion
                </label>
                <span className='text-sm font-semibold text-on-surface'>
                  {formatDateTime(current.solutionStartAt)}
                </span>
                <p className='mt-1 text-[11px] text-on-surface-variant'>
                  Registro de cuando se comenzo la atencion.
                </p>
              </div>
              <div className='bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-outline-variant/10'>
                <label className='text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2 block'>
                  Entrega de solucion
                </label>
                <span className='text-sm font-semibold text-on-surface'>
                  {formatDateTime(current.solutionEndAt)}
                </span>
                <p className='mt-1 text-[11px] text-on-surface-variant'>
                  Fecha en la que se cerro el ticket.
                </p>
              </div>
              <div className='bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-outline-variant/10'>
                <label className='text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2 block'>
                  Etiquetas
                </label>
                <div className='flex flex-wrap gap-2'>
                  {current.tags.length > 0 ? (
                    current.tags.map((tag) => (
                      <span
                        key={tag}
                        className='inline-flex items-center rounded-full bg-surface-container-high px-3 py-1 text-[11px] font-semibold text-on-surface-variant'
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className='text-sm text-on-surface-variant'>
                      Sin etiquetas
                    </span>
                  )}
                </div>
              </div>
              <div className='bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-outline-variant/10'>
                <label className='text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2 block'>
                  Encargado
                </label>
                <span className='text-sm font-medium text-outline'>
                  {current.encargadoName || current.encargadoId}
                </span>
              </div>
            </div>

            <div className='bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-outline-variant/10'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='p-2 bg-primary-container rounded-lg text-primary'>
                  <span className='material-symbols-outlined'>description</span>
                </div>
                <h3 className='text-xl font-bold'>Adjuntos</h3>
              </div>

              <div>
                <h4 className='text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4'>
                  Adjuntos ({current.attachments.length})
                </h4>
                <div className='grid grid-cols-1  gap-3'>
                  {current.attachments.map((url, index) => {
                    const previewUrl = attachmentPreviewUrls[index] || ''
                    const originalUrl = getDriveOriginalUrl(url)
                    const attachmentName = getAttachmentName(url)

                    const orientation =
                      attachmentOrientations[index] ?? 'landscape'
                    const thumbClass =
                      orientation === 'portrait'
                        ? 'h-20 w-14'
                        : orientation === 'landscape'
                          ? 'h-14 w-20'
                          : 'h-16 w-16'

                    return (
                      <div
                        key={url}
                        className='grid grid-cols-[auto_1fr] items-start gap-3 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/10 group hover:bg-surface-container-high transition-colors'
                      >
                        <div
                          className={`overflow-hidden rounded-3xl bg-surface-container-highest border border-outline-variant/50 ${thumbClass}`}
                        >
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              referrerPolicy='no-referrer'
                              alt={attachmentName}
                              className='h-full w-full object-cover'
                            />
                          ) : (
                            <div className='flex h-full w-full items-center justify-center text-[10px] text-on-surface-variant'>
                              Cargando...
                            </div>
                          )}
                        </div>
                        <div className='min-w-0'>
                          <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                            <div className='min-w-0'>
                              <p className='text-sm font-semibold truncate'>
                                {attachmentName}
                              </p>
                              <a
                                href={originalUrl}
                                target='_blank'
                                rel='noreferrer'
                                className='mt-1 block max-w-full text-[10px] text-on-surface-variant break-words'
                              >
                                {originalUrl}
                              </a>
                            </div>
                            <div className='flex items-center gap-2'>
                              <button
                                type='button'
                                onClick={() =>
                                  setAttachmentPreview({
                                    url: getDrivePreviewUrl(url),
                                    name: attachmentName,
                                    mode: 'img',
                                    orientation,
                                  })
                                }
                                className='text-outline text-lg p-2 rounded-full hover:bg-surface-container-low transition'
                                aria-label='Ver adjunto'
                              >
                                <span className='material-symbols-outlined'>
                                  visibility
                                </span>
                              </button>
                              <a
                                href={originalUrl}
                                target='_blank'
                                rel='noreferrer'
                                className='text-outline text-lg p-2 rounded-full hover:bg-surface-container-low transition'
                                aria-label='Abrir original'
                              >
                                <span className='material-symbols-outlined'>
                                  open_in_new
                                </span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className='bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-outline-variant/10'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='p-2 bg-secondary-container rounded-lg text-secondary'>
                  <span className='material-symbols-outlined'>task_alt</span>
                </div>
                <h3 className='text-xl font-bold'>Registro de solución</h3>
              </div>
              <div className='space-y-6'>
                <div>
                  <p className='text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2'>
                    Descripcion de la solucion
                  </p>
                  <p className='text-sm text-on-surface-variant'>
                    {current.solutionDescription ||
                      'Sin descripcion registrada.'}
                  </p>
                </div>
                <div>
                  <p className='text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2'>
                    Observaciones
                  </p>
                  <p className='text-sm text-on-surface-variant'>
                    {current.solutionObservation || 'Sin observaciones.'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className='col-span-12 lg:col-span-5 flex flex-col h-[700px] bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/10 overflow-hidden'>
          <div className='p-6 border-b border-outline-variant/10'>
            <h3 className='text-xl font-bold'>Historial de acciones</h3>
            <p className='text-sm text-on-surface-variant mt-1'>
              Registro cronológico de cambios en el ticket y eventos clave.
            </p>
          </div>
          <div className='flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide'>
            <div className='flex gap-4 relative pb-4'>
              <div className='absolute left-4 top-10 bottom-0 w-px bg-outline-variant/20' />
              <div className='h-10 w-10 rounded-full bg-primary-container flex items-center justify-center text-primary z-10'>
                <span className='material-symbols-outlined'>add_circle</span>
              </div>
              <div className='flex-1'>
                <div className='flex items-start justify-between gap-4 mb-2'>
                  <span className='text-sm font-bold'>Ticket creado</span>
                  <div className='text-right'>
                    <div className='text-[10px] font-semibold text-on-surface'>
                      {current.applicantName}
                    </div>
                    <div className='text-[10px] text-on-surface-variant'>
                      {formatDateTime(current.createdAt)}
                    </div>
                  </div>
                </div>
                <p className='text-sm text-on-surface-variant'>
                  {current.applicantName} creó el ticket y describió "
                  {current.description}".
                </p>
              </div>
            </div>
            {current.solutionStartAt && (
              <div className='flex gap-4 relative pb-4'>
                <div className='absolute left-4 top-10 bottom-0 w-px bg-outline-variant/20' />
                <div className='h-10 w-10 rounded-full bg-surface-container-high text-primary flex items-center justify-center z-10'>
                  <span className='material-symbols-outlined'>play_arrow</span>
                </div>
                <div className='flex-1'>
                  <div className='flex items-start justify-between gap-4 mb-2'>
                    <span className='text-sm font-bold'>
                      Cambio a En progreso
                    </span>
                    <div className='text-right'>
                      <div className='text-[10px] font-semibold text-on-surface'>
                        {current.encargadoName || 'Encargado'}
                      </div>
                      <div className='text-[10px] text-on-surface-variant'>
                        {formatDateTime(current.solutionStartAt)}
                      </div>
                    </div>
                  </div>
                  <p className='text-sm text-on-surface-variant'>
                    {current.encargadoName || 'Encargado'} comenzó a atender el
                    ticket y cambió el estado a "En progreso".
                  </p>
                </div>
              </div>
            )}
            {current.status === 'Observado' && (
              <div className='flex gap-4 relative pb-4'>
                <div className='absolute left-4 top-10 bottom-0 w-px bg-outline-variant/20' />
                <div className='h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center z-10'>
                  <span className='material-symbols-outlined'>
                    report_problem
                  </span>
                </div>
                <div className='flex-1'>
                  <div className='flex items-start justify-between gap-4 mb-2'>
                    <span className='text-sm font-bold'>
                      Marcado como observado
                    </span>
                    <div className='text-right'>
                      <div className='text-[10px] font-semibold text-on-surface'>
                        {current.encargadoName || 'Encargado'}
                      </div>
                      <div className='text-[10px] text-on-surface-variant'>
                        {formatDateTime(
                          current.solutionStartAt || current.createdAt,
                        )}
                      </div>
                    </div>
                  </div>
                  <p className='text-sm text-on-surface-variant'>
                    {current.encargadoName || 'Encargado'} marcó el ticket como
                    observado: "{current.solutionObservation}".
                  </p>
                </div>
              </div>
            )}
            {current.solutionEndAt && (
              <div className='flex gap-4 relative'>
                <div className='absolute left-4 top-10 bottom-0 w-px bg-outline-variant/20' />
                <div className='h-10 w-10 rounded-full bg-secondary-container text-secondary flex items-center justify-center z-10'>
                  <span className='material-symbols-outlined'>
                    check_circle
                  </span>
                </div>
                <div className='flex-1'>
                  <div className='flex items-start justify-between gap-4 mb-2'>
                    <span className='text-sm font-bold'>Finalización</span>
                    <div className='text-right'>
                      <div className='text-[10px] font-semibold text-on-surface'>
                        {current.encargadoName || 'Encargado'}
                      </div>
                      <div className='text-[10px] text-on-surface-variant'>
                        {formatDateTime(current.solutionEndAt)}
                      </div>
                    </div>
                  </div>
                  <p className='text-sm text-on-surface-variant'>
                    {current.encargadoName || 'Encargado'}
                    registró la solución y cerró el ticket.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {observedModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4'>
          <div className='w-full max-w-2xl rounded-[2rem] bg-surface-container-highest p-6 shadow-2xl'>
            <div className='flex items-start justify-between gap-4 mb-4'>
              <div>
                <p className='text-sm font-semibold text-on-surface'>
                  Marcar ticket como observado
                </p>
                <p className='text-xs text-on-surface-variant'>
                  Explica brevemente por qué el ticket queda en estado
                  observado.
                </p>
              </div>
              <button
                type='button'
                onClick={() => setObservedModalOpen(false)}
                className='rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high'
                aria-label='Cerrar modal'
              >
                <span className='material-symbols-outlined'>close</span>
              </button>
            </div>

            <div className='space-y-4'>
              <div>
                <label className='text-xs font-bold uppercase tracking-widest text-on-surface-variant'>
                  Observación
                </label>
                <textarea
                  value={observedReason}
                  onChange={(event) => setObservedReason(event.target.value)}
                  rows={5}
                  className='mt-2 w-full rounded-[1.5rem] border border-outline-variant/30 bg-white px-4 py-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 outline-none'
                  placeholder='Describe por qué el ticket no puede cerrarse todavía...'
                />
              </div>
            </div>

            <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end'>
              <button
                type='button'
                onClick={() => setObservedModalOpen(false)}
                className='rounded-full border border-outline-variant/40 bg-white px-6 py-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low'
              >
                Cancelar
              </button>
              <button
                type='button'
                onClick={handleMarkObserved}
                disabled={actionLoading}
                className='rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-200/40 hover:bg-amber-600 disabled:opacity-60'
              >
                Guardar observado
              </button>
            </div>
          </div>
        </div>
      )}

      {solutionModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4'>
          <div className='w-full max-w-3xl rounded-[2rem] bg-surface-container-highest p-6 shadow-2xl'>
            <div className='flex items-start justify-between gap-4 mb-4'>
              <div>
                <p className='text-sm font-semibold text-on-surface'>
                  Registrar solucion
                </p>
                <p className='text-xs text-on-surface-variant'>
                  Completa la informacion para cerrar el ticket.
                </p>
              </div>
              <button
                type='button'
                onClick={() => setSolutionModalOpen(false)}
                className='rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high'
                aria-label='Cerrar modal'
              >
                <span className='material-symbols-outlined'>close</span>
              </button>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='rounded-2xl bg-surface-container-low p-4'>
                <p className='text-xs font-bold uppercase tracking-widest text-on-surface-variant'>
                  Encargado
                </p>
                <p className='mt-2 text-sm font-semibold text-on-surface'>
                  {sessionUser?.name || 'Sin sesion'}
                </p>
                <p className='text-xs text-on-surface-variant'>
                  {sessionUser?.role || ''}
                </p>
              </div>
              <div className='rounded-2xl bg-surface-container-low p-4'>
                <p className='text-xs font-bold uppercase tracking-widest text-on-surface-variant'>
                  Estado
                </p>
                <p className='mt-2 text-sm font-semibold text-on-surface'>
                  Terminado
                </p>
                <p className='text-xs text-on-surface-variant'>
                  Fecha entrega al guardar
                </p>
              </div>
              <div className='rounded-2xl bg-surface-container-low p-4'>
                <p className='text-xs font-bold uppercase tracking-widest text-on-surface-variant'>
                  Fecha inicio
                </p>
                <p className='mt-2 text-sm font-semibold text-on-surface'>
                  {formatDateTime(current.solutionStartAt)}
                </p>
              </div>
              <div className='rounded-2xl bg-surface-container-low p-4'>
                <p className='text-xs font-bold uppercase tracking-widest text-on-surface-variant'>
                  Ticket
                </p>
                <p className='mt-2 text-sm font-semibold text-on-surface'>
                  {current.ticketId}
                </p>
              </div>
            </div>

            <div className='mt-6 space-y-4'>
              <div>
                <label className='text-xs font-bold uppercase tracking-widest text-on-surface-variant'>
                  Descripcion de la solucion
                </label>
                <textarea
                  value={solutionDescription}
                  onChange={(event) =>
                    setSolutionDescription(event.target.value)
                  }
                  rows={4}
                  className='mt-2 w-full rounded-[1.5rem] border border-outline-variant/30 bg-white px-4 py-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 outline-none'
                  placeholder='Describe la solucion aplicada...'
                />
              </div>
              <div>
                <label className='text-xs font-bold uppercase tracking-widest text-on-surface-variant'>
                  Observaciones (opcional)
                </label>
                <textarea
                  value={solutionObservation}
                  onChange={(event) =>
                    setSolutionObservation(event.target.value)
                  }
                  rows={3}
                  className='mt-2 w-full rounded-[1.5rem] border border-outline-variant/30 bg-white px-4 py-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 outline-none'
                  placeholder='Observaciones finales...'
                />
              </div>
            </div>

            <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end'>
              <button
                type='button'
                onClick={() => setSolutionModalOpen(false)}
                className='rounded-full border border-outline-variant/40 bg-white px-6 py-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low'
              >
                Cancelar
              </button>
              <button
                type='button'
                onClick={handleRegisterSolution}
                disabled={actionLoading}
                className='rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 hover:shadow-primary/40 disabled:opacity-60'
              >
                Guardar solucion
              </button>
            </div>
          </div>
        </div>
      )}

      {attachmentPreview && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4'>
          <div className='relative w-full max-w-[90vw] rounded-[2rem] bg-surface-container-highest p-4 shadow-2xl'>
            <button
              type='button'
              onClick={() => setAttachmentPreview(null)}
              className='absolute right-4 top-4 rounded-full w-6 h-6 text-center  text-slate-600   z-10'
            >
              <span className='material-symbols-outlined'>close</span>
            </button>
            <div className='mb-4 text-center h-8'>
              <p className='text-sm font-semibold '>{attachmentPreview.name}</p>
            </div>
            <div className=''>
              <div
                className='relative overflow-hidden  bg-surface-container-highest flex items-center justify-center'
                style={{
                  // width:
                  //   attachmentPreview.orientation === 'portrait'
                  //     ? '55vw'
                  //     : '90vw',
                  maxWidth: '90vw',
                  maxHeight: '80vh',
                  minWidth: '320px',
                  minHeight: '240px',
                }}
              >
                {attachmentPreview.mode === 'img' ? (
                  <img
                    src={attachmentPreview.url}
                    alt={attachmentPreview.name}
                    referrerPolicy='no-referrer'
                    className='max-h-[80vh] max-w-full object-contain'
                    onError={() =>
                      setAttachmentPreview((prev) =>
                        prev ? { ...prev, mode: 'iframe' } : prev,
                      )
                    }
                  />
                ) : (
                  <iframe
                    src={attachmentPreview.url}
                    title={attachmentPreview.name}
                    className='border-0 h-full w-full'
                    allow='camera; microphone; autoplay; encrypted-media; picture-in-picture'
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
