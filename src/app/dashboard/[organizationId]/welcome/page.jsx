"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { useOrganizations } from "@/hooks/useOrganization"
import { useProjects } from "@/hooks/UseProjects"
import {
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"
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

export default function WelcomePage() {
  const { organizationId } = useParams()
  const router = useRouter()
  const { handleFetchOrganizationById } = useOrganizations()
  const { createProject } = useProjects(organizationId)

  const [organization, setOrganization] = useState(null)
  const [showGuide, setShowGuide] = useState(false)
  const [stats, setStats] = useState({
    projects: "—",
    schools: "—",
    students: "—",
    teachers: "—",
    // ratio: "—", // Commented out
  })

  const { user: currentUser } = useSelector((state) => state.auth)
  const isAdminOrSuperAdmin =
    currentUser?.role === "admin" || currentUser?.role === "super_admin"

  // ------------------- Fetch Organization Stats -------------------
  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) return
      try {
        const org = await handleFetchOrganizationById(organizationId)
        setOrganization(org)

        if (org) {
          const projects = Number(org.total_projects ?? 0)
          const schools = Number(org.total_schools ?? 0)
          const students = Number(org.total_students ?? 0)
          const teachers = Number(org.total_teachers ?? 0)
          // const ratio = teachers > 0 ? (students / teachers).toFixed(2) : "—" // Commented out

          setStats({
            projects: projects.toLocaleString(),
            schools: schools.toLocaleString(),
            students: students.toLocaleString(),
            teachers: teachers.toLocaleString(),
            // ratio, // Commented out
          })
        }
      } catch (err) {
        console.error("Failed to load organization stats:", err)
      }
    }

    fetchData()
  }, [organizationId, handleFetchOrganizationById])

    const statsConfig = [
    { 
      label: "Learners Reached", 
      value: stats.students,
      color: "text-secondary-2"
    },
     { 
      label: (
        <span>
          Schools in <span className="text-primary-3 font-bold">{stats.projects} </span>Projects
        </span>
      ),
      value: stats.schools,
      color: "text-primary-3"
    },
    { 
      label: "Teachers", 
      value: stats.teachers,
      color: "text-primary-3"
    },
  ]

  return (
    <DashboardLayout title="Welcome" organizationId={organizationId}>
      <div className="min-h-screen text-foreground flex flex-col">
        <Header organizationName={organization?.name || "Loading..."} />

        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Quick Guide button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-2 px-4 py-2 bg-background-lighter border border-gray-600 hover:border-gray-500 rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              <InformationCircleIcon className="h-5 w-5 text-primary-2" />
              Quick Guide
            </button>
          </div>

          {/* Organization stats - Redesigned */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-10">
            {statsConfig.map((item, i) => (
              <div
                key={i}
                className="bg-background-lighter rounded-2xl p-6 border border-gray-700 text-center"
              >
                <div className={`text-3xl font-bold ${item.color}`}>
                  {item.value}
                </div>
                <hr className="border-t border-gray-600 my-4" />
                <div className="text-xl text-gray-400 tracking-wide">
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Student Level Distribution Chart + Key Barriers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {/* Left side - Student Levels Chart (takes 2 columns) */}
            <div className="lg:col-span-2">
              <StudentLevelsChart organizationId={organizationId} />
            </div>

            {/* Right side - Key Barriers (takes 1 column) */}
            <div className="lg:col-span-1">
              <KeyBarriers organizationId={organizationId} />
            </div>
          </div>

          {/* Weekly Engagement Chart + Program Impact */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {/* Left side - Weekly Engagement Chart (takes 2 columns) */}
            <div className="lg:col-span-2">
              <WeeklyEngagementChart organizationId={organizationId} />
            </div>

            {/* Right side - Program Impact (takes 1 column) */}
            <div className="lg:col-span-1">
              <ProgramImpact organizationId={organizationId} />
            </div>
          </div>

          {/* Assessment Health - Full width */}
          <div className="mb-10">
            <AssessmentHealth organizationId={organizationId} />
          </div>

          {/* Attendance Overview - Full width */}
          <div className="mb-10">
            <AttendanceOverview organizationId={organizationId} />
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
                  <XMarkIcon className="h-6 w-6" />
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