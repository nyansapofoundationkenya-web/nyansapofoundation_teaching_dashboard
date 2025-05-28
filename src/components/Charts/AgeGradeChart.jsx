"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function AgeGradeChart({ data, showTitle = true }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-white rounded-lg">
        <div className="text-center p-4">
          <div className="text-lg font-medium mb-2">No Data Available</div>
          <div className="text-sm">No age distribution data found for grades.</div>
        </div>
      </div>
    )
  }

  // Colors for different age ranges
  const ageColors = {
    5: "#ef4444", // Red
    6: "#f97316", // Orange
    7: "#eab308", // Yellow
    8: "#22c55e", // Green
    9: "#3b82f6", // Blue
    10: "#a855f7", // Purple
    11: "#ec4899", // Pink
    12: "#8b5cf6", // Violet
    13: "#06b6d4", // Cyan
    14: "#84cc16", // Lime
    15: "#f59e0b", // Amber
    default: "#94a3b8", // Gray
  }

  // Get all age ranges from the data
  const ageRanges = new Set()
  data.forEach((gradeData) => {
    Object.keys(gradeData).forEach((key) => {
      if (key !== "grade") {
        ageRanges.add(key)
      }
    })
  })

  const ages = Array.from(ageRanges).sort((a, b) => Number(a) - Number(b))

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, entry) => sum + entry.value, 0)

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg min-w-[120px]">
          <p className="font-medium text-gray-800 mb-2 text-sm">{label}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded mr-1" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs text-gray-600">Age {entry.name}:</span>
                </div>
                <span className="text-xs font-medium ml-1">{entry.value}</span>
              </div>
            ))}
            <div className="border-t pt-1 mt-1">
              <div className="flex justify-between">
                <span className="text-xs font-medium text-gray-700">Total:</span>
                <span className="text-xs font-bold">{total}</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full bg-white rounded-lg">
      {showTitle && (
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Age Distribution by Grade</h3>
        </div>
      )}

      <div className="p-4">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
            barCategoryGap="15%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="grade"
              tick={{ fontSize: 11, fill: "#374151" }}
              axisLine={{ stroke: "#374151" }}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#374151" }}
              axisLine={{ stroke: "#374151" }}
              label={{ value: "Students", angle: -90, position: "insideLeft", style: { fontSize: 11 } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: "10px",
                paddingTop: "10px",
              }}
              formatter={(value) => `Age ${value}`}
              iconType="rect"
            />
            {ages.map((age) => (
              <Bar
                key={age}
                dataKey={age}
                fill={ageColors[age] || ageColors.default}
                name={age}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
