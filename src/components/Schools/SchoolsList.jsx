"use client"

import { useEffect, useState } from "react"
import { useSchools } from "@/hooks/useSchools"
import SchoolCard from "./SchoolCard"
import { School } from "lucide-react"

export default function SchoolsList({ organizationId }) {
  const { schools, loading, error, fetchAllSchools } = useSchools(organizationId)
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")

  useEffect(() => {
    if (organizationId) {
      fetchAllSchools()
    }
  }, [organizationId])

  // Filter schools based on search and filters
  const filteredSchools = schools.filter((school) => {
    const matchesSearch = school.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLocation =
      locationFilter === "all" ||
      (Array.isArray(school.location) ? school.location.includes(locationFilter) : school.location === locationFilter)
    const matchesProject = projectFilter === "all" || school.projectId === projectFilter

    return matchesSearch && matchesLocation && matchesProject
  })

  // Get unique locations and projects for filters
  const uniqueLocations = [
    ...new Set(schools.flatMap((school) => (Array.isArray(school.location) ? school.location : [school.location]))),
  ].filter(Boolean)

  const uniqueProjects = [
    ...new Set(
      schools.map((school) => ({
        id: school.projectId,
        name: school.projectName,
      })),
    ),
  ]

  if (loading) {
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
        <p className="text-red-600 font-medium text-sm sm:text-base">Error loading schools</p>
        <p className="text-red-500 text-xs sm:text-sm mt-2">{error}</p>
        <button
          onClick={() => fetchAllSchools()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <School className="w-6 h-6 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-800">Schools</h1>
          <span className="ml-3 bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {filteredSchools.length} school{filteredSchools.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div> */}

      {/* Search and Filters
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search schools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

        
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Locations</option>
              {uniqueLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          
          <div>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Projects</option>
              {uniqueProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Schools Grid - Responsive 3 columns */}
      {filteredSchools.length === 0 ? (
        <div className="text-center py-12">
          <School className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No schools found</h3>
          <p className="text-gray-500 text-sm sm:text-base">
            {schools.length === 0
              ? "No schools have been added to this organization yet."
              : "Try adjusting your search or filter criteria."}
          </p>
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
