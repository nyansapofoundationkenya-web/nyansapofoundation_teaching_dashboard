"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/firebase/config" 
import { ChevronDown, FolderOpen, GraduationCap, X, Calendar } from "lucide-react"

export default function Filter({ organizationId, onFilterChange }) {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Set default date to today when component mounts
  useEffect(() => {
    const today = new Date()
    const todayString = today.toISOString().split('T')[0] // Format: YYYY-MM-DD
    setSelectedDate(todayString)
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [organizationId])

  // Update filter change effect to include date
  useEffect(() => {
    onFilterChange({ 
      projectId: selectedProject, 
      schoolId: selectedSchool,
      date: selectedDate
    })
  }, [selectedProject, selectedSchool, selectedDate])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const projectsRef = collection(db, "organization", organizationId, "projects")
      const projectsSnapshot = await getDocs(projectsRef)

      const projectsData = await Promise.all(
        projectsSnapshot.docs.map(async (projectDoc) => {
          const projectData = { id: projectDoc.id, ...projectDoc.data() }

          // Fetch schools for each project
          const schoolsRef = collection(db, "organization", organizationId, "projects", projectDoc.id, "schools")
          const schoolsSnapshot = await getDocs(schoolsRef)
          const schools = schoolsSnapshot.docs.map((schoolDoc) => ({
            id: schoolDoc.id,
            ...schoolDoc.data(),
          }))

          return { ...projectData, schools }
        }),
      )

      setProjects(projectsData)
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectSelect = (projectId) => {
    setSelectedProject(projectId)
    setSelectedSchool(null)
    setIsOpen(false)
  }

  const handleSchoolSelect = (projectId, schoolId) => {
    setSelectedProject(projectId)
    setSelectedSchool(schoolId)
    setIsOpen(false)
  }

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value)
  }

  const clearFilters = () => {
    setSelectedProject(null)
    setSelectedSchool(null)
    // Reset date to today when clearing filters
    const today = new Date()
    const todayString = today.toISOString().split('T')[0]
    setSelectedDate(todayString)
  }

  const clearDateFilter = () => {
    const today = new Date()
    const todayString = today.toISOString().split('T')[0]
    setSelectedDate(todayString)
  }

  const getProjectName = (projectId) => {
    return projects.find((p) => p.id === projectId)?.name || ""
  }

  const getSchoolName = (schoolId) => {
    for (const project of projects) {
      const school = project.schools?.find((s) => s.id === schoolId)
      if (school) return school.name
    }
    return ""
  }

  if (loading) {
    return <button className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-600">Loading...</button>
  }

  return (
    <div className="relative">
      <div className="flex gap-3">
        {/* Date Filter */}
        <div className="relative">
          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="bg-transparent outline-none text-gray-700"
            />
            {selectedDate && selectedDate !== new Date().toISOString().split('T')[0] && (
              <button 
                onClick={clearDateFilter}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Project/School Filter */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors text-gray-700"
        >
          Add Filter
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-100">
            <h3 className="font-medium text-gray-900">Filter by Project & School</h3>
          </div>

          <div className="max-h-80 overflow-y-auto text-gray-800">
            {projects.map((project) => (
              <div key={project.id} className="border-b border-gray-100 last:border-b-0">
                <button
                  onClick={() => handleProjectSelect(project.id)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <FolderOpen className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{project.name}</span>
                </button>

                {project.schools && project.schools.length > 0 && (
                  <div className="bg-gray-50">
                    {project.schools.map((school) => (
                      <button
                        key={school.id}
                        onClick={() => handleSchoolSelect(project.id, school.id)}
                        className="w-full flex items-center gap-2 px-8 py-2 text-left hover:bg-gray-100 transition-colors text-sm"
                      >
                        <GraduationCap className="w-4 h-4 text-green-600" />
                        <span>{school.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {(selectedProject || selectedSchool) && (
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {(selectedProject || selectedSchool || selectedDate) && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {/* Date Filter Badge */}
          {selectedDate && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-sm">
              <Calendar className="w-3 h-3" />
              {new Date(selectedDate).toLocaleDateString()}
              {selectedDate !== new Date().toISOString().split('T')[0] && (
                <button onClick={clearDateFilter} className="ml-1 hover:bg-purple-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )}
          
          {selectedProject && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
              <FolderOpen className="w-3 h-3" />
              {getProjectName(selectedProject)}
              {!selectedSchool && (
                <button onClick={() => setSelectedProject(null)} className="ml-1 hover:bg-blue-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )}
          {selectedSchool && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm">
              <GraduationCap className="w-3 h-3" />
              {getSchoolName(selectedSchool)}
              <button onClick={() => setSelectedSchool(null)} className="ml-1 hover:bg-green-200 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  )
}