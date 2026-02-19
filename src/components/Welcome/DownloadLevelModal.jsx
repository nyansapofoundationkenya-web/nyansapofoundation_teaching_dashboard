// components/Welcome/DownloadLevelModal.jsx
"use client"

import { useState } from "react"
import { X, Download, Filter } from "lucide-react"

export default function DownloadLevelModal({
  isOpen,
  onClose,
  chartData,
  levelType,
  organizationId,
  projectId,
  schoolId,
  onDownload
}) {
  const [selectedLevels, setSelectedLevels] = useState([])
  const [downloadAll, setDownloadAll] = useState(true)
  const [downloading, setDownloading] = useState(false)

  if (!isOpen) return null

  const handleLevelToggle = (level) => {
    setSelectedLevels(prev => {
      if (prev.includes(level)) {
        return prev.filter(l => l !== level)
      } else {
        return [...prev, level]
      }
    })
    setDownloadAll(false)
  }

  const handleSelectAll = () => {
    setDownloadAll(true)
    setSelectedLevels([])
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const levels = downloadAll ? 'all' : selectedLevels.join(',')
      
      // Build URL with query parameters
      let url = `/api/export/student-performance?organization_id=${organizationId}`
      if (projectId) url += `&project_id=${projectId}`
      if (schoolId) url += `&school_id=${schoolId}`
      url += `&level_type=${levelType}`
      url += `&levels=${levels}`

      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || "Download failed")
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl

      // Get filename from Content-Disposition header
      let filename = `student_performance_${levelType}.xlsx`
      const disposition = response.headers.get("Content-Disposition")
      if (disposition) {
        const filenameMatch = disposition.match(/filename\*?=["']?([^"']+)["']?/i)
        if (filenameMatch?.[1]) filename = decodeURIComponent(filenameMatch[1])
      }

      link.download = filename
      document.body.appendChild(link)
      link.click()

      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(downloadUrl)
      }, 100)

      onClose()
    } catch (error) {
      console.error("Download error:", error)
      alert(`Error downloading file: ${error.message || "Unknown error"}`)
    } finally {
      setDownloading(false)
    }
  }

  const getLevelColor = (rawLevel) => {
    if (levelType === 'literacy') {
      const colors = {
        'non-reader': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        'beginner': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        'letter': 'bg-green-500/20 text-green-300 border-green-500/30',
        'word': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        'paragraph': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        'story': 'bg-red-500/20 text-red-300 border-red-500/30',
        'above': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
        'reading-comprehension': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
      }
      return colors[rawLevel] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    } else {
      const colors = {
        'beginner': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        'number_recognition': 'bg-green-500/20 text-green-300 border-green-500/30',
        'addition': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        'subtraction': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        'multiplication': 'bg-red-500/20 text-red-300 border-red-500/30',
        'division': 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      }
      return colors[rawLevel] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background-lighter rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-primary-2" />
            <h2 className="text-xl font-semibold">Download Students by Level</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-background transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <p className="text-gray-300 mb-4">
            Select the student levels you want to download. You can download all students or filter by specific levels.
          </p>

          {/* Level Type Indicator */}
          <div className="mb-6">
            <span className="text-sm text-gray-400">Assessment Type: </span>
            <span className="px-3 py-1 bg-primary-2/20 text-primary-2 rounded-full text-sm font-medium">
              {levelType === 'literacy' ? 'Literacy' : 'Numeracy'}
            </span>
          </div>

          {/* Download Options */}
          <div className="mb-6">
            <label className="flex items-center gap-3 p-3 bg-background rounded-lg border border-gray-700 cursor-pointer hover:bg-background-light transition-colors">
              <input
                type="radio"
                checked={downloadAll}
                onChange={handleSelectAll}
                className="w-4 h-4 text-primary-2"
              />
              <div>
                <span className="font-medium">All Students</span>
                <p className="text-sm text-gray-400">Download all students regardless of their current level</p>
              </div>
            </label>
          </div>

          {/* Level Selection */}
          <div className="mb-4">
            <h3 className="font-medium mb-3">Filter by Current Level:</h3>
            <div className="grid grid-cols-2 gap-3">
              {chartData.map((item) => (
                <label
                  key={item.rawLevel}
                  className={`
                    flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all
                    ${selectedLevels.includes(item.rawLevel)
                      ? 'border-primary-2 bg-primary-2/10'
                      : 'border-gray-700 hover:border-gray-600'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={selectedLevels.includes(item.rawLevel)}
                    onChange={() => handleLevelToggle(item.rawLevel)}
                    className="w-4 h-4 text-primary-2 rounded"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium block">{item.level}</span>
                    <span className="text-xs text-gray-400">{item.current} students</span>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full border ${getLevelColor(item.rawLevel)}`}>
                    {item.current}
                  </span>
                </label>
              ))}
            </div>
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
            onClick={handleDownload}
            disabled={downloading || (!downloadAll && selectedLevels.length === 0)}
            className={`
              flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-all
              ${downloading || (!downloadAll && selectedLevels.length === 0)
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
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download {downloadAll ? 'All Students' : `${selectedLevels.length} Level${selectedLevels.length !== 1 ? 's' : ''}`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}