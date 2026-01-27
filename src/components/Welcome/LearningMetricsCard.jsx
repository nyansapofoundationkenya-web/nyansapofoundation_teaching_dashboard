"use client"

import { ChartBarIcon } from "@heroicons/react/24/outline"

export default function LearningMetricsCard({ metrics, onClick }) {
  const { loading, activities, competencies, common_confusions, total_students } = metrics || {}

  // Skeleton loader while data is loading
  if (loading) {
    return (
      <div className="p-6 rounded-2xl border border-gray-700 bg-background-lighter animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-background rounded-xl w-10 h-10" />
            <div className="h-4 w-32 bg-gray-700 rounded" />
          </div>
          <div className="h-3 w-20 bg-gray-700 rounded" />
        </div>

        <div className="space-y-3">
          <div className="h-3 w-full bg-gray-700 rounded" />
          <div className="h-3 w-3/4 bg-gray-700 rounded" />
          <div className="h-3 w-2/3 bg-gray-700 rounded" />
        </div>

        <div className="mt-5 space-y-3">
          <div className="h-3 w-full bg-gray-700 rounded" />
          <div className="h-3 w-4/5 bg-gray-700 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className="p-6 rounded-2xl border border-gray-700 bg-background-lighter hover:border-primary-2 hover:shadow-lg transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-background rounded-xl">
            <ChartBarIcon className="h-6 w-6 text-primary-2" />
          </div>
          <h3 className="font-semibold text-xl">Learning Performance</h3>
        </div>
        <span className="text-xs text-gray-400">Click for details →</span>
      </div>

      {/* Activity accuracy */}
      <div className="mb-5">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">Activity Accuracy</h4>
        {activities && Object.keys(activities).length > 0 ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries(activities).map(([key, val]) => (
              <div key={key} className="flex justify-between border-b border-gray-700 pb-1">
                <span className="capitalize text-gray-400">{key.replace("_", " ")}</span>
                <span className="font-medium text-gray-100">{val}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No activity data yet</p>
        )}
      </div>

      {/* Competency levels (counts only) */}
      <div className="mb-5">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">
          Competency Levels ({total_students ?? 0} students)
        </h4>
        {competencies && Object.keys(competencies).length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {Object.entries(competencies).map(([level, data]) => (
              <div
                key={level}
                className="flex flex-col border border-gray-700 rounded-xl p-2 bg-background/40"
              >
                <span className="text-gray-300 capitalize">{level}</span>
                <span className="font-semibold text-primary-2 text-sm">
                  {data.count} students
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No competency data yet</p>
        )}
      </div>

      {/* Common confusions — list of letters */}
      <div>
        <h4 className="text-sm font-semibold text-gray-300 mb-2">Most Missed Letters</h4>
        {common_confusions && common_confusions.length > 0 ? (
          <p className="text-gray-300 text-sm">
            {common_confusions.map((c) => c.letter).join(", ")}
          </p>
        ) : (
          <p className="text-gray-500 text-sm">No common mistakes recorded</p>
        )}
      </div>
    </div>
  )
}
