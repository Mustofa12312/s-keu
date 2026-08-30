// ============================================================
// src/pages/LogAktivitas/ActivityLogPage.jsx
// ============================================================
import { useState, useEffect } from 'react'
import { ClockIcon, UserIcon, DocumentTextIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import EmptyState from '../../components/ui/EmptyState'
import { activityLogService } from '../../services/firebase.service'
import { useAuth } from '../../context/AuthContext'

export default function ActivityLogPage() {
  const { isSuperAdmin } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)

  async function load() {
    setLoading(true)
    setErrorMsg(null)
    try {
      const data = await activityLogService.getAll({ limitCount: 100 })
      setLogs(data)
    } catch(e) {
      console.error('Error loading logs:', e)
      setErrorMsg(e.message)
    }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (!isSuperAdmin) {
    return <div className="p-5 text-center text-red-500">Akses ditolak. Halaman ini hanya untuk Super Admin.</div>
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display flex items-center gap-2">
            <ClockIcon className="w-6 h-6 text-emerald-600" />
            Log Aktivitas (Audit Trail)
          </h2>
          <p className="text-sm text-slate-500">Riwayat perubahan data transaksi dan sistem (100 aktivitas terakhir)</p>
        </div>
        <button className="btn-secondary" onClick={load} disabled={loading}>
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Muat Ulang
        </button>
      </div>

      <div className="card overflow-hidden">
        {errorMsg ? (
          <div className="p-5 text-center">
            <div className="text-red-500 font-medium mb-2">Gagal memuat log aktivitas</div>
            <div className="text-slate-500 text-sm bg-slate-50 p-3 rounded">{errorMsg}</div>
          </div>
        ) : loading ? (
          <div className="p-5 space-y-4">
            {[1, 2, 3, 4, 5].map(n => <div key={n} className="h-10 skeleton w-full" />)}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            title="Belum ada aktivitas tercatat"
            description="Perubahan data akan tercatat di sini secara otomatis."
            icon={DocumentTextIcon}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl text-sm">
              <thead>
                <tr>
                  <th className="w-48">Waktu</th>
                  <th className="w-48">Pengguna</th>
                  <th className="w-24">Aksi</th>
                  <th className="w-32">Modul</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const dateStr = log.created_at ? log.created_at.toDate().toLocaleString() : '-'
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="text-slate-500 whitespace-nowrap">{dateStr}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-700">{log.user_name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge uppercase tracking-wider text-[10px] ${
                          log.action === 'CREATE' ? 'badge-green' :
                          log.action === 'UPDATE' ? 'badge-blue' :
                          log.action === 'DELETE' ? 'badge-red' :
                          log.action === 'RESTORE' ? 'badge-slate' : ''
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="capitalize text-slate-600 font-medium">{log.target_type}</td>
                      <td className="text-slate-500">{log.details}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
