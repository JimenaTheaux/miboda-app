import { useState, useMemo, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
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

const AGE_VALUES     = ['adulto', 'adolescente', 'nino']
const STATUS_VALUES  = ['pendiente', 'confirmado', 'no_asiste']
const INVITED_VALUES = ['novia1', 'novia2', 'ambas']
const MENU_VALUES    = ['adulto', 'infantil']

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

function ImportModal({ open, onClose, onConfirm, rows, loading }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surface rounded-t-2xl w-full max-w-lg p-5 pb-8">
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>
        <h2 className="font-semibold text-ink mb-1">Importar invitados</h2>
        <p className="text-ink-soft text-sm mb-4">
          Se van a importar <span className="font-semibold text-bordo">{rows.length} invitados</span>. Revisá que el archivo esté bien antes de confirmar.
        </p>
        <div className="bg-surface-2 rounded-xl divide-y divide-border max-h-52 overflow-y-auto mb-4">
          {rows.slice(0, 20).map((r, i) => (
            <div key={i} className="px-3 py-2 flex items-center gap-2 text-sm">
              <span className="flex-1 font-medium text-ink truncate">{r.full_name}</span>
              <span className="text-xs text-ink-soft">{r.age_group} · {r.status}</span>
            </div>
          ))}
          {rows.length > 20 && (
            <div className="px-3 py-2 text-xs text-ink-soft text-center">...y {rows.length - 20} más</div>
          )}
        </div>
        <button onClick={onConfirm} disabled={loading} className="btn-primary w-full mb-2">
          {loading ? 'Importando...' : `Importar ${rows.length} invitados`}
        </button>
        <button onClick={onClose} className="w-full text-center text-sm text-ink-soft py-2">Cancelar</button>
      </div>
    </div>
  )
}

export default function GuestsPage() {
  const { eventId, event } = useAppStore()
  const bride1 = event?.bride1_name || 'Novia 1'
  const bride2 = event?.bride2_name || 'Novia 2'
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)

  const [modalOpen, setModalOpen]       = useState(false)
  const [editingGuest, setEditingGuest] = useState(null)
  const [filterStatus, setFilterStatus]       = useState('todos')
  const [filterAge, setFilterAge]             = useState('todos')
  const [filterInvitedBy, setFilterInvitedBy] = useState('todos')
  const [importRows, setImportRows]   = useState([])
  const [importOpen, setImportOpen]   = useState(false)
  const [importing, setImporting]     = useState(false)

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

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['guests', eventId] })
    queryClient.invalidateQueries({ queryKey: ['confirmed-guests', eventId] })
    queryClient.invalidateQueries({ queryKey: ['recent-guests-dash', eventId] })
  }

  // ── Export ───────────────────────────────────────────────────────────────
  function handleExport() {
    const HEADERS = [
      'Nombre completo',
      'Edad',
      'Estado',
      'Invitado por',
      'Menú',
      'Restricciones alimentarias',
    ]
    const HINTS = [
      '(texto libre)',
      '(adulto | adolescente | nino)',
      '(pendiente | confirmado | no_asiste)',
      '(novia1 | novia2 | ambas)',
      '(adulto | infantil)',
      '(texto libre, opcional)',
    ]

    const dataRows = guests.map((g) => [
      g.full_name,
      g.age_group,
      g.status,
      g.invited_by,
      g.menu,
      g.dietary_notes ?? '',
    ])

    const ws = XLSX.utils.aoa_to_sheet([HEADERS, HINTS, ...dataRows])
    ws['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 30 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Invitados')
    XLSX.writeFile(wb, 'invitados-miboda.xlsx')
  }

  // ── Import ───────────────────────────────────────────────────────────────
  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const allRows = XLSX.utils.sheet_to_json(ws, { header: 1 })

    // Skip header + hints rows (first 2), filter blank and hint rows
    const parsed = allRows
      .slice(1)
      .filter((row) => row[0] && typeof row[0] === 'string' && !String(row[0]).startsWith('('))
      .map((row) => ({
        full_name:       String(row[0] ?? '').trim(),
        age_group:       AGE_VALUES.includes(row[1])     ? row[1]     : 'adulto',
        status:          STATUS_VALUES.includes(row[2])  ? row[2]     : 'pendiente',
        invited_by:      INVITED_VALUES.includes(row[3]) ? row[3]     : 'ambas',
        menu:            MENU_VALUES.includes(row[4])    ? row[4]     : 'adulto',
        dietary_notes:   row[5] ? String(row[5]).trim() || null : null,
        event_id:        eventId,
      }))
      .filter((g) => g.full_name)

    if (parsed.length === 0) {
      alert('No se encontraron filas válidas en el archivo.')
      return
    }
    setImportRows(parsed)
    setImportOpen(true)
  }

  async function handleImportConfirm() {
    setImporting(true)
    await supabase.from('guests').insert(importRows)
    invalidate()
    setImporting(false)
    setImportOpen(false)
    setImportRows([])
  }

  // ── Filters ──────────────────────────────────────────────────────────────
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

      <div className="bg-bordo px-5 pt-8 pb-5">
        <div className="flex items-end justify-between">
          <h1 className="font-serif text-white text-3xl">Invitados</h1>
          <div className="flex items-center gap-2">
            {/* Exportar */}
            <button
              onClick={handleExport}
              title="Exportar Excel"
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-3 py-2 rounded-xl transition active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Excel
            </button>
            {/* Importar */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Importar desde Excel"
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-3 py-2 rounded-xl transition active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 7.5m0 0L7.5 12m4.5-4.5V21" />
              </svg>
              Importar
            </button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
            {/* Agregar */}
            <button
              onClick={() => { setEditingGuest(null); setModalOpen(true) }}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-3 py-2 rounded-xl transition active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Agregar
            </button>
          </div>
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
            { value: 'todos', label: 'Todos' },
            { value: 'novia1', label: bride1 },
            { value: 'novia2', label: bride2 },
            { value: 'ambas', label: 'Ambas' },
          ]} />
        </div>

        {/* Lista */}
        {isLoading ? (
          <p className="text-center text-ink-soft text-sm py-8 animate-pulse">Cargando invitados...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">👥</p>
            <p className="font-medium text-ink mb-1">
              {total === 0 ? 'Sin invitados todavía' : 'Sin resultados'}
            </p>
            <p className="text-sm text-ink-soft">
              {total === 0 ? 'Tocá "Agregar" o importá un Excel' : 'Probá cambiando los filtros'}
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
        onSaved={invalidate}
      />

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onConfirm={handleImportConfirm}
        rows={importRows}
        loading={importing}
      />
    </div>
  )
}
