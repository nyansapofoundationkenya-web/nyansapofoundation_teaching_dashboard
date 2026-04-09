// app/dashboard/[organizationId]/households/page.js
"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useParams } from "next/navigation"
import DashboardLayout from "../DashboardLayout"
import HouseholdMetrics from "@/components/Household/HouseholdMetrics"
import HouseholdFilters from "@/components/Household/HouseholdFilters"
import HouseholdList from "@/components/Household/HouseholdList"
import { useOrganizationHouseholds } from "@/hooks/useOrganizationHouseholds"
import { useProgressiveMetrics } from "@/hooks/household/useHouseholdMetrics"
import { useHouseholdExport } from "@/hooks/household/useHouseholdExport"

export default function HouseholdsPage() {
  const { organizationId } = useParams()
  const [filters, setFilters] = useState({
    county: "",
    searchQuery: ""
  })
  
  // Progressive metrics - numbers increase on their own
  const { metrics } = useProgressiveMetrics(organizationId)

  // Paginated households
  const { 
    households: rawHouseholds, 
    loading: householdsLoading, 
    error,
    hasMore,
    loadMore,
    resetAndReload,
    totalLoaded
  } = useOrganizationHouseholds(organizationId, 20)

  // Export
  const {
    exportToCSV,
    exportToExcel,
    isExporting,
    exportError,
    exportProgress
  } = useHouseholdExport(organizationId)

  // Apply filters
  const filteredHouseholds = rawHouseholds.filter(household => {
    const matchesCounty = !filters.county || household.county === filters.county
    const matchesSearch = !filters.searchQuery || 
      household.householdHeadName?.toLowerCase().includes(filters.searchQuery.toLowerCase())
    
    return matchesCounty && matchesSearch
  })

  // Transform for display
  const displayHouseholds = filteredHouseholds.map(hh => ({
    id: hh.id,
    projectId: hh.projectId,
    schoolId: hh.schoolId,
    householdHead: hh.householdHeadName,
    county: hh.county,
    subCounty: hh.subCounty,
    children: hh.children?.length || 0,
    village: hh.village, 
    members: hh.householdMembersCount || 0,
    organizationId: organizationId,
    interviewDate: hh.interviewDate ? new Date(hh.interviewDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }) : 'N/A'
  }))

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters)
    resetAndReload()
  }, [resetAndReload])

  if (error) {
    return (
      <div className="flex h-screen bg-background justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Data</h2>
          <p className="text-gray-300">{error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-2 rounded-lg hover:bg-primary-2/80 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout title="Household" organizationId={organizationId} currentSection={"survey"}>
      <div className="space-y-6 max-w-7xl mx-auto w-full pb-8">
        {/* Metrics - Just numbers that count up */}
        <HouseholdMetrics metrics={metrics} />

        {/* Export Error Display */}
        {exportError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
            Export error: {exportError}
          </div>
        )}

        {/* Filters */}
        <HouseholdFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
          organizationId={organizationId}
          exportToCSV={exportToCSV}
          exportToExcel={exportToExcel}
          isExporting={isExporting}
          exportProgress={exportProgress}
        />

        {/* Household List with Infinite Scroll */}
        <InfiniteScrollList 
          households={displayHouseholds}
          loading={householdsLoading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          organizationId={organizationId}
          totalLoaded={totalLoaded}
        />
      </div>
    </DashboardLayout>
  )
}

// Infinite Scroll Component
function InfiniteScrollList({ households, loading, hasMore, onLoadMore, organizationId, totalLoaded }) {
  const loaderRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore()
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    )

    const currentLoaderRef = loaderRef.current
    if (currentLoaderRef) {
      observer.observe(currentLoaderRef)
    }

    return () => {
      if (currentLoaderRef) {
        observer.unobserve(currentLoaderRef)
      }
    }
  }, [hasMore, loading, onLoadMore])

  return (
    <div className="space-y-4">
      <HouseholdList 
        households={households} 
        loading={loading && households.length === 0}
        organizationId={organizationId}
      />
      
      {loading && households.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary-2 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-300">Loading more households...</span>
          </div>
        </div>
      )}
      
      {hasMore && !loading && households.length > 0 && (
        <div ref={loaderRef} className="flex justify-center py-4">
          <div className="text-gray-400 text-sm animate-pulse">
            Scroll down to load more
          </div>
        </div>
      )}
      
      {!hasMore && households.length > 0 && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-background-light rounded-full border border-gray-600">
            <span className="text-gray-400 text-sm">
              ✓ Loaded all {totalLoaded} households
            </span>
          </div>
        </div>
      )}
      
      {!loading && households.length === 0 && (
        <div className="text-center py-12 bg-background-light rounded-2xl border border-gray-600">
          <p className="text-gray-400">No households found matching your filters</p>
        </div>
      )}
    </div>
  )
}