import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import toast, { Toaster } from 'react-hot-toast'
import type { ChangeEvent, DragEvent, FormEvent, KeyboardEvent } from 'react'
import type { Ticket } from './BandejaTickets'
import { useTickets } from '../context/TicketsContext'

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxF9tYK9MKuDh07J34mL22ehRP-OgWb7G1ilsU7imTg4EdBiH023mYqrkQI4yjosJOg/exec'

export interface NuevoTicketProps {
  onTicketCreated: (ticket: Ticket) => void
}

export default function NuevoTicket({ onTicketCreated }: NuevoTicketProps) {
  const ADMIN_ROLE = 'admin'
  const [sessionUser, setSessionUser] = useState<{
    id: string
    name: string
    email: string
    role: string
    cargo: string
  } | null>(null)
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null)
  const [selectedEncargado, setSelectedEncargado] = useState<any | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagQuery, setTagQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [description, setDescription] = useState('')
  const [selectedPriority, setSelectedPriority] = useState('')
  const [selectedFloor, setSelectedFloor] = useState('')
  const [selectedSalon, setSelectedSalon] = useState('')
  const [submissionMessage, setSubmissionMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [salonPanelOpen, setSalonPanelOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [filePreviews, setFilePreviews] = useState<
    Array<{ file: File; previewUrl: string | null; key: string }>
  >([])
  const [previewModalData, setPreviewModalData] = useState<{
    url: string
    name: string
  } | null>(null)
  const isSupportReady = Boolean(selectedEncargado) && !usersLoading
  const { refresh } = useTickets()

  const departmentOptions = [
    'Operaciones',
    'Administración',
    'Recursos Humanos',
    'Tecnología / TI',
    'Marketing',
    'Ventas',
    'Calidad',
    'Logística',
    'Infraestructura',
    'Comunicación',
    'Otro',
  ]
  const locationOptions = [
    'Laboratorio 1',
    'Laboratorio 2',
    'Laboratorio 3',
    'Laboratorio 4',
    '4to piso - Oficina 6',
    'Sótano',
    'OSE',
    'Blackwell',
    'Internacional',
    'Salones',
  ]
  const tagOptions = [
    'Wifi 2.4GHz',
    'Conectividad',
    'Internet',
    'AIO',
    'Proyector',
    'Pantalla',
    'Impresión',
    'Escáner',
    'Cableado',
    'RJ45',
    'Contraseña',
    'Lentitud',
    'Saturación',
    'Reubicación',
    'Mantenimiento',
    'Red wifi',
    'Laboratorio 3',
    'Laboratorio 4',
    '4to piso',
    'Sótano',
    'AIO saturado',
    'Mapeo de redes',
  ]
  const priorityOptions = ['Baja', 'Media', 'Alta', 'Crítica']
  const priorityOptionStyles: Record<string, string> = {
    Baja: 'peer-checked:bg-emerald-300 peer-checked:text-on-surface-variant peer-checked:shadow-sm',
    Media:
      'peer-checked:bg-amber-300 peer-checked:text-on-surface-variant peer-checked:shadow-sm',
    Alta: 'peer-checked:bg-orange-300 peer-checked:text-on-surface-variant peer-checked:shadow-sm',
    Crítica:
      'peer-checked:bg-red-300 peer-checked:text-on-surface-variant peer-checked:shadow-sm',
  }

  const addTag = (tag: string) => {
    const normalized = tag.trim()
    if (!normalized || selectedTags.includes(normalized)) return
    setSelectedTags((current) => [...current, normalized])
    setTagQuery('')
  }

  const removeTag = (tag: string) => {
    setSelectedTags((current) => current.filter((item) => item !== tag))
  }

  const filteredTagSuggestions = tagOptions
    .filter((tag) => !selectedTags.includes(tag))
    .filter((tag) =>
      tagQuery.length === 0
        ? false
        : tag.toLowerCase().includes(tagQuery.toLowerCase()),
    )
    .slice(0, 6)

  const firstFloorRooms = ['100', '101', '102', '103', '104', '105']
  const secondFloorRooms = ['200', '201', '202', '203', '204', '205']
  const thirdFloorRooms = ['300', '301', '302', '303', '304', '305']
  const fourthFloorRooms = ['400', '401', '402', '403', '404', '405']

  const handleLocationChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    setSelectedLocation(value)
    if (value !== 'Salones') {
      setSalonPanelOpen(false)
      setSelectedFloor('')
      setSelectedSalon('')
    }
  }

  const fileKey = (file: File) =>
    `${file.name}-${file.size}-${file.lastModified}`

  useEffect(() => {
    const storedUser = sessionStorage.getItem('sessionUser')
    if (storedUser) {
      try {
        setSessionUser(JSON.parse(storedUser))
        setSelectedApplicant(JSON.parse(storedUser))
      } catch {
        sessionStorage.removeItem('sessionUser')
      }
    }
  }, [])

  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true)
      setUsersError('')

      try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=users`)
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'No se pudieron cargar usuarios.')
        }

        const users = Array.isArray(result.users) ? result.users : []
        setUsers(users)
        const support = users.find(
          (user: { role?: string }) =>
            String(user.role || '').toLowerCase() === 'soporte informatico',
        )

        setSelectedEncargado(support || users[0] || null)
      } catch (error: unknown) {
        setUsersError(
          error instanceof Error ? error.message : 'Error al cargar usuarios.',
        )
      } finally {
        setUsersLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const addFiles = (files: File[]) => {
    const existingKeys = new Set(selectedFiles.map((file) => fileKey(file)))
    const newFiles = files.filter((file) => !existingKeys.has(fileKey(file)))
    const availableSlots = 5 - selectedFiles.length

    if (availableSlots <= 0) {
      toast.error('Ya alcanzaste el máximo de 5 archivos.')
      return
    }

    if (newFiles.length === 0) {
      toast.error('Estos archivos ya fueron agregados.')
      return
    }

    const filesToAdd = newFiles.slice(0, availableSlots)
    if (newFiles.length > availableSlots) {
      toast.error(
        `Solo se pueden agregar ${availableSlots} archivos más. Se añadieron los primeros ${availableSlots}.`,
      )
    }

    setSelectedFiles((current) => [...current, ...filesToAdd])
  }

  useEffect(() => {
    const previews = selectedFiles.map((file) => ({
      file,
      previewUrl: file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : null,
      key: fileKey(file),
    }))

    setFilePreviews(previews)

    return () => {
      previews.forEach((preview) => {
        if (preview.previewUrl) {
          URL.revokeObjectURL(preview.previewUrl)
        }
      })
    }
  }, [selectedFiles])

  useEffect(() => {
    if (!salonPanelOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [salonPanelOpen])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return

    addFiles(Array.from(event.target.files))
  }

  const handleFileDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const files = Array.from(event.dataTransfer.files)
    if (files.length === 0) return

    addFiles(files)
  }

  const readFileAsBase64 = (file: File) =>
    new Promise<{ name: string; type: string; content: string }>(
      (resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result
          if (typeof result === 'string') {
            const base64 = result.split(',')[1]
            resolve({ name: file.name, type: file.type, content: base64 })
          } else {
            reject(new Error('No se pudo leer el archivo.'))
          }
        }
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      },
    )

  const removeSelectedFile = (key: string) => {
    setSelectedFiles((current) =>
      current.filter((file) => fileKey(file) !== key),
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmissionMessage('')

    if (!selectedApplicant) {
      toast.error('No hay un solicitante seleccionado.')
      return
    }

    if (!selectedEncargado) {
      toast.error('No se pudo asignar un encargado de soporte.')
      return
    }

    if (
      !selectedArea ||
      !selectedLocation ||
      !selectedPriority ||
      !description.trim()
    ) {
      setSubmissionMessage('')
      toast.error('Complete todos los campos obligatorios antes de enviar.')
      return
    }

    setSubmitting(true)

    try {
      const attachmentPayload = await Promise.all(
        selectedFiles.map((file) => readFileAsBase64(file)),
      )

      const payload = {
        applicantName: selectedApplicant.name,
        applicantId: selectedApplicant.id,
        applicantEmail: selectedApplicant.email,
        encargadoId: selectedEncargado.id,
        encargadoName: selectedEncargado.name,
        encargadoEmail: selectedEncargado.email,
        area: selectedArea,
        location: selectedLocation,
        priority: selectedPriority,
        status: 'Pendiente',
        tags: selectedTags,
        description,
        selectedFloor,
        selectedSalon,
        attachments: attachmentPayload,
        createdAt: selectedDate,
      }

      console.log('Nuevo ticket JSON:', JSON.stringify(payload, null, 2))

      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',

        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (!response.ok || result.error) {
        throw new Error(result.error || 'No se pudo guardar el ticket.')
      }

      const updatedTickets = await refresh()
      const createdTicket = updatedTickets.find(
        (item) => item.ticketId === result.ticketId,
      )

      if (createdTicket) {
        onTicketCreated(createdTicket)
        return
      }

      setSubmissionMessage('Ticket guardado en Google Sheets correctamente.')
      setSelectedArea('')
      setSelectedLocation('')
      setSelectedTags([])
      setTagQuery('')
      setSelectedPriority('')
      setSelectedFloor('')
      setSelectedSalon('')
      setSelectedFiles([])
      setDescription('')
    } catch (error: any) {
      setSubmissionMessage(`Error al enviar: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='space-y-10'>
      <Toaster position='top-right' />
      <section className='grid grid-cols-1 gap-6'>
        <div className='rounded-[2rem] bg-surface-container-low p-6 sm:p-8 flex flex-col justify-center'>
          <span className='text-xs uppercase tracking-widest text-[#673ab6] font-bold mb-2'>
            Espacio de trabajo
          </span>
          <h2 className='text-3xl sm:text-4xl font-extrabold text-on-surface leading-tight'>
            Detalles del Requerimiento
          </h2>
          <p className='text-on-surface-variant mt-3 max-w-xl text-sm sm:text-base'>
            Complete los campos detalladamente para que nuestro equipo pueda
            asistirle con la mayor precisión posible.
          </p>
        </div>
      </section>

      <section className='bg-surface-container-lowest rounded-[2rem] p-6 sm:p-10 shadow-[0_32px_64px_rgba(103,58,182,0.04)]'>
        <form className='space-y-12' onSubmit={handleSubmit}>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-10'>
            <div className='space-y-2'>
              <label className='block text-sm font-semibold text-on-surface-variant'>
                Solicitante
              </label>
              {sessionUser?.role?.toLowerCase() === ADMIN_ROLE ? (
                <select
                  value={
                    selectedApplicant ? JSON.stringify(selectedApplicant) : ''
                  }
                  onChange={(event) => {
                    const user = JSON.parse(event.target.value)
                    setSelectedApplicant(user)
                  }}
                  className='w-full bg-surface-container-highest px-5 sm:px-8 py-3 sm:py-4 rounded-3xl border border-outline-variant text-on-surface focus:ring-2 focus:ring-primary/20 transition-all'
                >
                  <option disabled value=''>
                    Seleccione el solicitante...
                  </option>
                  {users.map((user) => (
                    <option key={user.id} value={JSON.stringify(user)}>
                      {user.name} - {user.role}
                    </option>
                  ))}
                </select>
              ) : (
                <div className='rounded-3xl bg-surface-container-highest p-4 text-sm text-on-surface-variant space-y-2'>
                  {selectedApplicant ? (
                    <>
                      <p className='font-semibold text-on-surface'>
                        {selectedApplicant.name}
                      </p>
                      <p>Email: {selectedApplicant.email}</p>
                    </>
                  ) : (
                    <p className='text-sm text-error'>No hay sesion activa.</p>
                  )}
                </div>
              )}
            </div>
            <div className='space-y-2'>
              <label className='block text-sm font-semibold text-on-surface-variant'>
                Encargado
              </label>
              {sessionUser?.role?.toLowerCase() === ADMIN_ROLE ? (
                <select
                  value={
                    selectedEncargado ? JSON.stringify(selectedEncargado) : ''
                  }
                  onChange={(event) => {
                    const user = JSON.parse(event.target.value)
                    setSelectedEncargado(user)
                  }}
                  className='w-full bg-surface-container-highest px-5 sm:px-8 py-3 sm:py-4 rounded-3xl border border-outline-variant text-on-surface focus:ring-2 focus:ring-primary/20 transition-all'
                >
                  <option disabled value=''>
                    Seleccione el encargado...
                  </option>
                  {users.map((user) => (
                    <option key={user.id} value={JSON.stringify(user)}>
                      {user.name} - {user.role}
                    </option>
                  ))}
                </select>
              ) : (
                <div className='rounded-3xl bg-surface-container-highest p-4 text-sm text-on-surface-variant space-y-2'>
                  {selectedEncargado ? (
                    <>
                      <p className='font-semibold text-on-surface'>
                        {selectedEncargado.name}
                      </p>
                      <p className='text-xs text-on-surface-variant'>
                        {selectedEncargado.role}
                      </p>
                    </>
                  ) : usersLoading ? (
                    <p className='text-xs text-on-surface-variant'>
                      Cargando encargado...
                    </p>
                  ) : (
                    <p className='text-xs text-error'>
                      {usersError || 'No hay encargado asignado.'}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className='space-y-2'>
              <label className='block text-sm font-semibold text-on-surface-variant'>
                Fecha de solicitud
              </label>
              <input
                type='date'
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                disabled={sessionUser?.role?.toLowerCase() !== ADMIN_ROLE}
                className='w-full bg-surface-container-highest px-5 sm:px-8 py-3 sm:py-4 rounded-full border border-outline-variant text-on-surface focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
              />
            </div>
            <div className='space-y-2'>
              <label className='block text-sm font-semibold text-on-surface-variant'>
                Estado inicial
              </label>
              <div className='flex h-[48px] sm:h-[56px] items-center'>
                <span className='inline-flex items-center px-6 py-2 rounded-full bg-error-container text-on-error-container font-bold text-xs tracking-widest'>
                  PENDIENTE
                </span>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10'>
            <div className='space-y-4'>
              <label className='block text-sm font-semibold text-on-surface-variant'>
                Área / Departamento
              </label>
              <div className='relative group'>
                <select
                  value={selectedArea}
                  onChange={(event) => setSelectedArea(event.target.value)}
                  className='w-full appearance-none bg-surface-container-highest px-5 sm:px-8 py-3 sm:py-4 rounded-full border-none text-on-surface focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer'
                >
                  <option disabled value=''>
                    Seleccione el área...
                  </option>
                  {departmentOptions.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className='space-y-4'>
              <label className='block text-sm font-semibold text-on-surface-variant'>
                Ubicación / Sede
              </label>
              <div className='relative group'>
                <select
                  value={selectedLocation}
                  onChange={handleLocationChange}
                  className='w-full appearance-none bg-surface-container-highest px-5 sm:px-8 py-3 sm:py-4 rounded-full border-none text-on-surface focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer'
                >
                  <option disabled value=''>
                    Seleccione la ubicación...
                  </option>
                  {locationOptions.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className='space-y-4'>
              <label className='block text-sm font-semibold text-on-surface-variant'>
                Etiquetas
              </label>
              <div className='relative'>
                <input
                  value={tagQuery}
                  onChange={(event) => setTagQuery(event.target.value)}
                  onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addTag(tagQuery)
                    }
                  }}
                  placeholder='Buscar o añadir etiquetas...'
                  className='w-full bg-surface-container-highest px-5 sm:px-8 py-3 sm:py-4 rounded-full border border-outline-variant text-on-surface focus:ring-2 focus:ring-primary/20 transition-all'
                />
                <div className='absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-primary'>
                  <span className='material-symbols-outlined'>search</span>
                </div>
                {tagQuery.length > 0 && filteredTagSuggestions.length > 0 && (
                  <div className='absolute left-0 right-0 z-10 mt-2 rounded-3xl border border-outline-variant/30 bg-white shadow-lg'>
                    {filteredTagSuggestions.map((tag) => (
                      <button
                        key={tag}
                        type='button'
                        className='w-full px-4 py-3 text-left text-sm text-on-surface hover:bg-surface-container-high'
                        onClick={() => addTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedTags.length > 0 && (
                <div className='flex flex-wrap gap-2'>
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className='inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-sm font-semibold text-primary'
                    >
                      {tag}
                      <button
                        type='button'
                        className='text-primary hover:text-primary/80'
                        onClick={() => removeTag(tag)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          {selectedLocation === 'Salones' && (
            <div className='space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-6 shadow-sm'>
              <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                <div>
                  <p className='text-sm font-semibold text-on-surface'>
                    Seleccionar salón
                  </p>
                  <p className='text-xs text-on-surface-variant'>
                    Abre el plano del edificio y elige el piso con una UI clara.
                  </p>
                </div>
                <button
                  type='button'
                  className='rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition'
                  onClick={() => setSalonPanelOpen(true)}
                >
                  Seleccionar salón
                </button>
              </div>

              <div className='rounded-3xl bg-surface-container-low p-4 text-sm text-on-surface'>
                <span className='font-semibold'>Salón actual:</span>{' '}
                {selectedSalon
                  ? `${selectedSalon} - Piso ${selectedFloor}`
                  : 'Ninguno seleccionado'}
              </div>

              {salonPanelOpen &&
                createPortal(
                  <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm sm:p-6'>
                    <div className='w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl max-h-[92vh] flex flex-col'>
                      <div className='flex items-center justify-between border-b border-outline-variant/20 px-4 py-4 sm:px-6 sm:py-5'>
                        <div>
                          <p className='text-lg font-bold text-on-surface'>
                            Mapa de salones
                          </p>
                          <p className='text-sm text-on-surface-variant'>
                            Selecciona el piso y el salón directamente en el
                            edificio.
                          </p>
                        </div>
                        <button
                          type='button'
                          className='text-sm font-semibold text-on-surface-variant hover:text-on-surface'
                          onClick={() => setSalonPanelOpen(false)}
                        >
                          Cerrar
                        </button>
                      </div>
                      <div className='p-4 sm:p-6 space-y-6 overflow-y-auto'>
                        <div className='space-y-4'>
                          {[
                            {
                              floor: '4',
                              label: 'Cuarto piso',
                              rooms: fourthFloorRooms,
                            },
                            {
                              floor: '3',
                              label: 'Tercer piso',
                              rooms: thirdFloorRooms,
                            },
                            {
                              floor: '2',
                              label: 'Segundo piso',
                              rooms: secondFloorRooms,
                            },
                            {
                              floor: '1',
                              label: 'Primer piso',
                              rooms: firstFloorRooms,
                            },
                          ].map(({ floor, label, rooms }) => (
                            <div
                              key={floor}
                              className='grid gap-3 items-start sm:items-center sm:grid-cols-[120px_repeat(6,minmax(0,1fr))]'
                            >
                              <div className='flex h-12 items-center justify-center rounded-3xl bg-surface-container-low text-sm font-semibold text-on-surface'>
                                {label}
                              </div>
                              <div className='grid grid-cols-6 gap-1 sm:contents'>
                                {rooms.map((salon) => (
                                  <button
                                    key={salon}
                                    type='button'
                                    className={` rounded-xl border p-1 text-base font-semibold transition ${selectedSalon === salon ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/50 bg-surface-container-low text-on-surface hover:bg-surface-container-high'}`}
                                    onClick={() => {
                                      setSelectedFloor(floor)
                                      setSelectedSalon(salon)
                                    }}
                                  >
                                    {salon}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className='flex flex-col gap-3 rounded-3xl bg-surface-container-low p-5 sm:flex-row sm:items-center sm:justify-between'>
                          <div>
                            <p className='text-sm font-semibold text-on-surface'>
                              Selección actual
                            </p>
                            <p className='text-sm text-on-surface-variant'>
                              {selectedSalon
                                ? `Piso ${selectedFloor} · Salón ${selectedSalon}`
                                : 'No has seleccionado un salón aún.'}
                            </p>
                          </div>
                          <button
                            type='button'
                            className='rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-primary/40'
                            onClick={() => setSalonPanelOpen(false)}
                            disabled={!selectedSalon}
                          >
                            Confirmar selección
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>,
                  document.body,
                )}
            </div>
          )}
          <div className='grid grid-cols-1 gap-8 sm:gap-10'>
            <div className='space-y-4'>
              <label className='block text-sm font-semibold text-on-surface-variant font-label'>
                Nivel de prioridad
              </label>
              <div className='inline-flex flex-wrap items-center gap-1 bg-surface-container-high p-1.5 rounded-3xl sm:rounded-full w-fit max-w-full'>
                {priorityOptions.map((level) => (
                  <label key={level} className='relative cursor-pointer group'>
                    <input
                      className='peer sr-only'
                      name='priority'
                      type='radio'
                      value={level}
                      checked={selectedPriority === level}
                      onChange={(event) =>
                        setSelectedPriority(event.target.value)
                      }
                    />
                    <div
                      className={`min-w-[80px] px-4 text-center py-3 rounded-full text-sm font-semibold text-on-surface-variant transition-all ${priorityOptionStyles[level]}`}
                    >
                      {level}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className='space-y-4'>
            <label className='block text-sm font-semibold text-on-surface-variant'>
              Descripción del Problema
            </label>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className='w-full bg-surface-container-highest px-5 sm:px-8 py-4 sm:py-6 rounded-[2rem] border-none text-on-surface focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/50 transition-all resize-none'
              placeholder='Describa el incidente con el mayor detalle técnico posible...'
            />
          </div>

          <div className='space-y-4'>
            <label className='block text-sm font-semibold text-on-surface-variant'>
              Adjuntos (PDF, Imágenes)
            </label>
            <div>
              <label
                htmlFor='ticket-attachments'
                className='border-2 border-dashed border-outline-variant bg-surface-container-low rounded-[2rem] p-6 sm:p-12 text-center group hover:bg-surface-container-high hover:border-primary/50 transition-all cursor-pointer block'
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleFileDrop}
              >
                <div className='flex flex-col items-center gap-4'>
                  <div className='w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-primary transition-transform group-hover:scale-110'>
                    <span className='material-symbols-outlined text-3xl'>
                      cloud_upload
                    </span>
                  </div>
                  <div>
                    <p className='text-base sm:text-lg font-bold text-on-surface'>
                      Arrastre archivos o haga clic para subir
                    </p>
                    <p className='text-xs sm:text-sm text-on-surface-variant'>
                      Soporta hasta 5 archivos en PDF o imagen (PNG/JPG), 10MB
                      máximo cada uno
                    </p>
                  </div>
                </div>
              </label>
              <input
                id='ticket-attachments'
                type='file'
                multiple
                accept='image/*,application/pdf'
                className='hidden'
                onChange={handleFileChange}
              />
              {filePreviews.length > 0 && (
                <div className='mt-4 text-left'>
                  <p className='text-sm font-semibold text-on-surface'>
                    Archivos seleccionados
                  </p>
                  <div className='mt-3 grid gap-3 sm:grid-cols-2'>
                    {filePreviews.map((item) => (
                      <div
                        key={item.key}
                        className='group relative overflow-hidden rounded-[1.5rem] border border-outline-variant bg-surface-container-low p-4 cursor-pointer hover:bg-surface-container-high'
                        onClick={() => {
                          if (item.previewUrl) {
                            setPreviewModalData({
                              url: item.previewUrl,
                              name: item.file.name,
                            })
                          } else {
                            toast.error(
                              'Vista previa no disponible para este archivo.',
                            )
                          }
                        }}
                      >
                        <button
                          type='button'
                          onClick={(event) => {
                            event.stopPropagation()
                            removeSelectedFile(item.key)
                          }}
                          className='absolute right-3 top-3 rounded-full p-0.5 w-8 h-8 text-slate-600  hover:bg-slate-200'
                          aria-label={`Eliminar ${item.file.name}`}
                        >
                          <span className='material-symbols-outlined text-base'>
                            close
                          </span>
                        </button>
                        <div className='flex items-center gap-4'>
                          <div className='h-16 w-16 overflow-hidden rounded-3xl bg-surface-container-high flex items-center justify-center'>
                            {item.previewUrl ? (
                              <img
                                src={item.previewUrl}
                                alt={item.file.name}
                                className='h-full w-full object-cover'
                              />
                            ) : (
                              <span className='material-symbols-outlined text-3xl text-primary'>
                                picture_as_pdf
                              </span>
                            )}
                          </div>
                          <div className='min-w-0'>
                            <p className='truncate text-sm font-semibold text-on-surface'>
                              {item.file.name}
                            </p>
                            <p className='text-xs text-on-surface-variant'>
                              {(item.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {previewModalData &&
            createPortal(
              <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4'>
                <div className='relative w-full max-w-5xl rounded-[2rem] bg-white p-4 shadow-2xl'>
                  <button
                    type='button'
                    onClick={() => setPreviewModalData(null)}
                    className='absolute right-4 top-4 rounded-full  text-slate-600 '
                    aria-label='Cerrar vista previa'
                  >
                    <span className='material-symbols-outlined'>close</span>
                  </button>
                  <div className='mb-4 text-center'>
                    <p className='text-sm font-semibold text-on-surface'>
                      {previewModalData.name}
                    </p>
                  </div>
                  <div className='rounded-[2rem] bg-slate-950 p-4'>
                    <img
                      src={previewModalData.url}
                      alt={previewModalData.name}
                      className='mx-auto max-h-[80vh] w-full object-contain'
                    />
                  </div>
                </div>
              </div>,
              document.body,
            )}

          {submissionMessage && (
            <div className='rounded-[2rem] border border-outline-variant/30 bg-surface-container-high p-4 text-sm text-on-surface'>
              {submissionMessage}
            </div>
          )}

          <div className='pt-8 flex flex-col gap-3 sm:gap-4 md:flex-row md:justify-end md:items-center'>
            <button
              className='w-full sm:w-auto text-on-surface-variant font-semibold px-8 py-3 transition-colors bg-slate-100 rounded-full hover:bg-slate-200 active:bg-slate-300'
              type='button'
              onClick={() => {
                setSelectedArea('')
                setSelectedLocation('')
                setSelectedTags([])
                setTagQuery('')
                setSelectedDate(new Date().toISOString().slice(0, 10))
                setSelectedPriority('')
                setSelectedFloor('')
                setSelectedSalon('')
                setDescription('')
                setSubmissionMessage('')
              }}
            >
              Cancelar
            </button>
            <button
              disabled={submitting || !isSupportReady}
              className='w-full sm:w-auto bg-primary text-white px-10 sm:px-12 py-4 rounded-full font-bold shadow-[0_8px_20px_rgba(103,58,182,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
              type='submit'
            >
              <span className='material-symbols-outlined'>send</span>
              {usersLoading
                ? 'Cargando encargado...'
                : submitting
                  ? 'Enviando...'
                  : 'Crear Ticket'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
