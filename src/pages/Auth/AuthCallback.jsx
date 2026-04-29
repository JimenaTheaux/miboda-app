import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import useAppStore from '../../store/useAppStore'

function SetPasswordForm() {
  const navigate = useNavigate()
  const { setUser, setEventId, setEvent } = useAppStore()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 6) { setError('Mínimo 6 caracteres'); return }
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.updateUser({ password })
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

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="font-serif text-bordo text-4xl mb-1">MiBoda</p>
          <p className="text-ink-soft text-sm">Creá tu contraseña</p>
        </div>
        <form onSubmit={handleSubmit} className="card">
          <h2 className="font-semibold text-ink text-lg mb-1">Nueva contraseña</h2>
          <p className="text-ink-soft text-sm mb-5">Usala para ingresar en el futuro.</p>

          <label className="block text-sm font-medium text-ink-mid mb-1.5">Contraseña</label>
          <div className="relative mb-4">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              autoComplete="new-password"
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

          <label className="block text-sm font-medium text-ink-mid mb-1.5">Confirmá la contraseña</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repetí la contraseña"
            required
            autoComplete="new-password"
            className="input-base mb-4"
          />

          {error && (
            <p className="text-red-500 text-xs mb-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={loading || !password || !confirm} className="btn-primary w-full">
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const { setUser, setEventId, setEvent } = useAppStore()
  const [error, setError] = useState(null)
  const [isRecovery, setIsRecovery] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function handleCallback() {
      try {
        await new Promise((r) => setTimeout(r, 100))

        // Check if this is a password recovery link
        const hash = window.location.hash
        const hashParams = new URLSearchParams(hash.replace('#', ''))
        const type = hashParams.get('type')

        if (type === 'recovery') {
          // Supabase will auto-sign in the user from the hash token
          const { data, error } = await supabase.auth.getSession()
          if (error) throw error
          if (data.session?.user) {
            setUser(data.session.user)
          }
          setIsRecovery(true)
          setReady(true)
          return
        }

        const { data, error } = await supabase.auth.getSession()
        if (error) throw error

        const session = data.session
        if (!session?.user) { navigate('/login', { replace: true }); return }

        setUser(session.user)

        const params = new URLSearchParams(window.location.search)
        const eventIdFromInvite = params.get('event_id')

        if (eventIdFromInvite) {
          const { data: existing } = await supabase
            .from('event_users').select('id').eq('user_id', session.user.id).single()
          if (!existing) {
            await supabase.from('event_users')
              .insert({ event_id: eventIdFromInvite, user_id: session.user.id, role: 'bride' })
          }
        }

        const { data: eventData } = await supabase
          .from('event_users').select('event_id, events(*)')
          .eq('user_id', session.user.id).single()

        if (eventData) {
          setEventId(eventData.event_id)
          setEvent(eventData.events)
          navigate('/dashboard', { replace: true })
        } else {
          navigate('/onboarding', { replace: true })
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setError(err.message)
      }
    }

    handleCallback()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-5">
        <div className="card text-center max-w-sm w-full">
          <p className="text-3xl mb-3">⚠️</p>
          <h2 className="font-semibold text-ink mb-2">Error al verificar</h2>
          <p className="text-ink-soft text-sm mb-5 bg-surface rounded-lg px-3 py-2">{error}</p>
          <a href="/login" className="btn-primary inline-block">Volver al login</a>
        </div>
      </div>
    )
  }

  if (isRecovery && ready) {
    return <SetPasswordForm />
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center">
        <p className="font-serif text-bordo text-4xl mb-3">MiBoda</p>
        <p className="text-ink-soft text-sm animate-pulse">Verificando tu acceso...</p>
      </div>
    </div>
  )
}
