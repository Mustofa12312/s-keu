// ============================================================
// src/components/ui/EmptyState.jsx
// ============================================================
import { InboxIcon } from '@heroicons/react/24/outline'

export default function EmptyState({ title = 'Data kosong', description = 'Belum ada data untuk ditampilkan.', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
