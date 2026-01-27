// components/Welcome/MetricCard.jsx
"use client"

import { ArrowRightIcon } from "@heroicons/react/24/outline"

export default function MetricCard({ 
  title, 
  icon: Icon, 
  iconColor, 
  bgColor, 
  borderColor,
  metrics,
  onClick 
}) {
  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-xl border ${borderColor} ${bgColor} hover:shadow-md transition-all cursor-pointer group`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${bgColor.replace('50', '100').replace('900/20', '800/30')}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-transform" />
      </div>
      
      <div className="space-y-2">
        {metrics.map((metric, index) => (
          <div key={index} className="flex justify-between items-center text-xs">
            <span className="text-gray-600 dark:text-gray-400">{metric.label}</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{metric.value}</span>
              {metric.change && (
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  metric.change.includes('+') || metric.change.includes('Declining')
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : metric.change.includes('-')
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {metric.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <span className="text-xs text-primary-2 group-hover:text-primary-1 transition-colors">
          Click to view detailed metrics →
        </span>
      </div>
    </div>
  )
}