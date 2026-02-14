"use client"

import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

export default function WeeklyEngagementChart() {
  const [loading, setLoading] = useState(true)

  // Hardcoded data for now - week abbreviations: M, T, W, T, F, S, S
  const chartData = [
    { day: "M", engagement: 0 },
    { day: "T", engagement: 0 },
    { day: "W", engagement: 0 },
    { day: "T", engagement: 0},
    { day: "F", engagement: 0 },
    { day: "S", engagement: 0 },
    { day: "S", engagement: 0 },
  ]

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500)
  }, [])

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dayNames = {
        M: "Monday",
        T: payload[0].payload.day === "T" && chartData.indexOf(payload[0].payload) === 3 ? "Thursday" : "Tuesday",
        W: "Wednesday",
        F: "Friday",
        S: payload[0].payload.day === "S" && chartData.indexOf(payload[0].payload) === 5 ? "Saturday" : "Sunday",
      }

      return (
        <div className="bg-background-lighter border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold mb-1">
            {dayNames[payload[0].payload.day] || payload[0].payload.day}
          </p>
          <p className="text-xs text-gray-400">
            Engagement: <span className="text-primary-3 font-medium">{payload[0].value}%</span>
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="rounded-2xl p-6 border-0 shadow-xl bg-gradient-to-br from-[var(--primary-2)] to-[var(--secondary-1)]">
        <h2 className="text-xl font-bold mb-6 text-white drop-shadow-lg">
          WEEKLY ENGAGEMENT (%)
        </h2>
        <div className="h-80 flex items-center justify-center">
          <div className="text-white/70 animate-pulse">Loading chart data...</div>
        </div>
      </div>
    )
  }

  // Find the best day for highlight
  const maxEngagement = Math.max(...chartData.map(d => d.engagement))
  const bestDay = chartData.find(d => d.engagement === maxEngagement)

  return (
    <div className="rounded-2xl p-6 border-0 shadow-xl bg-gradient-to-br from-[var(--primary-2)] to-[var(--secondary-1)]">
      <h2 className="text-xl font-bold mb-6 text-white drop-shadow-lg">
        WEEKLY ENGAGEMENT (%)
      </h2>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#fff2" />
          <XAxis
            dataKey="day"
            stroke="#fff9"
            tick={{ fill: "#fff", fontSize: 16, fontWeight: 700 }}
            axisLine={{ stroke: "#fff7" }}
          />
          <YAxis
            stroke="#fff9"
            tick={{ fill: "#fff", fontSize: 14 }}
            axisLine={{ stroke: "#fff7" }}
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#f7cc1c", strokeWidth: 2 }} />
          <Line
            type="monotone"
            dataKey="engagement"
            stroke="#f7cc1c"
            strokeWidth={4}
            dot={{ fill: "#f7cc1c", r: 8, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 12, fill: "#f7cc1c", stroke: "#fff", strokeWidth: 3 }}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Week Summary */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-white/20 rounded-lg p-3 text-center shadow-inner">
          <div className="text-2xl font-bold text-yellow-200 animate-bounce">
            {maxEngagement}%
          </div>
          <div className="text-xs text-white/80 mt-1">Peak ({bestDay?.day})</div>
        </div>
        <div className="bg-white/20 rounded-lg p-3 text-center shadow-inner">
          <div className="text-2xl font-bold text-white">
            {Math.round(chartData.reduce((sum, d) => sum + d.engagement, 0) / chartData.length)}%
          </div>
          <div className="text-xs text-white/80 mt-1">Average</div>
        </div>
        <div className="bg-white/20 rounded-lg p-3 text-center shadow-inner">
          <div className="text-2xl font-bold text-pink-200">
            {Math.min(...chartData.map(d => d.engagement))}%
          </div>
          <div className="text-xs text-white/80 mt-1">Lowest</div>
        </div>
      </div>
    </div>
  )
}