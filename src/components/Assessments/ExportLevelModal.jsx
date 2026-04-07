// components/ExportLevelModal.jsx
"use client"

import { useState, useEffect } from "react"
import { X, Download, Filter, Check } from "lucide-react"

// Competency levels by assessment type
const LITERACY_LEVELS = [
  { value: "non-reader", label: "Non Reader", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  { value: "beginner", label: "Beginner", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { value: "letter", label: "Letter", color: "bg-green-500/20 text-green-300 border-green-500/30" },
  { value: "word", label: "Word", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  { value: "paragraph", label: "Paragraph", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  { value: "story", label: "Story", color: "bg-red-500/20 text-red-300 border-red-500/30" },
  { value: "above", label: "Above", color: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
  { value: "reading-comprehension", label: "Reading Comprehension", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
]

const NUMERACY_LEVELS = [
  { value: "beginner", label: "Beginner", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { value: "number_recognition", label: "Number Recognition", color: "bg-green-500/20 text-green-300 border-green-500/30" },
  { value: "addition", label: "Addition", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  { value: "subtraction", label: "Subtraction", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  { value: "multiplication", label: "Multiplication", color: "bg-red-500/20 text-red-300 border-red-500/30" },
  { value: "division", label: "Division", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
]

export default function ExportLevelModal({
  isOpen,
  onClose,
  assessmentType = "literacy",
  students = [],
  onExport
}) {
  const [selectedLevels, setSelectedLevels] = useState([])
  const [downloading, setDownloading] = useState(false)
  const [levelCounts, setLevelCounts] = useState({})

  useEffect(() => {
    // Calculate student counts per level
    const counts = {}
    const levels = assessmentType === "literacy" ? LITERACY_LEVELS : NUMERACY_LEVELS
    
    levels.forEach(level => {
      counts[level.value] = students.filter(s => 
        s.baseline?.toLowerCase().trim() === level.value.toLowerCase()
      ).length
    })
    
    setLevelCounts(counts)
    // Select ALL levels by default
    setSelectedLevels(levels.map(l => l.value))
  }, [students, assessmentType])

  if (!isOpen) return null

  const levels = assessmentType === "literacy" ? LITERACY_LEVELS : NUMERACY_LEVELS

  const handleLevelToggle = (levelValue) => {
    setSelectedLevels(prev => {
      if (prev.includes(levelValue)) {
        // Uncheck this level
        return prev.filter(l => l !== levelValue)
      } else {
        // Check this level
        return [...prev, levelValue]
      }
    })
  }

  const handleSelectAll = () => {
    setSelectedLevels(levels.map(l => l.value))
  }

  const handleExport = async () => {
    if (selectedLevels.length === 0) {
      alert("Please select at least one level")
      return
    }
    
    setDownloading(true)
    try {
      // Pass null when all levels selected (export all), otherwise pass selected array
      const allLevelValues = levels.map(l => l.value)
      const isAllSelected = selectedLevels.length === allLevelValues.length
      const levelsToExport = isAllSelected ? null : selectedLevels
      
      await onExport(levelsToExport)
      onClose()
    } catch (error) {
      console.error("Export error:", error)
      alert(`Error exporting: ${error.message || "Unknown error"}`)
    } finally {
      setDownloading(false)
    }
  }

  const totalStudents = students.length
  const selectedCount = selectedLevels.reduce((sum, level) => sum + (levelCounts[level] || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background-lighter rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-primary-2" />
            <h2 className="text-xl font-semibold">Export Students</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-background transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Scrollable with hidden scrollbar */}
        <div className="p-6 overflow-y-auto scrollbar-hide">
          <p className="text-gray-300 mb-4">
            Select which competency levels to include in the export. 
            Each student&apos;s assessment duration will be included.
          </p>

          {/* Assessment Type Badge */}
          <div className="mb-6">
            <span className="text-sm text-gray-400">Assessment Type: </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              assessmentType === "literacy" 
                ? "bg-primary-2/20 text-primary-2" 
                : "bg-secondary-2/20 text-secondary-2"
            }`}>
              {assessmentType === "literacy" ? "Literacy" : "Numeracy"}
            </span>
          </div>

          {/* Select All Button */}
          <div className="mb-4">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-3 p-3 w-full bg-background rounded-lg border border-gray-700 hover:border-gray-600 transition-all"
            >
              <div className="w-4 h-4 rounded-full border-2 border-gray-400 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-2" />
              </div>
              <div className="flex-1 text-left">
                <span className="font-medium">All Students</span>
                <p className="text-sm text-gray-400">{totalStudents} students total</p>
              </div>
            </button>
          </div>

          {/* Level Selection - Scrollable with hidden scrollbar */}
          <div className="mb-4">
            <h3 className="font-medium mb-3 text-sm text-gray-300">Filter by Competency Level:</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
              {levels.map((level) => {
                const count = levelCounts[level.value] || 0
                const isSelected = selectedLevels.includes(level.value)
                
                return (
                  <div
                    key={level.value}
                    onClick={() => count > 0 && handleLevelToggle(level.value)}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                      ${isSelected
                        ? 'border-primary-2 bg-primary-2/10'
                        : 'border-gray-700 hover:border-gray-600'
                      }
                      ${count === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className={`
                      w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                      ${isSelected ? 'border-primary-2 bg-primary-2' : 'border-gray-400'}
                    `}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium block">{level.label}</span>
                      <span className="text-xs text-gray-400">{count} students</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full border ${level.color}`}>
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="p-3 bg-background rounded-lg border border-gray-700">
            <p className="text-sm text-gray-300">
              Will export: <span className="font-semibold text-white">{selectedCount}</span> student{selectedCount !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Includes: Student ID, Name, Age, Gender, Competency Level, Duration
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={downloading || selectedCount === 0}
            className={`
              flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-all
              ${downloading || selectedCount === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-primary-2 hover:bg-blue-500 text-white'
              }
            `}
          >
            {downloading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export {selectedCount} Student{selectedCount !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}