"use client"

export default function StatsCard({ icon, label, value, iconColor = "text-primary-2", valueColor = "text-foreground" }) {
  return (
    <div className="bg-background-light rounded-xl shadow-md p-3 flex items-center gap-3 min-w-0 w-full border border-gray-600">
      <div className={`text-xl flex-shrink-0 ${iconColor}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-gray-400 truncate">{label}</div>
        <div className={`text-lg font-semibold ${valueColor} truncate`}>{value}</div>
      </div>
    </div>
  )
}