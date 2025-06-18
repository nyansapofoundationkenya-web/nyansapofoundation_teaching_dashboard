"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Upload } from "lucide-react"
import SchoolDetailStats from "./SchoolDetailStats"
import StudentUploadModal from "@/components/ui/StudentUploadModal"
import SchoolCharts from "./charts/SchoolCharts"
import { useSchools } from "@/hooks/useSchools"

export default function SchoolDetailContent({ school, organizationId, onSchoolUpdated }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showStudentUploadModal, setShowStudentUploadModal] = useState(false)
  const dropdownRef = useRef(null)
  const { getSchoolById } = useSchools(organizationId)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleUploadStudents = () => {
    setShowStudentUploadModal(true)
    setDropdownOpen(false)
  }

  const handleStudentsAdded = async () => {
    try {
      const updatedSchool = await getSchoolById(school.projectId, school.id)
      onSchoolUpdated(updatedSchool)
    } catch (err) {
      console.error("Error refetching school data:", err)
    }
  }

  return (
    <div className="p-6 bg-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{school?.name || "Nairobi Primary School"}</h1>

        {/* Actions Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg border shadow-sm transition-colors"
          >
            <span>Actions</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <ul className="py-1">
                <li>
                  <button
                    onClick={handleUploadStudents}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Students
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <SchoolDetailStats school={school} />

      {/* Additional content can be added here later */}
      <SchoolCharts schoolData={school}/>

      {/* Student Upload Modal */}
      <StudentUploadModal
        isOpen={showStudentUploadModal}
        onClose={() => setShowStudentUploadModal(false)}
        organizationId={organizationId}
        projectId={school?.projectId}
        schoolId={school?.id}
        onStudentsAdded={handleStudentsAdded}
      />
    </div>
  )
}