import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../../lib/supabase'
import useAppStore from '../../store/useAppStore'

const CATEGORIES = [
  'Salón', 'Catering', 'Música', 'Fotografía', 'Decoración',
  'Vestimenta', 'Invitados', 'Papeles', 'Viaje', 'General',
]

export default function ChecklistItemFormModal({ open, onClose, item, onSaved, bride1, bride2 }) {
  const { eventId } = useAppStore()
  const [saveError, setSaveError] = useState(null)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()

  useEffect(() => {
    if (open) {
      setSaveError(null)
      reset(item
        ? {
            title:       item.title,
            category:    item.category ?? '',
            notes:       item.notes ?? '',
            assigned_to: item.assigned_to ?? 'ambas',
            due_date:    item.due_date ?? '',
          }
        : { title: '', category: '', notes: '', assigned_to: 'ambas', due_date: '' }
      )
    }
  }, [open, item])

  async function onSubmit(values) {
    setSaveError(null)
    const payload = {
      event_id:    eventId,
      title:       values.title.trim(),
      category:    values.category?.trim() || null,
      notes:       values.notes?.trim()    || null,
      assigned_to: values.assigned_to || 'ambas',
      due_date:    values.due_date || null,
    }
    let error
    if (item) {
      ;({ error } = await supabase.from('checklist_items').update(payload).eq('id', item.id))
    } else {
      ;({ error } = await supabase.from('checklist_items').insert(payload))
    }
    if (error) { setSaveError(error.message); return }
    onSaved()
    onClose()
  }

  async function handleDelete() {
    const { error } = await supabase.from('checklist_items').delete().eq('id', item.id)
    if (!error) { onSaved(); onClose() }
  }

  if (!open) return null

  const assignOptions = [
    { value: 'ambas',  label: 'Ambas' },
    { value: 'novia1', label: bride1 || 'Novia 1' },
    { value: 'novia2', label: bride2 || 'Novia 2' },
  ]

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface rounded-t-2xl md:rounded-2xl shadow-xl p-6 pb-14 md:pb-8">

        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-bordo text-xl">{item ? 'Editar tarea' : 'Nueva tarea'}</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink transition p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Tarea</label>
            <input
              className="input-base"
              placeholder="Ej: Confirmar el salón..."
              {...register('title', { required: 'Obligatorio' })}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Categoría (opcional)</label>
            <select className="input-base" {...register('category')}>
              <option value="">Sin categoría</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-2">Asignar a</label>
            <div className="flex gap-2">
              {assignOptions.map((opt) => (
                <label key={opt.value} className="flex-1 cursor-pointer">
                  <input type="radio" value={opt.value} className="peer sr-only" {...register('assigned_to')} />
                  <span className="block text-center text-xs font-medium py-2 rounded-xl border transition
                    border-border text-ink-soft hover:border-bordo-light
                    peer-checked:bg-bordo peer-checked:text-white peer-checked:border-bordo">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Fecha límite (opcional)</label>
            <input
              type="date"
              className="input-base"
              {...register('due_date')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Notas (opcional)</label>
            <textarea
              rows={2}
              className="input-base resize-none"
              placeholder="Detalles adicionales..."
              {...register('notes')}
            />
          </div>

          {saveError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600">
              {saveError}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-primary mt-2">
            {isSubmitting ? 'Guardando...' : item ? 'Guardar cambios' : 'Agregar tarea'}
          </button>

          {item && (
            <button type="button" onClick={handleDelete}
              className="w-full text-sm text-red-500 border border-red-200 rounded-xl py-2.5 hover:bg-red-50 transition">
              Eliminar tarea
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
