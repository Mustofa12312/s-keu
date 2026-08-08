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
  ClipboardDocumentCheckIcon,
  ChartPieIcon,
  DocumentCheckIcon,
  ChartBarSquareIcon,
  TagIcon,
  ClockIcon,
  ChartBarIcon
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
      { to: '/perbandingan-tahunan', label: 'Perbandingan Tahunan', icon: ChartBarIcon },
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
  },
  {
    label: 'RAPBM (Anggaran)',
    icon: ChartPieIcon,
    items: [
      { to: '/anggaran/rencana',   label: 'Rencana Anggaran',  icon: ChartBarSquareIcon },
      { to: '/anggaran/realisasi', label: 'Realisasi Anggaran',icon: DocumentCheckIcon },
      { to: '/anggaran/laporan',   label: 'Laporan RAPBM',     icon: ClipboardDocumentCheckIcon },
    ]
  }
]

const adminItems = [
  { to: '/kategori',  label: 'Kategori Transaksi', icon: TagIcon },
  { to: '/instansi',  label: 'Instansi',   icon: BuildingOffice2Icon },
  { to: '/users',     label: 'Pengguna',   icon: UsersIcon },
  { to: '/log-aktivitas', label: 'Log Aktivitas', icon: ClockIcon },
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
    fixed inset-y-0 left-0 z-40 w-64 bg-white/70 backdrop-blur-3xl border-r border-white/60 flex flex-col
    transform transition-transform duration-300 ease-out shadow-[4px_0_24px_rgba(0,0,0,0.02)]
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
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/50">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/30 border border-brand-400/30">
            <ShieldCheckIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-800 font-display leading-tight tracking-tight">SIKAP</p>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">Darur Rohman</p>
          </div>
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 
                    ${isActiveGroup ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800 hover:translate-x-1'}`}
                >
                  <div className="flex items-center gap-3">
                    <group.icon className={`w-5 h-5 ${isActiveGroup ? 'text-brand-600' : 'text-slate-400'}`} />
                    <div className="flex items-center gap-2">
                      <span>{group.label}</span>
                      {group.label === 'Hutang Piutang' && overdueCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shadow-sm shadow-red-200">
                          {overdueCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${isActiveGroup ? 'text-brand-600' : 'text-slate-400'}`} />
                </button>
                
                {isOpen && (
                  <div className="pl-9 pr-2 py-1.5 space-y-1 animate-slide-in">
                    {visibleItems.map(item => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${isActive ? 'bg-white shadow-sm text-brand-700 ring-1 ring-slate-100/50' : 'text-slate-500 hover:bg-white/60 hover:text-slate-800 hover:shadow-sm'}`}
                        onClick={onClose}
                      >
                        {({ isActive }) => (
                          <>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? 'bg-brand-50 text-brand-600' : 'bg-slate-100/50 text-slate-400'}`}>
                              <item.icon className="w-4 h-4" />
                            </div>
                            <span>{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isSuperAdmin && (
            <>
              <p className="px-3 py-1.5 mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Administrasi</p>
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

        <div className="p-4 border-t border-white/60 bg-white/40 backdrop-blur-md mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/20 border border-brand-400/30">
              <span className="text-sm font-bold text-white">
                {profile?.nama?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800 truncate">{profile?.nama || 'User'}</p>
              <p className="text-[10px] font-medium text-slate-500 truncate capitalize">
                {profile?.instansi ? profile.instansi.nama_instansi : (isSuperAdmin ? 'Akses Penuh' : (profile?.role?.replace('_', ' ') || '-'))}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 mt-4 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-500 hover:text-white hover:shadow-md hover:shadow-red-500/20 transition-all duration-300"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  )
}
