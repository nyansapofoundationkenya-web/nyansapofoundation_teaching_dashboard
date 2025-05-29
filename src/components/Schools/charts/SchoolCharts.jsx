"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import SchoolGradeLevelChart from "./SchoolGradeLevelChart"

export default function SchoolCharts({ schoolData }) {
  const [selectedType, setSelectedType] = useState("numeracy")
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Color schemes for the charts
  const colorSchemes = {
    numeracy: {
      above: "#3b82f6", // Blue
      multiplication: "#a855f7", // Purple
      addition: "#22c55e", // Green
      numberRecognition: "#ef4444", // Red
      division: "#f97316", // Orange
      subtraction: "#eab308", // Yellow
      countAndMatch: "#6b7280", // Gray
      beginner: "#8b5cf6", // Violet
      default: "#94a3b8", // Default gray
    },
    literacy: {
      above: "#3b82f6", // Blue
      paragraph: "#a855f7", // Purple
      beginner: "#22c55e", // Green
      story: "#ef4444", // Red
      word: "#eab308", // Yellow
      default: "#94a3b8", // Default gray
    },
  }

  // Process the chart data from the Firestore structure
  const processChartData = (learningLevelData, type) => {
    if (!learningLevelData) return []

    const typeData = learningLevelData.find((item) => item.type === type)
    if (!typeData || !typeData.data) return []

    return typeData.data
      .map((gradeData) => {
        const chartItem = {
          grade: `Grade ${gradeData.grade}`,
          total_maleStudents: gradeData.total_maleStudents || 0,
          total_femaleStudents: gradeData.total_femaleStudents || 0,
          mean_age: gradeData.mean_age || null,
        }

        // Convert distribution array to object properties
        // Handle typo in Firestore data - it's "distibution" not "distribution"
        const distributionData = gradeData.distribution || gradeData.distibution || []
        distributionData.forEach((dist) => {
          chartItem[dist.learning_level] = dist.value
        })

        return chartItem
      })
      .sort((a, b) => {
        // Sort by grade number
        const gradeA = Number.parseInt(a.grade.replace("Grade ", ""))
        const gradeB = Number.parseInt(b.grade.replace("Grade ", ""))
        return gradeA - gradeB
      })
  }

  // Get available chart types from the data
  const availableTypes = schoolData?.learning_level_distribution?.map((item) => item.type) || []

  // Chart type options
  const chartOptions = [
    { value: "numeracy", label: "Numeracy Level Distribution", available: availableTypes.includes("numeracy") },
    { value: "literacy", label: "Literacy Level Distribution", available: availableTypes.includes("literacy") },
  ]

  const getCurrentData = () => {
    return processChartData(schoolData?.learning_level_distribution, selectedType)
  }

  const currentData = getCurrentData()
  const currentColors = colorSchemes[selectedType] || colorSchemes.numeracy

  const renderChart = () => {
    const literacyOrder = ["beginner", "word", "paragraph", "story", "above"]
    const chartTitle =
      selectedType === "literacy" ? "Literacy Level Distribution by Grade" : "Numeracy Level Distribution by Grade"

    return (
      <SchoolGradeLevelChart
        data={currentData}
        title={chartTitle}
        colors={currentColors}
        showTitle={true}
        levelOrder={selectedType === "literacy" ? literacyOrder : null}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Chart Selector */}
      <div className="flex justify-start items-center">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-sm w-full sm:w-auto min-w-[200px] justify-between"
          >
            <span className="truncate">
              {chartOptions.find((option) => option.value === selectedType)?.label || "Select Chart"}
            </span>
            <ChevronDown
              className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-30">
              <ul className="py-1">
                {chartOptions.map((option) => (
                  <li key={option.value}>
                    <button
                      onClick={() => {
                        if (option.available) {
                          setSelectedType(option.value)
                          setDropdownOpen(false)
                        }
                      }}
                      disabled={!option.available}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        option.available
                          ? selectedType === option.value
                            ? "bg-yellow-50 text-yellow-700 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <span className="truncate">{option.label}</span>
                      {!option.available && <span className="text-xs text-gray-400 ml-2">(No data)</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Chart Container */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="w-full">{renderChart()}</div>
      </div>
    </div>
  )
}
