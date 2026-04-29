import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import useAppStore from '../../store/useAppStore'
import ChecklistItemFormModal from './ChecklistItemFormModal'

const TEMPLATE_TASKS = [
  { title: 'Reservar el salón',                          category: 'Salón' },
  { title: 'Confirmar menú con el salón',                category: 'Salón' },
  { title: 'Visita final al salón',                      category: 'Salón' },
  { title: 'Definir menú para adultos',                  category: 'Catering' },
  { title: 'Definir menú infantil',                      category: 'Catering' },
  { title: 'Confirmar cantidad de invitados al catering',category: 'Catering' },
  { title: 'Contratar fotógrafa/o',                      category: 'Fotografía' },
  { title: 'Confirmar horarios y cronograma de fotos',   category: 'Fotografía' },
  { title: 'Armar lista de fotos obligatorias',          category: 'Fotografía' },
  { title: 'Contratar DJ o banda',                       category: 'Música' },
  { title: 'Definir playlist: primer vals, vals de los padres', category: 'Música' },
  { title: 'Confirmar horarios y equipamiento del DJ',   category: 'Música' },
  { title: 'Confeccionar lista de invitados',            category: 'Invitados' },
  { title: 'Enviar invitaciones',                        category: 'Invitados' },
  { title: 'Confirmar asistencias',                      category: 'Invitados' },
  { title: 'Elegir vestido/s',                           category: 'Vestimenta' },
  { title: 'Primera prueba de vestido',                  category: 'Vestimenta' },
  { title: 'Segunda prueba de vestido',                  category: 'Vestimenta' },
  { title: 'Prueba de maquillaje y peinado',             category: 'Vestimenta' },
  { title: 'Definir accesorios y ramo',                  category: 'Vestimenta' },
  { title: 'Definir estilo y paleta de decoración',      category: 'Decoración' },
  { title: 'Contratar florería',                         category: 'Decoración' },
  { title: 'Confirmar centros de mesa',                  category: 'Decoración' },
  { title: 'Sacar turno en el Registro Civil',           category: 'Papeles' },
  { title: 'Reunir documentación necesaria',             category: 'Papeles' },
  { title: 'Coordinar testigos',                         category: 'Papeles' },
  { title: 'Definir destino de luna de miel',            category: 'Viaje' },
  { title: 'Reservar vuelos',                            category: 'Viaje' },
  { title: 'Reservar alojamiento',                       category: 'Viaje' },
  { title: 'Definir presupuesto total del casamiento',   category: 'General' },
  { title: 'Coordinar traslados para invitados',         category: 'General' },
]

const ASSIGN_COLORS = {
  novia1: 'bg-bordo-pale text-bordo-light',
  novia2: 'bg-sage-pale text-sage',
}

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

export default function ChecklistPage() {
  const { eventId, event } = useAppStore()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen]         = useState(false)
  const [editingItem, setEditingItem]     = useState(null)
  const [filterStatus, setFilterStatus]   = useState('todas')
  const [filterCat, setFilterCat]         = useState('todas')
  const [filterAssign, setFilterAssign]   = useState('todas')
  const [loadingTemplate, setLoadingTemplate] = useState(false)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['checklist', eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('event_id', eventId)
        .order('completed', { ascending: true })
        .order('sort_order',  { ascending: true })
        .order('created_at',  { ascending: true })
      return data ?? []
    },
    enabled: !!eventId,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['checklist', eventId] })
    queryClient.invalidateQueries({ queryKey: ['pending-tasks-count', eventId] })
    queryClient.invalidateQueries({ queryKey: ['recent-tasks', eventId] })
  }

  async function toggleCompleted(item) {
    await supabase.from('checklist_items').update({ completed: !item.completed }).eq('id', item.id)
    invalidate()
  }

  async function loadTemplate() {
    setLoadingTemplate(true)
    const payload = TEMPLATE_TASKS.map((t, i) => ({
      event_id:    eventId,
      title:       t.title,
      category:    t.category,
      completed:   false,
      assigned_to: 'ambas',
      sort_order:  i,
    }))
    await supabase.from('checklist_items').insert(payload)
    invalidate()
    setLoadingTemplate(false)
  }

  const total     = items.length
  const completed = items.filter((i) => i.completed).length
  const pending   = total - completed
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0

  const catOptions = useMemo(() => {
    const used = [...new Set(items.map((i) => i.category).filter(Boolean))]
    return [{ value: 'todas', label: 'Todas' }, ...used.map((c) => ({ value: c, label: c }))]
  }, [items])

  const assignOptions = [
    { value: 'todas',  label: 'Todas' },
    { value: 'ambas',  label: 'Ambas' },
    { value: 'novia1', label: event?.bride1_name || 'Novia 1' },
    { value: 'novia2', label: event?.bride2_name || 'Novia 2' },
  ]

  const filtered = useMemo(() => items.filter((i) => {
    if (filterStatus === 'pendientes'  && i.completed)  return false
    if (filterStatus === 'completadas' && !i.completed) return false
    if (filterCat !== 'todas' && i.category !== filterCat) return false
    if (filterAssign !== 'todas' && (i.assigned_to || 'ambas') !== filterAssign) return false
    return true
  }), [items, filterStatus, filterCat, filterAssign])

  const grouped = useMemo(() => {
    if (filterCat !== 'todas') return { [filterCat]: filtered }
    return filtered.reduce((acc, item) => {
      const key = item.category || 'Sin categoría'
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {})
  }, [filtered, filterCat])

  const bride1 = event?.bride1_name || 'Novia 1'
  const bride2 = event?.bride2_name || 'Novia 2'

  return (
    <div className="min-h-full bg-surface">

      <div className="bg-bordo px-5 pt-8 pb-5">
        <div className="flex items-end justify-between mb-3">
          <h1 className="font-serif text-white text-3xl">Checklist</h1>
          <button
            onClick={() => { setEditingItem(null); setModalOpen(true) }}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-4 py-2 rounded-xl transition active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Agregar
          </button>
        </div>
        {total === 0 && !isLoading && (
          <button
            onClick={loadTemplate}
            disabled={loadingTemplate}
            className="w-full text-left bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2.5 rounded-xl transition flex items-center gap-2"
          >
            <span className="text-base">✨</span>
            <span>{loadingTemplate ? 'Cargando tareas...' : 'Cargar tareas sugeridas para casamiento AR'}</span>
          </button>
        )}
      </div>

      <div className="p-4 md:p-6">

        {total > 0 && (
          <div className="card mb-5">
            <div className="flex justify-between items-baseline mb-2">
              <p className="text-xs font-medium text-ink-soft uppercase tracking-wide">Progreso general</p>
              <p className="text-sm font-semibold text-bordo">{pct}%</p>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#6B8070' : '#5C1F2E' }}
              />
            </div>
            <p className="text-xs text-ink-soft">{completed} de {total} tareas completadas</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { value: total,     label: 'Total',       cls: 'text-bordo' },
            { value: completed, label: 'Completadas', cls: 'text-sage'  },
            { value: pending,   label: 'Pendientes',  cls: 'text-gold'  },
          ].map(({ value, label, cls }) => (
            <div key={label} className="card text-center">
              <p className={`text-2xl font-semibold leading-none ${cls}`}>{value}</p>
              <p className="text-xs text-ink-soft mt-1.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2 mb-5">
          <FilterChips value={filterStatus} onChange={setFilterStatus} options={[
            { value: 'todas',       label: 'Todas' },
            { value: 'pendientes',  label: 'Pendientes' },
            { value: 'completadas', label: 'Completadas' },
          ]} />
          <FilterChips value={filterAssign} onChange={setFilterAssign} options={assignOptions} />
          {catOptions.length > 2 && (
            <FilterChips value={filterCat} onChange={setFilterCat} options={catOptions} />
          )}
        </div>

        {isLoading ? (
          <p className="text-center text-ink-soft text-sm py-8 animate-pulse">Cargando tareas...</p>
        ) : filtered.length === 0 && total === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">📋</p>
            <p className="font-medium text-ink mb-1">Sin tareas todavía</p>
            <p className="text-sm text-ink-soft mb-4">Usá las sugeridas o agregá las tuyas</p>
            <button
              onClick={loadTemplate}
              disabled={loadingTemplate}
              className="inline-flex items-center gap-2 bg-bordo text-white text-sm font-medium px-5 py-2.5 rounded-xl transition hover:bg-bordo-light active:scale-95"
            >
              <span>✨</span>
              {loadingTemplate ? 'Cargando...' : 'Cargar tareas sugeridas'}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">✅</p>
            <p className="font-medium text-ink mb-1">
              {filterStatus === 'completadas' ? '¡Todo pendiente!' : '¡Todo listo!'}
            </p>
            <p className="text-sm text-ink-soft">Probá cambiando el filtro</p>
          </div>
        ) : (
          <div className="md:grid md:grid-cols-2 md:gap-x-6 md:items-start">
            {Object.entries(grouped).map(([cat, catItems]) => (
              <div key={cat} className="mb-4">
                {Object.keys(grouped).length > 1 && (
                  <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide mb-2 px-1">
                    {cat}
                  </p>
                )}
                <div className="space-y-2">
                  {catItems.map((item) => {
                    const assignKey = item.assigned_to || 'ambas'
                    const assignName = assignKey === 'novia1' ? bride1 : assignKey === 'novia2' ? bride2 : null
                    const assignCls  = ASSIGN_COLORS[assignKey] ?? null
                    return (
                      <div
                        key={item.id}
                        className={`card flex items-start gap-3 transition ${item.completed ? 'opacity-55' : ''}`}
                      >
                        <button
                          onClick={() => toggleCompleted(item)}
                          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${
                            item.completed ? 'bg-sage border-sage' : 'border-border hover:border-bordo-light'
                          }`}
                        >
                          {item.completed && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-medium leading-snug ${item.completed ? 'line-through text-ink-soft' : 'text-ink'}`}>
                              {item.title}
                            </p>
                            {assignName && assignCls && (
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${assignCls}`}>
                                {assignName}
                              </span>
                            )}
                          </div>
                          {item.notes && (
                            <p className="text-xs text-ink-soft mt-0.5 leading-snug">{item.notes}</p>
                          )}
                        </div>

                        <button
                          onClick={() => { setEditingItem(item); setModalOpen(true) }}
                          className="text-ink-soft hover:text-ink transition p-1 flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ChecklistItemFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        item={editingItem}
        onSaved={invalidate}
        bride1={bride1}
        bride2={bride2}
      />
    </div>
  )
}
