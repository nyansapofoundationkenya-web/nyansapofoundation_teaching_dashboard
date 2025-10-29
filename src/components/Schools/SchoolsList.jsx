"use client"

import { useEffect, useState } from "react"
import { useSchools } from "@/hooks/useSchools"
import SchoolCard from "./SchoolCard"
import { School, Search, Filter, ChevronDown, RefreshCw } from "lucide-react"

export default function SchoolsList({ organizationId }) {
  const { 
    schools, 
    projects, 
    loading, 
    error, 
    fetchProjects, 
    fetchAllSchools, 
    fetchSchoolsByProject 
  } = useSchools(organizationId)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [projectFilter, setProjectFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch projects and schools on component mount
  useEffect(() => {
    const initializeData = async () => {
      if (organizationId) {
        await fetchProjects()
        await fetchAllSchools()
      }
    }
    initializeData()
  }, [organizationId])

  // Handle project filter change
  const handleProjectFilterChange = async (projectId) => {
    setProjectFilter(projectId)
    setIsRefreshing(true)
    
    try {
      if (projectId === "all") {
        await fetchAllSchools()
      } else {
        await fetchSchoolsByProject(projectId)
      }
    } catch (err) {
      console.error("Error fetching schools:", err)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      if (projectFilter === "all") {
        await fetchAllSchools()
      } else {
        await fetchSchoolsByProject(projectFilter)
      }
    } catch (err) {
      console.error("Error refreshing data:", err)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Filter schools based on search (project filter is handled by data fetch)
  const filteredSchools = schools.filter((school) => {
    const matchesSearch = school.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Get the most common project to set as default
  const getDefaultProject = () => {
    if (projects.length === 0) return "all"
    
    const projectCounts = {}
    schools.forEach(school => {
      if (school.projectId) {
        projectCounts[school.projectId] = (projectCounts[school.projectId] || 0) + 1
      }
    })
    
    const mostCommonProject = Object.keys(projectCounts).reduce((a, b) => 
      projectCounts[a] > projectCounts[b] ? a : b, "all"
    )
    
    return mostCommonProject
  }

  // Set default project filter when projects are loaded
  useEffect(() => {
    if (projects.length > 0 && projectFilter === "all") {
      const defaultProject = getDefaultProject()
      setProjectFilter(defaultProject)
    }
  }, [projects.length])

  if (loading && schools.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading schools...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
        <p className="text-red-700 font-medium text-sm sm:text-base">Error loading schools</p>
        <p className="text-red-600 text-xs sm:text-sm mt-2">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schools</h1>
            <p className="text-gray-700 text-sm mt-1 font-medium">
              {filteredSchools.length} of {schools.length} schools
              {projectFilter !== "all" && ` in selected project`}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              title="Refresh schools"
            >
              <RefreshCw className={`w-4 h-4 text-gray-700 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors sm:w-auto w-full font-medium text-gray-700"
            >
              <Filter className="w-4 h-4 mr-2 text-gray-600" />
              Filters
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform text-gray-600 ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search schools by name, location, or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 font-medium"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
            {/* Project Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Project
              </label>
              <select
                value={projectFilter}
                onChange={(e) => handleProjectFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium"
                disabled={isRefreshing}
              >
                <option value="all" className="text-gray-700">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id} className="text-gray-900">
                    {project.name || `Project ${project.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  handleProjectFilterChange("all")
                  setSearchTerm("")
                }}
                disabled={isRefreshing}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full disabled:opacity-50 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {(searchTerm || projectFilter !== "all") && (
          <div className="flex flex-wrap gap-2 mt-4">
            {searchTerm && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm("")}
                  className="ml-2 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                >
                  ×
                </button>
              </span>
            )}
            {projectFilter !== "all" && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                Project: {projects.find(p => p.id === projectFilter)?.name || `Project ${projectFilter}`}
                <button
                  onClick={() => handleProjectFilterChange("all")}
                  disabled={isRefreshing}
                  className="ml-2 hover:bg-green-200 rounded-full p-0.5 transition-colors disabled:opacity-50"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Loading state for refreshes */}
      {isRefreshing && (
        <div className="flex items-center justify-center py-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading schools...
          </div>
        </div>
      )}

      {/* Schools Grid */}
      {filteredSchools.length === 0 && !isRefreshing ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <School className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No schools found</h3>
          <p className="text-gray-600 text-sm sm:text-base mb-4 font-medium">
            {schools.length === 0
              ? "No schools have been added to this organization yet."
              : "Try adjusting your search or filter criteria."}
          </p>
          {(searchTerm || projectFilter !== "all") && (
            <button
              onClick={() => {
                handleProjectFilterChange("all")
                setSearchTerm("")
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredSchools.map((school) => (
            <SchoolCard key={`${school.projectId}-${school.id}`} school={school} organizationId={organizationId} />
          ))}
        </div>
      )}
    </div>
  )
}