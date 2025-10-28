"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/firebase/config"
import { ChevronDown, FolderOpen, GraduationCap, X } from "lucide-react"


export default function Filter({ organizationId, onFilterChange }) {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [assessmentCounts, setAssessmentCounts] = useState([])
  const [loadingCounts, setLoadingCounts] = useState(true)

  useEffect(() => {
    fetchProjects()
    fetchAssessmentCounts()
  }, [organizationId])

  useEffect(() => {
    onFilterChange({ 
      projectId: selectedProject, 
      schoolId: selectedSchool,
      date: selectedDate
    })
  }, [selectedProject, selectedSchool, selectedDate])

  const fetchAssessmentCounts = async () => {
    try {
      setLoadingCounts(true)
      const assessmentsRef = collection(db, "assessments")
      const snapshot = await getDocs(assessmentsRef)
      
      const countsByDate = {}
      const allDates = []
      
      snapshot.docs.forEach(doc => {
        const data = doc.data()
        if (data.organization_id === organizationId && data.created_at) {
          let dateStr
          if (data.created_at.includes('T')) {
            dateStr = data.created_at.split('T')[0]
          } else {
            dateStr = data.created_at
          }
          
          countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1
          allDates.push(dateStr)
        }
      })

      if (allDates.length === 0) {
        setAssessmentCounts([])
        return
      }

      const sortedDates = allDates.sort((a, b) => new Date(b) - new Date(a))
      const mostRecentDate = sortedDates[0]
      
      // Set most recent date with assessments as default
      setSelectedDate(mostRecentDate)

      // Build 10-day range from most recent date, including only dates with assessments
      const mostRecentDateObj = new Date(mostRecentDate)
      const assessmentCountsList = []
      for (let i = 0; i < 10; i++) {
        const date = new Date(mostRecentDateObj)
        date.setDate(mostRecentDateObj.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        if (countsByDate[dateStr] > 0) {
          assessmentCountsList.push({
            date: dateStr,
            count: countsByDate[dateStr],
            displayDate: new Date(date)
          })
        }
      }

      // Reverse to show from most recent to 10 days back
      setAssessmentCounts(assessmentCountsList.reverse())
    } catch (error) {
      console.error("Error fetching assessment counts:", error)
      setAssessmentCounts([])
    } finally {
      setLoadingCounts(false)
    }
  }

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const projectsRef = collection(db, "organization", organizationId, "projects")
      const projectsSnapshot = await getDocs(projectsRef)

      const projectsData = await Promise.all(
        projectsSnapshot.docs.map(async (projectDoc) => {
          const projectData = { id: projectDoc.id, ...projectDoc.data() }

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

  const handleBarClick = (date) => {
    setSelectedDate(selectedDate === date ? null : date)
  }

  const clearFilters = () => {
    setSelectedProject(null)
    setSelectedSchool(null)
    setSelectedDate(null)
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

  const maxCount = Math.max(...assessmentCounts.map(d => d.count), 1)

  if (loading) {
    return <div className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-600">Loading...</div>
  }

  return (
    <div className="w-full">
      {/* Bar Graph */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
        <h3 className="text-xs font-medium text-gray-700 mb-2">Assessments Created</h3>
        {loadingCounts ? (
          <div className="h-24 flex items-center justify-center text-gray-400 text-xs">
            Loading graph...
          </div>
        ) : assessmentCounts.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-gray-400 text-xs">
            No assessment data available
          </div>
        ) : (
          <div>
            <div className="relative" style={{ height: '80px' }}>
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-4 w-5 flex flex-col justify-between text-[10px] text-gray-500">
                <span>{maxCount}</span>
                <span>{Math.floor(maxCount * 0.5)}</span>
                <span>0</span>
              </div>

              {/* Bars container */}
              <div className="absolute left-6 right-0 top-0 bottom-6 flex items-end justify-between gap-0.5">
                {assessmentCounts.map((item, index) => {
                  const heightPercent = maxCount > 0 ? Math.max((item.count / maxCount) * 70, 2) : 2
                  const isSelected = selectedDate === item.date
                  const day = item.displayDate.getDate()
                  const month = item.displayDate.toLocaleDateString('en-US', { month: 'short' })
                  const year = item.displayDate.getFullYear()
                  const displayYear = year === 2025 ? '25' : year
                  
                  return (
                    <div key={item.date} className="flex-1 flex flex-col items-center group relative">
                      <button
                        onClick={() => handleBarClick(item.date)}
                        className={`w-3 rounded-t transition-all hover:opacity-80 ${
                          isSelected 
                            ? 'bg-green-700' 
                            : item.count > 0 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-gray-200'
                        }`}
                        style={{ 
                          height: `${heightPercent}px`,
                          minHeight: '2px'
                        }}
                        title={`${month} ${day}, ${year}: ${item.count} assessment${item.count !== 1 ? 's' : ''}`}
                      />
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-[10px] rounded py-1 px-2 whitespace-nowrap z-10 pointer-events-none">
                        {month} {day}, {year}
                        <br />
                        {item.count} assessment{item.count !== 1 ? 's' : ''}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                          <div className="border-3 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* X-axis date labels */}
              <div className="absolute left-6 right-0 bottom-0 flex items-center justify-between text-[10px] text-gray-500">
                {assessmentCounts.map((item, index) => {
                  const day = item.displayDate.getDate()
                  const month = item.displayDate.toLocaleDateString('en-US', { month: 'short' })
                  const year = item.displayDate.getFullYear()
                  const displayYear = year === 2025 ? '25' : year
                  
                  return (
                    <div key={item.date} className="flex-1 text-center">
                      <div className="font-medium text-[10px]">{`${day} ${month} ${displayYear}`}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="relative">
        <div className="flex gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors text-gray-700 text-sm"
          >
            Add Filter
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-2 border-b border-gray-100">
              <h3 className="font-medium text-gray-900 text-sm">Filter by Project & School</h3>
            </div>

            <div className="max-h-64 overflow-y-auto text-gray-800">
              {projects.map((project) => (
                <div key={project.id} className="border-b border-gray-100 last:border-b-0">
                  <button
                    onClick={() => handleProjectSelect(project.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                  >
                    <FolderOpen className="w-3 h-3 text-blue-600" />
                    <span className="font-medium truncate">{project.name}</span>
                  </button>

                  {project.schools && project.schools.length > 0 && (
                    <div className="bg-gray-50">
                      {project.schools.map((school) => (
                        <button
                          key={school.id}
                          onClick={() => handleSchoolSelect(project.id, school.id)}
                          className="w-full flex items-center gap-2 px-6 py-1.5 text-left hover:bg-gray-100 transition-colors text-xs"
                        >
                          <GraduationCap className="w-3 h-3 text-green-600" />
                          <span className="truncate">{school.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {(selectedProject || selectedSchool) && (
              <div className="p-2 border-t border-gray-100">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-xs text-red-600 hover:text-red-700"
                >
                  <X className="w-3 h-3" />
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Active Filters Display */}
        {(selectedProject || selectedSchool || selectedDate) && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs text-gray-600">Active filters:</span>
            
            {selectedDate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                📅 {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                <button onClick={() => setSelectedDate(null)} className="ml-0.5 hover:bg-green-200 rounded-full p-0.5">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            
            {selectedProject && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                <FolderOpen className="w-2.5 h-2.5" />
                <span className="truncate max-w-20">{getProjectName(selectedProject)}</span>
                {!selectedSchool && (
                  <button onClick={() => setSelectedProject(null)} className="ml-0.5 hover:bg-blue-200 rounded-full p-0.5">
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </span>
            )}
            {selectedSchool && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                <GraduationCap className="w-2.5 h-2.5" />
                <span className="truncate max-w-20">{getSchoolName(selectedSchool)}</span>
                <button onClick={() => setSelectedSchool(null)} className="ml-0.5 hover:bg-green-200 rounded-full p-0.5">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            
            {(selectedProject || selectedSchool || selectedDate) && (
              <button
                onClick={clearFilters}
                className="text-xs text-red-600 hover:text-red-700 underline"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Backdrop */}
        {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
      </div>
    </div>
  )
}