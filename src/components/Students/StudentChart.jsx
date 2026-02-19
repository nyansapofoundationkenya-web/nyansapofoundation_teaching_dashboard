"use client"

import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

// ────────────────────────────────────────────────
//   Competence level configurations
// ────────────────────────────────────────────────
const LEVELS = {
  // Standard literacy (6 levels)
  literacy_standard: {
    levels: {
      beginner: 0,
      letter: 1,
      word: 2,
      paragraph: 3,
      story: 4,
      above: 5,
    },
    labels: {
      beginner: "Beginner",
      letter: "Letter",
      word: "Word",
      paragraph: "Paragraph",
      story: "Story",
      above: "Above Level",
    },
  },

  // Dignitas literacy variant (5 levels)
  literacy_dignitas: {
    levels: {
      "non-reader": 0,
      letter: 1,
      word: 2,
      paragraph: 3,
      "reading-comprehension": 4,
    },
    labels: {
      "non-reader": "Non-Reader",
      letter: "Letter",
      word: "Word",
      paragraph: "Paragraph",
      "reading-comprehension": "Reading Comprehension",
    },
  },

  // Numeracy (7 levels)
  numeracy: {
    levels: {
      beginner: 0,
      number_recognition: 1,
      addition: 2,
      subtraction: 3,
      multiplication: 4,
      division: 5,
      above_level: 6,
    },
    labels: {
      beginner: "Beginner",
      number_recognition: "Number Recognition",
      addition: "Addition",
      subtraction: "Subtraction",
      multiplication: "Multiplication",
      division: "Division",
      above_level: "Above Level",
    },
  },
}

export default function StudentChart({
  baseline = "",
  assessmentType = "literacy",
  calculationType = "",           // new prop – pass from parent
}) {
  // Normalize inputs
  const type = assessmentType.toLowerCase().trim()
  const calc = (calculationType || "").toLowerCase().trim()

  console.log(baseline)

  // Choose the correct config
  let config
  if (type === "numeracy") {
    config = LEVELS.numeracy
  } else if (type === "literacy") {
    config = calc === "dignitas"
      ? LEVELS.literacy_dignitas
      : LEVELS.literacy_standard
  } else {
    // fallback
    config = LEVELS.literacy_standard
  }

  const { levels, labels } = config
  const maxLevel = Math.max(...Object.values(levels))

  // Normalize baseline - DON'T replace underscores
  const normalized = baseline
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")  // Only replace spaces with hyphens, keep underscores

  let baselineKey = normalized || "beginner"

  // Try to find exact match, or fallback
  if (!(baselineKey in levels)) {
    // Try common variations
    if (normalized.includes("nonreader") || normalized.includes("non-reader")) baselineKey = "non-reader"
    if (normalized.includes("readingcomprehension") || normalized.includes("reading-comprehension")) baselineKey = "reading-comprehension"
    if (normalized.includes("abov")) baselineKey = type === "numeracy" ? "above_level" : "above"
    
    // Additional fallback for number_recognition
    if (normalized.includes("number") && normalized.includes("recognition")) baselineKey = "number_recognition"
  }

  const baselineValue = levels[baselineKey] ?? 0

  const data = {
    labels: ["Current Level"],
    datasets: [{
      label: "Level",
      data: [baselineValue],
      backgroundColor: "#5aa2ce",
      borderColor: "#3b82c8",
      borderWidth: 1,
      borderRadius: 8,
      barPercentage: 0.35,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e3a63",
        titleColor: "#ffffff",
        bodyColor: "#d1d5db",
        borderColor: "#4b5563",
        borderWidth: 1,
        callbacks: {
          label: (ctx) => {
            const val = ctx.raw
            const key = Object.keys(levels).find(k => levels[k] === val)
            return `Level: ${labels[key] || key || "Unknown"}`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: maxLevel,
        min: 0,
        ticks: {
          stepSize: 1,
          color: "#d1d5db",
          font: { size: 13 },
          callback: (val) => {
            const key = Object.keys(levels).find(k => levels[k] === val)
            return labels[key] || ""
          },
        },
        grid: {
          color: "#4b5563",
          drawBorder: false,
        },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: "#d1d5db",
          font: { weight: "bold" },
        },
      },
    },
  }

  return (
    <div className="w-full h-[300px] p-4">
      <Bar data={data} options={options} />
    </div>
  )
}