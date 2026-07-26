// ============================================================
// src/components/ui/EmptyState.jsx
// ============================================================
import { InboxIcon } from '@heroicons/react/24/outline'

export default function EmptyState({ title = 'Data kosong', description = 'Belum ada data untuk ditampilkan.', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <InboxIcon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="font-semibold text-slate-600 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
