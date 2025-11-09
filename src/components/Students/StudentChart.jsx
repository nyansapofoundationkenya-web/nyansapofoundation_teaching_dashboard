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

// Define competence levels for both types
const COMPETENCE_LEVELS = {
  literacy: {
    "beginner": 0,
    "letter": 1,
    "word": 2,
    "paragraph": 3,
    "story": 4,
    "above_level": 5
  },
  numeracy: {
    "beginner": 0,
    "number_recognition": 1,
    "addition": 2,
    "subtraction": 3,
    "multiplication": 4,
    "division": 5,
    "above_level": 6
  }
};

// Format labels for display
const FORMATTED_LABELS = {
  literacy: {
    "beginner": "Beginner",
    "letter": "Letter",
    "word": "Word",
    "paragraph": "Paragraph",
    "story": "Story",
    "above": "Above"
  },
  numeracy: {
    "beginner": "Beginner",
    "number_recognition": "Number Recognition",
    "addition": "Addition",
    "subtraction": "Subtraction",
    "multiplication": "Multiplication",
    "division": "Division",
    "above": "Above"
  }
};

export default function StudentChart({ baseline, assessmentType = 'literacy' }) {
  // Get the appropriate competence levels based on assessment type
  const baselineLevels = COMPETENCE_LEVELS[assessmentType] || COMPETENCE_LEVELS.literacy;
  const formattedLabels = FORMATTED_LABELS[assessmentType] || FORMATTED_LABELS.literacy;
  
  // Convert the baseline to lowercase to match our keys
  const baselineKey = (baseline || 'beginner').toLowerCase();
  
  // Get the numeric value for the baseline
  const baselineValue = baselineLevels[baselineKey] || 0;
  
  // Get the maximum level for this assessment type
  const maxLevel = Math.max(...Object.values(baselineLevels));

  const data = {
    labels: ["Current Level"],
    datasets: [
      {
        label: "Current Level",
        data: [baselineValue],
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
            const value = context.raw;
            const level = Object.keys(baselineLevels).find(
              key => baselineLevels[key] === value
            );
            return `Level: ${formattedLabels[level] || level || 'Unknown'}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: maxLevel,
        min: 0,
        ticks: {
          stepSize: 1,
          color: "#d1d5db", // gray-300
          callback: function(value) {
            // Find the level name for this numeric value
            const level = Object.keys(baselineLevels).find(
              key => baselineLevels[key] === value
            );
            return formattedLabels[level] || "";
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
      {/* <div className="mt-4 text-sm text-gray-400">
        <p>Assessment Type: <span className="text-white font-medium">{assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)}</span></p>
        <p>Current Level: <span className="text-white font-medium">{formattedLabels[baselineKey] || baseline}</span></p>
      </div> */}
    </div>
  )
}