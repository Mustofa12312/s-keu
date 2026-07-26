// ============================================================
// src/utils/hijriyah.js
// Daftar bulan Hijriyah sesuai format Excel BKU
// ============================================================
export const BULAN_HIJRIYAH = [
  'SYAWAL',
  'DZULQADAH',
  'DZULHIJJAH',
  'MOHARROM',
  'SHAFAR',
  'RABIUL AWAL',
  'RABIUL TSANI',
  'JUM ULA',
  'JUM TSANI',
  'RAJAB',
  'SYABAN',
  'RAMADHAN',
]

export const BULAN_HIJRIYAH_LABEL = {
  'SYAWAL':        "Syawal",
  'DZULQADAH':     "Dzulqa'dah",
  'DZULHIJJAH':    "Dzulhijjah",
  'MOHARROM':      "Muharram",
  'SHAFAR':        "Shafar",
  'RABIUL AWAL':   "Rabiul Awal",
  'RABIUL TSANI':  "Rabiul Tsani",
  'JUM ULA':       "Jumadil Ula",
  'JUM TSANI':     "Jumadil Tsani",
  'RAJAB':         "Rajab",
  'SYABAN':        "Sya'ban",
  'RAMADHAN':      "Ramadhan",
}

export const TAHUN_HIJRIYAH_DEFAULT = '1446'

export function getBulanLabel(key) {
  return BULAN_HIJRIYAH_LABEL[key] || key
}
