"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import DashboardLayout from "../DashboardLayout"
import HouseholdMetrics from "@/components/Household/HouseholdMetrics"
import HouseholdFilters from "@/components/Household/HouseholdFilters"
import HouseholdList from "@/components/Household/HouseholdList"
import { useOrganizationHouseholds } from "@/hooks/useOrganizationHouseholds"

export default function HouseholdsPage() {
  const { organizationId } = useParams()
  const [filters, setFilters] = useState({
    county: "",
    searchQuery: ""
  })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Destructure export functions from the hook
  const { 
    households: rawHouseholds, 
    metrics: rawMetrics, 
    loading, 
    error,
    exportToCSV,      
    exportToExcel,    
    isExporting,     
    exportError       
  } = useOrganizationHouseholds(organizationId)

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
      <div className="flex h-screen bg-background justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Data</h2>
          <p className="text-gray-300">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout title="Household" organizationId={organizationId} currentSection={"survey"}>
      <div className="space-y-6 max-w-7xl mx-auto w-full">
        {/* Metrics Cards */}
        <HouseholdMetrics metrics={pageMetrics} />

        {/* Export Error Display */}
        {exportError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
            Export error: {exportError}
          </div>
        )}

        {/* Filters and Search*/}
        <HouseholdFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
          organizationId={organizationId}
          exportToCSV={exportToCSV}
          exportToExcel={exportToExcel}
          isExporting={isExporting}
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
    </DashboardLayout>
  )
}