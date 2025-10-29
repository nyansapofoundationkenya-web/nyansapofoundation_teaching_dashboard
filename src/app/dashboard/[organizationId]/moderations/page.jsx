"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import Header from "@/components/Dashboard/Header"
import Sidebar from "@/components/Dashboard/SideBar"
import Filter from "@/components/Moderations/Filter"
import Search from "@/components/Moderations/Search"
import AssessmentList from "@/components/Moderations/AssessmentList"
import { Plus } from "lucide-react"
import { FiMenu, FiX } from "react-icons/fi";
import AssessmentModal from "@/components/Moderations/AssessmentModal"; 

export default function ModerationsPage() {
  const { organizationId } = useParams()
  const router = useRouter()
  const [filters, setFilters] = useState({ 
    projectId: null, 
    schoolId: null,
    date: null
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // New state for modal

  // Get user data directly from Redux store
  const { user: currentUser, loading: userLoading } = useSelector((state) => state.auth);
  const isAdminOrSuperAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  const handleSearchChange = (query) => {
    setSearchQuery(query)
  }

  const handleAddAssessment = () => {
    if (!isAdminOrSuperAdmin) return; // Safety check, though button is hidden
    setIsModalOpen(true); // Open modal instead of navigating
  }

  // Optional: Callback to refresh the assessment list after creation
  const handleModalClose = () => {
    setIsModalOpen(false);
    // If AssessmentList has a refresh prop or you use a global state/query, trigger it here
  };
  
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Handle dynamic viewport height for mobile devices
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVh();
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-blue-50" style={{ height: "calc(var(--vh, 1vh) * 100)" }}>
      {/* Mobile/iPad Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-30 z-40" onClick={toggleSidebar} />
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
            className="absolute top-4 right-4 z-50 p-2 rounded-full shadow-md bg-white"
            aria-label="Close menu"
          >
            <FiX className="w-5 h-5 text-indigo-600" />
          </button>
        )}
        <Sidebar title="Moderations" organizationId={organizationId} />
      </div>

      {/* Main Content */}
      <div
        className={`
          flex-1 transition-all duration-300 ease-in-out
          ${!isMobile && sidebarOpen ? "ml-64" : "ml-0"}
        `}
      >
        <div className="h-full p-6 space-y-6 bg-blue-50 flex-1 overflow-auto">
          {/* Header with Menu Button and Title */}
          <div className="flex items-center gap-3">
            {isMobile && !sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md shadow-sm bg-white"
                aria-label="Open menu"
              >
                <FiMenu className="w-5 h-5 text-indigo-600" />
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-800">Assessments</h1>
          </div>

          {/* Search, Add Button, and Filter Section */}
          <div className="space-y-4">
            {/* Search and Add Button Row */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="flex-1 min-w-0 sm:min-w-[280px]">
                  <Search onSearchChange={handleSearchChange} placeholder="Search assessment..." />
                </div>
                {/* Add Assessment Button - Visible only to admin or super_admin */}
                {!userLoading && isAdminOrSuperAdmin && (
                  <button
                    onClick={handleAddAssessment}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap flex-shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                    Add Assessment
                  </button>
                )}
              </div>
            </div>

            {/* Filter Section */}
            <div className="w-full">
              <Filter organizationId={organizationId} onFilterChange={handleFilterChange} />
            </div>
          </div>

          {/* Assessment List */}
          <div className="bg-white rounded-lg shadow-sm">
            <AssessmentList 
              organizationId={organizationId} 
              filters={filters} 
              searchQuery={searchQuery} 
            />
          </div>
        </div>
      </div>

      {/* Render the modal - Only for admin or super_admin */}
      {!userLoading && isAdminOrSuperAdmin && isModalOpen && (
        <AssessmentModal 
          organizationId={organizationId} 
          onClose={handleModalClose} 
        />
      )}
    </div>
  )
}