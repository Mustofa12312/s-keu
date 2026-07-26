// ============================================================
// src/components/ui/StatCard.jsx
// ============================================================
export default function StatCard({ icon: Icon, iconBg, iconColor, label, value, sub, trend }) {
  return (
    <div className="stat-card animate-slide-in">
      <div className={`stat-icon ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 font-medium mb-0.5">{label}</p>
        <p className="text-lg font-bold text-slate-800 font-display truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        {trend !== undefined && (
          <p className={`text-xs font-medium mt-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% dari bulan lalu
          </p>
        )}
      </div>
    </div>
  )
}
