import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header decorativo */}
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

      {/* Card de login */}
      <div className="flex-1 flex items-start justify-center px-5 pt-8 pb-10">
        <div className="w-full max-w-sm">
          {sent ? (
            <div className="card text-center py-8">
              <p className="text-4xl mb-4">💌</p>
              <h2 className="font-semibold text-ink text-lg mb-2">¡Revisá tu correo!</h2>
              <p className="text-ink-soft text-sm leading-relaxed">
                Enviamos un link a{' '}
                <span className="font-medium text-bordo">{email}</span>.
                <br />Hacé click para ingresar.
              </p>
              <p className="text-ink-soft text-xs mt-4">
                ¿No llegó?{' '}
                <button
                  onClick={() => { setSent(false); setEmail('') }}
                  className="text-bordo underline"
                >
                  Intentá de nuevo
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card">
              <h2 className="font-semibold text-ink text-lg mb-1">Ingresá a tu cuenta</h2>
              <p className="text-ink-soft text-sm mb-5">Link mágico — sin contraseña.</p>

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

              <button type="submit" disabled={loading || !email} className="btn-primary w-full">
                {loading ? 'Enviando...' : 'Enviame el link'}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-ink-soft mt-5">
            Acceso seguro por email · Sin contraseña
          </p>
        </div>
      </div>
    </div>
  )
}
