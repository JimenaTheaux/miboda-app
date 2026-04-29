import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import useAppStore from './store/useAppStore'
import Layout from './components/Layout'

import LoginPage from './pages/Auth/LoginPage'
import AuthCallback from './pages/Auth/AuthCallback'
import OnboardingPage from './pages/Onboarding/OnboardingPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import GuestsPage from './pages/Guests/GuestsPage'
import TablesPage from './pages/Tables/TablesPage'
import PaymentsPage from './pages/Payments/PaymentsPage'
import PaymentDetailPage from './pages/Payments/PaymentDetailPage'
import VendorsPage from './pages/Vendors/VendorsPage'
import VendorDetailPage from './pages/Vendors/VendorDetailPage'
import ChecklistPage from './pages/Checklist/ChecklistPage'

function ProtectedRoute({ children }) {
  const user = useAppStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return children
}

function IndexRedirect() {
  const user = useAppStore((s) => s.user)
  const eventId = useAppStore((s) => s.eventId)
  if (!user) return <Navigate to="/login" replace />
  if (!eventId) return <Navigate to="/onboarding" replace />
  return <Navigate to="/dashboard" replace />
}

// Rutas con layout completo (sidebar + bottom nav)
const withLayout = (Page) => (
  <ProtectedRoute>
    <Layout>
      <Page />
    </Layout>
  </ProtectedRoute>
)

// Rutas protegidas sin layout (onboarding)
const protect = (Page) => (
  <ProtectedRoute>
    <Page />
  </ProtectedRoute>
)

export default function App() {
  const { setUser, setEventId, setEvent, reset } = useAppStore()
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)

        const { data } = await supabase
          .from('event_users')
          .select('event_id, events(*)')
          .eq('user_id', session.user.id)
          .single()

        if (data) {
          setEventId(data.event_id)
          setEvent(data.events)
        }
      }

      setInitializing(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') reset()
    })

    return () => subscription.unsubscribe()
  }, [])

  if (initializing) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="font-serif text-bordo text-4xl">MiBoda</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login"         element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/onboarding"    element={protect(OnboardingPage)} />
      <Route path="/dashboard"     element={withLayout(DashboardPage)} />
      <Route path="/guests"        element={withLayout(GuestsPage)} />
      <Route path="/tables"        element={withLayout(TablesPage)} />
      <Route path="/payments"           element={withLayout(PaymentsPage)} />
      <Route path="/payments/:guestId"  element={withLayout(PaymentDetailPage)} />
      <Route path="/vendors"            element={withLayout(VendorsPage)} />
      <Route path="/vendors/:vendorId"  element={withLayout(VendorDetailPage)} />
      <Route path="/checklist"     element={withLayout(ChecklistPage)} />
<Route path="*"              element={<IndexRedirect />} />
    </Routes>
  )
}
