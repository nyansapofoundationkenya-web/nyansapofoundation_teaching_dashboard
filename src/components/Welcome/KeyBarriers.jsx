"use client"

import { useEffect } from "react"

export default function KeyBarriers({
  organizationId,
  loading,
  error,
  barriersData,
  assessmentType,
  onAssessmentTypeChange,
  onFetchData,
}) {
  useEffect(() => {
    onFetchData(assessmentType)
  }, [organizationId, assessmentType])

  // Create empty data structure for when no data exists
  const getEmptyTopItems = () => {
    return assessmentType === "Literacy" 
      ? [{ value: "?" }, { value: "?" }, { value: "?" }]
      : [{ value: "?" }, { value: "?" }, { value: "?" }]
  }

  // Extract data with fallbacks
  const topItems = barriersData?.top_3_missed?.map((i) => ({ 
    value: assessmentType === "Literacy" ? i.letter : i.number 
  })) || getEmptyTopItems()

  const accuracy = barriersData?.stats?.success_rate || 0
  const missedCount = barriersData?.stats?.total_missed || 0

  const radius = 70
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (accuracy / 100) * circumference

  // Determine if we have real data
  const hasRealData = barriersData?.top_3_missed?.length > 0 && barriersData?.stats?.success_rate !== undefined

  // --- UI States ---
  if (loading) {
    return (
      <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700 flex flex-col gap-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 bg-gray-700 rounded animate-pulse"></div>
          <div className="h-8 w-28 bg-gray-700 rounded animate-pulse"></div>
        </div>

        {/* Content Skeleton */}
        <div className="flex flex-col gap-6">
          <div className="border border-gray-600 rounded-xl p-6">
            <div className="h-4 w-32 bg-gray-700 rounded animate-pulse mx-auto mb-4"></div>
            <div className="flex justify-center gap-4 mb-4">
              <div className="h-12 w-12 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-12 w-12 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-12 w-12 bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
          
          <div className="border border-gray-600 rounded-xl p-6">
            <div className="h-4 w-24 bg-gray-700 rounded animate-pulse mx-auto mb-4"></div>
            <div className="w-40 h-40 bg-gray-700 rounded-full animate-pulse mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  // --- Render with empty states (no error message) ---
  return (
    <div className="bg-background-lighter rounded-2xl p-6 md:p-8 border border-gray-700 flex flex-col gap-8">
      {/* Header + Dropdown */}
      <div className="flex items-center justify-between">
        <h3 className="text-secondary-1 text-base font-semibold tracking-wider uppercase">
          Key Barriers
        </h3>

        <select
          value={assessmentType}
          onChange={(e) => onAssessmentTypeChange(e.target.value)}
          className="bg-background-lighter border border-gray-700 text-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-3"
        >
          <option value="Literacy">Literacy</option>
          <option value="Numeracy">Numeracy</option>
        </select>
      </div>

      {/* CONTENT (2 rows, 1 column) - No error overlay */}
      <div className="flex flex-col gap-6">
        {/* ROW 1 — Missed Letters/Numbers */}
        <div className="border border-gray-600 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <h4 className="text-secondary-1 uppercase font-semibold tracking-wide mb-4 text-sm">
            Most Missed {assessmentType === "Literacy" ? "Letters" : "Numbers"}
          </h4>

          <div className="flex items-center justify-center flex-wrap gap-4 mb-4">
            {topItems.map((item, index) => (
              <div key={index} className="flex items-center">
                <span
                  className={`font-bold leading-none ${
                    !hasRealData || item.value === "?" 
                      ? "text-gray-600" 
                      : "text-secondary-1"
                  }`}
                  style={{
                    fontSize: "clamp(2rem, 6vmin, 3rem)",
                  }}
                >
                  {item.value?.toString().toUpperCase() || item.value}
                </span>
                {index < topItems.length - 1 && (
                  <span
                    className={`font-bold leading-none mx-2 ${
                      !hasRealData || item.value === "?" 
                        ? "text-gray-600" 
                        : "text-secondary-1"
                    }`}
                    style={{
                      fontSize: "clamp(2rem, 6vmin, 3rem)",
                    }}
                  >
                    ,
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Show missed count only if we have real data */}
          {hasRealData && missedCount > 0 && (
            <p className="text-gray-300 text-sm md:text-base">
              {missedCount} Total Missed
            </p>
          )}
        </div>

        {/* ROW 2 — Accuracy */}
        <div className="border border-gray-600 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <h4 className="text-secondary-1 uppercase font-semibold tracking-wide mb-4 text-sm">
            Accuracy
          </h4>

          <div className="relative w-40 h-40">
            <svg width="160" height="160" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#374151"
                strokeWidth="16"
                fill="none"
              />
              
              {/* Progress circle - if no data, show 0% progress */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={hasRealData ? "#4caf50" : "#4b5563"}
                strokeWidth="16"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={hasRealData ? offset : circumference}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                opacity={hasRealData ? 1 : 0.3}
              />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-3xl font-bold ${
                  hasRealData ? "text-foreground" : "text-gray-600"
                }`}>
                  {hasRealData ? Math.round(accuracy) : "—"}%
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {hasRealData ? "Success Rate" : "No data"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}