// ============================================================
// src/components/layout/Sidebar.jsx
// ============================================================
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  HomeIcon,
  BanknotesIcon,
  BookOpenIcon,
  DocumentChartBarIcon,
  BuildingOffice2Icon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'

const navItems = [
  { to: '/dashboard',  label: 'Dashboard',   icon: HomeIcon },
  { to: '/transaksi',  label: 'Transaksi',   icon: BanknotesIcon },
  { to: '/buku-kas',   label: 'Buku Kas Umum', icon: BookOpenIcon },
  { to: '/laporan',    label: 'Laporan',     icon: DocumentChartBarIcon },
]

const adminItems = [
  { to: '/instansi',  label: 'Instansi',   icon: BuildingOffice2Icon },
  { to: '/users',     label: 'Pengguna',   icon: UsersIcon },
  { to: '/pengaturan',label: 'Pengaturan', icon: Cog6ToothIcon },
]

export default function Sidebar({ open, onClose }) {
  const { profile, logout, isSuperAdmin } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const sidebarClass = `
    fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 flex flex-col
    transform transition-transform duration-200 ease-in-out
    ${open ? 'translate-x-0' : '-translate-x-full'}
    lg:translate-x-0 lg:static lg:z-auto
  `

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={sidebarClass}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheckIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 font-display leading-tight">SIKAP</p>
            <p className="text-[10px] text-slate-500 leading-tight">Darur Rohman</p>
          </div>
        </div>

        {/* Profile mini */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 border border-emerald-200">
              <span className="text-sm font-bold text-emerald-700">
                {profile?.nama?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800 truncate">{profile?.nama || 'User'}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{profile?.role?.replace('_', ' ') || '-'}</p>
            </div>
          </div>
          
          {profile?.instansi ? (
            <div className="px-3 py-2 rounded-lg bg-emerald-600 shadow-sm shadow-emerald-200 text-center border border-emerald-500">
              <p className="text-[10px] text-emerald-200 uppercase tracking-wider font-semibold mb-0.5">Mengelola Instansi</p>
              <p className="text-sm font-bold text-white truncate">
                {profile.instansi.nama_instansi}
              </p>
            </div>
          ) : isSuperAdmin ? (
            <div className="px-3 py-2 rounded-lg bg-blue-600 shadow-sm shadow-blue-200 text-center border border-blue-500">
              <p className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold mb-0.5">Akses Penuh</p>
              <p className="text-sm font-bold text-white truncate">Semua Instansi</p>
            </div>
          ) : null}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Menu Utama</p>
          {navItems
            .filter(item => isSuperAdmin || !profile?.akses_menu || profile.akses_menu.includes(item.to))
            .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: '18px', height: '18px' }} />
              <span>{label}</span>
            </NavLink>
          ))}

          {isSuperAdmin && (
            <>
              <p className="px-3 py-1.5 mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Administrasi</p>
              {adminItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                  onClick={onClose}
                >
                  <Icon style={{ width: '18px', height: '18px' }} className="flex-shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 pt-2 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <ArrowRightOnRectangleIcon style={{ width: '18px', height: '18px' }} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  )
}
