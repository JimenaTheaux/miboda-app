import { NavLink, useNavigate } from 'react-router-dom'
import { NAV_ITEMS } from './Sidebar'
import { supabase } from '../lib/supabase'
import useAppStore from '../store/useAppStore'

export default function BottomNav() {
  const navigate = useNavigate()
  const reset = useAppStore((s) => s.reset)

  async function handleSignOut() {
    await supabase.auth.signOut()
    reset()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50 safe-bottom">
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg transition-colors ${
                isActive ? 'text-bordo' : 'text-ink-soft hover:text-ink-mid'
              }`
            }
          >
            {tab.icon}
            <span className="text-[9px] font-medium">{tab.title}</span>
          </NavLink>
        ))}
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg text-ink-soft hover:text-ink-mid transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          <span className="text-[9px] font-medium">Salir</span>
        </button>
      </div>
    </nav>
  )
}
