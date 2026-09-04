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
import { useBarriers } from "@/hooks/stats/useBarriers"
import { useStudentImprovement } from "@/hooks/stats/useStudentImprovement"
import { useAttendanceOverview } from "@/hooks/stats/useAttendanceOverview"
import { useAssessmentHealth } from "@/hooks/stats/useAssessmentHealth"
import { useStudentLevels } from "@/hooks/stats/useStudentLevels"
import { useNumeracyLevels } from "@/hooks/stats/useNumeracyLevels"
import { useDemographicsLevels } from "@/hooks/stats/Usedemographicslevels"
import { useSelector } from "react-redux"
import DurationStats from "../Welcome/DurationStats"

export default function SchoolDetailContent({ 
  school, 
  organizationId, 
  projectId,
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

  // Student Levels Hook (Literacy)
  const {
    data: literacyLevelsData,
    loading: literacyLoading,
    error: literacyError,
    fetchData: fetchLiteracyLevels
  } = useStudentLevels({
    organizationId,
    projectId,
    schoolId: school?.id
  })

  // Numeracy Levels Hook
  const {
    data: numeracyLevelsData,
    loading: numeracyLoading,
    error: numeracyError,
    fetchData: fetchNumeracyLevels
  } = useNumeracyLevels({
    organizationId,
    projectId,
    schoolId: school?.id
  })

  // Demographics (grade / age / gender cross-tab) — scoped to this school
  const {
    data: demographicsData,
    loading: demographicsLoading,
    error: demographicsError,
    fetchData: fetchDemographicsLevels
  } = useDemographicsLevels({
    organizationId,
    projectId,
    schoolId: school?.id
  })

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showStudentUploadModal, setShowStudentUploadModal] = useState(false)
  const [levelType, setLevelType] = useState("literacy")
  const dropdownRef = useRef(null)

  const [assessmentType, setAssessmentType] = useState("Literacy") 
  const {
    loading: barrierLoading,
    error: barrierError,
    data: barriersData,
    fetchData: refetchBarriers 
  } = useBarriers({
    organizationId,
    projectId,
    schoolId: school?.id,
    type: assessmentType.toLowerCase(), 
  })

  // Assessment Health
  const {
    loading: healthLoading,
    error: healthError,
    data: healthData,
    fetchData: refetchHealth // Changed from refetch to fetchData
  } = useAssessmentHealth({
    organizationId,
    projectId,
    schoolId: school?.id
  })

  // Attendance Overview
  const {
    loading: attendanceLoading,
    error: attendanceError,
    data: attendanceData,
    fetchData: refetchAttendance // Changed from refetch to fetchData
  } = useAttendanceOverview({
    organizationId,
    projectId,
    schoolId: school?.id
  })

  // Program Impact
  const {
    loading: impactLoading,
    error: impactError,
    data: impactData,
    fetchData: refetchImpact // Changed from refetch to fetchData
  } = useStudentImprovement({
    organizationId,
    projectId,
    schoolId: school?.id
  })

  // Fetch school-level student stats when school loads
  useEffect(() => {
    if (organizationId && projectId && school?.id) {
      fetchSchoolStats(organizationId, projectId, school.id)
        .catch(err => console.error("Failed to fetch school stats:", err))
    }
  }, [organizationId, projectId, school?.id, fetchSchoolStats])

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
      // const updatedSchool = await getSchoolById(projectId, school.id)
      // onSchoolUpdated(updatedSchool)

      // Refresh student levels stats after upload
      await fetchSchoolStats(organizationId, projectId, school.id)
      
      // Also refresh the new hooks
      if (levelType === "literacy") {
        await fetchLiteracyLevels()
      } else {
        await fetchNumeracyLevels()
      }
      await fetchDemographicsLevels()
      await refetchBarriers()
      await refetchHealth()
      await refetchAttendance()
      await refetchImpact()
    } catch (err) {
      console.error("Error after students added:", err)
    }
  }

  const handleRefresh = async () => {
    if (!organizationId || !projectId || !school?.id) return
    try {
      await refreshSchoolStats(organizationId, projectId, school.id)
      
      // Also refresh the new hooks
      if (levelType === "literacy") {
        await fetchLiteracyLevels()
      } else {
        await fetchNumeracyLevels()
      }
      await fetchDemographicsLevels()
      await refetchBarriers()
      await refetchHealth()
      await refetchAttendance()
      await refetchImpact()
    } catch (err) {
      console.error("Failed to refresh school stats:", err)
    }
  }

  // Prepare chart data (use data from new hooks with fallback to old stats)
const chartData = (() => {
  const source = levelType === "literacy"
    ? (literacyLevelsData || studentLevelsStats?.literacy)
    : (numeracyLevelsData || studentLevelsStats?.numeracy);

  if (!source) return [];

  const baseline = source.baseline || {};
  const midline = source.midline || {};  // Added midline
  const endline = source.endline || {};

  // Get all unique levels from all three periods
  const allLevels = new Set([
    ...Object.keys(baseline),
    ...Object.keys(midline),
    ...Object.keys(endline)
  ]);

  let levels = Array.from(allLevels);
  
  // If no data at all, use default levels
  if (levels.length === 0) {
    levels = levelType === "literacy"
      ? ["beginner", "letter", "word", "paragraph", "story", "above"]
      : ["beginner", "number_recognition", "addition", "subtraction", "multiplication", "division"];
  }

  const levelOrder = {
    literacy: { 
      "non-reader": 0, 
      "beginner": 0, 
      "letter": 1, 
      "word": 2, 
      "paragraph": 3, 
      "story": 4, 
      "reading-comprehension": 4, 
      "above": 5 
    },
    numeracy: { 
      "beginner": 0, 
      "number_recognition": 1, 
      "addition": 2, 
      "subtraction": 3, 
      "multiplication": 4, 
      "division": 5 
    }
  };

  const orderMap = levelOrder[levelType] || {};
  const sorted = [...levels].sort((a, b) => (orderMap[a] ?? 99) - (orderMap[b] ?? 99));

  return sorted.map(level => ({
    level: level.charAt(0).toUpperCase() + level.slice(1).replace(/_/g, ' '),
    baseline: Number(baseline[level] || 0),
    midline: Number(midline[level] || 0),  // Added midline
    endline: Number(endline[level] || 0),  // Changed from 'current' to 'endline'
    rawLevel: level
  })).reverse();
})();

// Combine loading states
const combinedLevelsLoading = levelsLoading || literacyLoading || numeracyLoading;
const combinedLevelsError = levelsError || literacyError || numeracyError;

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

      {/* Student Levels Chart — full width, matches WelcomePage treatment */}
      <div className="mt-8">
        <StudentLevelsChart
          levelType={levelType}
          setLevelType={setLevelType}
          chartData={chartData}
          loading={combinedLevelsLoading}
          error={combinedLevelsError}
          onRefresh={handleRefresh}
          onDownload={() => console.log("Export school student levels")} // placeholder
          downloadLoading={false}
          isSuperAdmin={isSuperAdmin}
          organizationId={organizationId}
          projectId={projectId}
          schoolId={school?.id}
          demographicsData={demographicsData}
          demographicsLoading={demographicsLoading}
          demographicsError={demographicsError}
        />
      </div>

      {/* Key Barriers + Program Impact — side by side, matches WelcomePage */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <KeyBarriers
            organizationId={organizationId}
            loading={barrierLoading}
            error={barrierError}
            barriersData={barriersData}
            assessmentType={assessmentType}
            onAssessmentTypeChange={setAssessmentType}
            onFetchData={refetchBarriers}
          />
        </div>
        <div>
          <ProgramImpact
            organizationId={organizationId}
            loading={impactLoading}
            error={impactError}
            impactData={impactData}
            onFetchData={refetchImpact}
          />
        </div>
      </div>

      {/* Weekly Engagement — full width */}
      <div className="mt-8">
        <WeeklyEngagementChart organizationId={organizationId} />
      </div>

      {/* Assessment Health */}
      <div className="mt-8">
        <AssessmentHealth
          organizationId={organizationId}
          loading={healthLoading}
          error={healthError}
          data={healthData}
          onFetchData={refetchHealth}
        />
      </div>

      {/* Attendance Overview */}
      <div className="mt-8">
        <AttendanceOverview
          organizationId={organizationId}
          loading={attendanceLoading}
          error={attendanceError}
          data={attendanceData}
          onFetchData={refetchAttendance}
        />
      </div>

      {/* Duration Statistics */}
      <div className="mt-8">
        <DurationStats
          organizationId={organizationId}
          projectId={projectId}
          schoolId={school?.id}
          scope="school"
        />
      </div>

      {/* Student Upload Modal */}
      <StudentUploadModal
        isOpen={showStudentUploadModal}
        onClose={() => setShowStudentUploadModal(false)}
        organizationId={organizationId}
        projectId={projectId}
        schoolId={school?.id}
        onStudentsAdded={handleStudentsAdded}
      />
    </div>
  )
}