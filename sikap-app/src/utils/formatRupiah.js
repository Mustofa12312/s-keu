// ============================================================
// src/utils/formatRupiah.js
// ============================================================
export function formatRupiah(value) {
  if (value === null || value === undefined || value === '') return '-'
  const num = Number(value)
  if (isNaN(num)) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num)
}

export function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '-'
  const num = Number(value)
  if (isNaN(num)) return '-'
  return new Intl.NumberFormat('id-ID').format(num)
}

export function parseRupiah(str) {
  if (!str) return 0
  return parseInt(String(str).replace(/[^0-9-]/g, '')) || 0
}
