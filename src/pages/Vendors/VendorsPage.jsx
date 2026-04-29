import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import useAppStore from '../../store/useAppStore'
import VendorFormModal from './VendorFormModal'

const CATEGORIES = {
  salon:        { label: 'Salón',               icon: '🏛️' },
  fotografia:   { label: 'Fotografía',          icon: '📸' },
  catering:     { label: 'Catering',            icon: '🍽️' },
  musica:       { label: 'Música',              icon: '🎵' },
  flores:       { label: 'Flores / Decoración', icon: '💐' },
  indumentaria: { label: 'Indumentaria',        icon: '👗' },
  otros:        { label: 'Otros',               icon: '📦' },
}

const VENDOR_STATUS = {
  en_revision: { label: 'En revisión', cls: 'bg-gold-pale text-gold' },
  confirmado:  { label: 'Confirmado',  cls: 'bg-sage-pale text-sage' },
  cancelado:   { label: 'Cancelado',   cls: 'bg-red-50 text-red-500' },
}

const PAY_STATUS = {
  sin_pago:     { label: 'Sin pago',  cls: 'bg-surface-2 text-ink-soft border border-border' },
  sena_pagada:  { label: 'Seña',      cls: 'bg-gold-pale text-gold' },
  pago_parcial: { label: 'Parcial',   cls: 'bg-bordo-pale text-bordo-light' },
  pagado:       { label: 'Pagado',    cls: 'bg-sage-pale text-sage' },
}

function calcPayStatus(payments, chosenAmount) {
  const total = payments.reduce((s, p) => s + Number(p.amount), 0)
  if (total === 0) return 'sin_pago'
  if (payments.length === 1 && payments[0].is_sena) return 'sena_pagada'
  if (chosenAmount > 0 && total < chosenAmount) return 'pago_parcial'
  if (chosenAmount > 0 && total >= chosenAmount) return 'pagado'
  return 'pago_parcial'
}

function fmt(n) {
  return '$ ' + Math.round(n || 0).toLocaleString('es-AR')
}

export default function VendorsPage() {
  const { eventId } = useAppStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen]         = useState(false)
  const [filterStatus, setFilterStatus]   = useState('todos')
  const [filterPay, setFilterPay]         = useState('todos')

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors', eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from('vendors')
        .select('*, vendor_payments(id, amount, is_sena)')
        .eq('event_id', eventId)
        .order('name')
      if (!data) return []
      return data.map((v) => {
        const pmts = v.vendor_payments ?? []
        return {
          ...v,
          totalPaid: pmts.reduce((s, p) => s + Number(p.amount), 0),
          payStatus: calcPayStatus(pmts, v.chosen_amount),
        }
      })
    },
    enabled: !!eventId,
  })

  function handleSaved() {
    queryClient.invalidateQueries({ queryKey: ['vendors', eventId] })
  }

  const totalComprometido = vendors
    .filter((v) => v.status !== 'cancelado')
    .reduce((s, v) => s + (v.chosen_amount || 0), 0)
  const totalPagado       = vendors.reduce((s, v) => s + v.totalPaid, 0)
  const totalSaldo        = Math.max(0, totalComprometido - totalPagado)

  const filtered = useMemo(() => vendors.filter((v) => {
    if (filterStatus !== 'todos' && v.status    !== filterStatus) return false
    if (filterPay    !== 'todos' && v.payStatus !== filterPay)    return false
    return true
  }), [vendors, filterStatus, filterPay])

  return (
    <div className="min-h-full bg-surface">

      <div className="bg-bordo px-5 pt-8 pb-5">
        <div className="flex items-end justify-between mb-4">
          <h1 className="font-serif text-white text-3xl">Proveedores</h1>
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-4 py-2 rounded-xl transition active:scale-95">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Agregar
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Comprometido', value: fmt(totalComprometido) },
            { label: 'Pagado',       value: fmt(totalPagado) },
            { label: 'Saldo',        value: fmt(totalSaldo) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
              <p className="text-sm font-semibold text-white">{value}</p>
              <p className="text-white/50 text-[11px] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-6">

        <div className="space-y-2 mb-5">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {[
              { value: 'todos',       label: 'Todos' },
              { value: 'en_revision', label: 'En revisión' },
              { value: 'confirmado',  label: 'Confirmados' },
              { value: 'cancelado',   label: 'Cancelados' },
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
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {[
              { value: 'todos',        label: 'Pago: todos' },
              { value: 'sin_pago',     label: 'Sin pago' },
              { value: 'sena_pagada',  label: 'Seña' },
              { value: 'pago_parcial', label: 'Parcial' },
              { value: 'pagado',       label: 'Pagado' },
            ].map((opt) => (
              <button key={opt.value} onClick={() => setFilterPay(opt.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  filterPay === opt.value
                    ? 'bg-bordo text-white'
                    : 'bg-surface-2 border border-border text-ink-soft hover:text-ink'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-ink-soft text-sm py-8 animate-pulse">Cargando...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">🤝</p>
            <p className="font-medium text-ink mb-1">
              {vendors.length === 0 ? 'Sin proveedores todavía' : 'Sin resultados'}
            </p>
            <p className="text-sm text-ink-soft">
              {vendors.length === 0 ? 'Tocá "+ Agregar" para sumar el primero' : 'Probá cambiando el filtro'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((v) => {
              const cat = CATEGORIES[v.category] ?? CATEGORIES.otros
              const vst = VENDOR_STATUS[v.status] ?? VENDOR_STATUS.en_revision
              const pst = PAY_STATUS[v.payStatus]
              return (
                <button key={v.id}
                  onClick={() => navigate(`/vendors/${v.id}`)}
                  className="w-full text-left card hover:border-bordo-light transition active:scale-[0.99]">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-xl leading-none mt-0.5">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink text-sm leading-snug truncate">{v.name}</p>
                      <p className="text-[11px] text-ink-soft">{cat.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${vst.cls}`}>
                      {vst.label}
                    </span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${pst.cls}`}>
                      {pst.label}
                    </span>
                  </div>
                  {v.chosen_amount > 0 && (
                    <p className="text-xs text-ink-soft mt-2">
                      {fmt(v.totalPaid)} de {fmt(v.chosen_amount)}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <VendorFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        vendor={null}
        onSaved={handleSaved}
      />
    </div>
  )
}
