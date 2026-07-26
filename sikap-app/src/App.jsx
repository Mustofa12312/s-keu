// ============================================================
// src/App.jsx — Router utama
// ============================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'

// Pages
import LoginPage from './pages/Login/LoginPage'
import ResetPasswordPage from './pages/Login/ResetPasswordPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import TransaksiPage from './pages/Transaksi/TransaksiPage'
import BukuKasPage from './pages/BukuKas/BukuKasPage'
import LaporanPage from './pages/Laporan/LaporanPage'
import InstansiPage from './pages/Instansi/InstansiPage'
import UsersPage from './pages/Users/UsersPage'
import SettingsPage from './pages/Settings/SettingsPage'
import HutangPiutangPage from './pages/HutangPiutang/HutangPiutangPage'
import BukuKasHutangPiutangPage from './pages/HutangPiutang/BukuKasHutangPiutangPage'
import LaporanHutangPiutangPage from './pages/HutangPiutang/LaporanHutangPiutangPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/transaksi" element={<TransaksiPage />} />
              <Route path="/buku-kas" element={<BukuKasPage />} />
              <Route path="/laporan" element={<LaporanPage />} />
              
              {/* Hutang Piutang */}
              <Route path="/hutang" element={<HutangPiutangPage type="hutang" />} />
              <Route path="/piutang" element={<HutangPiutangPage type="piutang" />} />
              <Route path="/buku-kas-hutang" element={<BukuKasHutangPiutangPage />} />
              <Route path="/laporan-hutang" element={<LaporanHutangPiutangPage />} />

              <Route 
                path="/instansi"
              element={
                <ProtectedRoute adminOnly>
                  <InstansiPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute adminOnly>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pengaturan"
              element={
                <ProtectedRoute adminOnly>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
