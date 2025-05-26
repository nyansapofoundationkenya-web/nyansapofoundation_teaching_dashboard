"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function GenderGradeChart({ data, showTitle = true }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No Data Available</div>
          <div className="text-sm">No gender distribution data found for grades.</div>
        </div>
      </div>
    )
  }

  // Colors for gender
  const genderColors = {
    male: "#3b82f6", // Blue
    female: "#ec4899", // Pink
    other: "#8b5cf6", // Purple
    default: "#94a3b8", // Gray
  }

  // Get all gender categories from the data
  const genderCategories = new Set()
  data.forEach((gradeData) => {
    Object.keys(gradeData).forEach((key) => {
      if (key !== "grade") {
        genderCategories.add(key)
      }
    })
  })

  const genders = Array.from(genderCategories)

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, entry) => sum + entry.value, 0)

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800 mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between min-w-[120px]">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-gray-600 capitalize">{entry.name}:</span>
                </div>
                <span className="text-sm font-medium ml-2">{entry.value}</span>
              </div>
            ))}
            <div className="border-t pt-1 mt-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Total:</span>
                <span className="text-sm font-bold">{total}</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full relative">
      {/* Title inside the chart area */}
      <div className="absolute top-4 left-6 z-10">
        <h3 className="text-lg font-semibold text-gray-800 bg-white/90 px-2 py-1 rounded">
          Gender Distribution by Grade
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{
            top: 50,
            right: 120,
            left: 20,
            bottom: 60,
          }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="grade"
            tick={{ fontSize: 12, fill: "#374151" }}
            axisLine={{ stroke: "#374151" }}
            label={{ value: "Grade", position: "insideBottom", offset: -10 }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#374151" }}
            axisLine={{ stroke: "#374151" }}
            label={{ value: "Number of Students", angle: -90, position: "insideLeft" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{
              fontSize: "11px",
              paddingBottom: "10px",
              paddingRight: "10px",
              lineHeight: "14px",
            }}
            formatter={(value) => <span className="capitalize">{value}</span>}
            iconType="rect"
          />
          {genders.map((gender) => (
            <Bar
              key={gender}
              dataKey={gender}
              fill={genderColors[gender] || genderColors.default}
              name={gender}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
