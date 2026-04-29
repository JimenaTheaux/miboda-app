import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import useAppStore from '../../store/useAppStore'

export default function AssignGuestsModal({ open, onClose, table, onSaved }) {
  const { eventId } = useAppStore()
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const { data: guests = [], refetch } = useQuery({
    queryKey: ['guests-for-assign', eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from('guests')
        .select('id, full_name, table_id, tables(name)')
        .eq('event_id', eventId)
        .order('full_name', { ascending: true })
      return data ?? []
    },
    enabled: open && !!eventId,
  })

  const atThisTable = useMemo(
    () => guests.filter((g) => g.table_id === table?.id),
    [guests, table]
  )
  const unassigned = useMemo(
    () => guests.filter((g) => !g.table_id),
    [guests]
  )
  const atOtherTable = useMemo(
    () => guests.filter((g) => g.table_id && g.table_id !== table?.id),
    [guests, table]
  )

  const filteredUnassigned = useMemo(() => {
    if (!search.trim()) return unassigned
    const q = search.toLowerCase()
    return unassigned.filter((g) => g.full_name.toLowerCase().includes(q))
  }, [unassigned, search])

  const filteredOther = useMemo(() => {
    if (!search.trim()) return atOtherTable
    const q = search.toLowerCase()
    return atOtherTable.filter((g) => g.full_name.toLowerCase().includes(q))
  }, [atOtherTable, search])

  const seated = atThisTable.length
  const capacity = table?.capacity ?? 0
  const pct = capacity > 0 ? Math.min(100, Math.round((seated / capacity) * 100)) : 0
  const isFull = seated >= capacity

  async function assign(guestId) {
    if (isFull) return
    setSaving(true)
    await supabase.from('guests').update({ table_id: table.id }).eq('id', guestId)
    await refetch()
    onSaved()
    setSaving(false)
  }

  async function unassign(guestId) {
    setSaving(true)
    await supabase.from('guests').update({ table_id: null }).eq('id', guestId)
    await refetch()
    onSaved()
    setSaving(false)
  }

  if (!open || !table) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface rounded-t-2xl md:rounded-2xl shadow-xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <div>
            <h2 className="font-serif text-bordo text-xl">{table.name}</h2>
            <p className="text-xs text-ink-soft mt-0.5">{seated} / {capacity} lugares</p>
          </div>
          <button onClick={onClose} className="text-ink-soft hover:text-ink transition p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Capacity bar */}
        <div className="px-6 pb-4 flex-shrink-0">
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                backgroundColor: pct >= 100 ? '#5C1F2E' : pct >= 80 ? '#B8965A' : '#6B8070',
              }}
            />
          </div>
        </div>

        {/* Search */}
        <div className="px-6 pb-3 flex-shrink-0">
          <input
            className="input-base"
            placeholder="Buscar invitado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Scrollable list */}
        <div className="overflow-y-auto flex-1 px-6 pb-6 space-y-4">

          {/* At this table */}
          {atThisTable.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide mb-2">
                En esta mesa ({atThisTable.length})
              </p>
              <div className="space-y-1.5">
                {atThisTable.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 card py-2.5">
                    <div className="w-2 h-2 rounded-full bg-sage flex-shrink-0" />
                    <span className="flex-1 text-sm text-ink">{g.full_name}</span>
                    <button
                      disabled={saving}
                      onClick={() => unassign(g.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition flex-shrink-0"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unassigned */}
          {filteredUnassigned.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide mb-2">
                Sin mesa ({filteredUnassigned.length})
              </p>
              <div className="space-y-1.5">
                {filteredUnassigned.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 card py-2.5">
                    <div className="w-2 h-2 rounded-full bg-border flex-shrink-0" />
                    <span className="flex-1 text-sm text-ink">{g.full_name}</span>
                    <button
                      disabled={saving || isFull}
                      onClick={() => assign(g.id)}
                      className={`text-xs font-medium transition flex-shrink-0 ${
                        isFull
                          ? 'text-ink-soft cursor-not-allowed'
                          : 'text-bordo hover:text-bordo-mid'
                      }`}
                    >
                      {isFull ? 'Mesa llena' : 'Asignar'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* At other tables */}
          {filteredOther.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide mb-2">
                En otra mesa
              </p>
              <div className="space-y-1.5">
                {filteredOther.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 card py-2.5 opacity-60">
                    <div className="w-2 h-2 rounded-full bg-gold flex-shrink-0" />
                    <span className="flex-1 text-sm text-ink">{g.full_name}</span>
                    <span className="text-[11px] text-ink-soft flex-shrink-0">{g.tables?.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredUnassigned.length === 0 && filteredOther.length === 0 && atThisTable.length === 0 && (
            <p className="text-center text-sm text-ink-soft py-8">No hay invitados disponibles</p>
          )}
        </div>
      </div>
    </div>
  )
}
