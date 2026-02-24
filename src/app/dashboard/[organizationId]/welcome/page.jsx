"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useSelector } from "react-redux"
import { useOrganizations } from "@/hooks/useOrganization"
import { useStats } from "@/hooks/stats/useStats"
import { useBarriers } from "@/hooks/stats/useBarriers"
import { useStudentImprovement } from "@/hooks/stats/useStudentImprovement"
import { useAttendanceOverview } from "@/hooks/stats/useAttendanceOverview"
import { useAssessmentHealth } from "@/hooks/stats/useAssessmentHealth"
import { useStudentLevels } from "@/hooks/stats/useStudentLevels"
import { useNumeracyLevels } from "@/hooks/stats/useNumeracyLevels"
import {
  Info,
  X,
  Users,
  School,
  GraduationCap,
} from "lucide-react"
import Header from "@/components/Welcome/Header"
import DashboardLayout from "../DashboardLayout"
import GetStarted from "@/components/Welcome/GetStarted"
import HowItWorks from "@/components/Welcome/HowItWorks"
import StudentLevelsChart from "@/components/Welcome/StudentLevelChart"
import KeyBarriers from "@/components/Welcome/KeyBarriers"
import WeeklyEngagementChart from "@/components/Welcome/WeeklyEngagementChart"
import ProgramImpact from "@/components/Welcome/ProgramImpact"
import AssessmentHealth from "@/components/Welcome/AssessmentHealth"
import AttendanceOverview from "@/components/Welcome/AttendanceOverview"
import StatsCard from "@/components/ProjectDetails/StatsCard"

// Chart data utilities (unchanged)
const ChartDataFormatter = {
  formatLevelName: (level) => {
    if (!level) return "Unknown"
    const special = {
      "non-reader": "Non-Reader",
      "reading-comprehension": "Reading Comprehension",
      "beginner": "Beginner",
      "letter": "Letter",
      "word": "Word",
      "paragraph": "Paragraph",
      "story": "Story",
      "above": "Above",
      "number_recognition": "Number Recognition",
      "addition": "Addition",
      "subtraction": "Subtraction",
      "multiplication": "Multiplication",
      "division": "Division",
    }
    if (special[level]) return special[level]
    return level.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
  }
}

const ChartDataParser = {
  safeNumber: (v) => {
    if (v == null || v === '' || v === undefined) return 0
    const n = Number(v)
    return isNaN(n) || !isFinite(n) || n < 0 ? 0 : n
  }
}

const ChartDataTransformer = {
  transformData: (data, levelType) => {
    if (!data || typeof data !== 'object') return []

    const baseKey  = levelType === "literacy" ? "baseline" : "baseline_numeracy"
    const endKey   = levelType === "literacy" ? "endline"  : "endline_numeracy"

    const baseline = data[baseKey]  || {}
    const endline  = data[endKey]   || {}

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
    const sorted = [...levels].sort((a,b) => (orderMap[a] ?? 99) - (orderMap[b] ?? 99))

    return sorted.map(level => ({
      level: ChartDataFormatter.formatLevelName(level),
      baseline: ChartDataParser.safeNumber(baseline[level]),
      current:  ChartDataParser.safeNumber(endline[level]),
      rawLevel: level
    })).reverse()
  }
}

export default function WelcomePage() {
  const { organizationId } = useParams()
  const { handleFetchOrganizationById } = useOrganizations()
  const { user: currentUser } = useSelector((state) => state.auth)

  const isSuperAdmin = 
    currentUser?.role === "super_admin" || 
    currentUser?.role === "superadmin" || 
    currentUser?.role === "admin"

  // Use student levels hook instead of useStats
  const {
    data: studentLevelsData,
    loading: levelsLoading,
    error: levelsError,
    fetchData: fetchStudentLevels
  } = useStudentLevels({
    organizationId
  })

  // Use numeracy levels hook
  const {
    data: numeracyLevelsData,
    loading: numeracyLoading,
    error: numeracyError,
    fetchData: fetchNumeracyLevels
  } = useNumeracyLevels({
    organizationId
  })

  const [organization, setOrganization] = useState(null)
  const [showGuide, setShowGuide] = useState(false)
  const [generalStats, setGeneralStats] = useState({
    projects: "—",
    schools: "—",
    students: "—",
    teachers: "—",
  })

  const [levelType, setLevelType] = useState("literacy")
  const [downloadLoading, setDownloadLoading] = useState(false)

  
  const [assessmentType, setAssessmentType] = useState("Literacy") 
  const {
    loading: barrierLoading,
    error: barrierError,
    data: barriersData,
    fetchData: refetchBarriers
  } = useBarriers({
    organizationId,
    type: assessmentType.toLowerCase(), 
    projectId: null,
    schoolId: null
  })

  // Assessment Health
  const {
    loading: healthLoading,
    error: healthError,
    data: healthData,
    fetchData: refetchHealth
  } = useAssessmentHealth({
    organizationId,
    projectId: null,
    schoolId: null
  })

  // Attendance Overview
  const {
    loading: attendanceLoading,
    error: attendanceError,
    data: attendanceData,
    fetchData: refetchAttendance
  } = useAttendanceOverview({
    organizationId,
    projectId: null,
    schoolId: null
  })

  // Program Impact (Student Improvement)
  const {
    loading: impactLoading,
    error: impactError,
    data: impactData,
    fetchData: refetchImpact
  } = useStudentImprovement({
    organizationId,
    projectId: null,
    schoolId: null
  })

  // Fetch organization general info
  useEffect(() => {
    if (!organizationId) return

    const fetchOrg = async () => {
      try {
        const org = await handleFetchOrganizationById(organizationId)
        setOrganization(org)

        if (org) {
          setGeneralStats({
            projects: Number(org.total_projects ?? 0).toLocaleString(),
            schools: Number(org.total_schools ?? 0).toLocaleString(),
            students: Number(org.total_students ?? 0).toLocaleString(),
            teachers: Number(org.total_teachers ?? 0).toLocaleString(),
          })
        }
      } catch (err) {
        console.error("Failed to load organization info:", err)
      }
    }

    fetchOrg()
  }, [organizationId, handleFetchOrganizationById])

  // Prepare chart data based on level type
  const chartData = ChartDataTransformer.transformData(
    levelType === "literacy" ? studentLevelsData : numeracyLevelsData,
    levelType
  )

  const handleRefresh = async () => {
    if (!organizationId) return
    try {
      if (levelType === "literacy") {
        await fetchStudentLevels()
      } else {
        await fetchNumeracyLevels()
      }
    } catch (err) {
      console.error("Refresh failed:", err)
    }
  }

  const handleDownload = async () => {
    if (!organizationId) {
      alert("Please select an organization first")
      return
    }

    setDownloadLoading(true)

    try {
      const response = await fetch(
        `/api/export/student-performance?organization_id=${organizationId}`,
        { method: "GET" }
      )

      const contentType = response.headers.get("content-type") || ""

      if (contentType.includes("application/json")) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || "Download failed")
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url

      let filename = "student_performance.xlsx"
      const disposition = response.headers.get("Content-Disposition")
      if (disposition) {
        const filenameMatch = disposition.match(/filename\*?=["']?([^"']+)["']?/i)
        if (filenameMatch?.[1]) filename = decodeURIComponent(filenameMatch[1])
      }

      link.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`
      document.body.appendChild(link)
      link.click()

      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 100)
    } catch (error) {
      console.error("Download error:", error)
      alert(`Error downloading file: ${error.message || "Unknown error"}`)
    } finally {
      setDownloadLoading(false)
    }
  }

  const handleSchoolsClick = () => {
    console.log("Schools card clicked – add navigation/modal here if needed")
  }

  return (
    <DashboardLayout title="Welcome" organizationId={organizationId} currentSection={"home"}>
      <div className="min-h-screen text-foreground flex flex-col">
        <Header organizationName={organization?.name || "Loading..."} />

        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Quick Guide button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-2 px-4 py-2 bg-background-lighter border border-gray-600 hover:border-gray-500 rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              <Info className="h-5 w-5 text-primary-2" />
              Quick Guide
            </button>
          </div>

          {/* Stats Cards – using StatsCard with lucide-react icons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-10">
            <StatsCard
              icon={<GraduationCap className="w-6 h-6" />}
              label="Learners Reached"
              value={generalStats.students}
              iconColor="text-secondary-2"
              valueColor="text-secondary-2"
            />

            <StatsCard
              icon={<School className="w-6 h-6" />}
              label={
                <span>
                  Schools in{" "}
                  <span className="font-bold text-primary-3">
                    {generalStats.projects}
                  </span>{" "}
                  {Number(generalStats.projects.replace(/,/g, "")) === 1 ? "Project" : "Projects"}
                </span>
              }
              value={generalStats.schools}
              iconColor="text-primary-3"
              valueColor="text-primary-3"
              onClick={handleSchoolsClick}
              clickable={true}
            />

            <StatsCard
              icon={<Users className="w-6 h-6" />}
              label="Teachers"
              value={generalStats.teachers}
              iconColor="text-primary-3"
              valueColor="text-primary-3"
            />
          </div>

          {/* Student Levels Chart + Key Barriers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <div className="lg:col-span-2">
              <StudentLevelsChart
                levelType={levelType}
                setLevelType={setLevelType}
                chartData={chartData}
                loading={levelsLoading || numeracyLoading}
                error={levelsError || numeracyError}
                onRefresh={handleRefresh}
                onDownload={handleDownload}
                downloadLoading={downloadLoading}
                isSuperAdmin={isSuperAdmin}
                organizationId={organizationId}
              />
            </div>
            <div className="lg:col-span-1">
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
          </div>

          {/* Weekly Engagement + Program Impact */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <div className="lg:col-span-2">
              <WeeklyEngagementChart organizationId={organizationId} />
            </div>
            <div className="lg:col-span-1">
              <ProgramImpact
                organizationId={organizationId}
                loading={impactLoading}
                error={impactError}
                impactData={impactData}
                onFetchData={refetchImpact}
              />
            </div>
          </div>

          {/* Assessment Health */}
          <div className="mb-10">
            <AssessmentHealth
              organizationId={organizationId}
              loading={healthLoading}
              error={healthError}
              data={healthData}
              onFetchData={refetchHealth}
            />
          </div>

          {/* Attendance Overview */}
          <div className="mb-10">
            <AttendanceOverview
              organizationId={organizationId}
              loading={attendanceLoading}
              error={attendanceError}
              data={attendanceData}
              onFetchData={refetchAttendance}
            />
          </div>
        </main>

        {/* Quick guide modal */}
        {showGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-background-lighter rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700 flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold">Quick Start Guide</h2>
                <button
                  onClick={() => setShowGuide(false)}
                  className="p-2 rounded-full hover:bg-background transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                <GetStarted organizationId={organizationId} />
                <hr className="border-t border-gray-700 my-10" />
                <HowItWorks />
              </div>
              <div className="px-6 py-4 border-t border-gray-700 flex justify-end">
                <button
                  onClick={() => setShowGuide(false)}
                  className="px-5 py-2.5 bg-primary-2 text-white rounded-xl hover:bg-blue-500 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}