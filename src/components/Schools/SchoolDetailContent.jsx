"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Upload, RefreshCw } from "lucide-react"
import SchoolDetailStats from "./SchoolDetailStats"
import StudentUploadModal from "@/components/ui/StudentUploadModal"
import StudentLevelsChart from "@/components/Welcome/StudentLevelChart"
import { useStats } from "@/hooks/stats/useStats"
import { useSelector } from "react-redux"

export default function SchoolDetailContent({ 
  school, 
  organizationId, 
  onSchoolUpdated 
}) {
  const { user: currentUser } = useSelector((state) => state.auth)
  const isSuperAdmin = 
    currentUser?.role === "super_admin" || 
    currentUser?.role === "superadmin" || 
    currentUser?.role === "admin"

  const {
    stats: studentLevelsStats,
    loading: levelsLoading,
    error: levelsError,
    fetchSchoolStats,
    refreshSchoolStats,
  } = useStats()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showStudentUploadModal, setShowStudentUploadModal] = useState(false)
  const [levelType, setLevelType] = useState("literacy")
  const dropdownRef = useRef(null)

  // Fetch school-level student stats when school loads
  useEffect(() => {
    if (organizationId && school?.projectId && school?.id) {
      fetchSchoolStats(organizationId, school.projectId, school.id)
        .catch(err => console.error("Failed to fetch school stats:", err))
    }
  }, [organizationId, school?.projectId, school?.id, fetchSchoolStats])

  // Click outside handler for dropdown
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
      // Optional: refresh school general info if needed
      // const updatedSchool = await getSchoolById(school.projectId, school.id)
      // onSchoolUpdated(updatedSchool)

      // Refresh student levels stats after upload
      await fetchSchoolStats(organizationId, school.projectId, school.id)
    } catch (err) {
      console.error("Error after students added:", err)
    }
  }

  const handleRefresh = async () => {
    if (!organizationId || !school?.projectId || !school?.id) return
    try {
      await refreshSchoolStats(organizationId, school.projectId, school.id)
    } catch (err) {
      console.error("Failed to refresh school stats:", err)
    }
  }

  // Prepare chart data (same transformation as before)
  const chartData = (() => {
    const source = levelType === "literacy"
      ? studentLevelsStats?.literacy
      : studentLevelsStats?.numeracy

    if (!source) return []

    const baseline = source.baseline || {}
    const endline  = source.endline  || {}

    let levels = Object.keys(baseline)
    if (levels.length === 0) {
      levels = levelType === "literacy"
        ? ["beginner", "letter", "word", "paragraph", "story", "above"]
        : ["beginner", "number_recognition", "addition", "subtraction", "multiplication", "division"]
    }

    const levelOrder = {
      literacy: { "non-reader":0, "beginner":0, "letter":1, "word":2, "paragraph":3, "story":4, "reading-comprehension":4, "above":5 },
      numeracy: { "beginner":0, "number_recognition":1, "addition":2, "subtraction":3, "multiplication":4, "division":5 }
    }

    const orderMap = levelOrder[levelType] || {}
    const sorted = [...levels].sort((a, b) => (orderMap[a] ?? 99) - (orderMap[b] ?? 99))

    return sorted.map(level => ({
      level: level.charAt(0).toUpperCase() + level.slice(1),
      baseline: Number(baseline[level] || 0),
      current: Number(endline[level] || 0),
      rawLevel: level
    })).reverse()
  })()

  return (
    <div className="p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          {school?.name || "School Details"}
        </h1>

        {/* Actions Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 bg-background-light hover:bg-background-lighter text-foreground font-medium px-4 py-2 rounded-xl border border-gray-600 shadow-md hover:shadow-lg transition-all"
          >
            <span>Actions</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-background-light border border-gray-600 rounded-2xl shadow-xl z-10">
              <ul className="py-1">
                <li>
                  <button
                    onClick={handleUploadStudents}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-background-lighter transition-colors rounded-lg mx-1 my-1"
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

      {/* Student Levels Chart */}
      <div className="mt-8">
        <StudentLevelsChart
          levelType={levelType}
          setLevelType={setLevelType}
          chartData={chartData}
          loading={levelsLoading}
          error={levelsError}
          onRefresh={handleRefresh}
          onDownload={() => console.log("Export school student levels")} // placeholder
          downloadLoading={false}
          isSuperAdmin={isSuperAdmin}
        />
      </div>

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