"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Upload, RefreshCw } from "lucide-react"
import SchoolDetailStats from "./SchoolDetailStats"
import StudentUploadModal from "@/components/ui/StudentUploadModal"
import StudentLevelsChart from "@/components/Welcome/StudentLevelChart"
import KeyBarriers from "@/components/Welcome/KeyBarriers"
import WeeklyEngagementChart from "@/components/Welcome/WeeklyEngagementChart"
import ProgramImpact from "@/components/Welcome/ProgramImpact"
import AssessmentHealth from "@/components/Welcome/AssessmentHealth"
import AttendanceOverview from "@/components/Welcome/AttendanceOverview"
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

  // Dummy state for Key Barriers
  const [barrierLoading] = useState(false)
  const [barrierError] = useState(null)
  const [barriersData] = useState({
    top_3_missed: [
      { letter: "E", number: 5 },
      { letter: "F", number: 6 },
      { letter: "G", number: 7 },
    ],
    stats: { success_rate: 78 },
  })
  const [assessmentType, setAssessmentType] = useState("Literacy")

  // Dummy state for Assessment Health
  const [healthLoading] = useState(false)
  const [healthError] = useState(null)
  const [healthData] = useState({
  literacy: {
    completion_rate: 85,
    total_assessments: 450,
    total_students_completed: 450,
    total_students_assigned: 500,
  },
  numeracy: {
    completion_rate: 78,
    total_assessments: 390,
    total_students_completed: 390,
    total_students_assigned: 500,
  },
});


  // Dummy state for Attendance Overview
  const [attendanceLoading] = useState(false)
  const [attendanceError] = useState(null)
  const [attendanceData] = useState({
  today: {
    attendance_rate: 88,
    total_present: 440,
    total_students: 500,
    date: new Date().toISOString(),
    schools_took_attendance: 8,
    schools_pending_attendance: 2,
    total_schools: 10,
  },
  last_7_days: [
    { day: "Mon", attendance_rate: 85, total_present: 425, total_students: 500 },
    { day: "Tue", attendance_rate: 87, total_present: 435, total_students: 500 },
    { day: "Wed", attendance_rate: 90, total_present: 450, total_students: 500 },
    { day: "Thu", attendance_rate: 88, total_present: 440, total_students: 500 },
    { day: "Fri", attendance_rate: 86, total_present: 430, total_students: 500 },
    { day: "Sat", attendance_rate: 84, total_present: 420, total_students: 500 },
    { day: "Sun", attendance_rate: 89, total_present: 445, total_students: 500 },
  ],
  last_30_days: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - i * 86400000).toISOString(),
    attendance_rate: 80 + Math.random() * 10,
    total_present: 400 + Math.floor(Math.random() * 100),
    total_students: 500,
  })).reverse(),
  weekly_comparison: {
    this_week_avg: 87,
    last_week_avg: 84,
    change: 3,
    trend: "up",
  },
  monthly_comparison: {
    this_month_avg: 86,
    last_month_avg: 82,
    change: 4,
    trend: "up",
  },
});


  // Dummy state for Program Impact
  const [impactLoading] = useState(false)
  const [impactError] = useState(null)
  const [impactData] = useState({
    students_improved: 42,
    improvement_percentage: 72,
    students_assessed: 145,
    total_students: 160,
  })

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

      {/* Key Barriers + Student Levels Chart */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <KeyBarriers
            organizationId={organizationId}
            loading={barrierLoading}
            error={barrierError}
            barriersData={barriersData}
            assessmentType={assessmentType}
            onAssessmentTypeChange={setAssessmentType}
            onFetchData={() => console.log("Fetching barriers data for school")}
          />
        </div>
        <div className="lg:col-span-2">
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
      </div>

      {/* Weekly Engagement + Program Impact */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeeklyEngagementChart organizationId={organizationId} />
        </div>
        <div className="lg:col-span-1">
          <ProgramImpact
            organizationId={organizationId}
            loading={impactLoading}
            error={impactError}
            impactData={impactData}
            onFetchData={() => console.log("Fetching impact data for school")}
          />
        </div>
      </div>

      {/* Assessment Health */}
      <div className="mt-8">
        <AssessmentHealth
          organizationId={organizationId}
          loading={healthLoading}
          error={healthError}
          data={healthData}
          onFetchData={() => console.log("Fetching health data for school")}
        />
      </div>

      {/* Attendance Overview */}
      <div className="mt-8">
        <AttendanceOverview
          organizationId={organizationId}
          loading={attendanceLoading}
          error={attendanceError}
          data={attendanceData}
          onFetchData={() => console.log("Fetching attendance data for school")}
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