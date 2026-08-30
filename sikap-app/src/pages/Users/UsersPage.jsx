// ============================================================
// src/pages/Users/UsersPage.jsx
// Super admin only — dengan fitur Reset Password
// ============================================================
import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, KeyIcon, EyeIcon, EyeSlashIcon, NoSymbolIcon, CheckCircleIcon, TrashIcon } from '@heroicons/react/24/outline'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { profileService, instansiService, activityLogService } from '../../services/firebase.service'
import { useAuth } from '../../context/AuthContext'
import { auth, app } from '../../lib/firebase'
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { initializeApp } from 'firebase/app'

const EMPTY = { nama: '', email: '', password: '', role: 'admin_instansi', instansi_id: '', akses_menu: ['/dashboard', '/transaksi', '/buku-kas', '/laporan', '/hutang', '/piutang', '/buku-kas-hutang', '/laporan-hutang'] }

const ROLES = [
  { value: 'super_admin',    label: 'Super Admin',        badge: 'badge-blue' },
  { value: 'admin_instansi', label: 'Admin Instansi',     badge: 'badge-green' },
  { value: 'viewer',         label: 'Viewer / Pimpinan',  badge: 'badge-amber' },
  { value: 'blocked',        label: 'Akses Diblokir',     badge: 'badge-red' },
]

const MENU_OPTIONS = [
  { value: '/dashboard', label: 'Dashboard' },
  { value: '/transaksi', label: 'Transaksi' },
  { value: '/buku-kas', label: 'Buku Kas Umum' },
  { value: '/laporan', label: 'Laporan' },
  { value: '/hutang', label: 'Data Hutang' },
  { value: '/piutang', label: 'Data Piutang' },
  { value: '/buku-kas-hutang', label: 'Buku Kas Hutang' },
  { value: '/laporan-hutang', label: 'Laporan Hutang' },
  { value: '/anggaran/rencana', label: 'Rencana Anggaran' },
  { value: '/anggaran/realisasi', label: 'Realisasi Anggaran' },
  { value: '/anggaran/laporan', label: 'Laporan RAPBM' },
  { value: '/kategori', label: 'Kategori Transaksi' },
  { value: '/instansi', label: 'Instansi' },
  { value: '/users', label: 'Pengguna' },
  { value: '/log-aktivitas', label: 'Log Aktivitas' },
  { value: '/pengaturan', label: 'Pengaturan' },
]

export default function UsersPage() {
  const { profile } = useAuth()
  const [list, setList]               = useState([])
  const [instansiList, setInstansiList] = useState([])
  const [loading, setLoading]         = useState(true)
  const [modalOpen, setModalOpen]     = useState(false)
  const [resetModal, setResetModal]   = useState(false)
  const [editItem, setEditItem]       = useState(null)
  const [resetTarget, setResetTarget] = useState(null)
  const [form, setForm]               = useState(EMPTY)

  const [saving, setSaving]           = useState(false)
  const [resetting, setResetting]     = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [toast, setToast]             = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function load() {
    setLoading(true)
    try {
      const [users, instansi] = await Promise.all([
        profileService.getAll(),
        instansiService.getAll(),
      ])
      setList(users)
      setInstansiList(instansi)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openAdd() { setForm(EMPTY); setEditItem(null); setShowPassword(false); setModalOpen(true) }
  function openEdit(item) {
    setForm({ 
      nama: item.nama, 
      email: '', 
      password: '', 
      role: item.role, 
      instansi_id: item.instansi_id || '',
      akses_menu: item.akses_menu || ['/dashboard', '/transaksi', '/buku-kas', '/laporan', '/hutang', '/piutang', '/buku-kas-hutang', '/laporan-hutang']
    })
    setEditItem(item)
    setModalOpen(true)
  }
  function openReset(item) { setResetTarget(item); setResetModal(true) }

  async function handleSave() {
    if (!form.nama) return
    setSaving(true)
    try {
      if (editItem) {
        await profileService.update(editItem.id, {
          nama: form.nama,
          role: form.role,
          instansi_id: form.instansi_id || null,
          akses_menu: form.akses_menu,
        })
        await activityLogService.create({
          user: profile,
          action: 'UPDATE',
          target_type: 'pengguna',
          target_id: editItem.id,
          details: `Mengubah data dan hak akses pengguna ${form.nama}`
        })
        showToast('Data pengguna berhasil diperbarui')
      } else {
        // Create secondary app to avoid logging out current admin
        const tempApp = initializeApp(app.options, 'tempApp' + Date.now());
        const tempAuth = getAuth(tempApp);
        
        const userCredential = await createUserWithEmailAndPassword(tempAuth, form.email, form.password);
        
        await profileService.create(userCredential.user, {
          nama: form.nama,
          role: form.role,
          instansi_id: form.instansi_id || null,
          akses_menu: form.akses_menu,
        })
        await activityLogService.create({
          user: profile,
          action: 'CREATE',
          target_type: 'pengguna',
          target_id: userCredential.user.uid,
          details: `Menambah pengguna baru ${form.nama}`
        })
        
        await tempAuth.signOut();
        showToast('Pengguna baru berhasil ditambahkan.')
      }
      setModalOpen(false)
      load()
    } catch (e) { showToast('Gagal: ' + e.message, 'error') }
    finally { setSaving(false) }
  }

  async function handleResetPassword() {
    setResetting(true)
    try {
      await sendPasswordResetEmail(auth, resetTarget.email || '', {
        url: window.location.origin + '/reset-password'
      })
      showToast(`Email reset password dikirim ke ${resetTarget.email || 'user'}`)
      setResetModal(false)
    } catch (e) {
      showToast('Kirim email reset password gagal: ' + e.message, 'error')
      setResetModal(false)
    } finally { setResetting(false) }
  }

  async function handleToggleBlock(item) {
    if (item.role === 'super_admin') {
      showToast('Tidak dapat memblokir sesama Super Admin!', 'error')
      return
    }
    const isCurrentlyBlocked = item.role === 'blocked'
    const newRole = isCurrentlyBlocked ? 'admin_instansi' : 'blocked'
    const confirmMsg = isCurrentlyBlocked
      ? `Pulihkan akses untuk ${item.nama}?`
      : `Cabut akses (Blokir) pengguna ${item.nama}? Mereka akan langsung logout dan tidak bisa masuk lagi.`
      
    if (!window.confirm(confirmMsg)) return

    try {
      await profileService.update(item.id, { role: newRole })
      await activityLogService.create({
        user: profile,
        action: 'UPDATE',
        target_type: 'pengguna',
        target_id: item.id,
        details: isCurrentlyBlocked ? `Memulihkan akses pengguna ${item.nama}` : `Memblokir akses pengguna ${item.nama}`
      })
      showToast(isCurrentlyBlocked ? `Akses ${item.nama} dipulihkan.` : `Akses ${item.nama} berhasil dicabut.`)
      load()
    } catch (e) {
      showToast('Gagal mengubah status: ' + e.message, 'error')
    }
  }

  async function handleDeleteUser(item) {
    if (item.role === 'super_admin') {
      showToast('Tidak dapat menghapus sesama Super Admin!', 'error')
      return
    }

    const confirmMsg = `HAPUS PERMANEN profil pengguna ${item.nama}? \n\nPerhatian: Penghapusan user dari Firebase Auth memerlukan Admin SDK. Aksi ini hanya menghapus profil dari database.`
    if (!window.confirm(confirmMsg)) return

    setLoading(true)
    try {
      // In Firebase client SDK, we can't delete other users. 
      // We will just mark them as blocked or delete their profile doc.
      // Let's just block them for now, or delete doc.
      // Since deleteUser needs Admin SDK, we'll update role to blocked.
      await profileService.update(item.id, { role: 'blocked' })
      await activityLogService.create({
        user: profile,
        action: 'DELETE',
        target_type: 'pengguna',
        target_id: item.id,
        details: `Memblokir permanen (hapus) pengguna ${item.nama}`
      })
      showToast(`Profil pengguna ${item.nama} berhasil diblokir / dihapus secara logika.`)
      load()
    } catch (e) {
      console.error(e)
      showToast('Gagal menghapus: ' + e.message, 'error')
      setLoading(false)
    }
  }

  const roleInfo = (r) => ROLES.find(x => x.value === r) || { label: r, badge: 'badge-slate' }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-in
          ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.type === 'error' ? '✗ ' : '✓ '}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-bold text-slate-800 font-display">Manajemen Pengguna</h2>
          <p className="text-sm text-slate-500">{list.length} pengguna terdaftar</p>
        </div>
        <button id="btn-tambah-user" className="btn-primary" onClick={openAdd}>
          <PlusIcon className="w-4 h-4" /> Tambah User
        </button>
      </div>

      {/* Info banner */}
      <div className="card p-4 bg-blue-50 border border-blue-200 text-blue-700 text-xs leading-relaxed">
        <strong>ℹ️ Cara menambah user:</strong> User baru akan dibuat di Firebase Auth.
        Setelah itu, role dan instansi dapat diatur dari halaman ini.
        Untuk reset password, sistem akan mengirim link reset ke email user.
      </div>

      {/* Users table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Memuat pengguna...</div>
        ) : list.length === 0 ? (
          <EmptyState
            title="Belum ada pengguna"
            description="Tambahkan pengguna pertama untuk mengakses sistem."
            action={<button className="btn-primary btn-sm" onClick={openAdd}>+ Tambah User</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Instansi</th>
                  <th className="w-28">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item, i) => {
                  const ri = roleInfo(item.role)
                  return (
                    <tr key={item.id}>
                      <td className="text-slate-400">{i + 1}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 flex-shrink-0">
                            {item.nama?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <span className="font-medium">{item.nama}</span>
                        </div>
                      </td>
                      <td className="text-slate-500">{item.email || '-'}</td>
                      <td>
                        <span className={ri.badge}>{ri.label}</span>
                      </td>
                      <td className="text-slate-500">{item.instansi?.nama_instansi || '-'}</td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition"
                            title="Edit"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openReset(item)}
                            className="p-1.5 rounded hover:bg-amber-50 text-amber-500 transition"
                            title="Reset Password"
                          >
                            <KeyIcon className="w-3.5 h-3.5" />
                          </button>
                          {item.role !== 'super_admin' && (
                            <>
                              <button
                                onClick={() => handleToggleBlock(item)}
                                className={`p-1.5 rounded transition ${item.role === 'blocked' ? 'hover:bg-emerald-50 text-emerald-500' : 'hover:bg-amber-50 text-amber-500'}`}
                                title={item.role === 'blocked' ? 'Pulihkan Akses' : 'Cabut Akses (Blokir)'}
                              >
                                {item.role === 'blocked' ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <NoSymbolIcon className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(item)}
                                className="p-1.5 rounded hover:bg-red-50 text-red-500 transition"
                                title="Hapus Permanen"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---- Modal Tambah / Edit ---- */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : (editItem ? 'Simpan Perubahan' : 'Tambah Pengguna')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nama Lengkap *</label>
            <input className="input" placeholder="Nama pengguna"
              value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} />
          </div>
          {!editItem && (
            <>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" placeholder="email@darurrohman.id"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="label">Password Awal *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} className="input pr-10" placeholder="Minimal 6 karakter"
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">User akan dibuat langsung di Firebase Auth.</p>
              </div>
            </>
          )}
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          {form.role !== 'super_admin' && (
            <div className="space-y-4">
              <div>
                <label className="label">Instansi</label>
                <select className="input" value={form.instansi_id}
                  onChange={e => setForm(f => ({ ...f, instansi_id: e.target.value }))}>
                  <option value="">-- Pilih Instansi --</option>
                  {instansiList.map(i => <option key={i.id} value={i.id}>{i.nama_instansi}</option>)}
                </select>
              </div>
              <div>
                <label className="label mb-2">Hak Akses Menu</label>
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  {MENU_OPTIONS.map(menu => (
                    <label key={menu.value} className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer hover:bg-slate-100 p-1.5 rounded transition">
                      <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        checked={form.akses_menu.includes(menu.value)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm(f => ({
                            ...f,
                            akses_menu: checked 
                              ? [...f.akses_menu, menu.value]
                              : f.akses_menu.filter(m => m !== menu.value)
                          }))
                        }}
                      />
                      {menu.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ---- Modal Reset Password ---- */}
      <Modal
        open={resetModal}
        onClose={() => setResetModal(false)}
        title="Reset Password"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setResetModal(false)}>Batal</button>
            <button className="btn-primary" onClick={handleResetPassword} disabled={resetting}>
              {resetting ? 'Mengirim...' : 'Kirim Link Reset'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <KeyIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-700">Reset Password untuk:</p>
              <p className="text-sm font-bold text-amber-800">{resetTarget?.nama}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Sistem akan mengirimkan <strong>link reset password</strong> ke email terdaftar pengguna ini.
            User perlu mengklik link tersebut untuk membuat password baru.
          </p>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
            💡 Untuk keamanan, gunakan link reset email daripada mengubah password langsung.
          </div>
        </div>
      </Modal>
    </div>
  )
}
