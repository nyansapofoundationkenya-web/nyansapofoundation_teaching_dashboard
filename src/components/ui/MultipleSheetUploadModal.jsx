"use client"

import { useState } from "react"
import { useMultiSheetUpload } from "@/hooks/useMultipleSheetUpload"
import { Download, Info, FileSpreadsheet, Users, X } from "lucide-react"
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
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Define the column headers
    const headers = ["No", "Name", "Grade", "Age", "Sex"];

    // Sample data for each sheet
    const sampleData = [
      ["1", "John Doe", "4", "10", "Male"],
      ["2", "Jane Smith", "3", "11", "Female"],
      ["3", "Bob Johnson", "5", "", "Male"]
    ];

    // Create three sheets with different school names
    const schoolNames = ["school name 1", "school name 2", "school name 3"];
    
    schoolNames.forEach((schoolName) => {
      // Create worksheet data with headers and sample data
      const worksheetData = [headers, ...sampleData];
      
      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Add worksheet to workbook with school name as sheet name
      XLSX.utils.book_append_sheet(workbook, worksheet, schoolName);
    });

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, "student_data_template.xlsx");
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
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50" onClick={handleClose}></div>

      <div className="relative w-full max-w-2xl bg-background-light rounded-2xl shadow-xl max-h-[90vh] overflow-auto m-4 border border-gray-600">
        <div className="flex justify-between items-center p-4 border-b border-gray-600">
          <h2 className="text-lg font-semibold text-foreground">Upload Student Data</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-background-lighter rounded-xl transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4">
          {uploadResults ? (
            <div className="space-y-3">
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary-2/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-secondary-2/30">
                  <FileSpreadsheet className="w-8 h-8 text-secondary-2" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Upload Successful!</h3>
                <p className="text-sm text-gray-300 mb-3">
                  Processed {uploadResults.totalSheets} sheets with student data
                </p>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {uploadResults.results.map((result, index) => (
                  <div key={index} className="bg-background-lighter p-3 rounded-xl border border-gray-600">
                    <h4 className="font-medium text-foreground mb-2 text-sm">{result.sheetName}</h4>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary-2" />
                        <span>{result.studentsCount} students</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleClose}
                className="w-full bg-primary-3 hover:bg-primary-3/90 text-primary-1 font-semibold py-2 px-4 rounded-xl transition-colors shadow-md hover:shadow-lg"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {loading && (
                <div className="mb-4 bg-primary-2/20 p-3 rounded-xl border border-primary-2/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-2"></div>
                    <span className="text-sm font-medium text-primary-2">
                      Processing sheet {progress.current} of {progress.total}
                    </span>
                  </div>
                  {progress.sheet && <p className="text-xs text-primary-2">Current: {progress.sheet}</p>}
                  <div className="w-full bg-primary-2/30 rounded-full h-2 mt-2">
                    <div
                      className="bg-primary-2 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">Bulk Upload Student Data</h3>
                  <p className="text-sm text-gray-300 mb-3">
                    Upload an Excel file with multiple sheets containing student data. Each sheet should
                    represent a different school and contain properly formatted student data.
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="flex items-center text-sm px-3 py-1.5 bg-primary-3 hover:bg-primary-3/90 text-primary-1 font-semibold rounded-xl transition-colors shadow-md"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel Template
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRequirements((prev) => !prev)}
                    className="flex items-center text-sm px-3 py-1.5 border border-gray-500 rounded-xl text-gray-300 hover:bg-background-lighter transition-colors"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Format Requirements
                  </button>
                </div>

                {showRequirements && (
                  <div className="bg-background-lighter p-3 rounded-xl border border-gray-600">
                    <p className="text-sm font-medium text-foreground mb-2">Excel File Requirements:</p>
                    <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                      <li>
                        <strong>Sheet Names:</strong> Each sheet should be named with the school name (e.g., "school name 1", "school name 2", etc.)
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
                        <strong>Column C:</strong> Grade
                      </li>
                      <li>
                        <strong>Column D:</strong> Age (optional)
                      </li>
                      <li>
                        <strong>Column E:</strong> Sex (Male/Female)
                      </li>
                    </ul>
                    <div className="mt-2 p-2 bg-primary-3/20 border border-primary-3/30 rounded-xl">
                      <p className="text-xs text-primary-1">
                        <strong>Important:</strong> The template includes three sample sheets. You can add more sheets as needed, but each sheet name must match an existing school name in your system.
                        Students will be saved to their respective school's subcollection.
                      </p>
                    </div>
                  </div>
                )}

                <div className="border-dashed border-2 border-gray-500 rounded-xl p-6 text-center">
                  <label className="cursor-pointer">
                    <FileSpreadsheet className="w-12 h-12 text-primary-2 mx-auto mb-3" />
                    <span className="text-primary-2 font-medium block mb-2">Click to upload Excel file</span>
                    <span className="text-gray-300 text-xs">
                      Support for .xlsx files with multiple sheets. Use the template for proper format.
                    </span>
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
                  <div className="text-sm text-gray-300 bg-primary-2/20 p-3 rounded-xl border border-primary-2/30">
                    <p>
                      Selected file: <span className="font-medium text-primary-2">{formState.file.name}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      File size: {(formState.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-xs text-primary-2 mt-1">
                      Sheets detected: {sheetNames.join(", ")}
                    </p>
                  </div>
                )}

                {error && (
                  <div className="text-red-400 text-sm bg-red-500/20 p-3 rounded-xl border border-red-500/30">
                    <p className="font-medium">Upload Error:</p>
                    <p>{error}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-3 py-1.5 border border-gray-500 rounded-xl text-foreground hover:bg-background-lighter transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formState.file || !isValidated}
                    className="flex-1 px-3 py-1.5 bg-primary-3 hover:bg-primary-3/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-primary-1 font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg"
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