// ============================================================
// src/pages/Login/ResetPasswordPage.jsx
// ============================================================
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { auth } from '../../lib/firebase'
import { verifyPasswordResetCode, confirmPasswordReset, updatePassword } from 'firebase/auth'
import { KeyIcon, CheckCircleIcon, ExclamationCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const oobCode = searchParams.get('oobCode')

  useEffect(() => {
    if (oobCode) {
      verifyPasswordResetCode(auth, oobCode).catch(() => {
        setMessage({ text: 'Link reset tidak valid atau sudah kadaluarsa.', type: 'error' })
      })
    } else {
      // If no oobCode, check if user is logged in to change password
      const unsubscribe = auth.onAuthStateChanged(user => {
        if (!user) {
          setMessage({ text: 'Anda harus login untuk mengubah password atau gunakan link dari email.', type: 'error' })
        }
      })
      return () => unsubscribe()
    }
  }, [oobCode])

  async function handleReset(e) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setMessage({ text: 'Password tidak cocok.', type: 'error' })
      return
    }
    if (password.length < 6) {
      setMessage({ text: 'Password minimal 6 karakter.', type: 'error' })
      return
    }

    setLoading(true)
    try {
      if (oobCode) {
        await confirmPasswordReset(auth, oobCode, password)
      } else {
        if (auth.currentUser) {
          await updatePassword(auth.currentUser, password)
        } else {
          throw new Error('Tidak ada user yang aktif')
        }
      }
      
      setMessage({ text: 'Password berhasil diubah. Mengalihkan...', type: 'success' })
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (error) {
      setMessage({ text: 'Gagal mengubah password: ' + error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 opacity-90" />
        
        <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-emerald-500/20 blur-[120px] mix-blend-screen animate-pulse duration-10000" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-teal-600/20 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] rounded-full bg-emerald-400/10 blur-[80px] mix-blend-screen" />

        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMTBoNDBNMTAgMHY0ME0wIDIwaDQwTTIwIDB2NDBNMCAzMGg0ME0zMCAwdjQwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-50" />

        <div className="relative z-10 p-16 flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400/30 to-emerald-600/10 border border-emerald-400/20 backdrop-blur-xl flex items-center justify-center shadow-[0_0_40px_rgba(52,211,153,0.15)]">
                <ShieldCheckIcon className="w-8 h-8 text-emerald-300 drop-shadow-md" />
              </div>
              <div>
                <p className="text-white font-bold text-2xl font-display tracking-wide">S-KEU</p>
                <p className="text-emerald-400/80 font-medium text-xs tracking-[0.2em] uppercase mt-0.5">Darur Rohman</p>
              </div>
            </div>
            
            <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
              <h2 className="text-transparent bg-clip-text bg-gradient-to-br from-white via-emerald-50 to-emerald-200/60 font-display font-bold text-5xl leading-[1.15] mb-6 tracking-tight">
                Keamanan &<br />Privasi
              </h2>
              <p className="text-emerald-100/70 text-base leading-relaxed max-w-sm font-light">
                Sistem kami menggunakan enkripsi standar industri untuk memastikan data dan kata sandi Anda selalu aman terlindungi.
              </p>
            </div>
          </div>
          
          <div className="animate-fade-in" style={{ animationDelay: '500ms' }}>
            <div className="mt-12 flex items-center justify-between border-t border-white/5 pt-8">
              <p className="text-emerald-400/50 text-xs uppercase tracking-widest font-medium">
                © {new Date().getFullYear()} Cakrawala Digital
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — reset form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-800 font-display">SIKAP</p>
              <p className="text-emerald-600 text-[10px] font-bold tracking-wider uppercase">Pondok Pesantren</p>
            </div>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <div className="inline-flex w-14 h-14 bg-emerald-100 rounded-2xl items-center justify-center mb-6 lg:mx-0 mx-auto">
              <KeyIcon className="w-7 h-7 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 font-display tracking-tight mb-3">
              Buat Password Baru
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Silakan masukkan password baru Anda yang kuat dan mudah diingat.
            </p>
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl mb-8 flex items-start gap-3 text-sm font-medium border
              ${message.type === 'error' ? 'bg-red-50/50 text-red-600 border-red-100' : 'bg-emerald-50/50 text-emerald-600 border-emerald-100'}`}>
              {message.type === 'error' ? <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />}
              <p className="leading-relaxed">{message.text}</p>
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password Baru</label>
              <input 
                type="password" 
                className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block p-3.5 text-sm transition-shadow" 
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading || message.type === 'success'}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Konfirmasi Password</label>
              <input 
                type="password" 
                className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block p-3.5 text-sm transition-shadow" 
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={loading || message.type === 'success'}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm px-5 py-3.5 mt-4 transition-colors focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-70 flex items-center justify-center gap-2"
              disabled={loading || message.type === 'success' || message.text.includes('kadaluarsa')}
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Menyimpan...' : 'Simpan Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
