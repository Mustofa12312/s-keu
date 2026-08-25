// ============================================================
// src/routes/ProtectedRoute.jsx
// ============================================================
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, profileError, loading } = useAuth()

  // Tampilkan loading spinner hanya saat proses cek sesi awal
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Memeriksa sesi...</p>
        </div>
      </div>
    )
  }

  // Tidak ada user → ke login
  if (!user) return <Navigate to="/login" replace />

  // Route khusus admin: cek role dari profile
  if (adminOnly) {
    // Jika profile masih dimuat (null) DAN belum ada error → tunggu sebentar
    if (profile === null && !profileError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )
    }
    // Periksa akses berdasarkan super_admin atau akses_menu
    const currentPath = window.location.pathname;
    const isSuperAdmin = profile?.role === 'super_admin';
    const hasAksesMenu = profile?.akses_menu?.some(menu => currentPath.startsWith(menu));
    const canAccess = isSuperAdmin || hasAksesMenu;

    // Jika gagal fetch profile atau tidak memiliki akses → redirect ke dashboard
    if (profileError || !canAccess) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}
