"use client"

import { ChartBarIcon } from "@heroicons/react/24/outline"

export default function TeacherClassroomMetricsCard({ metrics, onClick }) {
  const { 
    loading, 
    avg_score_increase, 
    percent_improved, 
    percent_dropped, 
    total_students, 
    students_with_both, 
    mastery_distribution 
  } = metrics || {}

  // Skeleton loader
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
          <h3 className="font-semibold text-xl">Teacher & Classroom Metrics</h3>
        </div>
        <span className="text-xs text-gray-400">Click for details →</span>
      </div>

      {/* Score & Improvement */}
      <div className="mb-5 space-y-2">
        <div className="flex justify-between text-sm border-b border-gray-700 pb-1">
          <span>Average Score Increase</span>
          <span className="font-medium">{avg_score_increase ?? "—"}</span>
        </div>
        <div className="flex justify-between text-sm border-b border-gray-700 pb-1">
          <span>% Improved</span>
          <span className="font-medium">{percent_improved ?? "—"}</span>
        </div>
        <div className="flex justify-between text-sm border-b border-gray-700 pb-1">
          <span>% Dropped</span>
          <span className="font-medium">{percent_dropped ?? "—"}</span>
        </div>
        <div className="flex justify-between text-sm border-b border-gray-700 pb-1">
          <span>Total Students</span>
          <span className="font-medium">{total_students ?? "—"}</span>
        </div>
        <div className="flex justify-between text-sm pb-1">
          <span>Students with Both Assessments</span>
          <span className="font-medium">{students_with_both ?? "—"}</span>
        </div>
      </div>

      {/* Mastery Distribution */}
      <div>
        <h4 className="text-sm font-semibold text-gray-300 mb-2">Mastery Distribution</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          {/* Baseline */}
          {mastery_distribution?.baseline &&
            Object.entries(mastery_distribution.baseline).map(([level, count]) => (
              <div
                key={`baseline-${level}`}
                className="flex flex-col border border-gray-700 rounded-xl p-2 bg-background/40"
              >
                <span className="text-gray-300 capitalize">{level} (Baseline)</span>
                <span className="font-semibold text-primary-2 text-sm">{count} students</span>
              </div>
            ))}

          {/* Endline */}
          {mastery_distribution?.endline &&
            Object.entries(mastery_distribution.endline).map(([level, count]) => (
              <div
                key={`endline-${level}`}
                className="flex flex-col border border-gray-700 rounded-xl p-2 bg-background/30"
              >
                <span className="text-gray-300 capitalize">{level} (Endline)</span>
                <span className="font-semibold text-primary-2 text-sm">{count} students</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
