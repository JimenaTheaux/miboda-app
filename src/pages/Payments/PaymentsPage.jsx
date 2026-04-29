import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import useAppStore from '../../store/useAppStore'

const PAY_STATUS = {
  sin_pago:     { label: 'Sin pago',  cls: 'bg-surface-2 text-ink-soft border border-border' },
  sena_pagada:  { label: 'Seña',      cls: 'bg-gold-pale text-gold' },
  pago_parcial: { label: 'Parcial',   cls: 'bg-bordo-pale text-bordo-light' },
  pagado:       { label: 'Pagado',    cls: 'bg-sage-pale text-sage' },
}

function calcPayStatus(guestPayments, agreedAmount) {
  const total = guestPayments.reduce((s, p) => s + Number(p.amount), 0)
  if (total === 0) return 'sin_pago'
  if (guestPayments.length === 1 && guestPayments[0].is_sena) return 'sena_pagada'
  if (total < (agreedAmount || 0)) return 'pago_parcial'
  return 'pagado'
}

function fmt(n) {
  return '$ ' + Math.round(n || 0).toLocaleString('es-AR')
}

export default function PaymentsPage() {
  const { eventId } = useAppStore()
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState('todos')

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ['payments-guests', eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from('guests')
        .select('id, full_name, agreed_amount, payments(id, amount, is_sena)')
        .eq('event_id', eventId)
        .order('full_name')
      if (!data) return []
      return data.map((g) => {
        const pmts = g.payments ?? []
        return {
          ...g,
          totalPaid: pmts.reduce((s, p) => s + Number(p.amount), 0),
          payStatus: calcPayStatus(pmts, g.agreed_amount),
        }
      })
    },
    enabled: !!eventId,
  })

  const totalExpected  = guests.reduce((s, g) => s + (g.agreed_amount || 0), 0)
  const totalCollected = guests.reduce((s, g) => s + g.totalPaid, 0)
  const totalPending   = Math.max(0, totalExpected - totalCollected)

  const filtered = useMemo(() =>
    filterStatus === 'todos' ? guests : guests.filter((g) => g.payStatus === filterStatus),
    [guests, filterStatus]
  )

  return (
    <div className="min-h-full bg-surface">

      <div className="bg-bordo px-5 pt-8 pb-5">
        <h1 className="font-serif text-white text-3xl mb-4">Pagos</h1>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Recaudado', value: fmt(totalCollected) },
            { label: 'Esperado',  value: fmt(totalExpected)  },
            { label: 'Pendiente', value: fmt(totalPending)   },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
              <p className="text-sm font-semibold text-white">{value}</p>
              <p className="text-white/50 text-[11px] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-6">

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5 mb-5">
          {[
            { value: 'todos',        label: 'Todos' },
            { value: 'sin_pago',     label: 'Sin pago' },
            { value: 'sena_pagada',  label: 'Seña' },
            { value: 'pago_parcial', label: 'Parcial' },
            { value: 'pagado',       label: 'Pagado' },
          ].map((opt) => (
            <button key={opt.value} onClick={() => setFilterStatus(opt.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                filterStatus === opt.value
                  ? 'bg-bordo text-white'
                  : 'bg-surface-2 border border-border text-ink-soft hover:text-ink'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-center text-ink-soft text-sm py-8 animate-pulse">Cargando...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">💰</p>
            <p className="font-medium text-ink mb-1">Sin resultados</p>
            <p className="text-sm text-ink-soft">Probá cambiando el filtro</p>
          </div>
        ) : (
          <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((g) => {
              const st     = PAY_STATUS[g.payStatus]
              const agreed = g.agreed_amount || 0
              const barPct = agreed > 0 ? Math.min(100, Math.round((g.totalPaid / agreed) * 100)) : 0
              return (
                <button key={g.id}
                  onClick={() => navigate(`/payments/${g.id}`)}
                  className="w-full text-left card flex flex-col gap-2 hover:border-bordo-light transition active:scale-[0.99]">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-ink text-sm truncate">{g.full_name}</p>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                  {agreed > 0 ? (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-sage font-medium">{fmt(g.totalPaid)}</span>
                        <span className="text-ink-soft">{fmt(agreed)}</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${barPct}%`,
                          backgroundColor: barPct >= 100 ? '#6B8070' : '#B8965A',
                        }} />
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-ink-soft">Tocá para definir monto →</p>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
