"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function GradeLevelChart({ data, title, colors, showTitle = true, levelOrder = null }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No Data Available</div>
          <div className="text-sm">No learning level distribution data found for this selection.</div>
        </div>
      </div>
    )
  }

  // Get all learning levels from the data
  const learningLevels = new Set()
  data.forEach((gradeData) => {
    Object.keys(gradeData).forEach((key) => {
      if (!["grade", "total_maleStudents", "total_femaleStudents", "mean_age"].includes(key)) {
        learningLevels.add(key)
      }
    })
  })

  // Sort levels according to the specified order, or use default order
  let levels = Array.from(learningLevels)
  if (levelOrder && levelOrder.length > 0) {
    // Filter and sort according to the specified order
    levels = levelOrder.filter((level) => learningLevels.has(level))
    // Add any levels not in the order at the end
    const remainingLevels = Array.from(learningLevels).filter((level) => !levelOrder.includes(level))
    levels = [...levels, ...remainingLevels]
  }

  // Custom tooltip to show better formatting including gender and age data
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload
      const total = payload.reduce((sum, entry) => sum + entry.value, 0)

      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg min-w-[200px]">
          <p className="font-medium text-gray-800 mb-3 text-center border-b pb-2">{label}</p>

          {/* Gender and Age Information */}
          <div className="mb-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-blue-600 font-medium">Male Students:</span>
              <span className="font-medium">{dataPoint?.total_maleStudents || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-pink-600 font-medium">Female Students:</span>
              <span className="font-medium">{dataPoint?.total_femaleStudents || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 font-medium">Mean Age:</span>
              <span className="font-medium">{dataPoint?.mean_age ? `${dataPoint.mean_age} years` : "N/A"}</span>
            </div>
          </div>

          {/* Learning Levels */}
          <div className="border-t pt-2">
            <p className="text-xs text-gray-500 mb-2">Learning Levels:</p>
            <div className="space-y-1">
              {payload.map((entry, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm text-gray-600 capitalize">{entry.name.replace(/([A-Z])/g, " $1")}:</span>
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
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full relative">
      {/* Title inside the chart area */}
      <div className="absolute top-4 left-6 z-10">
        <h3 className="text-lg font-semibold text-gray-800 bg-white/90 px-2 py-1 rounded">{title}</h3>
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
            angle={-45}
            textAnchor="end"
            height={60}
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
            formatter={(value) => <span className="capitalize">{value.replace(/([A-Z])/g, " $1")}</span>}
            iconType="rect"
          />
          {levels.map((level) => (
            <Bar
              key={level}
              dataKey={level}
              stackId="a"
              fill={colors[level] || colors.default || "#8884d8"}
              name={level}
              radius={[0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
