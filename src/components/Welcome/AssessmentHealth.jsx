"use client"

import { TrendingUp } from "lucide-react"

export default function AssessmentHealth({ 
  data, 
  loading = false, 
  error = null,
  onFetchData // Optional: if you want to provide a refresh button
}) {
  // Calculate circle progress
  const getCircleProps = (completionRate) => {
    const radius = 70
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (completionRate / 100) * circumference
    return { radius, circumference, offset }
  }

  // Format number for display
  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  if (loading) {
    return (
      <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Assessment Health
          </h2>
          {onFetchData && (
            <button
              onClick={onFetchData}
              className="text-sm text-primary-2 hover:text-primary-1 transition-colors"
            >
              Refresh
            </button>
          )}
        </div>
        <div className="h-48 flex items-center justify-center">
          <div className="text-gray-400">Loading assessment data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Assessment Health
          </h2>
          {onFetchData && (
            <button
              onClick={onFetchData}
              className="text-sm text-primary-2 hover:text-primary-1 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
        <div className="h-48 flex items-center justify-center">
          <div className="text-red-400">{error}</div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-6 text-foreground">
          Assessment Health
        </h2>
        <div className="h-48 flex items-center justify-center">
          <div className="text-gray-400">No assessment data available</div>
        </div>
      </div>
    )
  }

  const literacyCircle = getCircleProps(data.literacy?.completion_rate || 0)
  const numeracyCircle = getCircleProps(data.numeracy?.completion_rate || 0)

  return (
    <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          Assessment Health
        </h2>
        {onFetchData && (
          <button
            onClick={onFetchData}
            className="text-sm text-primary-2 hover:text-primary-1 transition-colors"
          >
            Refresh
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LITERACY SECTION */}
        <div className="border border-gray-600 rounded-xl p-6">
          <h3 className="text-primary-2 text-lg font-semibold mb-6 uppercase tracking-wide">
            Literacy
          </h3>

          <div className="flex items-center gap-6">
            {/* Circular gauge */}
            <div className="relative flex-shrink-0">
              <svg width="160" height="160" className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={literacyCircle.radius}
                  stroke="#374151"
                  strokeWidth="18"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={literacyCircle.radius}
                  stroke="#4caf50"
                  strokeWidth="18"
                  fill="none"
                  strokeDasharray={literacyCircle.circumference}
                  strokeDashoffset={literacyCircle.offset}
                  strokeLinecap="round"
                  style={{
                    transition: "stroke-dashoffset 1s ease-in-out",
                  }}
                />
                {/* White indicator */}
                <circle
                  cx="80"
                  cy="80"
                  r={literacyCircle.radius}
                  stroke="white"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`0 ${literacyCircle.offset} 8 ${literacyCircle.circumference}`}
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">
                    {Math.round(data.literacy?.completion_rate || 0)}%
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {data.literacy?.total_students_completed || 0}/{data.literacy?.total_students_assigned || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-4">
              {/* Completion Rate */}
              <div>
                <div className="text-gray-400 text-xs mb-1">Completion Rate</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary-2"></div>
                  <div className="text-2xl font-bold text-foreground">
                    {Math.round(data.literacy?.completion_rate || 0)}%
                  </div>
                </div>
              </div>

              {/* Total Assessments */}
              <div>
                <div className="text-gray-400 text-xs mb-1">Total Assessments</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-foreground">
                    {formatNumber(data.literacy?.total_assessments || 0)}
                  </div>
                  <TrendingUp className="w-5 h-5 text-secondary-2" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NUMERACY SECTION */}
        <div className="border border-gray-600 rounded-xl p-6">
          <h3 className="text-primary-3 text-lg font-semibold mb-6 uppercase tracking-wide">
            Numeracy
          </h3>

          <div className="flex items-center gap-6">
            {/* Circular gauge */}
            <div className="relative flex-shrink-0">
              <svg width="160" height="160" className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={numeracyCircle.radius}
                  stroke="#374151"
                  strokeWidth="18"
                  fill="none"
                />
                {/* Progress circle - using yellow/orange for numeracy */}
                <circle
                  cx="80"
                  cy="80"
                  r={numeracyCircle.radius}
                  stroke="#f7cc1c"
                  strokeWidth="18"
                  fill="none"
                  strokeDasharray={numeracyCircle.circumference}
                  strokeDashoffset={numeracyCircle.offset}
                  strokeLinecap="round"
                  style={{
                    transition: "stroke-dashoffset 1s ease-in-out",
                  }}
                />
                {/* White indicator */}
                <circle
                  cx="80"
                  cy="80"
                  r={numeracyCircle.radius}
                  stroke="white"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`0 ${numeracyCircle.offset} 8 ${numeracyCircle.circumference}`}
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">
                    {Math.round(data.numeracy?.completion_rate || 0)}%
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {data.numeracy?.total_students_completed || 0}/{data.numeracy?.total_students_assigned || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-4">
              {/* Completion Rate */}
              <div>
                <div className="text-gray-400 text-xs mb-1">Completion Rate</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary-3"></div>
                  <div className="text-2xl font-bold text-foreground">
                    {Math.round(data.numeracy?.completion_rate || 0)}%
                  </div>
                </div>
              </div>

              {/* Total Assessments */}
              <div>
                <div className="text-gray-400 text-xs mb-1">Total Assessments</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-foreground">
                    {formatNumber(data.numeracy?.total_assessments || 0)}
                  </div>
                  <TrendingUp className="w-5 h-5 text-primary-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}