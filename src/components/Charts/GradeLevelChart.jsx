"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function GradeLevelChart({ data, title, colors, showTitle = true, levelOrder = null }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-white rounded-lg">
        <div className="text-center p-4">
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
    levels = levelOrder.filter((level) => learningLevels.has(level))
    const remainingLevels = Array.from(learningLevels).filter((level) => !levelOrder.includes(level))
    levels = [...levels, ...remainingLevels]
  }

  // Custom tooltip that shows all levels but highlights the hovered one
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Filter out entries with zero values
      const activeEntries = payload.filter((entry) => entry.value > 0)

      if (activeEntries.length === 0) return null

      // Try to determine which segment is being hovered by finding the topmost segment
      // This is an approximation since Recharts doesn't provide exact segment hover info
      const hoveredEntry = activeEntries[activeEntries.length - 1]

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg min-w-[160px]">
          <p className="font-medium text-gray-800 mb-2 text-center border-b pb-1 text-sm">{label}</p>
          <div className="space-y-1">
            {activeEntries.map((entry, index) => {
              const isHovered = entry.name === hoveredEntry.name
              return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-1 rounded ${
                    isHovered ? "bg-gray-100 border border-gray-300" : ""
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: entry.color }} />
                    <span
                      className={`text-sm capitalize ${isHovered ? "font-semibold text-gray-800" : "text-gray-600"}`}
                    >
                      {entry.name.replace(/([A-Z])/g, " $1")}:
                    </span>
                  </div>
                  <span className={`text-sm ml-2 ${isHovered ? "font-bold text-black" : "font-medium text-black"}`}>
                    {entry.value}
                  </span>
                </div>
              )
            })}
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0, 0, 0, 0.1)" }} />
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
