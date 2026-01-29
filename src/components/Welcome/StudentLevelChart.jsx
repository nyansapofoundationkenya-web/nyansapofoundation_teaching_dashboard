"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"

export default function StudentLevelsChart({ organizationId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/literacy/student-levels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organization_id: organizationId }),
        })

        const result = await response.json()

        if (!result.success) {
          setError(result.message || result.error)
          return
        }

        // Transform data for the chart
        // Levels in order from bottom to top (Story at top)
        const levels = ["beginner", "letter", "word", "paragraph", "story"]
        const transformed = levels.reverse().map((level) => ({
          level: level.charAt(0).toUpperCase() + level.slice(1),
          baseline: result.data.baseline[level] || 0,
          current: result.data.endline[level] || 0,
        }))

        setChartData(transformed)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [organizationId])

  // Custom tooltip
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

  if (loading) {
    return (
      <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-6 text-primary-2">
          STUDENT LEVEL DISTRIBUTION
        </h2>
        <div className="h-80 flex items-center justify-center">
          <div className="text-gray-400">Loading chart data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-6 text-primary-2">
          STUDENT LEVEL DISTRIBUTION
        </h2>
        <div className="h-80 flex items-center justify-center">
          <div className="text-red-400">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700">
      <h2 className="text-xl font-semibold mb-6 text-primary-2">
        STUDENT LEVEL DISTRIBUTION
      </h2>

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
            width={80}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(55, 65, 81, 0.3)" }} />
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
    </div>
  )
}