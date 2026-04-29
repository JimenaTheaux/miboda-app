import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import useAppStore from '../../store/useAppStore'
import TableFormModal from './TableFormModal'
import AssignGuestsModal from './AssignGuestsModal'

function FilterChips({ options, value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
            value === opt.value
              ? 'bg-bordo text-white'
              : 'bg-surface-2 border border-border text-ink-soft hover:text-ink'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function CapacityBar({ seated, capacity }) {
  const pct = capacity > 0 ? Math.min(100, Math.round((seated / capacity) * 100)) : 0
  const color = pct >= 100 ? '#5C1F2E' : pct >= 80 ? '#B8965A' : '#6B8070'
  return (
    <div className="h-1.5 bg-border rounded-full overflow-hidden mt-2">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

export default function TablesPage() {
  const { eventId } = useAppStore()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen]         = useState(false)
  const [assignOpen, setAssignOpen]     = useState(false)
  const [editingTable, setEditingTable] = useState(null)
  const [assignTable, setAssignTable]   = useState(null)
  const [filter, setFilter]             = useState('todas')

  const { data: tables = [], isLoading: loadingTables } = useQuery({
    queryKey: ['tables', eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from('tables')
        .select('*')
        .eq('event_id', eventId)
        .order('name', { ascending: true })
      return data ?? []
    },
    enabled: !!eventId,
  })

  const { data: guests = [] } = useQuery({
    queryKey: ['guests-tables', eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from('guests')
        .select('id, table_id, menu')
        .eq('event_id', eventId)
      return data ?? []
    },
    enabled: !!eventId,
  })

  function handleSaved() {
    queryClient.invalidateQueries({ queryKey: ['tables', eventId] })
    queryClient.invalidateQueries({ queryKey: ['guests-tables', eventId] })
    queryClient.invalidateQueries({ queryKey: ['guests', eventId] })
    queryClient.invalidateQueries({ queryKey: ['guests-for-assign', eventId] })
  }

  const tablesWithStats = useMemo(() =>
    tables.map((t) => {
      const seated   = guests.filter((g) => g.table_id === t.id)
      const adultos  = seated.filter((g) => g.menu !== 'infantil').length
      const infantil = seated.filter((g) => g.menu === 'infantil').length
      return { ...t, seated: seated.length, adultos, infantil }
    }),
    [tables, guests]
  )

  const totalMesas    = tables.length
  const totalCapacity = tables.reduce((s, t) => s + (t.capacity ?? 0), 0)
  const totalSeated   = guests.filter((g) => g.table_id).length

  const filtered = useMemo(() => {
    switch (filter) {
      case 'con_lugar': return tablesWithStats.filter((t) => t.seated < t.capacity)
      case 'completas': return tablesWithStats.filter((t) => t.seated >= t.capacity && t.capacity > 0)
      case 'vacias':    return tablesWithStats.filter((t) => t.seated === 0)
      default:          return tablesWithStats
    }
  }, [tablesWithStats, filter])

  return (
    <div className="min-h-full bg-surface">

      {/* Header */}
      <div className="bg-bordo px-5 pt-8 pb-5">
        <div className="flex items-end justify-between">
          <h1 className="font-serif text-white text-3xl">Mesas</h1>
          <button
            onClick={() => { setEditingTable(null); setFormOpen(true) }}
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
            { value: totalMesas,    label: 'Total mesas', num: 'text-bordo' },
            { value: totalCapacity, label: 'Capacidad',   num: 'text-sage'  },
            { value: totalSeated,   label: 'Asignados',   num: 'text-gold'  },
          ].map(({ value, label, num }) => (
            <div key={label} className="card text-center">
              <p className={`text-2xl font-semibold leading-none ${num}`}>{value}</p>
              <p className="text-xs text-ink-soft mt-1.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="mb-5">
          <FilterChips
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'todas',     label: 'Todas' },
              { value: 'con_lugar', label: 'Con lugar' },
              { value: 'completas', label: 'Completas' },
              { value: 'vacias',    label: 'Vacías' },
            ]}
          />
        </div>

        {/* Lista */}
        {loadingTables ? (
          <p className="text-center text-ink-soft text-sm py-8 animate-pulse">Cargando mesas...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">🪑</p>
            <p className="font-medium text-ink mb-1">
              {totalMesas === 0 ? 'Sin mesas todavía' : 'Sin resultados'}
            </p>
            <p className="text-sm text-ink-soft">
              {totalMesas === 0 ? 'Tocá "+ Agregar" para crear la primera' : 'Probá cambiando el filtro'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((table) => {
              const isFull = table.seated >= table.capacity && table.capacity > 0
              return (
                <div key={table.id} className="card space-y-3">

                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink text-sm leading-none truncate">{table.name}</p>
                      <p className="text-xs text-ink-soft mt-1">
                        {table.seated} / {table.capacity} lugares
                        {isFull && <span className="ml-1.5 text-bordo font-medium">· Completa</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => { setEditingTable(table); setFormOpen(true) }}
                      className="text-ink-soft hover:text-ink transition p-1 flex-shrink-0"
                      aria-label="Editar mesa"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                    </button>
                  </div>

                  <CapacityBar seated={table.seated} capacity={table.capacity} />

                  {table.seated > 0 && (
                    <div className="flex gap-3 text-xs text-ink-soft">
                      <span>{table.adultos} adulto{table.adultos !== 1 ? 's' : ''}</span>
                      {table.infantil > 0 && (
                        <span>· {table.infantil} infantil{table.infantil !== 1 ? 'es' : ''}</span>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => { setAssignTable(table); setAssignOpen(true) }}
                    className="w-full text-xs font-medium text-bordo border border-bordo-pale rounded-lg py-1.5 hover:bg-bordo-pale transition"
                  >
                    Asignar invitados
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <TableFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        table={editingTable}
        onSaved={handleSaved}
      />

      <AssignGuestsModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        table={assignTable}
        onSaved={handleSaved}
      />
    </div>
  )
}
