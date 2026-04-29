import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../../lib/supabase'
import useAppStore from '../../store/useAppStore'

const DEFAULTS = {
  full_name: '', age_group: 'adulto', status: 'pendiente',
  invited_by: 'ambas', menu: 'adulto', dietary_notes: '',
}

export const PRESET_CATS = [
  { value: 'familia',        label: 'Familia' },
  { value: 'amigos',         label: 'Amigos' },
  { value: 'trabajo',        label: 'Trabajo' },
  { value: 'parejas_amigos', label: 'Parejas de amigos' },
  { value: 'otros',          label: 'Otros' },
]
const PRESET_VALUES = PRESET_CATS.map((c) => c.value)

export default function GuestFormModal({ open, onClose, guest, onSaved }) {
  const { eventId, event } = useAppStore()
  const bride1 = event?.bride1_name || 'Novia 1'
  const bride2 = event?.bride2_name || 'Novia 2'

  const { register, handleSubmit, reset, watch, setValue,
    formState: { errors, isSubmitting } } = useForm({ defaultValues: DEFAULTS })

  const [catValue, setCatValue]     = useState('')
  const [customCat, setCustomCat]   = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const ageGroup = watch('age_group')
  const isEditing = !!guest

  useEffect(() => {
    if (!open) return
    reset(guest ? {
      full_name: guest.full_name, age_group: guest.age_group, status: guest.status,
      invited_by: guest.invited_by, menu: guest.menu, dietary_notes: guest.dietary_notes ?? '',
    } : DEFAULTS)

    const cat = guest?.category ?? ''
    if (cat && !PRESET_VALUES.includes(cat)) {
      setCatValue('__custom__')
      setShowCustom(true)
      setCustomCat(cat)
    } else {
      setCatValue(cat)
      setShowCustom(false)
      setCustomCat('')
    }
  }, [open, guest])

  useEffect(() => {
    if (ageGroup === 'nino') setValue('menu', 'infantil')
    else setValue('menu', 'adulto')
  }, [ageGroup])

  function handleCatChange(e) {
    const val = e.target.value
    setCatValue(val)
    setShowCustom(val === '__custom__')
    if (val !== '__custom__') setCustomCat('')
  }

  async function onSubmit(data) {
    const category = showCustom
      ? (customCat.trim() || null)
      : (catValue || null)

    const payload = {
      full_name: data.full_name.trim(), age_group: data.age_group,
      status: data.status, invited_by: data.invited_by, menu: data.menu,
      dietary_notes: data.dietary_notes?.trim() || null,
      category,
    }
    if (isEditing) await supabase.from('guests').update(payload).eq('id', guest.id)
    else await supabase.from('guests').insert({ ...payload, event_id: eventId })
    onSaved(); onClose()
  }

  async function handleDelete() {
    if (!window.confirm('¿Eliminás a este invitado?')) return
    await supabase.from('guests').delete().eq('id', guest.id)
    onSaved(); onClose()
  }

  const labelCls = 'block text-sm font-medium text-ink-mid mb-1.5'
  const selectCls = 'input-base appearance-none'

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

        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4 pb-14">

          <div>
            <label className={labelCls}>Nombre completo</label>
            <input {...register('full_name', { required: 'Ingresá el nombre' })}
              type="text" placeholder="Ana García" className="input-base" />
            {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
          </div>

          {/* Categoría */}
          <div>
            <label className={labelCls}>Categoría</label>
            <select value={catValue} onChange={handleCatChange} className={selectCls}>
              <option value="">Sin categoría</option>
              {PRESET_CATS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
              <option value="__custom__">Otra categoría...</option>
            </select>
            {showCustom && (
              <input
                type="text"
                value={customCat}
                onChange={(e) => setCustomCat(e.target.value)}
                placeholder="Escribí la categoría"
                className="input-base mt-2"
                autoFocus
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Edad</label>
              <select {...register('age_group')} className={selectCls}>
                <option value="adulto">Adulto</option>
                <option value="adolescente">Adolescente</option>
                <option value="nino">Niño</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <select {...register('status')} className={selectCls}>
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
                <option value="no_asiste">No asiste</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Invitado por</label>
              <select {...register('invited_by')} className={selectCls}>
                <option value="novia1">{bride1}</option>
                <option value="novia2">{bride2}</option>
                <option value="ambas">Ambas</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Menú</label>
              <select {...register('menu')} className={selectCls}>
                <option value="adulto">Adulto</option>
                <option value="infantil">Infantil</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Restricciones alimentarias{' '}
              <span className="font-normal text-ink-soft">(opcional)</span>
            </label>
            <textarea {...register('dietary_notes')}
              placeholder="Vegano, celíaco, alérgico a nueces..."
              rows={2} className="input-base resize-none" />
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
