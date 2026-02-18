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
        {/* Refresh button disabled for now - kept for future use */}
        {/* {isSuperAdmin && onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 min-w-[110px]
              ${loading
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-secondary-1 hover:bg-secondary-1/90 text-white"
              }
            `}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Refreshing...
              </>
            ) : (
              "Refresh Data"
            )}
          </button>
        )} */}

        <button
          onClick={handleDownloadClick}
          disabled={downloadLoading || loading || chartData.length === 0}
          className={`
            px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors
            ${downloadLoading || loading || chartData.length === 0
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
            }
          `}
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

  return (
    <>
      <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700">
        {renderHeader()}

        {loading && chartData.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-gray-400">
            Loading chart data...
          </div>
        ) : error ? (
          <div className="h-80 flex items-center justify-center text-red-400 text-center">
            <div>
              <p className="font-medium text-lg">Error loading data</p>
              <p className="text-sm mt-2">{error}</p>
              {/* Removed Try Again button since refresh is disabled */}
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-gray-400 text-center">
            <div>
              <p className="font-medium text-lg">No data available</p>
              <p className="text-sm mt-2">
                No student performance data found for this{" "}
                {schoolId ? "school" : projectId ? "project" : "organization"}
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" />
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
              <Bar dataKey="baseline" fill="#6B7280" radius={[0, 4, 4, 0]} />
              <Bar dataKey="current" fill="#60A5FA" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Download Level Modal - Only show if we have organizationId */}
      {organizationId && (
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