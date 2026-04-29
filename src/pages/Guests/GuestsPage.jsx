import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import useAppStore from '../../store/useAppStore'
import GuestFormModal from './GuestFormModal'

const STATUS = {
  confirmado: { label: 'Confirmado', cls: 'bg-sage-pale text-sage' },
  pendiente:  { label: 'Pendiente',  cls: 'bg-gold-pale text-gold' },
  no_asiste:  { label: 'No asiste',  cls: 'bg-red-50 text-red-500' },
}
const AGE = {
  adulto:      { label: 'Adulto',  cls: 'bg-bordo-pale text-bordo-light' },
  adolescente: { label: 'Adol.',   cls: 'bg-bordo-pale text-bordo-light' },
  nino:        { label: 'Niño',    cls: 'bg-sage-pale text-sage' },
}

function StatusBadge({ status }) {
  const c = STATUS[status] ?? STATUS.pendiente
  return <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${c.cls}`}>{c.label}</span>
}
function AgeGroupBadge({ ageGroup }) {
  const c = AGE[ageGroup] ?? AGE.adulto
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${c.cls}`}>{c.label}</span>
}
function FilterChips({ options, value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
      {options.map((opt) => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
            value === opt.value
              ? 'bg-bordo text-white'
              : 'bg-surface-2 border border-border text-ink-soft hover:text-ink'
          }`}
        >{opt.label}</button>
      ))}
    </div>
  )
}

export default function GuestsPage() {
  const { eventId } = useAppStore()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen]       = useState(false)
  const [editingGuest, setEditingGuest] = useState(null)
  const [filterStatus, setFilterStatus]       = useState('todos')
  const [filterAge, setFilterAge]             = useState('todos')
  const [filterInvitedBy, setFilterInvitedBy] = useState('todos')

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ['guests', eventId],
    queryFn: async () => {
      const { data } = await supabase.from('guests')
        .select('*, tables(name)').eq('event_id', eventId)
        .order('full_name', { ascending: true })
      return data ?? []
    },
    enabled: !!eventId,
  })

  function handleSaved() {
    queryClient.invalidateQueries({ queryKey: ['guests', eventId] })
    queryClient.invalidateQueries({ queryKey: ['confirmed-guests', eventId] })
    queryClient.invalidateQueries({ queryKey: ['recent-guests-dash', eventId] })
  }

  const filtered = useMemo(() => guests.filter((g) => {
    if (filterStatus !== 'todos' && g.status !== filterStatus) return false
    if (filterAge !== 'todos' && g.age_group !== filterAge) return false
    if (filterInvitedBy !== 'todos' && g.invited_by !== filterInvitedBy) return false
    return true
  }), [guests, filterStatus, filterAge, filterInvitedBy])

  const total     = guests.length
  const confirmed = guests.filter((g) => g.status === 'confirmado').length
  const pending   = guests.filter((g) => g.status === 'pendiente').length

  return (
    <div className="min-h-full bg-surface">

      {/* Page header */}
      <div className="bg-bordo px-5 pt-8 pb-5">
        <div className="flex items-end justify-between">
          <h1 className="font-serif text-white text-3xl">Invitados</h1>
          <button
            onClick={() => { setEditingGuest(null); setModalOpen(true) }}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-4 py-2 rounded-xl transition active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Agregar
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6">

        {/* Contadores */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { value: total,     label: 'Total',       num: 'text-bordo' },
            { value: confirmed, label: 'Confirmados', num: 'text-sage' },
            { value: pending,   label: 'Pendientes',  num: 'text-gold' },
          ].map(({ value, label, num }) => (
            <div key={label} className="card text-center">
              <p className={`text-2xl font-semibold leading-none ${num}`}>{value}</p>
              <p className="text-xs text-ink-soft mt-1.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="space-y-2 mb-5">
          <FilterChips value={filterStatus} onChange={setFilterStatus} options={[
            { value: 'todos', label: 'Todos' },
            { value: 'confirmado', label: '✓ Confirmado' },
            { value: 'pendiente', label: '· Pendiente' },
            { value: 'no_asiste', label: '✕ No asiste' },
          ]} />
          <FilterChips value={filterAge} onChange={setFilterAge} options={[
            { value: 'todos', label: 'Todas las edades' },
            { value: 'adulto', label: 'Adultos' },
            { value: 'adolescente', label: 'Adolescentes' },
            { value: 'nino', label: 'Niños' },
          ]} />
          <FilterChips value={filterInvitedBy} onChange={setFilterInvitedBy} options={[
            { value: 'todos', label: 'Por todos' },
            { value: 'novia1', label: 'Novia 1' },
            { value: 'novia2', label: 'Novia 2' },
            { value: 'ambas', label: 'Ambas' },
          ]} />
        </div>

        {/* Lista — 1 col mobile, 2 col desktop */}
        {isLoading ? (
          <p className="text-center text-ink-soft text-sm py-8 animate-pulse">Cargando invitados...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">👥</p>
            <p className="font-medium text-ink mb-1">
              {total === 0 ? 'Sin invitados todavía' : 'Sin resultados'}
            </p>
            <p className="text-sm text-ink-soft">
              {total === 0 ? 'Tocá "+ Agregar" para sumar el primero' : 'Probá cambiando los filtros'}
            </p>
          </div>
        ) : (
          <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((guest) => (
              <button
                key={guest.id}
                onClick={() => { setEditingGuest(guest); setModalOpen(true) }}
                className="w-full text-left card flex items-center gap-3 hover:border-bordo-light transition active:scale-[0.99]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-ink text-sm leading-none">{guest.full_name}</span>
                    <AgeGroupBadge ageGroup={guest.age_group} />
                  </div>
                  <p className="text-xs text-ink-soft">
                    {guest.tables?.name ?? 'Sin mesa'}
                    {' · '}Menú {guest.menu === 'infantil' ? 'infantil' : 'adulto'}
                    {guest.dietary_notes ? ' · ⚠️' : ''}
                  </p>
                </div>
                <StatusBadge status={guest.status} />
              </button>
            ))}
          </div>
        )}
      </div>

      <GuestFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        guest={editingGuest}
        onSaved={handleSaved}
      />
    </div>
  )
}
