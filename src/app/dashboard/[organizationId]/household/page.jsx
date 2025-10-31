"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Header from "@/components/Dashboard/Header"
import Sidebar from "@/components/Dashboard/SideBar"
import HouseholdHeader from "@/components/Household/HouseholdHeader"
import HouseholdMetrics from "@/components/Household/HouseholdMetrics"
import HouseholdFilters from "@/components/Household/HouseholdFilters"
import HouseholdList from "@/components/Household/HouseholdList"
import { FiMenu, FiX } from "react-icons/fi"
import { useOrganizationHouseholds } from "@/hooks/useOrganizationHouseholds"

export default function HouseholdsPage() {
  const { organizationId } = useParams()
  const [filters, setFilters] = useState({
    county: "",
    searchQuery: ""
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const itemsPerPage = 10

  const { households: rawHouseholds, metrics: rawMetrics, loading, error } = useOrganizationHouseholds(organizationId)

  // Responsive sidebar handling
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

  const handlePageChange = (newPage) => {
  setCurrentPage(newPage)
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page on filter change
  }

  const allFilteredRaw = rawHouseholds.filter(household => {
    const matchesCounty = !filters.county || household.county === filters.county
    const matchesSearch = !filters.searchQuery || 
      household.householdHeadName?.toLowerCase().includes(filters.searchQuery.toLowerCase())
    
    return matchesCounty && matchesSearch
  })

 const allFiltered = allFilteredRaw.map(hh => ({
    id: hh.id,
    projectId: hh.projectId,
    schoolId: hh.schoolId,
    householdHead: hh.householdHeadName,
    county: hh.county,
    subCounty: hh.subCounty,
    children: hh.children?.length || 0,
    village: hh.village, 
    members: hh.householdMembersCount || 0,
    interviewDate: new Date(hh.interviewDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }))

  const totalFiltered = allFiltered.length
  const totalPages = Math.ceil(totalFiltered / itemsPerPage)
  const paginatedHouseholds = allFiltered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalFiltered)

  const pageMetrics = {
    ...rawMetrics,
    totalFematen: rawMetrics.totalFemales,
    totalFemsChildren: rawMetrics.totalFemaleChildren
  }

  if (error) {
    return (
      <div className="flex h-screen bg-blue-50 justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Data</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-blue-50" style={{ height: "calc(var(--vh, 1vh) * 100)" }}>
      {/* Mobile/iPad Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-30 z-40" onClick={toggleSidebar} />
      )}

      {/* Sidebar - Fixed with no scrolling */}
      <div
        className={`
          fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:relative
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
        <Sidebar title="Households" organizationId={organizationId} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with Menu Button */}
        <div className="bg-white shadow-sm z-30 flex-shrink-0">
          <div className="flex items-center h-16 px-4 lg:px-6">
            {/* Menu Button - Only show on mobile/tablet when sidebar is closed */}
            {isMobile && !sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors mr-3"
                aria-label="Open menu"
              >
                <FiMenu className="w-5 h-5" />
              </button>
            )}
            
            {/* Header Content */}
            <div className="flex-1">
              <Header />
            </div>
          </div>
        </div>
        
        {/* Scrollable Main Content - ONLY this section should scroll */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-blue-50 scrollbar-hide">
          <div className="space-y-6 max-w-7xl mx-auto w-full">
            {/* Header Section */}
            <HouseholdHeader 
              subtitle="Household Survey"
              organizationId={organizationId}
            />

            {/* Metrics Cards */}
            <HouseholdMetrics metrics={pageMetrics} />

            {/* Filters and Search */}
            <HouseholdFilters 
              filters={filters}
              onFilterChange={handleFilterChange}
              organizationId={organizationId}
            />

            {/* Household List */}
            <HouseholdList 
              households={paginatedHouseholds}
              loading={loading}
              currentPage={currentPage}
              totalPages={totalPages}
              organizationId={organizationId}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}