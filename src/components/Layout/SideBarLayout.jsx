"use client"

import { useState, useEffect } from "react"
import { FiX, FiMenu } from "react-icons/fi"
import Sidebar from "@/components/Dashboard/SideBar"

export default function SideBarLayout({ organizationId, children }) {
  const title ="";
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      setSidebarOpen(window.innerWidth >= 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full z-30">
        <div
          className={`${
            isMobile ? (sidebarOpen ? "fixed left-0 z-40" : "fixed -left-full") : "relative"
          } transition-all duration-300 ease-in-out h-full`}
        >
          <Sidebar title={title} organizationId={organizationId} />
        </div>

        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={toggleSidebar}></div>
        )}
      </div>

      {/* Main content area */}
      <div className={`flex-1 ${isMobile ? "ml-0" : "ml-64"} transition-all duration-300`}>
        {/* Header */}
        <div className="bg-white px-6 py-4 flex justify-between items-center shadow-sm border-b">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="text-indigo-600 p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                {sidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  )
}
