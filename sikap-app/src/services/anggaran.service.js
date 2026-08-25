import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';

const mapDoc = (docSnap) => ({ id: docSnap.id, ...docSnap.data() });

export const anggaranService = {
  // ==========================
  // RENCANA ANGGARAN (RAPBM)
  // ==========================
  async getRencana({ instansiId, tahunPelajaran, kategori }) {
    let constraints = [];
    if (instansiId) constraints.push(where('instansi_id', '==', instansiId));
    if (tahunPelajaran) constraints.push(where('tahun_pelajaran', '==', tahunPelajaran));
    if (kategori) constraints.push(where('kategori', '==', kategori));
    
    const q = query(collection(db, 'anggaran'), ...constraints);
    const snapshot = await getDocs(q);
    let data = snapshot.docs.map(mapDoc);

    data.sort((a, b) => {
      if ((a.kode || '') < (b.kode || '')) return -1;
      if ((a.kode || '') > (b.kode || '')) return 1;
      return 0;
    });

    return data;
  },

  async getRencanaById(id) {
    const docRef = doc(db, 'anggaran', id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) throw new Error("Anggaran not found");
    return mapDoc(snapshot);
  },

  async createRencana(payload) {
    const docRef = await addDoc(collection(db, 'anggaran'), {
      ...payload,
      created_at: serverTimestamp()
    });
    const snapshot = await getDoc(docRef);
    return mapDoc(snapshot);
  },

  async updateRencana(id, payload) {
    const docRef = doc(db, 'anggaran', id);
    await updateDoc(docRef, {
      ...payload,
      updated_at: serverTimestamp()
    });
    const snapshot = await getDoc(docRef);
    return mapDoc(snapshot);
  },

  async deleteRencana(id) {
    const rSnap = await getDocs(query(collection(db, 'realisasi_anggaran'), where('anggaran_id', '==', id)));
    const batch = writeBatch(db);
    rSnap.docs.forEach(d => batch.delete(d.ref));
    batch.delete(doc(db, 'anggaran', id));
    await batch.commit();
  },

  // ==========================
  // REALISASI ANGGARAN
  // ==========================
  async getRealisasi(anggaranId, instansiId = null) {
    let constraints = [where('anggaran_id', '==', anggaranId)];
    if (instansiId) {
      constraints.push(where('instansi_id', '==', instansiId));
    }
    const q = query(collection(db, 'realisasi_anggaran'), ...constraints);
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
  
  async getAllRealisasiLaporan({ instansiId, tahunPelajaran }) {
    let constraints = [];
    if (instansiId) constraints.push(where('instansi_id', '==', instansiId));
    if (tahunPelajaran) constraints.push(where('tahun_pelajaran', '==', tahunPelajaran));
    
    const q = query(collection(db, 'realisasi_anggaran'), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDoc);
  },

  async createRealisasi(anggaranId, payload) {
    const docRef = await addDoc(collection(db, 'realisasi_anggaran'), {
      ...payload,
      anggaran_id: anggaranId,
      created_at: serverTimestamp()
    });
    const snapshot = await getDoc(docRef);
    return mapDoc(snapshot);
  },

  async deleteRealisasi(id) {
    await deleteDoc(doc(db, 'realisasi_anggaran', id));
  }
};
