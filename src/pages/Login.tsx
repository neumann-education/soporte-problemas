import { useState } from 'react'

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxF9tYK9MKuDh07J34mL22ehRP-OgWb7G1ilsU7imTg4EdBiH023mYqrkQI4yjosJOg/exec'

type SessionUser = {
  id: string
  name: string
  email: string
  role: string
  cargo: string
}

interface LoginProps {
  onLogin: (user: SessionUser) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'login', email, password }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Credenciales inválidas.')
      }

      onLogin(result.user)
    } catch (loginError: unknown) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Error al iniciar sesión.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-background px-4'>
      <div className='w-full max-w-md rounded-[2rem] bg-surface-container-lowest p-8 shadow-lg border border-outline-variant/20'>
        <div className='mb-6 text-center'>
          <p className='text-xs uppercase tracking-[0.3em] text-on-surface-variant font-bold'>
            Acceso
          </p>
          <h1 className='mt-3 text-3xl font-extrabold text-on-surface'>
            Iniciar sesion
          </h1>
          <p className='mt-2 text-base text-on-surface-variant'>
            Ingresa con tu correo y password registrados.
          </p>
        </div>

        <form className='space-y-4' onSubmit={handleSubmit}>
          <div>
            <label className='text-base font-semibold text-on-surface-variant'>
              Correo
            </label>
            <input
              type='email'
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className='mt-2 w-full rounded-full border border-outline-variant/30 bg-white px-4 py-3 text-base text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none'
              placeholder='usuario@empresa.com'
              required
            />
          </div>

          <div>
            <label className='text-base font-semibold text-on-surface-variant'>
              Password
            </label>
            <div className='relative mt-2'>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className='w-full rounded-full border border-outline-variant/30 bg-white px-4 py-3 pr-12 text-base text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none'
                placeholder='********'
                required
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface-variant transition-colors'
                aria-label={
                  showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
              >
                <span className='material-symbols-outlined text-lg'>
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {error && (
            <div className='rounded-2xl border border-error-container/40 bg-error-container/20 p-3 text-base text-error'>
              {error}
            </div>
          )}

          <button
            type='submit'
            disabled={loading}
            className='w-full rounded-full bg-primary py-3 text-base font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 disabled:opacity-60'
          >
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
