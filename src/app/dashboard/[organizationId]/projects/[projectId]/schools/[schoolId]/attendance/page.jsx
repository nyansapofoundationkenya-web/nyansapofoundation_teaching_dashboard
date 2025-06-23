"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Sidebar from "@/components/Dashboard/SideBar"
import AttendanceDashboard from "@/components/Attendance/Attendance-dashboard"
import { FiMenu, FiX } from "react-icons/fi"

export default function AnalyticsPage() {
  const { organizationId } = useParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

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

  return (
    <div className="flex min-h-screen bg-gray-50">
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
        <Sidebar initialTitle="Schools" organizationId={organizationId} />
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
          </div>

          <AttendanceDashboard />
        </div>
      </div>
    </div>
  )
}
