"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Calendar, TrendingUp, TrendingDown, Users, Minus, Building2, CheckCircle, Clock } from "lucide-react"

export default function AttendanceOverview({ organizationId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [chartView, setChartView] = useState("7days") // "7days" or "30days"

  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/literacy/attendance-overview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organization_id: organizationId }),
        })

        const result = await response.json()

        if (!result.success) {
          setError(result.message || result.error)
          return
        }

        setData(result.data)
      } catch (err) {
        console.error("Attendance overview fetch error:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [organizationId])

  // Calculate circle progress for gauge
  const getCircleProps = (rate) => {
    const radius = 60
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (rate / 100) * circumference
    return { radius, circumference, offset }
  }

  // Get color based on attendance rate
  const getAttendanceColor = (rate) => {
    if (rate >= 95) return "#4caf50" // Excellent - green
    if (rate >= 85) return "#5aa2ce" // Good - blue
    if (rate >= 70) return "#f7cc1c" // Fair - yellow
    return "#e67e22" // Poor - orange
  }

  // Get trend icon
  const getTrendIcon = (trend) => {
    if (trend === "up") return <TrendingUp className="w-5 h-5 text-secondary-2" />
    if (trend === "down") return <TrendingDown className="w-5 h-5 text-secondary-1" />
    return <Minus className="w-5 h-5 text-gray-400" />
  }

  // Get trend color class
  const getTrendColor = (trend) => {
    if (trend === "up") return "text-secondary-2"
    if (trend === "down") return "text-secondary-1"
    return "text-gray-400"
  }

  // Custom tooltip for line chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background-lighter border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold mb-1">
            {payload[0].payload.day || payload[0].payload.date}
          </p>
          <p className="text-xs text-gray-400">
            Rate: <span className="text-primary-2 font-medium">{payload[0].value}%</span>
          </p>
          <p className="text-xs text-gray-400">
            Present: <span className="text-foreground font-medium">
              {payload[0].payload.total_present}/{payload[0].payload.total_students}
            </span>
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-6 text-foreground">
          Attendance Overview
        </h2>
        <div className="h-96 flex items-center justify-center">
          <div className="text-gray-400">Loading attendance data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-6 text-foreground">
          Attendance Overview
        </h2>
        <div className="h-96 flex items-center justify-center">
          <div className="text-red-400">{error}</div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const todayCircle = getCircleProps(data.today.attendance_rate)
  const chartData = chartView === "7days" ? data.last_7_days : data.last_30_days

  return (
    <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700">
      <h2 className="text-xl font-semibold mb-6 text-foreground">
        Attendance Overview
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Today's Attendance Gauge */}
        <div className="border border-gray-600 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary-2" />
            <h3 className="text-primary-2 font-semibold uppercase tracking-wide">
              Today's Attendance
            </h3>
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            {/* Circular gauge */}
            <div className="relative">
              <svg width="140" height="140" className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="70"
                  cy="70"
                  r={todayCircle.radius}
                  stroke="#374151"
                  strokeWidth="16"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="70"
                  cy="70"
                  r={todayCircle.radius}
                  stroke={getAttendanceColor(data.today.attendance_rate)}
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={todayCircle.circumference}
                  strokeDashoffset={todayCircle.offset}
                  strokeLinecap="round"
                  style={{
                    transition: "stroke-dashoffset 1s ease-in-out",
                  }}
                />
                {/* White indicator */}
                <circle
                  cx="70"
                  cy="70"
                  r={todayCircle.radius}
                  stroke="white"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`0 ${todayCircle.offset} 8 ${todayCircle.circumference}`}
                  strokeLinecap="round"
                />
              </svg>

              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">
                    {Math.round(data.today.attendance_rate)}%
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {data.today.total_present}/{data.today.total_students}
                  </div>
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="mt-4 text-center">
              <div className="text-sm text-gray-400">
                {new Date(data.today.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>

            {/* Students count */}
            <div className="mt-4 flex items-center gap-2 bg-background rounded-lg px-4 py-2">
              <Users className="w-4 h-4 text-primary-2" />
              <span className="text-lg font-bold text-foreground">
                {data.today.total_present}
              </span>
              <span className="text-sm text-gray-400">students present</span>
            </div>

            {/* NEW: Schools Attendance Tracking */}
            <div className="mt-4 w-full space-y-2">
              <div className="flex items-center justify-between bg-background rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-secondary-2" />
                  <span className="text-sm text-gray-400">Took attendance</span>
                </div>
                <span className="text-lg font-bold text-secondary-2">
                  {data.today.schools_took_attendance}
                </span>
              </div>
              
              <div className="flex items-center justify-between bg-background rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-secondary-1" />
                  <span className="text-sm text-gray-400">Pending</span>
                </div>
                <span className="text-lg font-bold text-secondary-1">
                  {data.today.schools_pending_attendance}
                </span>
              </div>

              <div className="flex items-center justify-between bg-background rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary-2" />
                  <span className="text-sm text-gray-400">Total schools</span>
                </div>
                <span className="text-lg font-bold text-foreground">
                  {data.today.total_schools}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE: Line Chart (7 or 30 days) */}
        <div className="lg:col-span-2 border border-gray-600 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-2" />
              <h3 className="text-primary-2 font-semibold uppercase tracking-wide">
                Attendance Trend
              </h3>
            </div>
            
            {/* Toggle buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setChartView("7days")}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  chartView === "7days"
                    ? "bg-primary-2 text-white"
                    : "bg-background text-gray-400 hover:bg-gray-700"
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setChartView("30days")}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  chartView === "30days"
                    ? "bg-primary-2 text-white"
                    : "bg-background text-gray-400 hover:bg-gray-700"
                }`}
              >
                30 Days
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey={chartView === "7days" ? "day" : "date"}
                stroke="#9CA3AF"
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                tickFormatter={(value) => {
                  if (chartView === "7days") return value
                  // For 30 days, show abbreviated date
                  const date = new Date(value)
                  return `${date.getMonth() + 1}/${date.getDate()}`
                }}
              />
              <YAxis
                stroke="#9CA3AF"
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="attendance_rate"
                stroke="#5aa2ce"
                strokeWidth={3}
                dot={{ fill: "#5aa2ce", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Average for period */}
          <div className="mt-4 text-center">
            <span className="text-xs text-gray-400">
              Average:{" "}
              <span className="text-primary-2 font-semibold">
                {Math.round(
                  chartData.reduce((sum, day) => sum + day.attendance_rate, 0) /
                    chartData.length
                )}
                %
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Weekly and Monthly Comparison Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Comparison */}
        <div className="border border-gray-600 rounded-xl p-6 bg-background">
          <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
            Weekly Comparison
          </h4>
          
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">This Week</div>
              <div className="text-2xl font-bold text-foreground">
                {data.weekly_comparison.this_week_avg}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Last Week</div>
              <div className="text-xl font-semibold text-gray-400">
                {data.weekly_comparison.last_week_avg}%
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-600">
            <span className="text-xs text-gray-400">Change:</span>
            <div className="flex items-center gap-2">
              {getTrendIcon(data.weekly_comparison.trend)}
              <span className={`text-lg font-bold ${getTrendColor(data.weekly_comparison.trend)}`}>
                {data.weekly_comparison.change > 0 ? "+" : ""}
                {data.weekly_comparison.change}%
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Comparison */}
        <div className="border border-gray-600 rounded-xl p-6 bg-background">
          <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
            Monthly Comparison
          </h4>
          
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">This Month (30d)</div>
              <div className="text-2xl font-bold text-foreground">
                {data.monthly_comparison.this_month_avg}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Last Month</div>
              <div className="text-xl font-semibold text-gray-400">
                {data.monthly_comparison.last_month_avg}%
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-600">
            <span className="text-xs text-gray-400">Change:</span>
            <div className="flex items-center gap-2">
              {getTrendIcon(data.monthly_comparison.trend)}
              <span className={`text-lg font-bold ${getTrendColor(data.monthly_comparison.trend)}`}>
                {data.monthly_comparison.change > 0 ? "+" : ""}
                {data.monthly_comparison.change}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}