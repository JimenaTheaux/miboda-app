import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { supabase } from '../../lib/supabase'
import useAppStore from '../../store/useAppStore'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user, setEventId, setEvent } = useAppStore()
  const [coverPhoto, setCoverPhoto] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const { register, handleSubmit, formState: { errors } } = useForm()

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setCoverPhoto(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  async function onSubmit(data) {
    setLoading(true)
    setError('')
    try {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          bride1_name: data.bride1_name.trim(),
          bride2_name: data.bride2_name.trim(),
          wedding_date: data.wedding_date,
        })
        .select().single()

      if (eventError) throw eventError

      const { error: euError } = await supabase
        .from('event_users')
        .insert({ event_id: event.id, user_id: user.id, role: 'bride' })
      if (euError) throw euError

      if (coverPhoto) {
        const ext = coverPhoto.name.split('.').pop().toLowerCase()
        const path = `${event.id}/portada/cover.${ext}`
        const { error: upErr } = await supabase.storage
          .from('miboda-files').upload(path, coverPhoto, { upsert: true })
        if (!upErr) {
          await supabase.from('events').update({ cover_photo_url: path }).eq('id', event.id)
          event.cover_photo_url = path
        }
      }

      await supabase.auth.signInWithOtp({
        email: data.bride2_email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?event_id=${event.id}` },
      })

      setEventId(event.id)
      setEvent(event)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Ocurrió un error. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const labelCls = 'block text-sm font-medium text-ink-mid mb-1.5'

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="relative bg-bordo overflow-hidden h-40">
        <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '50%' }}
          className="absolute -right-12 -top-12 w-52 h-52 pointer-events-none" />
        <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '50%' }}
          className="absolute -left-14 -bottom-10 w-48 h-48 pointer-events-none" />
        <div className="relative z-10 h-full flex flex-col justify-center px-5">
          <p className="font-serif text-white text-3xl">MiBoda</p>
          <p className="text-white/60 text-sm mt-1">Contanos de su boda</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto px-5 py-6 pb-12">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Foto de portada */}
          <div>
            <label className={labelCls}>
              Foto de portada <span className="font-normal text-ink-soft">(opcional)</span>
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full h-40 rounded-xl border border-border bg-surface-2 overflow-hidden flex items-center justify-center transition hover:border-bordo-light"
            >
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="Portada" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                    <span className="text-white text-xs font-medium bg-black/40 px-3 py-1.5 rounded-lg">Cambiar</span>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-3xl mb-1.5">📷</p>
                  <p className="text-sm text-ink-soft">Tocá para agregar una foto</p>
                </div>
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </div>

          {/* Nombre Novia 1 */}
          <div>
            <label className={labelCls}>Tu nombre</label>
            <input {...register('bride1_name', { required: 'Ingresá tu nombre' })}
              type="text" placeholder="Ana García" className="input-base" />
            {errors.bride1_name && <p className="text-red-500 text-xs mt-1">{errors.bride1_name.message}</p>}
          </div>

          {/* Nombre Novia 2 */}
          <div>
            <label className={labelCls}>Nombre de tu pareja</label>
            <input {...register('bride2_name', { required: 'Ingresá el nombre de tu pareja' })}
              type="text" placeholder="María López" className="input-base" />
            {errors.bride2_name && <p className="text-red-500 text-xs mt-1">{errors.bride2_name.message}</p>}
          </div>

          {/* Fecha */}
          <div>
            <label className={labelCls}>Fecha del casamiento</label>
            <input {...register('wedding_date', { required: 'Elegí la fecha' })}
              type="date" min={new Date().toISOString().split('T')[0]} className="input-base" />
            {errors.wedding_date && <p className="text-red-500 text-xs mt-1">{errors.wedding_date.message}</p>}
          </div>

          {/* Email Novia 2 */}
          <div>
            <label className={labelCls}>Email de tu pareja</label>
            <p className="text-xs text-ink-soft mb-2">Le enviamos un link para que acceda a MiBoda</p>
            <input {...register('bride2_email', {
              required: 'Ingresá el email de tu pareja',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
            })} type="email" placeholder="pareja@ejemplo.com" className="input-base" />
            {errors.bride2_email && <p className="text-red-500 text-xs mt-1">{errors.bride2_email.message}</p>}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Creando su boda...' : 'Crear nuestra boda'}
          </button>
        </form>
      </div>
    </div>
  )
}
