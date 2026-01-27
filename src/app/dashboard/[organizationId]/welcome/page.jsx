"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { useOrganizations } from "@/hooks/useOrganization"
import { useProjects } from "@/hooks/UseProjects"
import { useLiteracyMetrics } from "@/hooks/metrics/useLiteracyMetrics"
import { useTeacherClassroomMetrics } from "@/hooks/metrics/useTeacherClassroomMetrics"
import {
  InformationCircleIcon,
  UsersIcon,
  BookOpenIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"
import Header from "@/components/Welcome/Header"
import DashboardLayout from "../DashboardLayout"
import GetStarted from "@/components/Welcome/GetStarted"
import HowItWorks from "@/components/Welcome/HowItWorks"
import LearningMetricsCard from "@/components/Welcome/LearningMetricsCard"
import TeacherClassroomMetricsCard from "@/components/Welcome/TeacherClassroomMetricsCard"

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
    ratio: "—",
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

          const ratio = teachers > 0 ? (students / teachers).toFixed(2) : "—"

          setStats({
            projects: projects.toLocaleString(),
            schools: schools.toLocaleString(),
            students: students.toLocaleString(),
            teachers: teachers.toLocaleString(),
            ratio,
          })
        }
      } catch (err) {
        console.error("Failed to load organization stats:", err)
      }
    }

    fetchData()
  }, [organizationId, handleFetchOrganizationById])

  // ------------------- Fetch Metrics -------------------
  const literacyMetrics = useLiteracyMetrics(organizationId)
  const teacherMetrics = useTeacherClassroomMetrics(organizationId)

  const goTo = (path) => path && router.push(path)

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

          {/* Organization stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-10">
            {[
              { label: "Projects", value: stats.projects },
              { label: "Schools", value: stats.schools },
              { label: "Students", value: stats.students },
              { label: "Teachers", value: stats.teachers },
              { label: "Instructor/Student Ratio", value: stats.ratio },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-background-lighter rounded-2xl p-5 border border-gray-700 text-center"
              >
                <div className="text-3xl md:text-4xl font-bold">{item.value}</div>
                <div className="text-sm text-gray-400 mt-2">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Learning metrics card */}
            <LearningMetricsCard
              metrics={literacyMetrics}
              onClick={() =>
                goTo(`/dashboard/${organizationId}/analytics/learning-performance`)
              }
            />

            {/* Teacher metrics card */}
            <TeacherClassroomMetricsCard
              metrics={teacherMetrics}
              onClick={() =>
                goTo(`/dashboard/${organizationId}/analytics/teacher-metrics`)
              }
            />

            {/* Engagement card */}
            <div
              onClick={() => goTo(`/dashboard/${organizationId}/analytics/engagement`)}
              className="bg-background-lighter p-6 rounded-2xl border border-gray-700 hover:border-primary-2 hover:shadow-lg transition-all cursor-pointer flex flex-col h-full"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 bg-background rounded-xl">
                  <UsersIcon className="h-6 w-6 text-primary-2" />
                </div>
                <h3 className="font-semibold text-xl">Engagement Metrics</h3>
              </div>
              <div className="space-y-4 flex-grow">
                <div className="flex justify-between text-base">
                  <span className="text-gray-300">Daily Active Users</span>
                  <span className="font-medium">1,234</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-gray-300">Avg. session time</span>
                  <span className="font-medium">24m</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-gray-300">Completion rate</span>
                  <span className="font-medium">82%</span>
                </div>
              </div>
              <div className="mt-6 text-sm text-primary-2 hover:text-primary-1 transition-colors">
                View detailed report →
              </div>
            </div>
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
