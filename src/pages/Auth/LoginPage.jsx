import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import useAppStore from '../../store/useAppStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser, setEventId, setEvent } = useAppStore()
  const [mode, setMode] = useState('login') // 'login' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }

    setUser(data.user)

    const { data: eventData } = await supabase
      .from('event_users').select('event_id, events(*)')
      .eq('user_id', data.user.id).single()

    if (eventData) {
      setEventId(eventData.event_id)
      setEvent(eventData.events)
      navigate('/dashboard', { replace: true })
    } else {
      navigate('/onboarding', { replace: true })
    }
    setLoading(false)
  }

  async function handleReset(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const redirectTo = `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) { setError(error.message); setLoading(false); return }
    setResetSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="relative bg-bordo overflow-hidden h-56 flex-shrink-0">
        <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '50%' }}
          className="absolute -right-16 -top-16 w-64 h-64 pointer-events-none" />
        <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '50%' }}
          className="absolute -right-6 -top-6 w-44 h-44 pointer-events-none" />
        <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '50%' }}
          className="absolute -left-16 -bottom-10 w-56 h-56 pointer-events-none" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-serif text-white text-5xl leading-none">MiBoda</p>
          <p className="text-white/50 text-sm mt-2">Tu organizador de casamiento</p>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-5 pt-8 pb-10">
        <div className="w-full max-w-sm">

          {mode === 'reset' ? (
            resetSent ? (
              <div className="card text-center py-8">
                <p className="text-4xl mb-4">📧</p>
                <h2 className="font-semibold text-ink text-lg mb-2">¡Revisá tu correo!</h2>
                <p className="text-ink-soft text-sm leading-relaxed">
                  Enviamos un link a{' '}
                  <span className="font-medium text-bordo">{email}</span>.<br />
                  Hacé click para crear tu contraseña.
                </p>
                <button
                  onClick={() => { setMode('login'); setResetSent(false) }}
                  className="btn-primary w-full mt-6"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="card">
                <h2 className="font-semibold text-ink text-lg mb-1">Crear / recuperar contraseña</h2>
                <p className="text-ink-soft text-sm mb-5">Te enviamos un link por email.</p>

                <label className="block text-sm font-medium text-ink-mid mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tumail@ejemplo.com"
                  required
                  autoComplete="email"
                  className="input-base mb-4"
                />

                {error && (
                  <p className="text-red-500 text-xs mb-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <button type="submit" disabled={loading || !email} className="btn-primary w-full mb-3">
                  {loading ? 'Enviando...' : 'Enviar link'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError('') }}
                  className="w-full text-center text-sm text-ink-soft"
                >
                  ← Volver
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleLogin} className="card">
              <h2 className="font-semibold text-ink text-lg mb-1">Ingresá a tu cuenta</h2>
              <p className="text-ink-soft text-sm mb-5">Email y contraseña.</p>

              <label className="block text-sm font-medium text-ink-mid mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tumail@ejemplo.com"
                required
                autoComplete="email"
                className="input-base mb-4"
              />

              <label className="block text-sm font-medium text-ink-mid mb-1.5">Contraseña</label>
              <div className="relative mb-4">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="input-base w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
                  tabIndex={-1}
                >
                  {showPass ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {error && (
                <p className="text-red-500 text-xs mb-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button type="submit" disabled={loading || !email || !password} className="btn-primary w-full mb-3">
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>

              <button
                type="button"
                onClick={() => { setMode('reset'); setError('') }}
                className="w-full text-center text-sm text-bordo"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
