// ============================================================
// src/components/layout/Sidebar.jsx
// ============================================================
import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { hutangService } from '../../services/firebase.service'
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
  ChevronDownIcon,
  ArrowsRightLeftIcon,
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  WalletIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline'

const menuGroups = [
  {
    label: 'Utama',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    ]
  },
  {
    label: 'Transaksi Kas',
    icon: BanknotesIcon,
    items: [
      { to: '/transaksi',  label: 'Masuk & Keluar',   icon: ArrowsRightLeftIcon },
      { to: '/buku-kas',   label: 'Buku Kas',         icon: BookOpenIcon },
      { to: '/laporan',    label: 'Laporan Kas',      icon: DocumentChartBarIcon },
    ]
  },
  {
    label: 'Hutang Piutang',
    icon: WalletIcon,
    items: [
      { to: '/hutang',           label: 'Data Hutang',       icon: ArrowDownCircleIcon },
      { to: '/piutang',          label: 'Data Piutang',      icon: ArrowUpCircleIcon },
      { to: '/buku-kas-hutang',  label: 'Buku Kas Hutang',   icon: BookOpenIcon },
      { to: '/laporan-hutang',   label: 'Laporan Hutang',    icon: ClipboardDocumentCheckIcon },
    ]
  }
]

const adminItems = [
  { to: '/instansi',  label: 'Instansi',   icon: BuildingOffice2Icon },
  { to: '/users',     label: 'Pengguna',   icon: UsersIcon },
  { to: '/pengaturan',label: 'Pengaturan', icon: Cog6ToothIcon },
]

export default function Sidebar({ open, onClose }) {
  const { profile, logout, isSuperAdmin, instansiId } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [openGroup, setOpenGroup] = useState('Utama')
  const [overdueCount, setOverdueCount] = useState(0)

  useEffect(() => {
    if (!isSuperAdmin && !instansiId) return
    let mounted = true
    const id = isSuperAdmin ? null : instansiId
    
    hutangService.getAll({ instansiId: id, status: 'belum_lunas' })
      .then(data => {
        if (!mounted) return
        let count = 0
        data.forEach(d => {
          if (d.tanggal_jatuh_tempo) {
            const diffDays = Math.ceil((new Date(d.tanggal_jatuh_tempo) - new Date()) / (1000 * 60 * 60 * 24))
            if (diffDays < 0) count++
          }
        })
        setOverdueCount(count)
      })
      .catch(console.error)

    return () => { mounted = false }
  }, [instansiId, isSuperAdmin, location.pathname]) // re-fetch when navigation happens (to keep updated if they pay)

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
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {menuGroups.map((group, idx) => {
            if (group.label === 'Utama') {
              return group.items.map(item => {
                const canAccess = isSuperAdmin || !profile?.akses_menu || profile.akses_menu.includes(item.to);
                if (!canAccess) return null;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              });
            }

            // Accordion Groups
            const isActiveGroup = group.items.some(i => location.pathname.startsWith(i.to));
            const isOpen = openGroup === group.label || isActiveGroup;

            const visibleItems = group.items.filter(item => isSuperAdmin || !profile?.akses_menu || profile.akses_menu.includes(item.to));
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-0.5">
                <button
                  onClick={() => setOpenGroup(isOpen && !isActiveGroup ? '' : group.label)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 
                    ${isActiveGroup ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}
                >
                  <div className="flex items-center gap-3">
                    <group.icon className={`w-5 h-5 ${isActiveGroup ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div className="flex items-center gap-2">
                      <span>{group.label}</span>
                      {group.label === 'Hutang Piutang' && overdueCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shadow-sm shadow-red-200">
                          {overdueCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isActiveGroup ? 'text-emerald-600' : 'text-slate-400'}`} />
                </button>
                
                {isOpen && (
                  <div className="pl-11 pr-2 py-1 space-y-0.5 animate-slide-in">
                    {visibleItems.map(item => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${isActive ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                        onClick={onClose}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

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
