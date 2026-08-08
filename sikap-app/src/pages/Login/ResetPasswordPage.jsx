// ============================================================
// src/pages/Login/ResetPasswordPage.jsx
// ============================================================
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { auth } from '../../lib/firebase'
import { verifyPasswordResetCode, confirmPasswordReset, updatePassword } from 'firebase/auth'
import { KeyIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="card w-full max-w-md p-8 shadow-xl animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <KeyIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-slate-800 font-display mb-2">Buat Password Baru</h2>
        <p className="text-sm text-center text-slate-500 mb-8">Silakan masukkan password baru Anda.</p>

        {message.text && (
          <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 text-sm font-medium
            ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
            {message.type === 'error' ? <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" /> : <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-5">
          <div>
            <label className="label">Password Baru</label>
            <input 
              type="password" 
              className="input" 
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading || message.type === 'success'}
              required
            />
          </div>
          <div>
            <label className="label">Konfirmasi Password Baru</label>
            <input 
              type="password" 
              className="input" 
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={loading || message.type === 'success'}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-primary w-full py-2.5 text-base mt-2"
            disabled={loading || message.type === 'success' || message.text.includes('kadaluarsa')}
          >
            {loading ? 'Menyimpan...' : 'Simpan Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
