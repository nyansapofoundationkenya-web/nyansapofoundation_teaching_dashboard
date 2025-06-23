"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Sidebar from "@/components/Dashboard/SideBar"
import SchoolDetailContent from "@/components/Schools/SchoolDetailContent"
import { useSchools } from "@/hooks/useSchools"
import { FiMenu, FiX } from "react-icons/fi"

export default function SchoolDetailPage() {
  const { organizationId, projectId, schoolId } = useParams()
  const [sidebarOpen, setSidebarOpen] = useState(false) // Start closed on mobile
  const [isMobile, setIsMobile] = useState(false)
  const { getSchoolById, loading, error } = useSchools(organizationId)
  const [school, setSchool] = useState(null)

  useEffect(() => {
    const fetchSchool = async () => {
      if (organizationId && projectId && schoolId) {
        try {
          const schoolData = await getSchoolById(projectId, schoolId)
          setSchool(schoolData)
        } catch (err) {
          console.error("Error fetching school:", err)
        }
      }
    }

    fetchSchool()
  }, [organizationId, projectId, schoolId])

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // On desktop, sidebar should be open by default
      setSidebarOpen(!mobile)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleSchoolUpdated = (updatedSchool) => {
    setSchool(updatedSchool)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-blue-50">
        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black z-40" onClick={toggleSidebar} />}

        {/* Sidebar */}
        <div
          className={`
            fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* Close button for sidebar */}
          {isMobile && sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="absolute top-4 right-4 z-50 p-2 rounded-full shadow-md"
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
              {/* Menu button */}
              {isMobile && !sidebarOpen && (
                <button onClick={toggleSidebar} className="p-2 rounded-md shadow-sm" aria-label="Open menu">
                  <FiMenu className="w-5 h-5 text-indigo-600" />
                </button>
              )}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">School Details</h1>
            </div>

            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading school details...</p>
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
        {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black z-40" onClick={toggleSidebar} />}

        {/* Sidebar */}
        <div
          className={`
            fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* Close button for sidebar */}
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
              {/* Menu button */}
              {isMobile && !sidebarOpen && (
                <button onClick={toggleSidebar} className="p-2 rounded-md shadow-sm" aria-label="Open menu">
                  <FiMenu className="w-5 h-5 text-indigo-600" />
                </button>
              )}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">School Details</h1>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 font-medium">Error loading school details</p>
              <p className="text-red-500 text-sm mt-2">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-blue-50">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black z-40" onClick={toggleSidebar} />}

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Close button for sidebar */}
        {isMobile && sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="absolute top-4 right-4 z-50 p-2 rounded-full shadow-md"
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
        <div className="min-h-screen">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              {/* Menu button */}
              {isMobile && !sidebarOpen && (
                <button onClick={toggleSidebar} className="p-2 rounded-md shadow-sm" aria-label="Open menu">
                  <FiMenu className="w-5 h-5 text-indigo-600" />
                </button>
              )}
            </div>

            <SchoolDetailContent school={school} organizationId={organizationId} onSchoolUpdated={handleSchoolUpdated} />
          </div>
        </div>
      </div>
    </div>
  )
}