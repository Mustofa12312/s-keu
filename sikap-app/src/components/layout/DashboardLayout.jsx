// ============================================================
// src/components/layout/DashboardLayout.jsx
// ============================================================
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

const PAGE_TITLES = {
  '/dashboard':  'Dashboard',
  '/transaksi':  'Manajemen Transaksi',
  '/buku-kas':   'Buku Kas Umum',
  '/laporan':    'Laporan Keuangan',
  '/instansi':   'Manajemen Instansi',
  '/users':      'Manajemen Pengguna',
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] || 'S-KEU'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
