"use client"

import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import GradeLevelChart from "./GradeLevelChart"
import LevelDistributionByAgeChart from "./LevelDistributionByAge"
import LevelDistributionByGenderChart from "./LevelDistributionByGenderChart"

export default function ProjectCharts({ chartData }) {
  const [selectedType, setSelectedType] = useState("numeracy")
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Add click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest(".relative")) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownOpen])

  // Color schemes for the charts
  const colorSchemes = {
    numeracy: {
      above: "#3b82f6", // Blue
      multiplication: "#a855f7", // Purple
      addition: "#22c55e", // Green
      number_recognition: "#ef4444", // Red
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
      letter: "#8b5cf6",
      default: "#94a3b8", // Default gray
    },
  }

  // Process the chart data for grade-based visualization
  const processGradeChartData = (learningLevelData, type) => {
    if (!learningLevelData) return []

    const typeData = learningLevelData.find((item) => item.type === type)
    if (!typeData || !typeData.data) return []

    // Use data array directly for grades (no filtering needed)
    return typeData.data
      .map((gradeItem) => {
        const chartItem = {
          grade: `Grade ${gradeItem.grade}`,
        }

        // Convert distribution array to object properties
        gradeItem.distribution.forEach((dist) => {
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

  // Process chart data for age-based visualization
  const processAgeChartData = (learningLevelData, type) => {
    if (!learningLevelData) return []

    const typeData = learningLevelData.find((item) => item.type === type)
    if (!typeData || !typeData.ageData) return []

    // Use ageData array directly (not filtering from data array)
    return typeData.ageData
      .map((ageItem) => {
        // Add error checking and logging
        if (!ageItem) {
          console.warn("processAgeChartData: ageItem is null or undefined", ageItem)
          return null
        }

        if (!ageItem.age_range && ageItem.age_range !== 0) {
          console.warn("processAgeChartData: age_range is missing", ageItem)
          return null
        }

        const chartItem = {
          age: ageItem.age_range.toString(), // Convert to string for display
        }

        // Convert distribution array to object properties
        if (ageItem.distribution && Array.isArray(ageItem.distribution)) {
          ageItem.distribution.forEach((dist) => {
            if (dist && dist.learning_level && dist.value !== undefined) {
              chartItem[dist.learning_level] = dist.value
            }
          })
        } else {
          console.warn("processAgeChartData: distribution is missing or not an array", ageItem)
        }

        return chartItem
      })
      .filter((item) => item !== null) // Remove null items
      .sort((a, b) => {
        // Sort by age range numerically
        const ageA = Number.parseInt(a.age)
        const ageB = Number.parseInt(b.age)
        return ageA - ageB
      })
  }

  // Process chart data for gender-based visualization
  const processGenderChartData = (learningLevelData, type) => {
    if (!learningLevelData) return []

    const typeData = learningLevelData.find((item) => item.type === type)
    if (!typeData || !typeData.genderData) return []

    // Process the genderData array which contains both male and female data
    return typeData.genderData.map((genderItem) => {
      const chartItem = {
        gender: genderItem.gender.charAt(0).toUpperCase() + genderItem.gender.slice(1),
      }

      // Convert distribution array to object properties
      genderItem.distribution.forEach((dist) => {
        chartItem[dist.learning_level] = dist.value
      })

      return chartItem
    })
  }

  // Get available chart types and data types from the data
  const getAvailableDataTypes = (learningLevelData, type) => {
    if (!learningLevelData) return { hasGrade: false, hasAge: false, hasGender: false }

    const typeData = learningLevelData.find((item) => item.type === type)
    if (!typeData) return { hasGrade: false, hasAge: false, hasGender: false }

    const hasGrade = typeData.data && Array.isArray(typeData.data) && typeData.data.length > 0
    const hasAge = typeData.ageData && Array.isArray(typeData.ageData) && typeData.ageData.length > 0
    const hasGender = typeData.genderData && Array.isArray(typeData.genderData) && typeData.genderData.length > 0

    // Debug logging
    console.log("getAvailableDataTypes debug:", {
      type,
      hasGrade,
      hasAge,
      hasGender,
      ageDataSample: typeData.ageData?.[0],
      dataStructure: typeData,
    })

    return { hasGrade, hasAge, hasGender }
  }

  const availableTypes = chartData?.map((item) => item.type) || []

  // Chart type options with proper availability checking
  const chartOptions = [
    {
      value: "numeracy",
      label: "Numeracy Level Distribution by Grade",
      available: availableTypes.includes("numeracy") && getAvailableDataTypes(chartData, "numeracy").hasGrade,
    },
    {
      value: "literacy",
      label: "Literacy Level Distribution by Grade",
      available: availableTypes.includes("literacy") && getAvailableDataTypes(chartData, "literacy").hasGrade,
    },
    {
      value: "numeracyAge",
      label: "Numeracy Level Distribution by Age",
      available: availableTypes.includes("numeracy") && getAvailableDataTypes(chartData, "numeracy").hasAge,
    },
    {
      value: "literacyAge",
      label: "Literacy Level Distribution by Age",
      available: availableTypes.includes("literacy") && getAvailableDataTypes(chartData, "literacy").hasAge,
    },
    {
      value: "numeracyGender",
      label: "Numeracy Level Distribution by Gender",
      available: availableTypes.includes("numeracy") && getAvailableDataTypes(chartData, "numeracy").hasGender,
    },
    {
      value: "literacyGender",
      label: "Literacy Level Distribution by Gender",
      available: availableTypes.includes("literacy") && getAvailableDataTypes(chartData, "literacy").hasGender,
    },
  ]

  const getCurrentData = () => {
    switch (selectedType) {
      case "numeracyAge":
        return processAgeChartData(chartData, "numeracy")
      case "literacyAge":
        return processAgeChartData(chartData, "literacy")
      case "numeracyGender":
        return processGenderChartData(chartData, "numeracy")
      case "literacyGender":
        return processGenderChartData(chartData, "literacy")
      default:
        return processGradeChartData(chartData, selectedType)
    }
  }

  const currentData = getCurrentData()
  const currentColors = colorSchemes[selectedType.replace("Age", "").replace("Gender", "")] || colorSchemes.numeracy

  const renderChart = () => {
    const literacyOrder = ["beginner", "word", "paragraph", "story", "above"]

    switch (selectedType) {
      case "numeracyAge":
        return (
          <LevelDistributionByAgeChart
            data={currentData}
            title="Numeracy Level Distribution by Age"
            colors={currentColors}
            showTitle={true}
          />
        )
      case "literacyAge":
        return (
          <LevelDistributionByAgeChart
            data={currentData}
            title="Literacy Level Distribution by Age"
            colors={currentColors}
            showTitle={true}
            levelOrder={literacyOrder}
          />
        )
      case "numeracyGender":
        return (
          <LevelDistributionByGenderChart
            data={currentData}
            title="Numeracy Level Distribution by Gender"
            colors={currentColors}
            showTitle={true}
          />
        )
      case "literacyGender":
        return (
          <LevelDistributionByGenderChart
            data={currentData}
            title="Literacy Level Distribution by Gender"
            colors={currentColors}
            showTitle={true}
            levelOrder={literacyOrder}
          />
        )
      default:
        const chartTitle =
          selectedType === "literacy" ? "Literacy Level Distribution by Grade" : "Numeracy Level Distribution by Grade"
        return (
          <GradeLevelChart
            data={currentData}
            title={chartTitle}
            colors={currentColors}
            showTitle={true}
            levelOrder={selectedType === "literacy" ? literacyOrder : null}
          />
        )
    }
  }

  return (
    <div className="w-full space-y-3 sm:space-y-4 px-2 sm:px-0">
      {/* Chart Selector - Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-start sm:items-center">
        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between w-full sm:min-w-[280px] md:min-w-[320px] px-3 py-2.5 sm:py-2 bg-background-light border border-gray-600 rounded-xl hover:bg-background-lighter text-sm font-medium text-foreground shadow-md transition-all"
          >
            <span className="truncate text-left">
              {chartOptions.find((option) => option.value === selectedType)?.label || "Select Chart"}
            </span>
            <ChevronDown
              className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <>
              {/* Mobile/Tablet backdrop */}
              <div
                className="fixed inset-0 bg-gray-900 bg-opacity-50 z-20 sm:hidden"
                onClick={() => setDropdownOpen(false)}
              />

              {/* Dropdown menu */}
              <div className="absolute left-0 right-0 sm:right-auto mt-2 bg-background-light border border-gray-600 rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto">
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
                        className={`w-full text-left px-3 py-3 sm:py-2 text-sm transition-all ${
                          option.available
                            ? selectedType === option.value
                              ? "bg-primary-3/20 text-primary-1 font-medium"
                              : "text-foreground hover:bg-background-lighter active:bg-primary-2/20"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center">
                          <span className="truncate">{option.label}</span>
                          {!option.available && (
                            <span className="text-xs text-gray-400 mt-1 sm:mt-0 sm:ml-2">(No data)</span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Render the selected chart */}
      {renderChart()}
    </div>
  )
}