import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../../lib/supabase'
import useAppStore from '../../store/useAppStore'

const CATEGORIES = [
  { value: 'salon',        label: 'Salón' },
  { value: 'fotografia',   label: 'Fotografía' },
  { value: 'catering',     label: 'Catering' },
  { value: 'musica',       label: 'Música / DJ' },
  { value: 'flores',       label: 'Flores / Decoración' },
  { value: 'indumentaria', label: 'Indumentaria' },
  { value: 'otros',        label: 'Otros' },
]

export default function VendorFormModal({ open, onClose, vendor, onSaved }) {
  const { eventId } = useAppStore()
  const [saveError, setSaveError] = useState(null)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()

  useEffect(() => {
    if (open) {
      setSaveError(null)
      reset(vendor
        ? { name: vendor.name, category: vendor.category, status: vendor.status, notes: vendor.notes ?? '', chosen_amount: vendor.chosen_amount ?? '' }
        : { name: '', category: 'salon', status: 'en_revision', notes: '', chosen_amount: '' }
      )
    }
  }, [open, vendor])

  async function onSubmit(values) {
    setSaveError(null)
    const payload = {
      event_id:      eventId,
      name:          values.name.trim(),
      category:      values.category,
      status:        values.status,
      notes:         values.notes?.trim() || null,
      chosen_amount: parseFloat(values.chosen_amount) || null,
    }
    let error
    if (vendor) {
      ;({ error } = await supabase.from('vendors').update(payload).eq('id', vendor.id))
    } else {
      ;({ error } = await supabase.from('vendors').insert(payload))
    }
    if (error) { setSaveError(error.message); return }
    onSaved(); onClose()
  }

  async function handleDelete() {
    const { error } = await supabase.from('vendors').delete().eq('id', vendor.id)
    if (!error) { onSaved(); onClose() }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface rounded-t-2xl md:rounded-2xl shadow-xl p-6 pb-8">

        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-bordo text-xl">{vendor ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink transition p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Nombre</label>
            <input className="input-base" placeholder="Ej: Salón Las Rosas, Foto Studio..."
              {...register('name', { required: 'Obligatorio' })} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Rubro</label>
            <select className="input-base" {...register('category')}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Estado</label>
            <select className="input-base" {...register('status')}>
              <option value="en_revision">En revisión</option>
              <option value="confirmado">Confirmado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Monto contratado (opcional)</label>
            <input
              type="number" min={0} step={1}
              className="input-base"
              placeholder="Ej: 150000"
              {...register('chosen_amount')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Notas (opcional)</label>
            <textarea rows={2} className="input-base resize-none" placeholder="Contacto, condiciones..."
              {...register('notes')} />
          </div>

          {saveError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600">
              {saveError}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Guardando...' : vendor ? 'Guardar cambios' : 'Agregar proveedor'}
          </button>

          {vendor && (
            <button type="button" onClick={handleDelete}
              className="w-full text-sm text-red-500 border border-red-200 rounded-xl py-2.5 hover:bg-red-50 transition">
              Eliminar proveedor
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
