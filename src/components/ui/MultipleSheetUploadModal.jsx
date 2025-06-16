"use client"

import { useState } from "react"
import { useMultiSheetUpload } from "@/hooks/useMultipleSheetUpload"
import { Download, Info, FileSpreadsheet, Users, Calendar, X } from "lucide-react"
import SchoolMatcher from "@/hooks/SchoolMatcher"
import * as XLSX from "xlsx"

/**
 * Multi-sheet upload modal component for project details page
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close modal callback
 * @param {string} props.organizationId - Organization ID
 * @param {string} props.projectId - Project ID
 * @param {Function} props.onUploadComplete - Callback when upload completes
 */
export default function MultiSheetUploadModal({ isOpen, onClose, organizationId, projectId, onUploadComplete }) {
  const [formState, setFormState] = useState({})
  const [showRequirements, setShowRequirements] = useState(false)
  const [uploadResults, setUploadResults] = useState(null)
  const [validationResults, setValidationResults] = useState(null)
  const [isValidated, setIsValidated] = useState(false)
  const [sheetNames, setSheetNames] = useState([])

  const { processMultiSheetFile, loading, error, progress } = useMultiSheetUpload(organizationId)

  if (!isOpen) return null

  const handleChange = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const file = formData.get("file")

    if (!file) {
      alert("Please select an Excel file to upload.")
      return
    }

    try {
      const result = await processMultiSheetFile(file, projectId)
      if (result.success) {
        setUploadResults(result)
        setFormState({})
        // Call the callback to refresh project data
        if (onUploadComplete) {
          onUploadComplete()
        }
      }
    } catch (err) {
      console.error("Upload failed:", err)
    }
  }

  const downloadTemplate = () => {
    const csvContent = `No,Name,Class,Sex,Baseline,Group,20-May Session 1,21-May Session 2,22-May Session 3,23-May Session 4
1,John Doe,4,Male,Beginner(Lit),Group 1,1,1,0,1
2,Jane Smith,3,Female,Letter,Group 1,1,0,1,1
3,Bob Johnson,5,Male,Beginner(Lit),Group 1,0,1,1,0`

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "student_attendance_template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleClose = () => {
    setUploadResults(null)
    setFormState({})
    onClose()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    handleChange("file", file)

    if (file) {
      try {
        // Preview sheet names for validation
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: "array" })
        setSheetNames(workbook.SheetNames)
        setIsValidated(false)
      } catch (error) {
        console.error("Error reading file:", error)
      }
    } else {
      setSheetNames([])
      setIsValidated(false)
    }
  }

  const handleValidationComplete = (allMatched, results) => {
    setValidationResults(results)
    setIsValidated(allMatched)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose}></div>

      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-auto m-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Upload Student Data</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {uploadResults ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload Successful!</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Processed {uploadResults.totalSheets} sheets with student and attendance data
                </p>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {uploadResults.results.map((result, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">{result.sheetName}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span>{result.studentsCount} students</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-500" />
                        <span>{result.attendanceCount} attendance records</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleClose}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {loading && (
                <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm font-medium text-blue-700">
                      Processing sheet {progress.current} of {progress.total}
                    </span>
                  </div>
                  {progress.sheet && <p className="text-xs text-blue-600">Current: {progress.sheet}</p>}
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" encType="multipart/form-data">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Bulk Upload Student Data</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload an Excel file with multiple sheets containing student attendance data. Each sheet should
                    represent a different school and group combination.
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="flex items-center text-sm px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-semibold rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRequirements((prev) => !prev)}
                    className="flex items-center text-sm px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Format Requirements
                  </button>
                </div>

                {showRequirements && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-800 mb-2">Excel File Requirements:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      <li>
                        <strong>Sheet Names:</strong> "SchoolName-GroupName" (e.g., "Makaaya Primary-Group 1")
                      </li>
                      <li>
                        <strong>School Matching:</strong> School name in sheet must exactly match existing school names
                      </li>
                      <li>
                        <strong>Column A:</strong> Student number
                      </li>
                      <li>
                        <strong>Column B:</strong> Student name (required)
                      </li>
                      <li>
                        <strong>Column C:</strong> Class/Grade
                      </li>
                      <li>
                        <strong>Column D:</strong> Sex (Male/Female)
                      </li>
                      <li>
                        <strong>Column E:</strong> Baseline level
                      </li>
                      <li>
                        <strong>Column F:</strong> Group assignment
                      </li>
                      <li>
                        <strong>Columns G+:</strong> Date headers with attendance (1=present, 0=absent)
                      </li>
                    </ul>
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs text-yellow-800">
                        <strong>Important:</strong> Students will be saved to their respective school's subcollection.
                        Make sure the school names in your Excel sheets exactly match the school names you've already
                        created in the system.
                      </p>
                    </div>
                  </div>
                )}

                <div className="border-dashed border-2 border-gray-300 rounded-lg p-8 text-center">
                  <label className="cursor-pointer">
                    <FileSpreadsheet className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                    <span className="text-blue-500 font-medium block mb-2">Click to upload Excel file</span>
                    <span className="text-gray-500 text-sm">Support for .xlsx and .xls files with multiple sheets</span>
                    <input type="file" name="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>

                {formState.file && sheetNames.length > 0 && (
                  <SchoolMatcher
                    organizationId={organizationId}
                    projectId={projectId}
                    sheetNames={sheetNames}
                    onValidationComplete={handleValidationComplete}
                  />
                )}

                {formState.file && (
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <p>
                      Selected file: <span className="font-medium text-blue-700">{formState.file.name}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      File size: {(formState.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    <p className="font-medium">Upload Error:</p>
                    <p>{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formState.file || !isValidated}
                    className="flex-1 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-800 font-semibold rounded-lg transition-colors"
                  >
                    {loading ? "Processing..." : !isValidated && formState.file ? "Validation Required" : "Upload Data"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
