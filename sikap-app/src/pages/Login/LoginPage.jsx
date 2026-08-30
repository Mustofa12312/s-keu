// ============================================================
// src/pages/Login/LoginPage.jsx
// ============================================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ShieldCheckIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      // Bedakan error berdasarkan pesan dari Supabase
      const msg = err?.message || ''
      if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('invalid password')) {
        setError('Email atau password salah. Silakan periksa kembali.')
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        setError('Email belum dikonfirmasi. Periksa kotak masuk email Anda.')
      } else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
        setError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.')
      } else if (msg.toLowerCase().includes('too many requests') || msg.toLowerCase().includes('rate limit')) {
        setError('Terlalu banyak percobaan login. Tunggu beberapa menit sebelum mencoba lagi.')
      } else {
        setError(`Gagal masuk: ${msg || 'Terjadi kesalahan tidak dikenal.'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden bg-slate-900">
        {/* Deep, dynamic gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 opacity-90" />
        
        {/* Animated ambient glowing orbs */}
        <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-emerald-500/20 blur-[120px] mix-blend-screen animate-pulse duration-10000" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-teal-600/20 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] rounded-full bg-emerald-400/10 blur-[80px] mix-blend-screen" />

        {/* Abstract geometric grid overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMTBoNDBNMTAgMHY0ME0wIDIwaDQwTTIwIDB2NDBNMCAzMGg0ME0zMCAwdjQwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-50" />

        <div className="relative z-10 p-16 flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden shadow-[0_0_40px_rgba(52,211,153,0.15)]">
                <img src="/logofix.png" alt="Logo L-Keu" className="w-full h-full object-contain p-1.5" />
              </div>
              <div>
                <p className="text-white font-bold text-2xl font-display tracking-wide">L-Keu</p>
                <p className="text-emerald-400/80 font-medium text-xs tracking-[0.2em] uppercase mt-0.5">Darur Rohman</p>
              </div>
            </div>
            
            <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
              <h2 className="text-transparent bg-clip-text bg-gradient-to-br from-white via-emerald-50 to-emerald-200/60 font-display font-bold text-5xl leading-[1.15] mb-6 tracking-tight">
                Sistem Informasi<br />Keuangan &<br />Pelaporan
              </h2>
              <p className="text-emerald-100/70 text-base leading-relaxed max-w-sm font-light">
                Pengelolaan keuangan terpusat yang didesain secara khusus untuk transparansi dan efisiensi operasional Pondok Pesantren.
              </p>
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '500ms' }}>
            <div className="grid grid-cols-3 gap-5">
              {[
                { label: 'Instansi', value: '7+' },
                { label: 'Sistem', value: 'Terpadu' },
                { label: 'Keamanan', value: 'Ketat' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-5 text-center group hover:bg-white/[0.06] transition-all duration-500 cursor-default">
                  <p className="text-emerald-50 text-xl font-bold font-display group-hover:scale-105 transition-transform duration-500">{value}</p>
                  <p className="text-emerald-400/60 text-xs mt-2 uppercase tracking-widest font-medium group-hover:text-emerald-400/80 transition-colors">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 flex items-center justify-between border-t border-white/5 pt-8">
              <p className="text-emerald-400/50 text-xs uppercase tracking-widest font-medium">
                © {new Date().getFullYear()} Cakrawala Digital
              </p>
              <p className="text-emerald-100/80 text-sm font-light">
                Bantuan: <span className="font-semibold text-white ml-1">0813 5908 8246</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-200 overflow-hidden shadow-sm">
              <img src="/logofix.png" alt="Logo L-Keu" className="w-full h-full object-contain p-1" />
            </div>
            <div>
              <p className="font-bold text-slate-800 font-display">L-Keu</p>
              <p className="text-slate-400 text-xs">Darur Rohman</p>
            </div>
          </div>

          <div className="card p-8">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-slate-800 font-display">Selamat Datang 👋</h1>
              <p className="text-slate-500 text-sm mt-1">Masuk untuk mengakses sistem keuangan</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">Email</label>
                <input
                  id="email"
                  type="email"
                  className={`input ${error ? 'input-error' : ''}`}
                  placeholder="nama@darurrohman.id"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="label">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    className={`input pr-10 ${error ? 'input-error' : ''}`}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                id="btn-login"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5 mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Memverifikasi...
                  </>
                ) : 'Masuk ke Sistem'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            Hubungi administrator jika lupa password
          </p>
        </div>
      </div>
    </div>
  )
}
