import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { supabase } from '../../lib/supabase'
import useAppStore from '../../store/useAppStore'
import VendorFormModal from './VendorFormModal'

function fmt(n) { return '$ ' + Math.round(n || 0).toLocaleString('es-AR') }

const CATEGORIES = {
  salon:        { label: 'Salón',               icon: '🏛️' },
  fotografia:   { label: 'Fotografía',          icon: '📸' },
  catering:     { label: 'Catering',            icon: '🍽️' },
  musica:       { label: 'Música / DJ',         icon: '🎵' },
  flores:       { label: 'Flores / Decoración', icon: '💐' },
  indumentaria: { label: 'Indumentaria',        icon: '👗' },
  otros:        { label: 'Otros',               icon: '📦' },
}

const VENDOR_STATUS = {
  en_revision: { label: 'En revisión', cls: 'bg-gold-pale text-gold' },
  confirmado:  { label: 'Confirmado',  cls: 'bg-sage-pale text-sage' },
  cancelado:   { label: 'Cancelado',   cls: 'bg-red-50 text-red-500' },
}

function calcPayStatus(payments, chosenAmount) {
  const total = payments.reduce((s, p) => s + Number(p.amount), 0)
  if (total === 0) return { label: 'Sin pago', cls: 'bg-surface-2 text-ink-soft' }
  if (payments.length === 1 && payments[0].is_sena) return { label: 'Seña pagada', cls: 'bg-gold-pale text-gold' }
  if (chosenAmount > 0 && total >= chosenAmount) return { label: 'Pagado', cls: 'bg-sage-pale text-sage' }
  return { label: 'Pago parcial', cls: 'bg-bordo-pale text-bordo-light' }
}

// ── Slot de presupuesto ────────────────────────────────────────────────────────
function QuoteSlot({ n, files, vendorId, eventId, onChanged }) {
  const [uploading, setUploading] = useState(false)
  const [editAmt, setEditAmt]     = useState(false)
  const [amtInput, setAmtInput]   = useState('')
  const fileRef = useRef(null)

  const file    = files.find((f) => f.file_type === 'quote' && f.quote_number === n)
  const fileUrl = file ? supabase.storage.from('miboda-files').getPublicUrl(file.file_url).data.publicUrl : null
  const isImage = file ? /\.(jpg|jpeg|png|webp|gif)$/i.test(file.file_url) : false

  async function upload(e) {
    const f = e.target.files[0]; if (!f) return
    setUploading(true)
    const ext  = f.name.split('.').pop().toLowerCase()
    const path = `${eventId}/vendors/${vendorId}/presupuesto-${n}.${ext}`
    const { error } = await supabase.storage.from('miboda-files').upload(path, f, { upsert: true })
    if (!error) {
      if (file) {
        await supabase.from('vendor_files').update({ file_url: path }).eq('id', file.id)
      } else {
        await supabase.from('vendor_files').insert({
          event_id: eventId, vendor_id: vendorId,
          file_url: path, file_type: 'quote', quote_number: n, amount: 0, is_chosen: false,
        })
      }
      onChanged()
    }
    setUploading(false)
  }

  async function saveAmount() {
    if (!file) return
    const val = parseFloat(amtInput)
    if (!isNaN(val)) {
      await supabase.from('vendor_files').update({ amount: val }).eq('id', file.id)
      if (file.is_chosen) {
        await supabase.from('vendors').update({ chosen_amount: val }).eq('id', vendorId)
      }
    }
    onChanged(); setEditAmt(false)
  }

  async function markChosen() {
    await supabase.from('vendor_files').update({ is_chosen: false })
      .eq('vendor_id', vendorId).eq('file_type', 'quote')
    await supabase.from('vendor_files').update({ is_chosen: true }).eq('id', file.id)
    await supabase.from('vendors').update({ chosen_amount: file.amount ?? 0 }).eq('id', vendorId)
    onChanged()
  }

  async function removeFile() {
    await supabase.storage.from('miboda-files').remove([file.file_url])
    await supabase.from('vendor_files').delete().eq('id', file.id)
    if (file.is_chosen) await supabase.from('vendors').update({ chosen_amount: 0 }).eq('id', vendorId)
    onChanged()
  }

  return (
    <div className={`card space-y-2 ${file?.is_chosen ? 'border-sage' : ''}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-ink-soft">Presupuesto {n}</p>
        {file?.is_chosen && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 bg-sage-pale text-sage rounded-full">Elegido ✓</span>
        )}
      </div>

      {file ? (
        <>
          {isImage ? (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <img src={fileUrl} alt={`Presupuesto ${n}`} className="w-full h-28 object-cover rounded-lg" />
            </a>
          ) : (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-2.5 bg-surface-2 rounded-lg text-xs text-ink hover:text-bordo transition">
              <span className="text-lg">📄</span>
              <span>Ver archivo adjunto</span>
            </a>
          )}

          {editAmt ? (
            <div className="flex gap-2">
              <input type="number" min={0} step={1} autoFocus className="input-base flex-1 py-1.5 text-sm"
                value={amtInput} onChange={(e) => setAmtInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveAmount()} />
              <button onClick={saveAmount} className="px-3 py-1.5 bg-bordo text-white rounded-lg text-xs">OK</button>
            </div>
          ) : (
            <button onClick={() => { setAmtInput((file.amount || '').toString()); setEditAmt(true) }}
              className="text-sm font-semibold text-ink hover:text-bordo transition text-left">
              {file.amount > 0 ? fmt(file.amount) : '+ Agregar monto'}
            </button>
          )}

          <div className="flex gap-2">
            {!file.is_chosen && (
              <button onClick={markChosen}
                className="flex-1 text-xs font-medium text-sage border border-sage-pale rounded-lg py-1.5 hover:bg-sage-pale transition">
                Marcar elegido
              </button>
            )}
            <button onClick={() => fileRef.current?.click()}
              className="flex-1 text-xs text-ink-soft border border-border rounded-lg py-1.5 hover:bg-surface-2 transition">
              {uploading ? 'Subiendo...' : 'Reemplazar'}
            </button>
            <button onClick={removeFile}
              className="text-xs text-red-400 border border-red-100 rounded-lg px-2.5 py-1.5 hover:bg-red-50 transition">✕</button>
          </div>
        </>
      ) : (
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-full h-20 border-2 border-dashed border-border rounded-xl flex items-center justify-center text-xs text-ink-soft hover:border-bordo-light hover:text-ink transition">
          {uploading ? 'Subiendo...' : '+ Adjuntar archivo'}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={upload} className="hidden" />
    </div>
  )
}

// ── Galería ────────────────────────────────────────────────────────────────────
function GallerySection({ files, vendorId, eventId, onChanged }) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const photos  = files.filter((f) => f.file_type === 'photo')

  async function upload(e) {
    const f = e.target.files[0]; if (!f) return
    setUploading(true)
    const ext  = f.name.split('.').pop().toLowerCase()
    const path = `${eventId}/vendors/${vendorId}/gallery/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('miboda-files').upload(path, f)
    if (!error) {
      await supabase.from('vendor_files').insert({
        event_id: eventId, vendor_id: vendorId, file_url: path, file_type: 'photo',
      })
      onChanged()
    }
    setUploading(false)
  }

  async function deletePhoto(photo) {
    await supabase.storage.from('miboda-files').remove([photo.file_url])
    await supabase.from('vendor_files').delete().eq('id', photo.id)
    onChanged()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Galería de fotos</p>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="text-xs text-bordo font-medium hover:underline">
          {uploading ? 'Subiendo...' : '+ Agregar foto'}
        </button>
      </div>
      {photos.length === 0 ? (
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-full h-24 border-2 border-dashed border-border rounded-xl flex items-center justify-center text-xs text-ink-soft hover:border-bordo-light transition">
          + Fotos de referencia o portfolio
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => {
            const url = supabase.storage.from('miboda-files').getPublicUrl(photo.file_url).data.publicUrl
            return (
              <div key={photo.id} className="relative group aspect-square">
                <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                <button onClick={() => deletePhoto(photo)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  ✕
                </button>
              </div>
            )
          })}
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="aspect-square border-2 border-dashed border-border rounded-xl flex items-center justify-center text-xl text-ink-soft hover:border-bordo-light transition">
            +
          </button>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={upload} className="hidden" />
    </div>
  )
}

// ── Modal pago al proveedor ────────────────────────────────────────────────────
function VendorPaymentModal({ open, onClose, onSave, saving, error }) {
  const today = new Date().toISOString().split('T')[0]
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: { paid_at: today } })
  function submit(v) { onSave(v); reset({ paid_at: today }) }

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
            <input className="input-base" placeholder="Ej: Seña, pago final..." {...register('notes')} />
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

// ── Página principal ────────────────────────────────────────────────────────────
export default function VendorDetailPage() {
  const { vendorId } = useParams()
  const { eventId }  = useAppStore()
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const [editModalOpen, setEditModalOpen]   = useState(false)
  const [payModalOpen, setPayModalOpen]     = useState(false)
  const [saving, setSaving]                 = useState(false)
  const [saveError, setSaveError]           = useState(null)
  const [editChosen, setEditChosen]         = useState(false)
  const [chosenInput, setChosenInput]       = useState('')

  const { data: vendor } = useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: async () => {
      const { data } = await supabase.from('vendors').select('*').eq('id', vendorId).single()
      return data
    },
    enabled: !!vendorId,
  })

  const { data: files = [], refetch: refetchFiles } = useQuery({
    queryKey: ['vendor-files', vendorId],
    queryFn: async () => {
      const { data } = await supabase.from('vendor_files').select('*')
        .eq('vendor_id', vendorId).order('created_at')
      return data ?? []
    },
    enabled: !!vendorId,
  })

  const { data: vendorPayments = [] } = useQuery({
    queryKey: ['vendor-payments', vendorId],
    queryFn: async () => {
      const { data } = await supabase.from('vendor_payments').select('*')
        .eq('vendor_id', vendorId).order('paid_at', { ascending: true })
      return data ?? []
    },
    enabled: !!vendorId,
  })

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['vendor', vendorId] })
    queryClient.invalidateQueries({ queryKey: ['vendor-files', vendorId] })
    queryClient.invalidateQueries({ queryKey: ['vendor-payments', vendorId] })
    queryClient.invalidateQueries({ queryKey: ['vendors', eventId] })
  }

  async function registerPayment(values) {
    setSaving(true); setSaveError(null)
    const { error } = await supabase.from('vendor_payments').insert({
      event_id:  eventId,
      vendor_id: vendorId,
      amount:    parseFloat(values.amount),
      is_sena:   !!values.is_sena,
      notes:     values.notes?.trim() || null,
      paid_at:   values.paid_at || new Date().toISOString().split('T')[0],
    })
    if (error) { setSaveError(error.message); setSaving(false); return }
    invalidateAll(); setPayModalOpen(false); setSaving(false)
  }

  async function deleteVendorPayment(id) {
    await supabase.from('vendor_payments').delete().eq('id', id)
    invalidateAll()
  }

  async function saveChosenAmount() {
    const val = parseFloat(chosenInput)
    if (!isNaN(val) && val >= 0) {
      await supabase.from('vendors').update({ chosen_amount: val }).eq('id', vendorId)
      invalidateAll()
    }
    setEditChosen(false)
  }

  const totalPaid = vendorPayments.reduce((s, p) => s + Number(p.amount), 0)
  const chosen    = vendor?.chosen_amount ?? 0
  const saldo     = Math.max(0, chosen - totalPaid)
  const barPct    = chosen > 0 ? Math.min(100, Math.round((totalPaid / chosen) * 100)) : 0
  const payStatus = calcPayStatus(vendorPayments, chosen)
  const vst       = VENDOR_STATUS[vendor?.status] ?? VENDOR_STATUS.en_revision
  const cat       = CATEGORIES[vendor?.category]  ?? CATEGORIES.otros

  return (
    <div className="min-h-full bg-surface">

      {/* Header */}
      <div className="bg-bordo px-5 pt-8 pb-5">
        <button onClick={() => navigate('/vendors')}
          className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Proveedores
        </button>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-white/60 text-xs mb-1">{cat.icon} {cat.label}</p>
            <h1 className="font-serif text-white text-2xl leading-tight truncate">{vendor?.name ?? '...'}</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${vst.cls}`}>{vst.label}</span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${payStatus.cls}`}>{payStatus.label}</span>
            </div>
          </div>
          <button onClick={() => setEditModalOpen(true)}
            className="flex-shrink-0 bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-4 py-2 rounded-xl transition">
            Editar
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6 max-w-2xl">

        {/* Notas */}
        {vendor?.notes && (
          <div className="card">
            <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-1.5">Notas</p>
            <p className="text-sm text-ink leading-relaxed">{vendor.notes}</p>
          </div>
        )}

        {/* Sección 2: Presupuestos */}
        <div>
          <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-3">Presupuestos</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <QuoteSlot key={n} n={n} files={files} vendorId={vendorId} eventId={eventId}
                onChanged={invalidateAll} />
            ))}
          </div>
          {chosen > 0 && (
            <div className="card mt-3 flex justify-between items-center">
              <p className="text-xs text-ink-soft">Monto contratado</p>
              <p className="font-semibold text-ink">{fmt(chosen)}</p>
            </div>
          )}
        </div>

        {/* Sección 3: Galería */}
        <div className="card">
          <GallerySection files={files} vendorId={vendorId} eventId={eventId} onChanged={invalidateAll} />
        </div>

        {/* Sección 4: Pagos al proveedor */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Pagos realizados</p>
            <button onClick={() => setPayModalOpen(true)}
              className="text-xs font-medium text-bordo hover:underline">+ Registrar</button>
          </div>

          {/* Monto contratado editable */}
          <div className="card mb-3 flex items-center justify-between gap-3">
            <p className="text-xs text-ink-soft flex-shrink-0">Monto contratado</p>
            {editChosen ? (
              <div className="flex gap-2 items-center">
                <input
                  type="number" min={0} step={1} autoFocus
                  className="input-base py-1 text-sm w-36 text-right"
                  value={chosenInput}
                  onChange={(e) => setChosenInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveChosenAmount()}
                />
                <button onClick={saveChosenAmount} className="px-3 py-1.5 bg-bordo text-white rounded-lg text-xs">OK</button>
                <button onClick={() => setEditChosen(false)} className="text-ink-soft hover:text-ink text-xs px-1">✕</button>
              </div>
            ) : (
              <button
                onClick={() => { setChosenInput((chosen || '').toString()); setEditChosen(true) }}
                className={`text-sm font-semibold transition hover:text-bordo ${chosen > 0 ? 'text-ink' : 'text-ink-soft'}`}
              >
                {chosen > 0 ? fmt(chosen) : '+ Ingresar monto'}
              </button>
            )}
          </div>

          {chosen > 0 && (
            <div className="card mb-3">
              <div className="h-1.5 bg-border rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${barPct}%`, backgroundColor: barPct >= 100 ? '#6B8070' : '#B8965A' }} />
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-ink-soft mb-0.5">Pagado</p>
                  <p className="font-semibold text-sage">{fmt(totalPaid)}</p>
                </div>
                <div>
                  <p className="text-ink-soft mb-0.5">Total</p>
                  <p className="font-semibold text-ink">{fmt(chosen)}</p>
                </div>
                <div>
                  <p className="text-ink-soft mb-0.5">Saldo</p>
                  <p className="font-semibold text-gold">{fmt(saldo)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            {vendorPayments.length === 0 ? (
              <p className="text-sm text-ink-soft text-center py-4">Sin pagos registrados aún</p>
            ) : (
              <div className="divide-y divide-border">
                {vendorPayments.map((p) => (
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
                    <button onClick={() => deleteVendorPayment(p.id)}
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
      </div>

      <VendorFormModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        vendor={vendor}
        onSaved={invalidateAll}
      />

      <VendorPaymentModal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        onSave={registerPayment}
        saving={saving}
        error={saveError}
      />
    </div>
  )
}
