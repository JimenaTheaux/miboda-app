import { useState, useMemo, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'
import useAppStore from '../../store/useAppStore'
import GuestFormModal, { PRESET_CATS } from './GuestFormModal'

const STATUS_MAP = {
  confirmado: { label: 'Confirmado', cls: 'bg-sage-pale text-sage' },
  pendiente:  { label: 'Pendiente',  cls: 'bg-gold-pale text-gold' },
  no_asiste:  { label: 'No asiste',  cls: 'bg-red-50 text-red-500' },
}
const AGE_MAP = {
  adulto:      { label: 'Adulto',  cls: 'bg-bordo-pale text-bordo-light' },
  adolescente: { label: 'Adol.',   cls: 'bg-bordo-pale text-bordo-light' },
  nino:        { label: 'Niño',    cls: 'bg-sage-pale text-sage' },
}

const AGE_VALUES     = ['adulto', 'adolescente', 'nino']
const STATUS_VALUES  = ['pendiente', 'confirmado', 'no_asiste']
const INVITED_VALUES = ['novia1', 'novia2', 'ambas']
const MENU_VALUES    = ['adulto', 'infantil']

function catLabel(val) {
  return PRESET_CATS.find((c) => c.value === val)?.label ?? val
}
function StatusBadge({ status }) {
  const c = STATUS_MAP[status] ?? STATUS_MAP.pendiente
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${c.cls}`}>{c.label}</span>
}
function AgeGroupBadge({ ageGroup }) {
  const c = AGE_MAP[ageGroup] ?? AGE_MAP.adulto
  return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${c.cls}`}>{c.label}</span>
}

// ── Filter drawer ──────────────────────────────────────────────────────────────
function FilterSection({ label, value, onChange, options }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition active:scale-95 ${
              value === opt.value
                ? 'bg-bordo text-white border-bordo'
                : 'bg-surface-2 border-border text-ink-soft hover:text-ink'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function FilterDrawer({ open, onClose, filters, setFilter, resetFilters, bride1, bride2, catOptions }) {
  const activeCount = Object.values(filters).filter((v) => v !== 'todos').length
  return (
    <div className={`fixed inset-0 z-[60] ${open ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 max-w-lg mx-auto bg-surface rounded-t-2xl transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>
        <div className="px-5 pt-3 pb-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-ink">Filtros</h3>
          {activeCount > 0 && (
            <button onClick={resetFilters} className="text-xs text-bordo font-medium hover:underline">
              Limpiar todo
            </button>
          )}
        </div>
        <div className="px-5 py-4 pb-10 space-y-5 overflow-y-auto max-h-[60vh]">
          <FilterSection label="Estado" value={filters.status} onChange={(v) => setFilter('status', v)} options={[
            { value: 'todos',     label: 'Todos' },
            { value: 'confirmado',label: '✓ Confirmado' },
            { value: 'pendiente', label: '· Pendiente' },
            { value: 'no_asiste', label: '✕ No asiste' },
          ]} />
          <FilterSection label="Edad" value={filters.age} onChange={(v) => setFilter('age', v)} options={[
            { value: 'todos',       label: 'Todas' },
            { value: 'adulto',      label: 'Adulto' },
            { value: 'adolescente', label: 'Adolescente' },
            { value: 'nino',        label: 'Niño / Niña' },
          ]} />
          <FilterSection label="Invitado por" value={filters.invitedBy} onChange={(v) => setFilter('invitedBy', v)} options={[
            { value: 'todos',  label: 'Todos' },
            { value: 'novia1', label: bride1 },
            { value: 'novia2', label: bride2 },
            { value: 'ambas',  label: 'Ambas' },
          ]} />
          {catOptions.length > 0 && (
            <FilterSection label="Categoría" value={filters.cat} onChange={(v) => setFilter('cat', v)} options={[
              { value: 'todos',  label: 'Todas' },
              { value: '__sin__', label: 'Sin categoría' },
              ...catOptions,
            ]} />
          )}
          <button onClick={onClose} className="btn-primary w-full mt-2">
            Ver resultados
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Import modal ───────────────────────────────────────────────────────────────
function ImportModal({ open, onClose, onConfirm, rows, loading }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surface rounded-t-2xl w-full max-w-lg p-5 pb-8">
        <div className="flex justify-center mb-3"><div className="w-10 h-1 bg-border rounded-full" /></div>
        <h2 className="font-semibold text-ink mb-1">Importar invitados</h2>
        <p className="text-ink-soft text-sm mb-4">
          Se van a importar <span className="font-semibold text-bordo">{rows.length} invitados</span>. Revisá antes de confirmar.
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

// ── Page ───────────────────────────────────────────────────────────────────────
export default function GuestsPage() {
  const { eventId, event } = useAppStore()
  const bride1 = event?.bride1_name || 'Novia 1'
  const bride2 = event?.bride2_name || 'Novia 2'
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)

  const [modalOpen, setModalOpen]       = useState(false)
  const [editingGuest, setEditingGuest] = useState(null)
  const [search, setSearch]             = useState('')
  const [filterOpen, setFilterOpen]     = useState(false)
  const [filters, setFilters]           = useState({ status: 'todos', age: 'todos', invitedBy: 'todos', cat: 'todos' })
  const [importRows, setImportRows]     = useState([])
  const [importOpen, setImportOpen]     = useState(false)
  const [importing, setImporting]       = useState(false)

  function setFilter(key, value) { setFilters((p) => ({ ...p, [key]: value })) }
  function resetFilters()         { setFilters({ status: 'todos', age: 'todos', invitedBy: 'todos', cat: 'todos' }) }
  const activeFilterCount = Object.values(filters).filter((v) => v !== 'todos').length

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
    queryClient.invalidateQueries({ queryKey: ['guests-for-assign', eventId] })
  }

  const catOptions = useMemo(() => {
    const used = [...new Set(guests.map((g) => g.category).filter(Boolean))].sort()
    return used.map((v) => ({ value: v, label: catLabel(v) }))
  }, [guests])

  // ── Export ─────────────────────────────────────────────────────────────────
  function handleExport() {
    const HEADERS = ['Nombre completo', 'Categoría', 'Edad', 'Estado', 'Invitado por', 'Menú', 'Restricciones alimentarias']
    const HINTS   = ['(texto libre)', '(familia | amigos | trabajo | parejas_amigos | otros | texto libre)', '(adulto | adolescente | nino)', '(pendiente | confirmado | no_asiste)', '(novia1 | novia2 | ambas)', '(adulto | infantil)', '(opcional)']
    const rows = guests.map((g) => [g.full_name, g.category ?? '', g.age_group, g.status, g.invited_by, g.menu, g.dietary_notes ?? ''])
    const ws = XLSX.utils.aoa_to_sheet([HEADERS, HINTS, ...rows])
    ws['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 30 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Invitados')
    XLSX.writeFile(wb, 'invitados-miboda.xlsx')
  }

  // ── Import ─────────────────────────────────────────────────────────────────
  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const allRows = XLSX.utils.sheet_to_json(ws, { header: 1 })
    const parsed = allRows
      .slice(1)
      .filter((row) => row[0] && typeof row[0] === 'string' && !String(row[0]).startsWith('('))
      .map((row) => ({
        full_name:     String(row[0] ?? '').trim(),
        category:      row[1] ? String(row[1]).trim() || null : null,
        age_group:     AGE_VALUES.includes(row[2])     ? row[2] : 'adulto',
        status:        STATUS_VALUES.includes(row[3])  ? row[3] : 'pendiente',
        invited_by:    INVITED_VALUES.includes(row[4]) ? row[4] : 'ambas',
        menu:          MENU_VALUES.includes(row[5])    ? row[5] : 'adulto',
        dietary_notes: row[6] ? String(row[6]).trim() || null : null,
        event_id:      eventId,
      }))
      .filter((g) => g.full_name)
    if (parsed.length === 0) { alert('No se encontraron filas válidas.'); return }
    setImportRows(parsed)
    setImportOpen(true)
  }

  async function handleImportConfirm() {
    setImporting(true)
    await supabase.from('guests').insert(importRows)
    invalidate()
    setImporting(false); setImportOpen(false); setImportRows([])
  }

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return guests.filter((g) => {
      if (q && !g.full_name.toLowerCase().includes(q)) return false
      if (filters.status !== 'todos' && g.status !== filters.status) return false
      if (filters.age    !== 'todos' && g.age_group !== filters.age) return false
      if (filters.invitedBy !== 'todos' && g.invited_by !== filters.invitedBy) return false
      if (filters.cat === '__sin__' && g.category) return false
      if (filters.cat !== 'todos' && filters.cat !== '__sin__' && g.category !== filters.cat) return false
      return true
    })
  }, [guests, search, filters])

  const total     = guests.length
  const confirmed = guests.filter((g) => g.status === 'confirmado').length
  const pending   = guests.filter((g) => g.status === 'pendiente').length
  const isFiltering = search.trim() || activeFilterCount > 0

  return (
    <div className="min-h-full bg-surface">

      {/* Header */}
      <div className="bg-bordo px-5 pt-8 pb-5">
        <div className="flex items-end justify-between mb-4">
          <h1 className="font-serif text-white text-3xl">Invitados</h1>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} title="Exportar Excel"
              className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition active:scale-95">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Excel
            </button>
            <button onClick={() => fileInputRef.current?.click()} title="Importar"
              className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition active:scale-95">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 7.5m0 0L7.5 12m4.5-4.5V21" />
              </svg>
              Importar
            </button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
            <button onClick={() => { setEditingGuest(null); setModalOpen(true) }}
              className="flex items-center gap-1 bg-white text-bordo text-xs font-semibold px-3 py-1.5 rounded-lg transition active:scale-95">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Agregar
            </button>
          </div>
        </div>

        {/* Contadores en el header */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: total,     label: 'Total',       cls: 'text-white' },
            { value: confirmed, label: 'Confirmados', cls: 'text-white/80' },
            { value: pending,   label: 'Pendientes',  cls: 'text-white/80' },
          ].map(({ value, label, cls }) => (
            <div key={label} className="bg-white/10 rounded-xl px-3 py-2 text-center">
              <p className={`text-xl font-semibold leading-none ${cls}`}>{value}</p>
              <p className="text-white/50 text-[10px] mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-6">

        {/* Buscador + Filtros */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar invitado..."
              className="input-base pl-9 pr-3"
            />
          </div>
          <button
            onClick={() => setFilterOpen(true)}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition active:scale-95 ${
              activeFilterCount > 0
                ? 'bg-bordo text-white border-bordo'
                : 'bg-surface border-border text-ink-soft hover:text-ink hover:border-bordo-light'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            Filtros
            {activeFilterCount > 0 && (
              <span className="bg-white text-bordo text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Resultado count */}
        {isFiltering && (
          <p className="text-xs text-ink-soft mb-3">
            {filtered.length === 0
              ? 'Sin resultados'
              : `${filtered.length} invitado${filtered.length !== 1 ? 's' : ''}`}
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="ml-2 text-bordo hover:underline">
                Limpiar filtros
              </button>
            )}
          </p>
        )}

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
              {total === 0 ? 'Tocá "Agregar" o importá un Excel' : 'Probá con otra búsqueda o limpiar filtros'}
            </p>
          </div>
        ) : (
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((guest) => (
              <button
                key={guest.id}
                onClick={() => { setEditingGuest(guest); setModalOpen(true) }}
                className="w-full text-left card flex items-center gap-3 hover:border-bordo-light transition active:scale-[0.99]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="font-medium text-ink text-sm leading-snug">{guest.full_name}</span>
                    <AgeGroupBadge ageGroup={guest.age_group} />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {guest.category && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-bordo-pale text-bordo-light">
                        {catLabel(guest.category)}
                      </span>
                    )}
                    <span className="text-xs text-ink-soft truncate">
                      {guest.tables?.name ?? 'Sin mesa'}
                      {' · '}{guest.menu === 'infantil' ? 'Menú infantil' : 'Menú adulto'}
                      {guest.dietary_notes ? ' · ⚠️' : ''}
                    </span>
                  </div>
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

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        setFilter={setFilter}
        resetFilters={resetFilters}
        bride1={bride1}
        bride2={bride2}
        catOptions={catOptions}
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
