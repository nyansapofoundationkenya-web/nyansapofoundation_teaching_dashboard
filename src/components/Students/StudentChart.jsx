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
        backgroundColor: "#3b82f6",
        borderColor: "#1d4ed8",
        borderWidth: 1,
        borderRadius: 4,
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
          callback: function(value) {
            return Object.keys(baselineLevels).find(
              key => baselineLevels[key] === value
            ) || ""
          }
        },
        grid: {
          display: false
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          display: true,
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