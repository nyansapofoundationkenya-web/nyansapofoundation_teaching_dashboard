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

  if (loading) {
    return (
      <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700 h-full flex items-center justify-center">
        <div className="text-gray-400">Loading {assessmentType} data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700 h-full flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    )
  }

  // --- Extract data ---
  const topItems =
    assessmentType === "Literacy"
      ? barriersData?.top_3_missed?.map((i) => ({ value: i.letter }))
      : barriersData?.top_3_missed?.map((i) => ({ value: i.number }))

  const accuracy = barriersData?.stats?.success_rate || 0
  const missedCount = barriersData?.stats?.total_missed || 0

  const radius = 70
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (accuracy / 100) * circumference

  // --- Render ---
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

      {/* CONTENT (2 rows, 1 column) */}
      <div className="flex flex-col gap-6">
        {/* ROW 1 — Missed Letters/Numbers */}
        <div className="border border-gray-600 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <h4 className="text-secondary-1 uppercase font-semibold tracking-wide mb-4 text-sm">
            Most Missed {assessmentType === "Literacy" ? "Letters" : "Numbers"}
          </h4>

          <div className="flex items-center justify-center flex-wrap gap-4 mb-4">
            {topItems?.length > 0 ? (
              topItems.map((item, index) => (
                <span
                  key={index}
                  className="text-secondary-1 font-bold leading-none"
                  style={{
                    fontSize: "clamp(2rem, 6vmin, 3rem)",
                  }}
                >
                  {item.toUpperCase()}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-sm">No data available</span>
            )}
          </div>

          {/* <p className="text-gray-300 text-sm md:text-base">
            {missedCount} Total Missed
          </p> */}
        </div>

        {/* ROW 2 — Accuracy */}
        <div className="border border-gray-600 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <h4 className="text-secondary-1 uppercase font-semibold tracking-wide mb-4 text-sm">
            Accuracy
          </h4>

          <div className="relative w-40 h-40">
            <svg width="160" height="160" className="transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#374151"
                strokeWidth="16"
                fill="none"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#4caf50"
                strokeWidth="16"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
              />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">
                  {Math.round(accuracy)}%
                </div>
                <div className="text-xs text-gray-400 mt-1">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
