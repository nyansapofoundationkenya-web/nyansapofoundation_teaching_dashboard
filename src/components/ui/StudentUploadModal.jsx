"use client"

import { useState } from "react"
import { useSchools } from "@/hooks/useSchools"
import { Download, Info } from "lucide-react"
import * as XLSX from "xlsx"

export default function StudentUploadModal({ isOpen, onClose, organizationId, projectId, schoolId, onStudentsAdded }) {
  const [formState, setFormState] = useState({})
  const [showRequirements, setShowRequirements] = useState(false)
  const { addStudentsByCsv, loading, error } = useSchools(organizationId)

  if (!isOpen) return null

  const handleChange = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const file = formData.get("file")
    if (!file) {
      alert("Please select a CSV or Excel file to upload.")
      return
    }

    try {
      const result = await addStudentsByCsv(projectId, schoolId, file)
      if (result) {
        alert(result.message)
        setFormState({})
        // Refetch school data after successful upload
        if (onStudentsAdded) {
          await onStudentsAdded()
        }
        onClose()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const downloadTemplate = (format = 'excel') => {
    if (format === 'csv') {
      // Create a sample CSV template
      const csvContent = "name,class,gender,age,baseline,group\nJohn Doe,3,male,8,beginner,Group A\nJane Smith,4,female,9,intermediate,Group B"
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "students_template.csv"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } else {
      // Create Excel template
      const workbook = XLSX.utils.book_new();
      
      // Define the column headers
      const headers = ["name", "class", "gender", "age", "baseline", "group"];
      
      // Sample data
      const sampleData = [
        ["John Doe", "3", "male", "8", "beginner", "Group A"],
        ["Jane Smith", "4", "female", "9", "intermediate", "Group B"],
        ["Mike Johnson", "5", "male", "10", "advanced", "Group C"]
      ];
      
      // Create worksheet data with headers and sample data
      const worksheetData = [headers, ...sampleData];
      
      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
      
      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, "students_template.xlsx");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-grow" onClick={onClose}></div>

      <div className="w-full max-w-md bg-white shadow-lg h-full overflow-auto p-6 relative flex flex-col">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-xl text-gray-500 hover:text-black" aria-label="Close">
              ×
            </button>
            <h2 className="text-xl font-semibold text-gray-600">Upload students</h2>
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm px-4 py-1 border rounded text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
            <button
              type="submit"
              form="student-modal-form"
              className="text-sm px-4 py-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded"
              disabled={loading}
            >
              {loading ? "Uploading..." : "Submit"}
            </button>
          </div>
        </div>

        <form
          id="student-modal-form"
          onSubmit={handleSubmit}
          className="space-y-5 flex-1"
          encType="multipart/form-data"
        >
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Bulk Upload Students</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload an Excel or CSV file with student information. The file should have the following columns
              (case-insensitive): name, class, gender, age, baseline, group
            </p>
          </div>

          <div className="text-left flex gap-2 flex-wrap">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => downloadTemplate('excel')}
                className="flex items-center text-sm px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel Template
              </button>
              <button
                type="button"
                onClick={() => downloadTemplate('csv')}
                className="flex items-center text-sm px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV Template
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowRequirements((prev) => !prev)}
              className="flex items-center text-sm px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
            >
              <Info className="w-4 h-4 mr-2" />
              Field Requirements
            </button>
          </div>

          {showRequirements && (
            <div className="text-left bg-gray-100 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-800 mb-2">Field Requirements (case-insensitive):</p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>
                  <strong>name</strong> (required) - Student's full name
                </li>
                <li>
                  <strong>class</strong> (required) - Student's class (number between 1 and 12)
                </li>
                <li>
                  <strong>gender</strong> (required) - Student's gender (male/female/other)
                </li>
                <li>
                  <strong>age</strong> (optional) - Student's age
                </li>
                <li>
                  <strong>baseline</strong> (optional) - Student's learning baseline
                </li>
                <li>
                  <strong>group</strong> (optional) - Student's group assignment
                </li>
              </ul>
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> Only name, class, and gender are required fields. Age, baseline, and group are optional.
                </p>
              </div>
            </div>
          )}

          <div className="text-left border-dashed border-2 border-gray-300 rounded-lg p-8 flex items-center justify-center">
            <label className="flex flex-col items-center cursor-pointer">
              <svg className="w-12 h-12 text-blue-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12a1 1 0 01-1 1H9a1 1 0 01-1-1V8a1 1 0 011 1h6a1 1 0 011 1z"
                />
              </svg>
              <span className="text-blue-500 font-medium text-center">Click or drag file to this area to upload</span>
              <span className="text-gray-500 text-sm mt-2 text-center">
                Support for Excel (.xlsx, .xls) and CSV files
              </span>
              <input
                type="file"
                name="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => handleChange("file", e.target.files[0])}
              />
            </label>
          </div>

          {formState.file && (
            <div className="text-left text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p>
                Uploaded file: <span className="font-medium text-blue-700">{formState.file.name}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                File size: {(formState.file.size / 1024).toFixed(2)} KB
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Type: {formState.file.name.split('.').pop().toUpperCase()}
              </p>
            </div>
          )}

          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
        </form>
      </div>
    </div>
  )
}