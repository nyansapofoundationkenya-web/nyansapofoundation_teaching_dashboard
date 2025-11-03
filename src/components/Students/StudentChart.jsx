"use client"

import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

// Define your baseline levels with their order
const baselineLevels = {
  "Beginner": 1,
  "Letter": 2,
  "Word": 3,
  "Paragraph": 4,
  "Story": 5,
  "Above": 6
}

export default function StudentChart({ baseline }) {
  // Convert the baseline to proper case to match your levels
  const formattedBaseline = baseline.charAt(0).toUpperCase() + baseline.slice(1).toLowerCase()
  
  const data = {
    labels: ["Baseline"],
    datasets: [
      {
        label: "Current Level",
        data: [baselineLevels[formattedBaseline] || 0],
        backgroundColor: "#5aa2ce", // primary-2 color
        borderColor: "#3b82c8", // darker shade of primary-2
        borderWidth: 1,
        borderRadius: 8,
        barPercentage: 0.3
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // Hide the legend since we only have one bar
      },
      tooltip: {
        backgroundColor: "#1e3a63", // background-light equivalent
        titleColor: "#ffffff", // foreground
        bodyColor: "#d1d5db", // gray-300
        borderColor: "#4b5563", // gray-600
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const value = context.raw
            const level = Object.keys(baselineLevels).find(
              key => baselineLevels[key] === value
            ) || ''
            return `Level: ${level}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 6,
        min: 0,
        ticks: {
          stepSize: 1,
          color: "#d1d5db", // gray-300
          callback: function(value) {
            return Object.keys(baselineLevels).find(
              key => baselineLevels[key] === value
            ) || ""
          }
        },
        grid: {
          color: "#4b5563", // gray-600
          drawBorder: false
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          display: true,
          color: "#d1d5db", // gray-300
          font: {
            weight: 'bold'
          }
        }
      }
    }
  }

  return (
    <div className="w-full h-[300px] p-4">
      <Bar 
        data={data} 
        options={options}
        className="w-full h-full"
      />
    </div>
  )
}