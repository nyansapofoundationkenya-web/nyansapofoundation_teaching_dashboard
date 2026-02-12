"use client"

import { useEffect, useState } from "react"

export default function ProgramImpact({ organizationId, loading, error, impactData, onFetchData }) {
  useEffect(() => {
    onFetchData()
  }, [organizationId, onFetchData])

  if (loading) {
    return (
      <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700 h-full flex items-center justify-center">
        <div className="text-gray-400">Loading impact data...</div>
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

  // Calculate metrics
  const studentsImproved = impactData?.students_improved || 0
  const improvementPercentage = impactData?.improvement_percentage || 0
  const studentsAssessed = impactData?.students_assessed || 0
  const totalStudents = impactData?.total_students || 0

  // Determine pace status
  const getPaceStatus = () => {
    if (improvementPercentage >= 70) return { text: "On Track", color: "text-secondary-2" }
    if (improvementPercentage >= 50) return { text: "Moderate", color: "text-primary-3" }
    return { text: "Needs Focus", color: "text-secondary-1" }
  }

  const paceStatus = getPaceStatus()

  return (
    <div className="bg-background-lighter rounded-2xl p-8 border border-gray-700 h-full flex flex-col">
      {/* Header */}
      <h3 className="text-primary-2 text-lg font-semibold tracking-wide mb-8 uppercase">
        Program Impact
      </h3>

      {/* Metrics */}
      <div className="flex-1 space-y-6">
        {/* Level Ups */}
        <div className="flex items-center justify-between py-4 border-b border-gray-600">
          <div className="text-gray-300 text-base">Level Ups</div>
          <div className="text-primary-2 text-2xl font-bold">
            +{studentsImproved} Students
          </div>
        </div>

        {/* Intervention Success */}
        <div className="flex items-center justify-between py-4 border-b border-gray-600">
          <div className="text-gray-300 text-base">Intervention Success</div>
          <div className="text-primary-2 text-2xl font-bold">
            {improvementPercentage.toFixed(0)}%
          </div>
        </div>

        {/* Pace */}
        <div className="flex items-center justify-between py-4">
          <div className="text-gray-300 text-base">Pace</div>
          <div className={`text-2xl font-bold ${paceStatus.color}`}>
            {paceStatus.text}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 pt-6 border-t border-gray-600">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-background rounded-lg p-3">
            <div className="text-xl font-bold text-foreground">
              {studentsAssessed.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">Assessed</div>
          </div>
          <div className="bg-background rounded-lg p-3">
            <div className="text-xl font-bold text-foreground">
              {totalStudents.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">Total</div>
          </div>
        </div>
      </div>
    </div>
  )
}