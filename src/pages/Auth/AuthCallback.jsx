import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import useAppStore from '../../store/useAppStore'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { setUser, setEventId, setEvent } = useAppStore()
  const [error, setError] = useState(null)

  useEffect(() => {
    async function handleCallback() {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const eventIdFromInvite = params.get('event_id')

        let session = null

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
          session = data.session
        }

        if (!session) {
          const { data, error } = await supabase.auth.getSession()
          if (error) throw error
          session = data.session
        }

        if (!session?.user) { navigate('/login', { replace: true }); return }

        setUser(session.user)

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

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center">
        <p className="font-serif text-bordo text-4xl mb-3">MiBoda</p>
        <p className="text-ink-soft text-sm animate-pulse">Verificando tu acceso...</p>
      </div>
    </div>
  )
}
