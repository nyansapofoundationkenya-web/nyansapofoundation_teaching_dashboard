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
} from "recharts"

export default function StudentLevelsChart({ organizationId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [chartData, setChartData] = useState([])
  const [levelType, setLevelType] = useState("literacy") // literacy | numeracy

  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) return

      setLoading(true)
      setError(null)

      try {
        // Determine API endpoint based on dropdown
        const endpoint =
          levelType === "literacy"
            ? "/api/literacy/student-levels"
            : "/api/numeracy/levels"

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organization_id: organizationId }),
        })

        const result = await response.json()

        if (!result.success) {
          setError(result.message || result.error)
          return
        }

        // Define levels depending on type
        const levels =
          levelType === "literacy"
            ? ["beginner", "letter", "word", "paragraph", "story", "above"]
            : [
                "beginner",
                "number_recognition",
                "addition",
                "subtraction",
                "multiplication",
                "division",
              ]

        // Correct keys based on API
        const baselineKey =
          levelType === "literacy" ? "baseline" : "numeracy_baseline"
        const endlineKey =
          levelType === "literacy" ? "endline" : "numeracy_endline"

        // Transform data for chart
        const transformed = levels.map((level) => ({
          level:
            level
              .split("_")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" "),
          baseline: result.data[baselineKey][level] || 0,
          current: result.data[endlineKey][level] || 0,
        }))

        setChartData(transformed.reverse()) // Show highest level at top
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [organizationId, levelType]) //Re-fetch when literacy/numeracy changes

  // Tooltip for chart
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

  // Loading UI
  if (loading) {
    return (
      <ChartContainer title="STUDENT LEVEL DISTRIBUTION" levelType={levelType} setLevelType={setLevelType}>
        <div className="h-80 flex items-center justify-center text-gray-400">
          Loading chart data...
        </div>
      </ChartContainer>
    )
  }

  // Error UI
  if (error) {
    return (
      <ChartContainer title="STUDENT LEVEL DISTRIBUTION" levelType={levelType} setLevelType={setLevelType}>
        <div className="h-80 flex items-center justify-center text-red-400">
          {error}
        </div>
      </ChartContainer>
    )
  }

  // Chart UI
  return (
    <ChartContainer title="STUDENT LEVEL DISTRIBUTION" levelType={levelType} setLevelType={setLevelType}>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis type="number" stroke="#9CA3AF" />
          <YAxis type="category" dataKey="level" stroke="#9CA3AF" width={120} />
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
    </ChartContainer>
  )
}

// Dropdown + wrapper
function ChartContainer({ children, title, levelType, setLevelType }) {
  return (
    <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-primary-2">{title}</h2>
        <Dropdown levelType={levelType} setLevelType={setLevelType} />
      </div>
      {children}
    </div>
  )
}

function Dropdown({ levelType, setLevelType }) {
  return (
    <select
      value={levelType}
      onChange={(e) => setLevelType(e.target.value)}
      className="bg-gray-800 border border-gray-600 text-gray-200 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      <option value="literacy">Literacy</option>
      <option value="numeracy">Numeracy</option>
    </select>
  )
}
