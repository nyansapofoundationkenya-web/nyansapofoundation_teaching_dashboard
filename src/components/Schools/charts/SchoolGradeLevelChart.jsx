"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function SchoolGradeLevelChart({ data, title, colors, showTitle = true, levelOrder = null }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-white rounded-lg">
        <div className="text-center p-4">
          <div className="text-lg font-medium mb-2">No Data Available</div>
          <div className="text-sm">No learning level distribution data found for this school.</div>
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
    levels = levelOrder.filter((level) => learningLevels.has(level))
    const remainingLevels = Array.from(learningLevels).filter((level) => !levelOrder.includes(level))
    levels = [...levels, ...remainingLevels]
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload
      const total = payload.reduce((sum, entry) => sum + entry.value, 0)

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg min-w-[180px] max-w-[250px]">
          <p className="font-medium text-gray-800 mb-2 text-center border-b pb-1 text-sm">{label}</p>

          {/* Gender and Age Information */}
          <div className="mb-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-blue-600 font-medium">Male:</span>
              <span className="font-medium">{dataPoint?.total_maleStudents || 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-pink-600 font-medium">Female:</span>
              <span className="font-medium">{dataPoint?.total_femaleStudents || 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 font-medium">Mean Age:</span>
              <span className="font-medium">{dataPoint?.mean_age ? `${dataPoint.mean_age}y` : "N/A"}</span>
            </div>
          </div>

          {/* Learning Levels */}
          <div className="border-t pt-2">
            <p className="text-xs text-gray-500 mb-1">Learning Levels:</p>
            <div className="space-y-1">
              {payload.map((entry, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded mr-1" style={{ backgroundColor: entry.color }} />
                    <span className="text-xs text-gray-600 capitalize truncate">
                      {entry.name.replace(/([A-Z])/g, " $1")}:
                    </span>
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
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full bg-white rounded-lg">
      {showTitle && (
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
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
              angle={-45}
              textAnchor="end"
              height={50}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#374151" }}
              axisLine={{ stroke: "#374151" }}
              label={{ value: "Students", angle: -90, position: "insideLeft", style: { fontSize: 11 } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{
                fontSize: "10px",
                paddingTop: "0px",
                paddingBottom: "20px",
              }}
              formatter={(value) => <span className="capitalize text-xs">{value.replace(/([A-Z])/g, " $1")}</span>}
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
    </div>
  )
}
