"use client"

export default function StatsCard({ icon, label, value, iconColor = "text-gray-700", valueColor = "text-black" }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 min-w-0 w-full">
      <div className={`text-2xl flex-shrink-0 ${iconColor}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-gray-500 truncate">{label}</div>
        <div className={`text-xl font-semibold ${valueColor} truncate`}>{value}</div>
      </div>
    </div>
  )
}
