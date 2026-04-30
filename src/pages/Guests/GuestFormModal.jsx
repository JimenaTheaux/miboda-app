import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../../lib/supabase'
import useAppStore from '../../store/useAppStore'

export const PRESET_CATS = [
  { value: 'familia',        label: 'Familia' },
  { value: 'amigos',         label: 'Amigos' },
  { value: 'trabajo',        label: 'Trabajo' },
  { value: 'parejas_amigos', label: 'Parejas de amigos' },
  { value: 'otros',          label: 'Otros' },
]
const PRESET_VALUES = PRESET_CATS.map((c) => c.value)

function PillGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all active:scale-95 ${
            value === opt.value
              ? 'bg-bordo text-white border-bordo shadow-sm'
              : 'bg-surface border-border text-ink-soft hover:border-bordo-light hover:text-ink'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function GuestFormModal({ open, onClose, guest, onSaved }) {
  const { eventId, event } = useAppStore()
  const bride1 = event?.bride1_name || 'Novia 1'
  const bride2 = event?.bride2_name || 'Novia 2'
  const isEditing = !!guest

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()

  const [ageGroup,   setAgeGroup]   = useState('adulto')
  const [status,     setStatus]     = useState('pendiente')
  const [invitedBy,  setInvitedBy]  = useState('ambas')
  const [menu,       setMenu]       = useState('adulto')
  const [catValue,   setCatValue]   = useState('')
  const [customCat,  setCustomCat]  = useState('')
  const [showCustom, setShowCustom] = useState(false)

  useEffect(() => {
    if (!open) return
    reset({
      full_name:      guest?.full_name      ?? '',
      dietary_notes:  guest?.dietary_notes  ?? '',
    })
    setAgeGroup(guest?.age_group  || 'adulto')
    setStatus(guest?.status       || 'pendiente')
    setInvitedBy(guest?.invited_by || 'ambas')
    setMenu(guest?.menu            || 'adulto')

    const cat = guest?.category ?? ''
    if (cat && !PRESET_VALUES.includes(cat)) {
      setCatValue('__custom__'); setShowCustom(true); setCustomCat(cat)
    } else {
      setCatValue(cat); setShowCustom(false); setCustomCat('')
    }
  }, [open, guest])

  useEffect(() => {
    if (ageGroup === 'nino') setMenu('infantil')
  }, [ageGroup])

  async function onSubmit(data) {
    const category = showCustom ? (customCat.trim() || null) : (catValue || null)
    const payload = {
      full_name:      data.full_name.trim(),
      dietary_notes:  data.dietary_notes?.trim() || null,
      age_group:      ageGroup,
      status,
      invited_by:     invitedBy,
      menu,
      category,
    }
    if (isEditing) await supabase.from('guests').update(payload).eq('id', guest.id)
    else            await supabase.from('guests').insert({ ...payload, event_id: eventId })
    onSaved(); onClose()
  }

  async function handleDelete() {
    if (!window.confirm('¿Eliminás a este invitado?')) return
    await supabase.from('guests').delete().eq('id', guest.id)
    onSaved(); onClose()
  }

  const lbl = 'block text-[11px] font-semibold text-ink-soft uppercase tracking-wide mb-2'

  return (
    <div className={`fixed inset-0 z-[60] ${open ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 max-w-lg mx-auto bg-surface rounded-t-2xl max-h-[92vh] overflow-y-auto transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="font-semibold text-ink">
            {isEditing ? 'Editar invitado' : 'Agregar invitado'}
          </h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink p-1 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-5 pb-14">

          {/* Nombre */}
          <div>
            <label className={lbl}>Nombre completo</label>
            <input
              {...register('full_name', { required: 'Ingresá el nombre' })}
              type="text" placeholder="Ana García" className="input-base"
            />
            {errors.full_name && (
              <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>
            )}
          </div>

          {/* Estado */}
          <div>
            <label className={lbl}>Estado</label>
            <PillGroup value={status} onChange={setStatus} options={[
              { value: 'pendiente',  label: '· Pendiente' },
              { value: 'confirmado', label: '✓ Confirmado' },
              { value: 'no_asiste',  label: '✕ No asiste' },
            ]} />
          </div>

          {/* Categoría */}
          <div>
            <label className={lbl}>Categoría</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_CATS.map((c) => (
                <button key={c.value} type="button"
                  onClick={() => { setCatValue(c.value); setShowCustom(false); setCustomCat('') }}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all active:scale-95 ${
                    catValue === c.value && !showCustom
                      ? 'bg-bordo text-white border-bordo shadow-sm'
                      : 'bg-surface border-border text-ink-soft hover:border-bordo-light hover:text-ink'
                  }`}>
                  {c.label}
                </button>
              ))}
              <button type="button"
                onClick={() => { setCatValue('__custom__'); setShowCustom(true) }}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all active:scale-95 ${
                  showCustom
                    ? 'bg-bordo text-white border-bordo shadow-sm'
                    : 'bg-surface border-border text-ink-soft hover:border-bordo-light'
                }`}>
                + Otra
              </button>
              {(catValue || showCustom) && (
                <button type="button"
                  onClick={() => { setCatValue(''); setShowCustom(false); setCustomCat('') }}
                  className="px-2.5 py-2 rounded-xl text-xs border border-border text-ink-soft hover:text-red-400 transition">
                  ✕
                </button>
              )}
            </div>
            {showCustom && (
              <input type="text" value={customCat} onChange={(e) => setCustomCat(e.target.value)}
                placeholder="Escribí la categoría" className="input-base mt-2" autoFocus />
            )}
          </div>

          {/* Edad */}
          <div>
            <label className={lbl}>Edad</label>
            <PillGroup value={ageGroup} onChange={setAgeGroup} options={[
              { value: 'adulto',      label: 'Adulto' },
              { value: 'adolescente', label: 'Adolescente' },
              { value: 'nino',        label: 'Niño / Niña' },
            ]} />
          </div>

          {/* Invitado por */}
          <div>
            <label className={lbl}>Invitado por</label>
            <PillGroup value={invitedBy} onChange={setInvitedBy} options={[
              { value: 'novia1', label: bride1 },
              { value: 'novia2', label: bride2 },
              { value: 'ambas',  label: 'Ambas' },
            ]} />
          </div>

          {/* Menú */}
          <div>
            <label className={lbl}>Menú</label>
            <PillGroup value={menu} onChange={setMenu} options={[
              { value: 'adulto',   label: 'Adulto' },
              { value: 'infantil', label: 'Infantil' },
            ]} />
          </div>

          {/* Restricciones */}
          <div>
            <label className={lbl}>
              Restricciones alimentarias{' '}
              <span className="normal-case font-normal text-ink-soft">(opcional)</span>
            </label>
            <textarea
              {...register('dietary_notes')}
              placeholder="Vegano, celíaco, alérgico a nueces..."
              rows={2} className="input-base resize-none"
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Agregar invitado'}
          </button>

          {isEditing && (
            <button type="button" onClick={handleDelete}
              className="w-full text-red-500 text-sm font-medium py-2.5 rounded-xl border border-red-200 hover:bg-red-50 transition">
              Eliminar invitado
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
