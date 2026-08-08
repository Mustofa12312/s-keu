// ============================================================
// src/components/layout/Navbar.jsx
// ============================================================
import { Bars3Icon } from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import NotificationPanel from '../ui/NotificationPanel'

export default function Navbar({ onMenuClick, title }) {
  const { profile } = useAuth()
  return (
    <header className="no-print sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-[0_4px_30px_rgba(0,0,0,0.02)] h-16 flex items-center px-6 gap-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2.5 rounded-xl hover:bg-slate-100/50 text-slate-600 transition-colors"
        aria-label="Buka menu"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>

      <div className="flex-1">
        <h1 className="text-base font-bold text-slate-800 font-display tracking-tight">{title || 'Dashboard'}</h1>
      </div>

      <div className="flex items-center gap-3">
        <NotificationPanel />
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-md shadow-brand-500/20 flex items-center justify-center text-white text-sm font-bold border border-brand-400/30 cursor-pointer hover:scale-105 transition-transform">
          {profile?.nama?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  )
}

