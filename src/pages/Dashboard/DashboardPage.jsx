import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import useAppStore from '../../store/useAppStore'
import { useCountdown } from '../../hooks/useCountdown'

function pad(n) { return String(n).padStart(2, '0') }

function formatCurrency(n) {
  return '$' + Math.round(n).toLocaleString('es-AR')
}

// ── Arcos decorativos ──────────────────────────────────────────────────────────
function DecorativeArcs() {
  const arc = { border: '1px solid rgba(255,255,255,0.07)', borderRadius: '50%' }
  return (
    <>
      <div className="absolute -right-16 -top-16 w-64 h-64 pointer-events-none" style={arc} />
      <div className="absolute -right-6 -top-6 w-44 h-44 pointer-events-none" style={arc} />
      <div className="absolute -left-20 -bottom-12 w-60 h-60 pointer-events-none" style={arc} />
      <div className="absolute left-24 -bottom-20 w-48 h-48 pointer-events-none" style={arc} />
    </>
  )
}

// ── Status badge ───────────────────────────────────────────────────────────────
const STATUS_CFG = {
  confirmado: { label: 'Confirmado', cls: 'bg-sage-pale text-sage' },
  pendiente:  { label: 'Pendiente',  cls: 'bg-gold-pale text-gold' },
  no_asiste:  { label: 'No asiste',  cls: 'bg-red-50 text-red-500' },
}
function StatusBadge({ status }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.pendiente
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${c.cls}`}>{c.label}</span>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { event, eventId, setEvent } = useAppStore()
  const photoInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const timeLeft = useCountdown(event?.wedding_date)

  const coverUrl = event?.cover_photo_url
    ? supabase.storage.from('miboda-files').getPublicUrl(event.cover_photo_url).data.publicUrl
    : null

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: confirmed = 0 } = useQuery({
    queryKey: ['confirmed-guests', eventId],
    queryFn: async () => {
      const { count } = await supabase.from('guests')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId).eq('status', 'confirmado')
      return count ?? 0
    },
    enabled: !!eventId,
  })

  const { data: collected = 0 } = useQuery({
    queryKey: ['collected', eventId],
    queryFn: async () => {
      const { data } = await supabase.from('payments').select('amount').eq('event_id', eventId)
      return data?.reduce((s, p) => s + (Number(p.amount) || 0), 0) ?? 0
    },
    enabled: !!eventId,
  })

  const { data: tablesCount = 0 } = useQuery({
    queryKey: ['tables-count', eventId],
    queryFn: async () => {
      const { count } = await supabase.from('tables')
        .select('id', { count: 'exact', head: true }).eq('event_id', eventId)
      return count ?? 0
    },
    enabled: !!eventId,
  })

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['pending-tasks-count', eventId],
    queryFn: async () => {
      const { count } = await supabase.from('checklist_items')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId).eq('completed', false)
      return count ?? 0
    },
    enabled: !!eventId,
  })

  const { data: recentTasks = [] } = useQuery({
    queryKey: ['recent-tasks', eventId],
    queryFn: async () => {
      const { data } = await supabase.from('checklist_items')
        .select('id, title, category, completed')
        .eq('event_id', eventId).eq('completed', false)
        .order('sort_order', { ascending: true }).limit(5)
      return data ?? []
    },
    enabled: !!eventId,
  })

  const { data: recentGuests = [] } = useQuery({
    queryKey: ['recent-guests-dash', eventId],
    queryFn: async () => {
      const { data } = await supabase.from('guests')
        .select('id, full_name, status, age_group')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false }).limit(8)
      return data ?? []
    },
    enabled: !!eventId,
  })

  // ── Photo edit ─────────────────────────────────────────────────────────────
  async function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file || !eventId) return
    setUploading(true)
    const ext = file.name.split('.').pop().toLowerCase()
    const path = `${eventId}/portada/cover.${ext}`
    const { error } = await supabase.storage.from('miboda-files').upload(path, file, { upsert: true })
    if (!error) {
      await supabase.from('events').update({ cover_photo_url: path }).eq('id', eventId)
      setEvent({ ...event, cover_photo_url: path })
    }
    setUploading(false)
  }

  const weddingDateLabel = event?.wedding_date
    ? new Date(event.wedding_date + 'T12:00:00').toLocaleDateString('es-AR', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  const stats = [
    { value: confirmed,              label: 'Confirmados' },
    { value: formatCurrency(collected), label: 'Recaudado' },
    { value: tablesCount,            label: 'Mesas' },
    { value: pendingCount,           label: 'Tareas pend.' },
  ]

  return (
    <div className="min-h-full bg-surface">

      {/* ── Cover header ────────────────────────────────────────────────────── */}
      <div className="relative bg-bordo overflow-hidden h-52 md:h-60">
        <DecorativeArcs />

        {/* Foto de portada */}
        {coverUrl && (
          <img src={coverUrl} alt="Portada" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        )}

        {/* Contenido del header */}
        <div className="relative z-10 h-full flex flex-col justify-end px-5 pb-5">
          <h1 className="font-serif text-white text-3xl md:text-4xl leading-tight">
            {event?.bride1_name} &amp; {event?.bride2_name}
          </h1>
          {weddingDateLabel && (
            <p className="text-white/60 text-sm mt-1">{weddingDateLabel}</p>
          )}
        </div>

        {/* Editar foto */}
        <button
          onClick={() => photoInputRef.current?.click()}
          disabled={uploading}
          className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition"
        >
          {uploading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          )}
        </button>
        <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
      </div>

      {/* ── Countdown ─────────────────────────────────────────────────────────── */}
      {timeLeft && !timeLeft.past && (
        <div className="bg-bordo-mid">
          <div className="flex">
            {[
              { v: timeLeft.days,    l: 'días' },
              { v: timeLeft.hours,   l: 'horas' },
              { v: timeLeft.minutes, l: 'minutos' },
              { v: timeLeft.seconds, l: 'segundos' },
            ].map(({ v, l }, i) => (
              <div
                key={l}
                className="flex-1 text-center py-3"
                style={i < 3 ? { borderRight: '0.5px solid rgba(255,255,255,0.12)' } : {}}
              >
                <p className="text-white font-semibold text-xl tabular-nums leading-none">{pad(v)}</p>
                <p className="text-white/50 text-[11px] mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {timeLeft?.past && (
        <div className="bg-bordo-mid py-3 text-center">
          <p className="font-serif text-white text-xl">¡Felices para siempre!</p>
        </div>
      )}

      {/* ── Contenido ─────────────────────────────────────────────────────────── */}
      <div className="p-4 md:p-6">
        <div className="md:grid md:grid-cols-5 md:gap-6">

          {/* Columna izquierda: stats + checklist */}
          <div className="md:col-span-3 space-y-4">

            {/* Stats 2×2 */}
            <div className="grid grid-cols-2 gap-3">
              {stats.map(({ value, label }) => (
                <div key={label} className="card text-center">
                  <p className="text-2xl font-semibold text-bordo leading-none">{value}</p>
                  <p className="text-xs text-ink-soft mt-1.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Checklist preview */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-ink">Próximas tareas</h2>
                <Link to="/checklist" className="text-xs text-bordo font-medium hover:underline">
                  Ver todas →
                </Link>
              </div>
              {recentTasks.length === 0 ? (
                <p className="text-ink-soft text-sm text-center py-3">Sin tareas pendientes 🎉</p>
              ) : (
                <div className="divide-y divide-border">
                  {recentTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div className="w-4 h-4 rounded-full border-2 border-border mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-ink leading-snug">{task.title}</p>
                        {task.category && (
                          <p className="text-xs text-ink-soft mt-0.5">{task.category}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Columna derecha: invitados recientes (solo desktop) */}
          <div className="hidden md:block md:col-span-2">
            <div className="card h-full">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-ink">Invitados recientes</h2>
                <Link to="/guests" className="text-xs text-bordo font-medium hover:underline">
                  Ver todos →
                </Link>
              </div>
              {recentGuests.length === 0 ? (
                <p className="text-ink-soft text-sm text-center py-6">Sin invitados aún</p>
              ) : (
                <div className="divide-y divide-border">
                  {recentGuests.map((g) => (
                    <div key={g.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                      <p className="text-sm text-ink font-medium truncate mr-3">{g.full_name}</p>
                      <StatusBadge status={g.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
