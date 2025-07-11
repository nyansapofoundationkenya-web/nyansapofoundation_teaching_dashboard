"use client"

import { useEffect, useRef, useState } from "react"
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, BarController } from "chart.js"

// Register the required components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, BarController)

export default function LevelDistributionByGenderChart({ data, title, colors, showTitle = true, levelOrder = null }) {
  const chartRef = useRef(null)
  const chartInstanceRef = useRef(null)
  const [chartData, setChartData] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Default colors if not provided
  const defaultColors = {
    default: "#8884d8",
    beginner: "#4ade80",
    intermediate: "#fbbf24",
    advanced: "#ef4444",
    proficient: "#8b5cf6",
    expert: "#06b6d4",
  }

  const colorPalette = { ...defaultColors, ...colors }

  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData(null)
      return
    }

    // Get all learning levels from the data
    const learningLevels = new Set()
    data.forEach((genderData) => {
      Object.keys(genderData).forEach((key) => {
        if (key !== "gender") {
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

    // Create datasets for each learning level
    const datasets = levels.map((level, index) => ({
      label: level.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
      data: data.map((genderData) => genderData[level] || 0),
      backgroundColor: colorPalette[level] || colorPalette.default,
      barPercentage: 0.65, // Increased from 0.5 to 0.65
      categoryPercentage: 0.75, // Increased from 0.6 to 0.75
      borderRadius: {
        bottomLeft: index === 0 ? 4 : 0,
        bottomRight: index === 0 ? 4 : 0,
        topLeft: index === levels.length - 1 ? 4 : 0,
        topRight: index === levels.length - 1 ? 4 : 0,
      },
    }))

    setChartData({
      labels: data.map((item) => item.gender.charAt(0).toUpperCase() + item.gender.slice(1)),
      datasets: datasets,
    })
  }, [data, levelOrder, colors])

  useEffect(() => {
    if (chartRef.current && chartData) {
      // Destroy existing chart if it exists
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }

      // Create new chart
      const ctx = chartRef.current.getContext("2d")
      if (ctx) {
        chartInstanceRef.current = new ChartJS(ctx, {
          type: "bar",
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                stacked: true,
                grid: {
                  display: true,
                  color: "#f0f0f0",
                },
                border: {
                  display: true,
                  color: "#374151",
                },
                ticks: {
                  padding: isMobile ? 5 : 10,
                  font: {
                    size: isMobile ? 10 : 11,
                  },
                  color: "#374151",
                },
              },
              y: {
                stacked: true,
                beginAtZero: true,
                border: {
                  display: true,
                  color: "#374151",
                },
                grid: {
                  display: true,
                  color: "#f0f0f0",
                },
                ticks: {
                  font: {
                    size: isMobile ? 10 : 11,
                  },
                  color: "#374151",
                },
                title: {
                  display: !isMobile,
                  text: "Students",
                  font: {
                    size: isMobile ? 10 : 11,
                  },
                  color: "#374151",
                },
              },
            },
            interaction: {
              mode: "point",
              intersect: true,
            },
            plugins: {
              legend: {
                display: true,
                position: isMobile ? "bottom" : "top",
                align: isMobile ? "center" : "end",
                labels: {
                  font: {
                    size: isMobile ? 9 : 10,
                  },
                  usePointStyle: true,
                  pointStyle: "rect",
                  padding: isMobile ? 15 : 10,
                  boxWidth: isMobile ? 10 : 12,
                  generateLabels: (chart) => {
                    const datasets = chart.data.datasets
                    return datasets.map((dataset, i) => ({
                      text: dataset.label,
                      fillStyle: dataset.backgroundColor,
                      strokeStyle: dataset.backgroundColor,
                      lineWidth: 0,
                      pointStyle: "rect",
                      datasetIndex: i,
                    }))
                  },
                },
              },
              tooltip: {
                mode: "point",
                intersect: true,
                backgroundColor: "white",
                titleColor: "#374151",
                bodyColor: "#374151",
                borderColor: "#d1d5db",
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                titleFont: {
                  size: isMobile ? 12 : 14,
                },
                bodyFont: {
                  size: isMobile ? 10 : 12,
                },
                callbacks: {
                  title: (tooltipItems) => {
                    return tooltipItems[0].label
                  },
                  label: (context) => {
                    const label = context.dataset.label || ""
                    const value = context.raw
                    return `${label}: ${value}`
                  },
                  labelColor: (context) => {
                    return {
                      borderColor: context.dataset.backgroundColor,
                      backgroundColor: context.dataset.backgroundColor,
                    }
                  },
                },
              },
            },
            layout: {
              padding: {
                top: isMobile ? 10 : 20,
                right: isMobile ? 10 : 20,
                left: isMobile ? 10 : 20,
                bottom: isMobile ? 10 : 20,
              },
            },
          },
        })
      }
    }

    // Cleanup function
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }
    }
  }, [chartData, isMobile])

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-gray-500 bg-gray-50 rounded-lg">
        <div className="text-center p-4">
          <div className="text-base sm:text-lg font-medium mb-2">No Data Available</div>
          <div className="text-xs sm:text-sm">No learning level distribution data found for this selection.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-sm">
      {showTitle && (
        <div className="p-3 sm:p-4 border-b">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate">{title}</h3>
        </div>
      )}

      <div className="p-2 sm:p-4">
        <div style={{ height: isMobile ? "300px" : "350px", width: "100%" }}>
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </div>
  )
}
