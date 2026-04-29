import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { supabase } from '../../lib/supabase'
import useAppStore from '../../store/useAppStore'

function fmt(n) { return '$ ' + Math.round(n || 0).toLocaleString('es-AR') }

function calcStatus(payments, agreedAmount) {
  const total = payments.reduce((s, p) => s + Number(p.amount), 0)
  if (total === 0) return 'sin_pago'
  if (payments.length === 1 && payments[0].is_sena) return 'sena_pagada'
  if (total < (agreedAmount || 0)) return 'pago_parcial'
  return 'pagado'
}

const STATUS_LABELS = {
  sin_pago:     { label: 'Sin pago',     cls: 'bg-surface-2 text-ink-soft' },
  sena_pagada:  { label: 'Seña pagada',  cls: 'bg-gold-pale text-gold' },
  pago_parcial: { label: 'Pago parcial', cls: 'bg-bordo-pale text-bordo-light' },
  pagado:       { label: 'Pagado',       cls: 'bg-sage-pale text-sage' },
}

function RegisterPaymentModal({ open, onClose, onSave, saving, error }) {
  const today = new Date().toISOString().split('T')[0]
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: { paid_at: today } })

  function submit(values) { onSave(values); reset({ paid_at: today }) }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface rounded-t-2xl md:rounded-2xl shadow-xl p-6 pb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-bordo text-xl">Registrar pago</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Monto</label>
            <input type="number" min={1} step={1} className="input-base" placeholder="0"
              {...register('amount', { required: 'Obligatorio', min: { value: 1, message: 'Mínimo $1' } })} />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Fecha</label>
            <input type="date" className="input-base" {...register('paid_at')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Nota (opcional)</label>
            <input className="input-base" placeholder="Ej: Efectivo, transferencia..." {...register('notes')} />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" className="w-4 h-4 accent-bordo" {...register('is_sena')} />
            <span className="text-sm text-ink">Es seña</span>
          </label>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Guardando...' : 'Registrar pago'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function PaymentDetailPage() {
  const { guestId } = useParams()
  const { eventId } = useAppStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [saveError, setSaveError]   = useState(null)
  const [editAmount, setEditAmount] = useState(false)
  const [agreedInput, setAgreedInput] = useState('')

  const { data: guest } = useQuery({
    queryKey: ['guest-detail', guestId],
    queryFn: async () => {
      const { data } = await supabase.from('guests').select('*').eq('id', guestId).single()
      return data
    },
    enabled: !!guestId,
  })

  const { data: payments = [] } = useQuery({
    queryKey: ['guest-payments', guestId],
    queryFn: async () => {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('guest_id', guestId)
        .order('paid_at', { ascending: true })
      return data ?? []
    },
    enabled: !!guestId,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['guest-detail', guestId] })
    queryClient.invalidateQueries({ queryKey: ['guest-payments', guestId] })
    queryClient.invalidateQueries({ queryKey: ['payments-guests', eventId] })
    queryClient.invalidateQueries({ queryKey: ['collected', eventId] })
  }

  async function saveAgreedAmount() {
    const val = parseFloat(agreedInput)
    if (!isNaN(val) && val >= 0) {
      await supabase.from('guests').update({ agreed_amount: val }).eq('id', guestId)
      invalidate()
    }
    setEditAmount(false)
  }

  async function registerPayment(values) {
    setSaving(true); setSaveError(null)
    const { error } = await supabase.from('payments').insert({
      event_id: eventId,
      guest_id: guestId,
      amount:   parseFloat(values.amount),
      is_sena:  !!values.is_sena,
      notes:    values.notes?.trim() || null,
      paid_at:  values.paid_at || new Date().toISOString().split('T')[0],
    })
    if (error) { setSaveError(error.message); setSaving(false); return }
    invalidate(); setModalOpen(false); setSaving(false)
  }

  async function deletePayment(id) {
    await supabase.from('payments').delete().eq('id', id)
    invalidate()
  }

  const agreed    = guest?.agreed_amount ?? 0
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0)
  const remaining = Math.max(0, agreed - totalPaid)
  const barPct    = agreed > 0 ? Math.min(100, Math.round((totalPaid / agreed) * 100)) : 0
  const status    = calcStatus(payments, agreed)
  const st        = STATUS_LABELS[status]

  return (
    <div className="min-h-full bg-surface">

      <div className="bg-bordo px-5 pt-8 pb-5">
        <button onClick={() => navigate('/payments')}
          className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Pagos
        </button>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-serif text-white text-2xl leading-tight truncate">{guest?.full_name ?? '...'}</h1>
            <span className={`inline-block mt-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${st.cls}`}>
              {st.label}
            </span>
          </div>
          <button onClick={() => setModalOpen(true)}
            className="flex-shrink-0 bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-4 py-2 rounded-xl transition">
            + Registrar
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-2xl">

        {/* Monto acordado */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-ink-soft uppercase tracking-wide">Monto acordado</p>
            {!editAmount && (
              <button onClick={() => { setAgreedInput(agreed.toString()); setEditAmount(true) }}
                className="text-xs text-bordo font-medium hover:underline">
                Editar
              </button>
            )}
          </div>
          {editAmount ? (
            <div className="flex gap-2">
              <input type="number" min={0} step={1} autoFocus className="input-base flex-1"
                value={agreedInput} onChange={(e) => setAgreedInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveAgreedAmount()} />
              <button onClick={saveAgreedAmount} className="px-4 py-2 bg-bordo text-white rounded-xl text-sm font-medium">OK</button>
              <button onClick={() => setEditAmount(false)} className="px-3 py-2 text-ink-soft rounded-xl text-sm">✕</button>
            </div>
          ) : (
            <p className="text-2xl font-semibold text-bordo">{fmt(agreed)}</p>
          )}
          {agreed > 0 && (
            <>
              <div className="h-1.5 bg-border rounded-full overflow-hidden my-3">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${barPct}%`, backgroundColor: barPct >= 100 ? '#6B8070' : '#B8965A' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-ink-soft mb-0.5">Pagado</p>
                  <p className="text-sm font-semibold text-sage">{fmt(totalPaid)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-soft mb-0.5">Restante</p>
                  <p className="text-sm font-semibold text-gold">{fmt(remaining)}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Historial */}
        <div className="card">
          <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-3">
            Historial de pagos
          </p>
          {payments.length === 0 ? (
            <p className="text-sm text-ink-soft text-center py-4">Sin pagos registrados aún</p>
          ) : (
            <div className="divide-y divide-border">
              {payments.map((p) => (
                <div key={p.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-ink">{fmt(p.amount)}</span>
                      {p.is_sena && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gold-pale text-gold">Seña</span>
                      )}
                    </div>
                    <p className="text-xs text-ink-soft mt-0.5">
                      {new Date(p.paid_at + 'T12:00:00').toLocaleDateString('es-AR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                      {p.notes ? ` · ${p.notes}` : ''}
                    </p>
                  </div>
                  <button onClick={() => deletePayment(p.id)}
                    className="text-ink-soft hover:text-red-500 transition p-1 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <RegisterPaymentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={registerPayment}
        saving={saving}
        error={saveError}
      />
    </div>
  )
}
