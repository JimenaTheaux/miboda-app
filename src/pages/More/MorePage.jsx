import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import useAppStore from '../../store/useAppStore'

const items = [
  { to: '/tables',    icon: '🪑', label: 'Mesas',      desc: 'Organización y asignación de invitados' },
  { to: '/checklist', icon: '✅', label: 'Checklist',  desc: 'Tareas y pendientes' },
]

export default function MorePage() {
  const navigate = useNavigate()
  const reset = useAppStore((s) => s.reset)

  async function handleSignOut() {
    await supabase.auth.signOut()
    reset()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-full bg-surface">
      <div className="bg-bordo px-5 pt-8 pb-5">
        <h1 className="font-serif text-white text-3xl">Más opciones</h1>
      </div>

      <div className="p-4 max-w-lg space-y-3">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="card flex items-center gap-4 hover:border-bordo-light transition active:scale-[0.99]"
          >
            <span className="text-2xl">{item.icon}</span>
            <div className="flex-1">
              <p className="font-medium text-ink">{item.label}</p>
              <p className="text-xs text-ink-soft">{item.desc}</p>
            </div>
            <svg className="w-4 h-4 text-ink-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        ))}

        <button
          onClick={handleSignOut}
          className="w-full text-sm text-ink-soft border border-border rounded-xl py-3 hover:bg-surface-2 transition mt-4"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
