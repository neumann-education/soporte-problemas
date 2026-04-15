import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxF9tYK9MKuDh07J34mL22ehRP-OgWb7G1ilsU7imTg4EdBiH023mYqrkQI4yjosJOg/exec'

type User = {
  id: string
  name: string
  email: string
  password: string
  role: string
  cargo: string
  active: boolean
}

export default function ListadoUsuarios() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roleFilter, setRoleFilter] = useState('Todos')
  const [areaFilter, setAreaFilter] = useState('Todas')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    cargo: '',
    active: 'SI',
  })
  const [saving, setSaving] = useState(false)

  const roleOptions = Array.from(
    new Set(users.map((user) => user.role)),
  ).filter(Boolean)
  const areaOptions = Array.from(
    new Set(users.map((user) => user.cargo)),
  ).filter(Boolean)

  const filteredUsers = users.filter((user) => {
    const matchesRole = roleFilter === 'Todos' || user.role === roleFilter
    const matchesArea = areaFilter === 'Todas' || user.cargo === areaFilter
    const matchesStatus =
      statusFilter === 'Todos' ||
      (statusFilter === 'Activos' ? user.active : !user.active)
    const query = searchQuery.trim().toLowerCase()
    const matchesSearch =
      query.length === 0 ||
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.cargo.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)

    return matchesRole && matchesArea && matchesStatus && matchesSearch
  })

  const fetchUsers = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=users`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudieron cargar usuarios.')
      }

      setUsers(Array.isArray(result.users) ? result.users : [])
    } catch (fetchError: unknown) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : 'Error al cargar usuarios.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmitUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload: Record<string, unknown> = {
        name: formValues.name,
        email: formValues.email,
        role: formValues.role,
        cargo: formValues.cargo,
        active: formValues.active === 'SI',
      }

      if (formValues.password.trim()) {
        payload.password = formValues.password
      }

      if (editingUser) {
        payload.action = 'update_user'
        payload.id = editingUser.id
      } else {
        payload.action = 'create_user'
        payload.password = formValues.password
      }

      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            (editingUser
              ? 'No se pudo actualizar el usuario.'
              : 'No se pudo crear el usuario.'),
        )
      }

      if (editingUser) {
        setUsers((prev) =>
          prev.map((item) =>
            item.id === editingUser.id
              ? {
                  ...item,
                  name: formValues.name,
                  email: formValues.email,
                  role: formValues.role,
                  cargo: formValues.cargo,
                  active: formValues.active === 'SI',
                  password: formValues.password.trim()
                    ? formValues.password
                    : item.password,
                }
              : item,
          ),
        )
      } else {
        setUsers((prev) => [result.user, ...prev])
      }

      toast.success(
        editingUser ? 'Usuario actualizado.' : 'Usuario creado exitosamente.',
      )

      setFormValues({
        name: '',
        email: '',
        password: '',
        role: '',
        cargo: '',
        active: 'SI',
      })
      setEditingUser(null)
      setIsModalOpen(false)
    } catch (saveError: unknown) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : 'Error al guardar el usuario.'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setFormValues({
      name: '',
      email: '',
      password: '',
      role: '',
      cargo: '',
      active: 'SI',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setFormValues({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      cargo: user.cargo,
      active: user.active ? 'SI' : 'NO',
    })
    setIsModalOpen(true)
  }

  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-6 md:flex-row md:items-end md:justify-between'>
        <div className='space-y-2'>
          <h2 className='text-3xl font-extrabold tracking-tight text-on-surface'>
            Listado Usuarios
          </h2>
          <p className='text-sm text-on-surface-variant max-w-2xl'>
            Consulta y gestiona los usuarios registrados del sistema con filtros
            y acciones rápidas.
          </p>
        </div>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          <button
            type='button'
            onClick={openCreateModal}
            className='inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-on-primary font-bold shadow-lg shadow-primary/20 hover:opacity-95 transition-opacity'
          >
            <span className='material-symbols-outlined'>person_add</span>
            Crear Usuario
          </button>
        </div>
      </div>

      <section className='bg-surface-container-low p-5 rounded-3xl border border-outline-variant/20 shadow-sm'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1'>
            <div>
              <p className='text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2'>
                Rol
              </p>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className='w-full rounded-2xl bg-white border border-outline-variant/20 px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none'
              >
                <option>Todos</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className='text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2'>
                Area
              </p>
              <select
                value={areaFilter}
                onChange={(event) => setAreaFilter(event.target.value)}
                className='w-full rounded-2xl bg-white border border-outline-variant/20 px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none'
              >
                <option>Todas</option>
                {areaOptions.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className='text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2'>
                Estado
              </p>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className='w-full rounded-2xl bg-white border border-outline-variant/20 px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none'
              >
                <option>Todos</option>
                <option>Activos</option>
                <option>Inactivos</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {isModalOpen &&
        createPortal(
          <div
            className='drawer fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xl p-4'
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className='modal-card w-full max-w-4xl rounded-[32px] bg-white border border-slate-200 shadow-2xl'
              onClick={(event) => event.stopPropagation()}
            >
              <div className='flex flex-col gap-4 px-8 py-6 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <p className='text-sm font-semibold text-slate-900'>
                    {editingUser ? 'Editar usuario' : 'Crear nuevo usuario'}
                  </p>
                  <p className='mt-1 text-sm text-slate-500'>
                    {editingUser
                      ? 'Actualiza los campos necesarios del usuario.'
                      : 'Llena los campos y registra el usuario con su rol y equipo.'}
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='cancelConfig rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-200'
                >
                  Cerrar
                </button>
              </div>

              <form
                className='mt-6 grid gap-4 sm:grid-cols-2 px-8 pb-8'
                onSubmit={handleSubmitUser}
              >
                <label className='block'>
                  <span className='text-sm font-medium text-slate-700'>
                    Nombre
                  </span>
                  <input
                    name='name'
                    type='text'
                    required
                    placeholder='Nombre completo'
                    value={formValues.name}
                    onChange={handleInputChange}
                    className='mt-2 w-full rounded-[28px] border border-slate-200 bg-white shadow-sm px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
                  />
                </label>

                <label className='block'>
                  <span className='text-sm font-medium text-slate-700'>
                    Correo
                  </span>
                  <input
                    name='email'
                    type='email'
                    required
                    placeholder='usuario@empresa.com'
                    value={formValues.email}
                    onChange={handleInputChange}
                    className='mt-2 w-full rounded-[28px] border border-slate-200 bg-white shadow-sm px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
                  />
                </label>

                <label className='block'>
                  <span className='text-sm font-medium text-slate-700'>
                    Password
                  </span>
                  <input
                    name='password'
                    type='text'
                    required={!editingUser}
                    placeholder={
                      editingUser ? '*************' : 'Password de acceso'
                    }
                    value={formValues.password}
                    onChange={handleInputChange}
                    className='mt-2 w-full rounded-[28px] border border-slate-200 bg-white shadow-sm px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
                  />
                </label>

                <label className='block'>
                  <span className='text-sm font-medium text-slate-700'>
                    Rol
                  </span>
                  <select
                    name='role'
                    required
                    value={formValues.role}
                    onChange={handleInputChange}
                    className='mt-2 w-full rounded-[28px] border border-slate-200 bg-white shadow-sm px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
                  >
                    <option value='' disabled>
                      Seleccione un rol
                    </option>
                    <option value='Admin'>Admin</option>
                    <option value='Soporte informatico'>
                      Soporte informatico
                    </option>
                    <option value='Solicitante'>Solicitante</option>
                  </select>
                </label>

                <label className='block sm:col-span-2'>
                  <span className='text-sm font-medium text-slate-700'>
                    Cargo
                  </span>
                  <input
                    name='cargo'
                    type='text'
                    required
                    placeholder='Cargo del usuario'
                    value={formValues.cargo}
                    onChange={handleInputChange}
                    className='mt-2 w-full rounded-[28px] border border-slate-200 bg-white shadow-sm px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
                  />
                </label>

                <label className='block sm:col-span-2'>
                  <span className='block text-sm font-medium text-slate-700'>
                    Estado
                  </span>
                  <select
                    name='active'
                    value={formValues.active}
                    onChange={handleInputChange}
                    className='mt-2 block w-32 rounded-[28px] border border-slate-200 bg-white shadow-sm px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
                  >
                    <option value='SI'>Activo</option>
                    <option value='NO'>Inactivo</option>
                  </select>
                </label>

                <div className='sm:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end'>
                  <button
                    type='button'
                    onClick={() => setIsModalOpen(false)}
                    className='cancelConfig rounded-[28px] border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100'
                  >
                    Cancelar
                  </button>
                  <button
                    type='submit'
                    disabled={saving}
                    className='rounded-[28px] bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60'
                  >
                    {saving
                      ? 'Guardando...'
                      : editingUser
                        ? 'Actualizar'
                        : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
      <div className='flex items-center justify-between'>
        <div></div>
        <div className='relative w-full sm:w-auto'>
          <span className='absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400'>
            search
          </span>
          <input
            className='w-full sm:w-72 bg-surface-container-highest border border-outline-variant/50 rounded-full py-3 pl-12 pr-4 text-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none'
            placeholder='Buscar usuarios...'
            type='text'
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </div>
      <section className='bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm border border-outline-variant/20'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse'>
            <thead className='bg-surface-container-low'>
              <tr>
                <th className='py-5 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest'>
                  Nombre
                </th>
                <th className='py-5 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest'>
                  Rol
                </th>
                <th className='py-5 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest'>
                  Cargo
                </th>
                <th className='py-5 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest'>
                  Correo
                </th>

                <th className='py-5 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest text-right'>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-outline-variant/10'>
              {loading ? (
                <tr>
                  <td
                    className='py-6 px-6 text-sm text-on-surface-variant'
                    colSpan={6}
                  >
                    Cargando usuarios...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className='py-6 px-6 text-sm text-error' colSpan={6}>
                    {error}
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className='group hover:bg-surface-container-low/50 transition-colors'
                  >
                    <td className='py-6 px-6 font-semibold text-on-surface'>
                      {user.name}
                    </td>
                    <td className='py-6 px-6 text-sm text-on-surface-variant'>
                      {user.role}
                    </td>
                    <td className='py-6 px-6 text-sm text-on-surface-variant'>
                      {user.cargo}
                    </td>
                    <td className='py-6 px-6 text-sm text-primary'>
                      {user.email}
                    </td>

                    <td className='py-6 px-6 text-right'>
                      <button
                        type='button'
                        onClick={() => openEditModal(user)}
                        className='inline-flex items-center gap-2 rounded-full border border-outline-variant/40 px-4 py-2 text-xs font-semibold text-on-surface-variant hover:border-primary hover:text-primary transition'
                      >
                        <span className='material-symbols-outlined text-sm'>
                          edit
                        </span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className='py-6 px-6 text-sm text-on-surface-variant'
                    colSpan={6}
                  >
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
