import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

export default function Layout({ children }) {
  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Sidebar — solo desktop */}
      <Sidebar />

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto pb-14 md:pb-0">
        {children}
      </main>

      {/* Bottom nav — solo mobile */}
      <BottomNav />
    </div>
  )
}
