// components/Welcome/StudentLevelChart.jsx
"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import DownloadLevelModal from "./DownloadLevelModal"

export default function StudentLevelsChart({
  levelType,
  setLevelType,
  chartData,
  loading,
  error,
  onRefresh,  // Kept for future use
  onDownload, // Keep for backward compatibility
  downloadLoading,
  isSuperAdmin,
  organizationId,
  projectId,
  schoolId
}) {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)

  // Create empty data structure for all possible levels
  const getAllLevels = () => {
    const levels = ['Beginning', 'Developing', 'Expanding', 'Proficient', 'Exemplary']
    return levels.map(level => ({
      level,
      baseline: 0,
      current: 0
    }))
  }

  // Use actual data if available, otherwise use empty data
  const displayData = chartData && chartData.length > 0 ? chartData : getAllLevels()

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background-lighter border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold mb-2">{payload[0].payload.level}</p>
          <p className="text-xs text-gray-400">
            Baseline: <span className="text-white font-medium">{payload[0].value}</span>
          </p>
          <p className="text-xs text-gray-400">
            Current: <span className="text-white font-medium">{payload[1].value}</span>
          </p>
        </div>
      )
    }
    return null
  }

  const handleDownloadClick = () => {
    if (organizationId) {
      setIsDownloadModalOpen(true)
    } else {
      if (onDownload) onDownload()
    }
  }

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h2 className="text-xl font-semibold text-primary-2">
        STUDENT LEVEL DISTRIBUTION
      </h2>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleDownloadClick}
          disabled={downloadLoading || loading || !chartData || chartData.length === 0}
          className={`
            px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors
            ${downloadLoading || loading || !chartData || chartData.length === 0
              ? "bg-gray-700 text-gray-400 cursor-not-allowed opacity-50"
              : "bg-green-600 hover:bg-green-700 text-white"
            }
          `}
          title={!chartData || chartData.length === 0 ? "No data to export" : "Export students"}
        >
          {downloadLoading ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Downloading...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export Students
            </>
          )}
        </button>

        <select
          value={levelType}
          onChange={(e) => setLevelType(e.target.value)}
          disabled={loading}
          className="bg-gray-800 border border-gray-600 text-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-2/50"
        >
          <option value="literacy">Literacy</option>
          <option value="numeracy">Numeracy</option>
        </select>
      </div>
    </div>
  )

  // Show loading state
  if (loading && !chartData) {
    return (
      <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700">
        {renderHeader()}
        <div className="h-80 flex items-center justify-center text-gray-400">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-primary-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>Loading chart data...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show empty chart with zero bars (even on error or no data)
  return (
    <>
      <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700">
        {renderHeader()}
        
        <div className="relative">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={displayData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" domain={[0, 'dataMax']} />
              <YAxis
                type="category"
                dataKey="level"
                stroke="#9CA3AF"
                width={140}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(55,65,81,0.3)" }} />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="rect"
                formatter={(value) => (
                  <span className="text-sm text-gray-300">
                    {value === "baseline" ? "Baseline" : "Current"}
                  </span>
                )}
              />
              <Bar 
                dataKey="baseline" 
                fill="#6B7280" 
                radius={[0, 4, 4, 0]} 
                opacity={chartData && chartData.length > 0 ? 1 : 0.3}
              />
              <Bar 
                dataKey="current" 
                fill="#60A5FA" 
                radius={[0, 4, 4, 0]} 
                opacity={chartData && chartData.length > 0 ? 1 : 0.3}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Overlay message when there's an error or no data */}
          {(error || !chartData || chartData.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-background-lighter/90 rounded-lg p-4 text-center max-w-md">
                {error ? (
                  <>
                    <p className="text-yellow-400 font-medium mb-1">Unable to load data</p>
                    <p className="text-sm text-gray-400">
                      {error.includes("Failed to fetch") 
                        ? "Connection issue. Showing empty chart."
                        : "Showing empty chart template."}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400 font-medium mb-1">No student data available</p>
                    <p className="text-sm text-gray-500">
                      Add students or assessments to see distribution
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Optional: Add a subtle hint at the bottom */}
        {(!chartData || chartData.length === 0) && !error && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Chart shows empty template. Data will appear here when available.
            </p>
          </div>
        )}
      </div>

      {/* Download Level Modal - Only show if we have organizationId */}
      {organizationId && chartData && chartData.length > 0 && (
        <DownloadLevelModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
          chartData={chartData}
          levelType={levelType}
          organizationId={organizationId}
          projectId={projectId}
          schoolId={schoolId}
        />
      )}
    </>
  )
}