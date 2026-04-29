import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../../lib/supabase'
import useAppStore from '../../store/useAppStore'

export default function TableFormModal({ open, onClose, table, onSaved }) {
  const { eventId } = useAppStore()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()

  useEffect(() => {
    if (open) {
      reset(table ? { name: table.name, capacity: table.capacity } : { name: '', capacity: '' })
    }
  }, [open, table])

  async function onSubmit(values) {
    const payload = {
      name: values.name.trim(),
      capacity: parseInt(values.capacity, 10),
      event_id: eventId,
    }
    if (table) {
      await supabase.from('tables').update(payload).eq('id', table.id)
    } else {
      await supabase.from('tables').insert(payload)
    }
    onSaved()
    onClose()
  }

  async function handleDelete() {
    if (!table) return
    await supabase.from('tables').delete().eq('id', table.id)
    onSaved()
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface rounded-t-2xl md:rounded-2xl shadow-xl p-6 pb-8">

        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-bordo text-xl">
            {table ? 'Editar mesa' : 'Nueva mesa'}
          </h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink transition p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Nombre de la mesa</label>
            <input
              className="input-base"
              placeholder="Ej: Mesa 1, Familia García..."
              {...register('name', { required: 'Obligatorio' })}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Capacidad</label>
            <input
              type="number"
              min={1}
              max={30}
              className="input-base"
              placeholder="Ej: 10"
              {...register('capacity', {
                required: 'Obligatorio',
                min: { value: 1, message: 'Mínimo 1' },
                max: { value: 30, message: 'Máximo 30' },
              })}
            />
            {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary mt-2">
            {isSubmitting ? 'Guardando...' : table ? 'Guardar cambios' : 'Crear mesa'}
          </button>

          {table && (
            <button
              type="button"
              onClick={handleDelete}
              className="w-full text-sm text-red-500 border border-red-200 rounded-xl py-2.5 hover:bg-red-50 transition"
            >
              Eliminar mesa
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
