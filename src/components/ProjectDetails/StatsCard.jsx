"use client";

export default function StatsCard({ icon, label, value, iconColor = "text-gray-700", valueColor = "text-black" }) {
    // console.log(icon,label,value,iconColor,valueColor)
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 min-w-[160px]">
      <div className={`text-2xl ${iconColor}`}>{icon}</div>
      <div>
        <div className="text-sm text-gray-500 truncate">{label}</div>
        <div className={`text-xl font-semibold ${valueColor}`}>{value}</div>
      </div>
    </div>
  );
}
