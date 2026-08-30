const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

exports.onTransaksiCreated = onDocumentCreated("transaksi/{docId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log("No data associated with the event");
    return;
  }

  const data = snapshot.data();
  const tipe = data.tipe || "Pengeluaran";
  const nominal = data.nominal || 0;
  const uraian = data.uraian || "Transaksi Baru";
  const namaInstansi = (data.instansi && data.instansi.nama_instansi) ? data.instansi.nama_instansi : "L-Keu";

  // Format ke Rupiah
  const formattedNominal = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(nominal);

  // Payload Notifikasi
  const title = `Transaksi Baru: ${namaInstansi}`;
  const body = `${tipe === 'Pemasukan' ? '📈 Pemasukan' : '📉 Pengeluaran'}: ${formattedNominal} - ${uraian}`;

  try {
    // Ambil semua token FCM dari koleksi "profiles"
    const profilesSnapshot = await admin.firestore().collection("profiles").get();
    const tokens = [];

    profilesSnapshot.forEach((doc) => {
      const profileData = doc.data();
      if (profileData.fcm_token) {
        tokens.push(profileData.fcm_token);
      }
    });

    if (tokens.length === 0) {
      console.log("Tidak ada token FCM yang terdaftar, batal mengirim notifikasi.");
      return;
    }

    // Mengirim pesan multicast (ke semua HP yang token-nya ada)
    const message = {
      notification: {
        title: title,
        body: body,
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Berhasil mengirim ${response.successCount} notifikasi push.`);
    if (response.failureCount > 0) {
      console.error(`Gagal mengirim ${response.failureCount} notifikasi push.`);
    }
  } catch (error) {
    console.error("Gagal mengirim notifikasi:", error);
  }
});
