"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSchoolStudents } from "@/hooks/useSchoolStudents"
import Sidebar from "@/components/Dashboard/SideBar"
import {
  GraduationCap,
  Calendar,
  CheckCircle,
  XCircle,
  BarChart3,
  ArrowLeft,
  Users,
  Target,
  Filter,
} from "lucide-react"
import { FiMenu, FiX } from "react-icons/fi"

export default function StudentsPage() {
  const { organizationId, projectId, schoolId } = useParams()
  const router = useRouter()
  const [selectedView, setSelectedView] = useState("students") // "students" or "sessions"
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [filterGroup, setFilterGroup] = useState("all")
  const [filterAttendance, setFilterAttendance] = useState("all")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const { students, attendance, loading, error, getStudentAttendance, getAttendanceStats, getAllSessions, schoolInfo } =
    useSchoolStudents(organizationId, projectId, schoolId)

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setSidebarOpen(!mobile)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleBack = () => {
    router.push(`/dashboard/${organizationId}/schools/${projectId}/${schoolId}`)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-blue-50">
        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleSidebar} />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {isMobile && sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="absolute top-4 right-4 z-50 bg-white p-2 rounded-full shadow-md"
              aria-label="Close menu"
            >
              <FiX className="w-5 h-5 text-indigo-600" />
            </button>
          )}
          <Sidebar organizationId={organizationId} />
        </div>

        {/* Main Content */}
        <div
          className={`
            flex-1 transition-all duration-300 ease-in-out
            ${!isMobile && sidebarOpen ? "ml-64" : "ml-0"}
          `}
        >
          <div className="min-h-screen p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              {isMobile && !sidebarOpen && (
                <button onClick={toggleSidebar} className="p-2 rounded-md shadow-sm" aria-label="Open menu">
                  <FiMenu className="w-5 h-5 text-indigo-600" />
                </button>
              )}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Students</h1>
            </div>

            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading students...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-blue-50">
        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleSidebar} />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {isMobile && sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="absolute top-4 right-4 z-50 bg-white p-2 rounded-full shadow-md"
              aria-label="Close menu"
            >
              <FiX className="w-5 h-5 text-indigo-600" />
            </button>
          )}
          <Sidebar organizationId={organizationId} />
        </div>

        {/* Main Content */}
        <div
          className={`
            flex-1 transition-all duration-300 ease-in-out
            ${!isMobile && sidebarOpen ? "ml-64" : "ml-0"}
          `}
        >
          <div className="min-h-screen p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              {isMobile && !sidebarOpen && (
                <button onClick={toggleSidebar} className="p-2 rounded-md shadow-sm" aria-label="Open menu">
                  <FiMenu className="w-5 h-5 text-indigo-600" />
                </button>
              )}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Students</h1>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 font-medium">Error loading students</p>
              <p className="text-red-500 text-sm mt-2">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const sessions = getAllSessions()
  const groups = [...new Set(students.map((s) => s.group).filter(Boolean))]

  // Filter students
  const filteredStudents = students.filter((student) => {
    const groupMatch = filterGroup === "all" || student.group === filterGroup
    const stats = getAttendanceStats(student.id)

    let attendanceMatch = true
    if (filterAttendance === "high") attendanceMatch = stats.attendanceRate >= 80
    else if (filterAttendance === "medium") attendanceMatch = stats.attendanceRate >= 50 && stats.attendanceRate < 80
    else if (filterAttendance === "low") attendanceMatch = stats.attendanceRate < 50

    return groupMatch && attendanceMatch
  })

  return (
    <div className="flex min-h-screen bg-blue-50">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleSidebar} />}

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {isMobile && sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="absolute top-4 right-4 z-50 bg-white p-2 rounded-full shadow-md"
            aria-label="Close menu"
          >
            <FiX className="w-5 h-5 text-indigo-600" />
          </button>
        )}
        <Sidebar organizationId={organizationId} />
      </div>

      {/* Main Content */}
      <div
        className={`
          flex-1 transition-all duration-300 ease-in-out
          ${!isMobile && sidebarOpen ? "ml-64" : "ml-0"}
        `}
      >
        <div className="min-h-screen">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isMobile && !sidebarOpen && (
                  <button onClick={toggleSidebar} className="p-2 rounded-md shadow-sm" aria-label="Open menu">
                    <FiMenu className="w-5 h-5 text-indigo-600" />
                  </button>
                )}
                <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{schoolInfo?.name || "School"} Students</h1>
                  <p className="text-gray-600">
                    {filteredStudents.length} of {students.length} students • {sessions.length} sessions
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedView("students")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedView === "students"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50 border"
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Students
                </button>
                <button
                  onClick={() => setSelectedView("sessions")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedView === "sessions"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50 border"
                  }`}
                >
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Sessions
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="text-sm text-gray-600 mb-2">Total Students</div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-green-500" />
                  <span className="text-2xl font-bold text-green-500">{students.length}</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="text-sm text-gray-600 mb-2">Total Sessions</div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span className="text-2xl font-bold text-blue-500">{sessions.length}</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="text-sm text-gray-600 mb-2">Average Attendance</div>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-yellow-500" />
                  <span className="text-2xl font-bold text-yellow-500">
                    {sessions.length > 0
                      ? Math.round(
                          sessions.reduce(
                            (acc, session) => acc + (session.presentStudents / session.totalStudents) * 100,
                            0,
                          ) / sessions.length,
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="text-sm text-gray-600 mb-2">Active Students</div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  <span className="text-2xl font-bold text-purple-500">
                    {students.filter((student) => getAttendanceStats(student.id).attendanceRate > 0).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Filters */}
            {selectedView === "students" && (
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Filters:</span>
                  </div>

                  <select
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all" className="text-gray-900 bg-white">
                      All Groups
                    </option>
                    {groups.map((group) => (
                      <option key={group} value={group} className="text-gray-900 bg-white">
                        {group}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterAttendance}
                    onChange={(e) => setFilterAttendance(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all" className="text-gray-900 bg-white">
                      All Attendance
                    </option>
                    <option value="high" className="text-gray-900 bg-white">
                      High (80%+)
                    </option>
                    <option value="medium" className="text-gray-900 bg-white">
                      Medium (50-79%)
                    </option>
                    <option value="low" className="text-gray-900 bg-white">
                      Low (&lt;50%)
                    </option>
                  </select>
                </div>
              </div>
            )}

            {/* Content */}
            {selectedView === "students" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border">
                  <h2 className="text-lg font-semibold text-gray-800">Students List</h2>
                  <span className="text-sm text-gray-600">Showing {filteredStudents.length} students</span>
                </div>

                <div className="grid gap-4">
                  {filteredStudents.map((student) => {
                    const stats = getAttendanceStats(student.id)
                    return (
                      <div
                        key={student.id}
                        className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedStudent(selectedStudent === student.id ? null : student.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800">{student.name}</h3>
                            <div className="flex gap-4 text-sm text-gray-600 mt-1">
                              <span>Class: {student.class}</span>
                              <span>Sex: {student.sex}</span>
                              <span>Group: {student.group}</span>
                              <span>Baseline: {student.baseline}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm text-gray-600">Attendance Rate</div>
                              <div
                                className={`text-lg font-bold ${
                                  stats.attendanceRate >= 80
                                    ? "text-green-500"
                                    : stats.attendanceRate >= 60
                                      ? "text-yellow-500"
                                      : "text-red-500"
                                }`}
                              >
                                {stats.attendanceRate}%
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm text-gray-600">Sessions</div>
                              <div className="text-lg font-bold text-gray-800">
                                {stats.attendedSessions}/{stats.totalSessions}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded attendance details */}
                        {selectedStudent === student.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="font-semibold text-gray-800 mb-3 text-base">Attendance History</h4>
                            <div className="grid gap-2 max-h-60 overflow-y-auto">
                              {getStudentAttendance(student.id).map((record, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                                >
                                  <div className="flex items-center gap-3">
                                    {record.attended ? (
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                    <span className="text-sm font-medium text-gray-800">
                                      {record.date} - {record.session}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                                      record.attended ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {record.attended ? "Present" : "Absent"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <h2 className="text-lg font-semibold text-gray-800">Sessions Overview</h2>
                </div>

                <div className="grid gap-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="bg-white rounded-lg p-4 shadow-sm border">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-800">
                              {session.date} - {session.session}
                            </h3>
                            {session.group && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                {session.group}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {session.presentStudents} of {session.totalStudents} students present
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-gray-600">Attendance Rate</div>
                          <div
                            className={`text-lg font-bold ${
                              (session.presentStudents / session.totalStudents) * 100 >= 80
                                ? "text-green-500"
                                : (session.presentStudents / session.totalStudents) * 100 >= 60
                                  ? "text-yellow-500"
                                  : "text-red-500"
                            }`}
                          >
                            {session.totalStudents > 0
                              ? Math.round((session.presentStudents / session.totalStudents) * 100)
                              : 0}
                            %
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${session.totalStudents > 0 ? (session.presentStudents / session.totalStudents) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
