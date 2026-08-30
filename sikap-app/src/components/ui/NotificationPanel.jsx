// ============================================================
// src/components/ui/NotificationPanel.jsx
// Panel Notifikasi In-App — Transaksi Terbaru
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { BellIcon, CheckIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { BellAlertIcon } from '@heroicons/react/24/solid'
import { db } from '../../lib/firebase'
import { collection, query, orderBy, limit, onSnapshot, getDocs, where } from 'firebase/firestore'
import { formatRupiah } from '../../utils/formatRupiah'
import { useAuth } from '../../context/AuthContext'

function timeAgo(date) {
  if (!date) return 'baru saja'
  const dateObj = date.toDate ? date.toDate() : new Date(date)
  const diff = (Date.now() - dateObj.getTime()) / 1000
  if (diff < 60)   return 'baru saja'
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return `${Math.floor(diff / 86400)} hari lalu`
}

export default function NotificationPanel() {
  const { isSuperAdmin, instansiId } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('l-keu_read_notifs') || '[]') }
    catch { return [] }
  })
  const panelRef = useRef()

  useEffect(() => {
    let constraints = [orderBy('created_at', 'desc'), limit(15)];
    if (!isSuperAdmin && instansiId) {
      constraints.unshift(where('instansi_id', '==', instansiId));
    }
    
    const q = query(collection(db, 'transaksi'), ...constraints);

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch instansi details
      if (data.length > 0) {
        const instansiSnap = await getDocs(collection(db, 'instansi'));
        const instansiMap = {};
        instansiSnap.forEach(d => { instansiMap[d.id] = { id: d.id, ...d.data() }; });
        data = data.map(t => ({ ...t, instansi: instansiMap[t.instansi_id] }));
      }
      
      setNotifs(data);
    });

    return () => unsubscribe();
  }, [isSuperAdmin, instansiId])

  // Tutup panel saat klik di luar
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const unreadCount = notifs.filter(n => !readIds.includes(n.id)).length

  function markAllRead() {
    const allIds = notifs.map(n => n.id)
    setReadIds(allIds)
    localStorage.setItem('l-keu_read_notifs', JSON.stringify(allIds))
  }

  function markRead(id) {
    const updated = [...new Set([...readIds, id])]
    setReadIds(updated)
    localStorage.setItem('l-keu_read_notifs', JSON.stringify(updated))
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o) }}
        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition relative"
        aria-label="Notifikasi"
      >
        {unreadCount > 0
          ? <BellAlertIcon className="w-5 h-5 text-emerald-600 animate-pulse" />
          : <BellIcon className="w-5 h-5" />
        }
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-slide-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <BellAlertIcon className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-slate-800 text-sm">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                  {unreadCount} baru
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                  <CheckIcon className="w-3 h-3" /> Tandai Semua
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {notifs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                <BellIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Belum ada notifikasi</p>
              </div>
            ) : (
              notifs.map(n => {
                const isRead = readIds.includes(n.id)
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition
                      ${isRead ? 'bg-white hover:bg-slate-50' : 'bg-emerald-50/60 hover:bg-emerald-50'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                      ${n.jenis === 'pemasukan' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                      {n.jenis === 'pemasukan'
                        ? <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-600" />
                        : <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-tight truncate font-medium ${isRead ? 'text-slate-600' : 'text-slate-800'}`}>
                          {n.uraian || '-'}
                        </p>
                        {!isRead && <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1" />}
                      </div>
                      <p className={`text-xs font-semibold mt-0.5 ${n.jenis === 'pemasukan' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {n.jenis === 'pemasukan' ? '+' : '-'}{formatRupiah(n.nominal)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {n.instansi?.nama_instansi && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                            {n.instansi.nama_instansi}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">{timeAgo(n.created_at)}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-center">
              <p className="text-xs text-slate-400">Menampilkan {notifs.length} transaksi terbaru</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
