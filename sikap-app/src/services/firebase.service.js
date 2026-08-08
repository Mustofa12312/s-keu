import { collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp, writeBatch, getAggregateFromServer, sum } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Helper to extract id from doc
const mapDoc = (docSnap) => ({ id: docSnap.id, ...docSnap.data() });

// ---- KATEGORI TRANSAKSI ----
export const kategoriService = {
  async getAll() {
    const q = query(collection(db, 'kategori_transaksi'), orderBy('nama_kategori'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDoc);
  },
  async getByJenis(jenis) {
    const q = query(collection(db, 'kategori_transaksi'), where('jenis', '==', jenis), orderBy('nama_kategori'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDoc);
  },
  async create(payload) {
    const docRef = await addDoc(collection(db, 'kategori_transaksi'), { ...payload, created_at: serverTimestamp() });
    const snapshot = await getDoc(docRef);
    return mapDoc(snapshot);
  },
  async update(id, payload) {
    const docRef = doc(db, 'kategori_transaksi', id);
    await updateDoc(docRef, payload);
    const snapshot = await getDoc(docRef);
    return mapDoc(snapshot);
  },
  async delete(id) {
    await deleteDoc(doc(db, 'kategori_transaksi', id));
  }
}

// ---- ACTIVITY LOGS ----
export const activityLogService = {
  async getAll({ limitCount = 200 } = {}) {
    const q = query(collection(db, 'activity_logs'), orderBy('created_at', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDoc);
  },
  async create({ user, action, target_type, target_id, details }) {
    if (!user) return;
    try {
      await addDoc(collection(db, 'activity_logs'), {
        user_id: user.uid,
        user_name: user.nama || user.email || 'Unknown',
        action,           // e.g., 'CREATE', 'UPDATE', 'DELETE', 'RESTORE'
        target_type,      // e.g., 'transaksi'
        target_id,
        details,          // text description
        created_at: serverTimestamp()
      });
    } catch (e) {
      console.error('Failed to write activity log:', e);
    }
  }
}

// ---- INSTANSI ----
export const instansiService = {
  async getAll() {
    const q = query(collection(db, 'instansi'), orderBy('nama_instansi'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDoc);
  },
  async getById(id) {
    const docRef = doc(db, 'instansi', id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) throw new Error("Instansi not found");
    return mapDoc(snapshot);
  },
  async create(payload) {
    const docRef = await addDoc(collection(db, 'instansi'), { ...payload, created_at: serverTimestamp() });
    const snapshot = await getDoc(docRef);
    return mapDoc(snapshot);
  },
  async update(id, payload) {
    const docRef = doc(db, 'instansi', id);
    await updateDoc(docRef, payload);
    const snapshot = await getDoc(docRef);
    return mapDoc(snapshot);
  },
  async toggle(id, aktif) {
    const docRef = doc(db, 'instansi', id);
    await updateDoc(docRef, { aktif });
    const snapshot = await getDoc(docRef);
    return mapDoc(snapshot);
  },
}

// ---- TRANSAKSI ----
export const transaksiService = {
  async getAll({ instansiId, bulanHijriyah, tahunHijriyah, search, tglMulai, tglAkhir, includeDeleted = false, limitCount = 10000, orderDesc = false }) {
    let constraints = [];
    if (instansiId) constraints.push(where('instansi_id', '==', instansiId));
    if (bulanHijriyah) constraints.push(where('bulan_hijriyah', '==', bulanHijriyah));
    if (tahunHijriyah) constraints.push(where('tahun_hijriyah', '==', tahunHijriyah));
    
    constraints.push(limit(limitCount));

    const q = query(collection(db, 'transaksi'), ...constraints);
    const snapshot = await getDocs(q);
    
    let data = snapshot.docs.map(mapDoc);

    // Filter soft deletes if not explicitly requested
    if (!includeDeleted) {
      data = data.filter(t => !t.deleted_at);
    } else {
      data = data.filter(t => t.deleted_at); // If includeDeleted is true, we only want the trash
    }

    // Filter range in JS to avoid composite index requirement
    if (tglMulai) {
      data = data.filter(t => t.tanggal && t.tanggal >= tglMulai);
    }
    if (tglAkhir) {
      data = data.filter(t => t.tanggal && t.tanggal <= tglAkhir);
    }

    // Sort in JS to avoid composite index requirement
    data.sort((a, b) => {
      const dateA = a.tanggal || '';
      const dateB = b.tanggal || '';
      if (dateA < dateB) return orderDesc ? 1 : -1;
      if (dateA > dateB) return orderDesc ? -1 : 1;
      // if same date, sort by created_at
      const ca = a.created_at ? a.created_at.toMillis() : 0;
      const cb = b.created_at ? b.created_at.toMillis() : 0;
      return orderDesc ? cb - ca : ca - cb;
    });

    // Fetch instansi to populate (since Firestore doesn't have joins)
    if (data.length > 0) {
      const instansiSnap = await getDocs(collection(db, 'instansi'));
      const instansiMap = {};
      instansiSnap.forEach(d => { instansiMap[d.id] = mapDoc(d); });
      data = data.map(t => ({ ...t, instansi: instansiMap[t.instansi_id] }));
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      data = data.filter(t => (t.uraian || '').toLowerCase().includes(lowerSearch));
    }

    return data;
  },

  async create(payload) {
    const docRef = await addDoc(collection(db, 'transaksi'), { 
      ...payload, 
      created_at: serverTimestamp(),
      updated_at: serverTimestamp() 
    });
    const snapshot = await getDoc(docRef);
    return mapDoc(snapshot);
  },

  async createBatch(payloads) {
    const batch = writeBatch(db);
    payloads.forEach(payload => {
      const docRef = doc(collection(db, 'transaksi'));
      batch.set(docRef, {
        ...payload,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    });
    await batch.commit();
  },

  async update(id, payload) {
    const docRef = doc(db, 'transaksi', id);
    await updateDoc(docRef, { ...payload, updated_at: serverTimestamp() });
    const snapshot = await getDoc(docRef);
    return mapDoc(snapshot);
  },

  async getById(id) {
    const docRef = doc(db, 'transaksi', id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return mapDoc(snapshot);
  },

  async delete(id, user = null) {
    // Soft Delete
    const docRef = doc(db, 'transaksi', id);
    await updateDoc(docRef, { 
      deleted_at: serverTimestamp(),
      deleted_by: user ? user.uid : null 
    });
  },

  async restore(id, user = null) {
    // Restore Soft Delete
    const docRef = doc(db, 'transaksi', id);
    await updateDoc(docRef, { 
      deleted_at: null,
      deleted_by: null,
      updated_at: serverTimestamp()
    });
  },

  async hardDelete(id) {
    await deleteDoc(doc(db, 'transaksi', id));
  },

  async getSummary(instansiId, tahunHijriyah) {
    let constraints = [];
    if (instansiId) constraints.push(where('instansi_id', '==', instansiId));
    if (tahunHijriyah) constraints.push(where('tahun_hijriyah', '==', tahunHijriyah));
    
    const q = query(collection(db, 'transaksi'), ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(d => {
      const data = d.data();
      // Only include non-deleted in summary
      if (data.deleted_at) return null;
      return { 
        jenis: data.jenis, 
        nominal: data.nominal, 
        bulan_hijriyah: data.bulan_hijriyah,
        kategori_id: data.kategori_id,
        kategori_nama: data.kategori_nama
      };
    }).filter(Boolean);
  },

  async getAggregatedMonthlyData(instansiId, tahun) {
    const bulanKeys = [
      'muharram', 'shafar', 'rabiul_awal', 'rabiul_tsani',
      'jumadil_ula', 'jumadil_tsani', 'rajab', 'sya\'ban',
      'ramadhan', 'syawal', 'dzulqa\'dah', 'dzulhijjah'
    ];
    
    const promises = [];
    
    for (const bulan of bulanKeys) {
      let qMasukConstraints = [where('tahun_hijriyah', '==', tahun), where('bulan_hijriyah', '==', bulan), where('jenis', '==', 'masuk')];
      let qKeluarConstraints = [where('tahun_hijriyah', '==', tahun), where('bulan_hijriyah', '==', bulan), where('jenis', '==', 'keluar')];
      
      if (instansiId) {
        qMasukConstraints.push(where('instansi_id', '==', instansiId));
        qKeluarConstraints.push(where('instansi_id', '==', instansiId));
      }
      
      const qMasuk = query(collection(db, 'transaksi'), ...qMasukConstraints);
      promises.push(getAggregateFromServer(qMasuk, { total: sum('nominal') }));
      
      const qKeluar = query(collection(db, 'transaksi'), ...qKeluarConstraints);
      promises.push(getAggregateFromServer(qKeluar, { total: sum('nominal') }));
    }
    
    const results = await Promise.all(promises);
    const monthlyData = {};
    
    for (let i = 0; i < bulanKeys.length; i++) {
      const bulan = bulanKeys[i];
      const resMasuk = results[i * 2];
      const resKeluar = results[i * 2 + 1];
      
      const totalMasuk = resMasuk.data().total || 0;
      const totalKeluar = resKeluar.data().total || 0;
      
      monthlyData[bulan] = {
        masuk: totalMasuk,
        keluar: totalKeluar,
        saldo: totalMasuk - totalKeluar
      };
    }
    
    return monthlyData;
  }
}

// ---- HUTANG PIUTANG ----
export const hutangService = {
  async getAll({ instansiId, jenis, status, search, bulanHijriyah, tahunHijriyah, orderDesc = false }) {
    let constraints = [];
    if (instansiId) constraints.push(where('instansi_id', '==', instansiId));
    if (jenis) constraints.push(where('jenis', '==', jenis));
    if (status) constraints.push(where('status', '==', status));
    if (bulanHijriyah) constraints.push(where('bulan_hijriyah', '==', bulanHijriyah));
    if (tahunHijriyah) constraints.push(where('tahun_hijriyah', '==', tahunHijriyah));
    
    constraints.push(limit(10000));

    const q = query(collection(db, 'hutang_piutang'), ...constraints);
    const snapshot = await getDocs(q);
    let data = snapshot.docs.map(mapDoc);

    // Sort in JS
    data.sort((a, b) => {
      const dateA = a.tanggal || '';
      const dateB = b.tanggal || '';
      if (dateA < dateB) return orderDesc ? 1 : -1;
      if (dateA > dateB) return orderDesc ? -1 : 1;
      const ca = a.created_at ? a.created_at.toMillis() : 0;
      const cb = b.created_at ? b.created_at.toMillis() : 0;
      return orderDesc ? cb - ca : ca - cb;
    });

    // Populate instansi
    if (data.length > 0) {
      const instansiSnap = await getDocs(collection(db, 'instansi'));
      const instansiMap = {};
      instansiSnap.forEach(d => { instansiMap[d.id] = mapDoc(d); });
      data = data.map(t => ({ ...t, instansi: instansiMap[t.instansi_id] }));
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      data = data.filter(t => 
        (t.uraian || '').toLowerCase().includes(lowerSearch) || 
        (t.nama_pihak || '').toLowerCase().includes(lowerSearch)
      );
    }
    return data;
  },

  async getById(id) {
    const docRef = doc(db, 'hutang_piutang', id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) throw new Error("Data not found");
    return mapDoc(snapshot);
  },

  async create(payload) {
    const docRef = await addDoc(collection(db, 'hutang_piutang'), { 
      ...payload, 
      created_at: serverTimestamp(),
      updated_at: serverTimestamp() 
    });
    const snapshot = await getDoc(docRef);
    return mapDoc(snapshot);
  },

  async update(id, payload) {
    const docRef = doc(db, 'hutang_piutang', id);
    await updateDoc(docRef, { ...payload, updated_at: serverTimestamp() });
    const snapshot = await getDoc(docRef);
    return mapDoc(snapshot);
  },

  async delete(id) {
    // Delete payments first (if any)
    const pSnap = await getDocs(query(collection(db, 'pembayaran_hutang'), where('hutang_piutang_id', '==', id)));
    const batch = writeBatch(db);
    pSnap.docs.forEach(d => batch.delete(d.ref));
    batch.delete(doc(db, 'hutang_piutang', id));
    await batch.commit();
  },

  // ---- PEMBAYARAN ----
  async getPembayaran(hutangPiutangId) {
    const q = query(collection(db, 'pembayaran_hutang'), where('hutang_piutang_id', '==', hutangPiutangId));
    const snapshot = await getDocs(q);
    let data = snapshot.docs.map(mapDoc);
    data.sort((a, b) => {
      const dateA = a.tanggal || '';
      const dateB = b.tanggal || '';
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      return 0;
    });
    return data;
  },

  async getAllPembayaran() {
    const q = query(collection(db, 'pembayaran_hutang'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDoc);
  },

  async createPembayaran(hutangPiutangId, payload) {
    const docRef = await addDoc(collection(db, 'pembayaran_hutang'), { 
      ...payload, 
      hutang_piutang_id: hutangPiutangId,
      created_at: serverTimestamp() 
    });
    const snapshot = await getDoc(docRef);
    return mapDoc(snapshot);
  },

  async deletePembayaran(pembayaranId) {
    await deleteDoc(doc(db, 'pembayaran_hutang', pembayaranId));
  }
}

// ---- PROFILES ----
export const profileService = {
  async getAll() {
    const q = query(collection(db, 'profiles'), orderBy('nama'));
    const snapshot = await getDocs(q);
    let data = snapshot.docs.map(mapDoc);
    
    if (data.length > 0) {
      const instansiSnap = await getDocs(collection(db, 'instansi'));
      const instansiMap = {};
      instansiSnap.forEach(d => { instansiMap[d.id] = mapDoc(d); });
      data = data.map(p => ({ ...p, instansi: instansiMap[p.instansi_id] }));
    }
    return data;
  },
  async create(authUser, payload) {
    const docRef = doc(db, 'profiles', authUser.uid);
    await setDoc(docRef, { ...payload, email: authUser.email, created_at: serverTimestamp() });
    const snapshot = await getDoc(docRef);
    return mapDoc(snapshot);
  },
  async update(id, payload) {
    const docRef = doc(db, 'profiles', id);
    await updateDoc(docRef, payload);
    const snapshot = await getDoc(docRef);
    return mapDoc(snapshot);
  },
}

// ---- PENGATURAN ----
export const pengaturanService = {
  async getSettings() {
    const docRef = doc(db, 'pengaturan', 'general');
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return {};
    return mapDoc(snapshot);
  },
  async updateSettings(payload) {
    const docRef = doc(db, 'pengaturan', 'general');
    await setDoc(docRef, { ...payload, updated_at: serverTimestamp() }, { merge: true });
    const snapshot = await getDoc(docRef);
    return mapDoc(snapshot);
  }
}
