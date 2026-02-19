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
    <div
      className="rounded-2xl p-8 h-full flex flex-col shadow-xl border-0 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, var(--primary-1), var(--secondary-2) 80%)",
        color: "var(--foreground)",
        boxShadow: "0 8px 32px 0 rgba(60,60,120,0.18)"
      }}
    >
      {/* Animated Icon */}
      <div className="absolute right-6 top-6 animate-bounce drop-shadow-xl">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="20" fill="var(--accent, #f7cc1c)"/>
          <path d="M20 10 L24 28 L20 24 L16 28 Z" fill="var(--primary-2, #5aa2ce)"/>
        </svg>
      </div>

      {/* Header */}
      <h3 className="text-white text-lg font-bold tracking-wide mb-8 uppercase drop-shadow-lg">
        Program Impact
      </h3>

      {/* Metrics */}
      <div className="flex-1 space-y-6">
        {/* Level Ups */}
        <div className="flex items-center justify-between py-4 border-b border-white/30">
          <div className="text-white/90 text-base font-medium">Level Ups</div>
          <div className="text-yellow-300 text-2xl font-extrabold flex items-center gap-2">
            +{studentsImproved} Students
            <span className="inline-block bg-green-400/90 text-green-900 text-xs font-bold px-2 py-1 rounded-full ml-2 shadow-md animate-pulse">
              NEW
            </span>
          </div>
        </div>

        {/* Intervention Success */}
        <div className="flex items-center justify-between py-4 border-b border-white/30">
          <div className="text-white/90 text-base font-medium">Intervention Success</div>
          <div className="text-pink-200 text-2xl font-extrabold flex items-center gap-2">
            {improvementPercentage.toFixed(0)}%
            <span className="inline-block bg-pink-400/90 text-pink-900 text-xs font-bold px-2 py-1 rounded-full ml-2 shadow-md animate-bounce">
              {improvementPercentage >= 70 ? 'Great!' : improvementPercentage >= 50 ? 'Good' : 'Keep Going'}
            </span>
          </div>
        </div>

        {/* Pace */}
        <div className="flex items-center justify-between py-4">
          <div className="text-white/90 text-base font-medium">Pace</div>
          <div className={`text-2xl font-extrabold ${paceStatus.color} drop-shadow-md`}>
            {paceStatus.text}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 pt-6 border-t border-white/30">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-white/20 rounded-lg p-3 shadow-inner">
            <div className="text-xl font-extrabold text-white drop-shadow">
              {studentsAssessed.toLocaleString()}
            </div>
            <div className="text-xs text-white/80 mt-1">Assessed</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3 shadow-inner">
            <div className="text-xl font-extrabold text-white drop-shadow">
              {totalStudents.toLocaleString()}
            </div>
            <div className="text-xs text-white/80 mt-1">Total</div>
          </div>
        </div>
      </div>
    </div>
  )
}