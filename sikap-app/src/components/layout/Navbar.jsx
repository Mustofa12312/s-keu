// ============================================================
// src/components/layout/Navbar.jsx
// ============================================================
import { Bars3Icon } from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import NotificationPanel from '../ui/NotificationPanel'

export default function Navbar({ onMenuClick, title }) {
  const { profile } = useAuth()
  return (
    <header className="no-print sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100 h-14 flex items-center px-4 gap-3">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition"
        aria-label="Buka menu"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>

      <div className="flex-1">
        <h1 className="text-sm font-semibold text-slate-700 font-display">{title || 'Dashboard'}</h1>
      </div>

      <div className="flex items-center gap-2">
        <NotificationPanel />
        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
          {profile?.nama?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  )
}

