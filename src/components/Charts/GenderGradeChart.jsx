"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function GenderGradeChart({ data, showTitle = true }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-white rounded-lg">
        <div className="text-center p-4">
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
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg min-w-[120px]">
          <p className="font-medium text-gray-800 mb-2 text-sm">{label}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded mr-1" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs text-gray-600 capitalize">{entry.name}:</span>
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
          <h3 className="text-lg font-semibold text-gray-800">Gender Distribution by Grade</h3>
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
              formatter={(value) => <span className="capitalize text-xs">{value}</span>}
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
    </div>
  )
}
