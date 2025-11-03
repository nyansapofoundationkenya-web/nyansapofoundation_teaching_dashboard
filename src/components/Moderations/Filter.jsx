"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore"
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
  }, [organizationId])

  // Real-time listener for assessment counts
  useEffect(() => {
    if (!organizationId) {
      setAssessmentCounts([])
      setLoadingCounts(false)
      return
    }

    setLoadingCounts(true)
    const assessmentsQuery = query(
      collection(db, "assessments"),
      where("organization_id", "==", organizationId)
    )
    const unsubscribe = onSnapshot(assessmentsQuery, (snapshot) => {
      const countsByDate = {}
      
      snapshot.docs.forEach(doc => {
        const data = doc.data()
        if (data.created_at) {
          let dateStr
          if (data.created_at.includes('T')) {
            dateStr = data.created_at.split('T')[0]
          } else {
            dateStr = data.created_at
          }
          
          countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1
        }
      })

      // Get all dates with assessments and sort them (most recent first)
      const datesWithAssessments = Object.keys(countsByDate)
        .sort((a, b) => new Date(b) - new Date(a))

      if (datesWithAssessments.length === 0) {
        setAssessmentCounts([])
        if (!selectedDate) {
          setSelectedDate(null)
        }
        setLoadingCounts(false)
        return
      }

      const mostRecentDate = datesWithAssessments[0]
      
      // Only set most recent date as default if no date is currently selected
      if (!selectedDate) {
        setSelectedDate(mostRecentDate)
      }

      // Take only the last 10 dates that have assessments
      const last10Dates = datesWithAssessments.slice(0, 10)
      
      // Build the assessment counts list
      const assessmentCountsList = last10Dates.map(dateStr => ({
        date: dateStr,
        count: countsByDate[dateStr],
        displayDate: new Date(dateStr)
      }))

      // Reverse to show from oldest to most recent (left to right)
      setAssessmentCounts(assessmentCountsList.reverse())
      setLoadingCounts(false)
    })

    return () => unsubscribe()
  }, [organizationId, selectedDate])

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
      const projectsRef = collection(db, `organization/${organizationId}/projects`)
      const projectsSnapshot = await getDocs(projectsRef)

      const projectsData = await Promise.all(
        projectsSnapshot.docs.map(async (projectDoc) => {
          const projectData = { id: projectDoc.id, ...projectDoc.data() }

          const schoolsRef = collection(db, `organization/${organizationId}/projects`, projectDoc.id, "schools")
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
    return <div className="px-4 py-2 border border-gray-500 rounded-xl bg-background-light text-gray-300">Loading...</div>
  }

  return (
    <div className="w-full">
      {/* Bar Graph */}
      <div className="bg-background-light border border-gray-600 rounded-2xl p-3 mb-4">
        <h3 className="text-xs font-medium text-foreground mb-2">Assessments Done</h3>
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
              <div className="absolute left-0 top-0 bottom-4 w-5 flex flex-col justify-between text-[10px] text-gray-400">
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
                        className={`w-3 rounded-t-xl transition-all hover:opacity-80 ${
                          isSelected 
                            ? 'bg-primary-2' 
                            : item.count > 0 
                              ? 'bg-primary-2/70 hover:bg-primary-2/90' 
                              : 'bg-gray-600'
                        }`}
                        style={{ 
                          height: `${heightPercent}px`,
                          minHeight: '2px'
                        }}
                        title={`${month} ${day}, ${year}: ${item.count} assessment${item.count !== 1 ? 's' : ''}`}
                      />
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:block bg-background-lighter text-foreground text-[10px] rounded-xl py-1 px-2 whitespace-nowrap z-10 pointer-events-none border border-gray-600 shadow-lg">
                        {month} {day}, {year}
                        <br />
                        {item.count} assessment{item.count !== 1 ? 's' : ''}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                          <div className="border-3 border-transparent border-t-background-lighter"></div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* X-axis date labels */}
              <div className="absolute left-6 right-0 bottom-0 flex items-center justify-between text-[10px] text-gray-400">
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
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-500 rounded-xl bg-background-light hover:bg-background-lighter transition-colors text-foreground text-sm shadow-md hover:shadow-lg"
          >
            Add Filter
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-56 bg-background-light border border-gray-600 rounded-2xl shadow-xl z-50">
            <div className="p-2 border-b border-gray-600">
              <h3 className="font-medium text-foreground text-sm">Filter by Project & School</h3>
            </div>

            <div className="max-h-64 overflow-y-auto text-foreground">
              {projects.map((project) => (
                <div key={project.id} className="border-b border-gray-600 last:border-b-0">
                  <button
                    onClick={() => handleProjectSelect(project.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-background-lighter transition-colors text-sm"
                  >
                    <FolderOpen className="w-3 h-3 text-primary-2" />
                    <span className="font-medium truncate">{project.name}</span>
                  </button>

                  {project.schools && project.schools.length > 0 && (
                    <div className="bg-background-lighter">
                      {project.schools.map((school) => (
                        <button
                          key={school.id}
                          onClick={() => handleSchoolSelect(project.id, school.id)}
                          className="w-full flex items-center gap-2 px-6 py-1.5 text-left hover:bg-background transition-colors text-xs"
                        >
                          <GraduationCap className="w-3 h-3 text-secondary-2" />
                          <span className="truncate">{school.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {(selectedProject || selectedSchool) && (
              <div className="p-2 border-t border-gray-600">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300"
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
            <span className="text-xs text-gray-300">Active filters:</span>
            
            {selectedDate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-2/20 text-primary-2 rounded-lg text-xs border border-primary-2/30">
                📅 {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                <button onClick={() => setSelectedDate(null)} className="ml-0.5 hover:bg-primary-2/30 rounded-full p-0.5">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            
            {selectedProject && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-2/20 text-primary-2 rounded-lg text-xs border border-primary-2/30">
                <FolderOpen className="w-2.5 h-2.5" />
                <span className="truncate max-w-20">{getProjectName(selectedProject)}</span>
                {!selectedSchool && (
                  <button onClick={() => setSelectedProject(null)} className="ml-0.5 hover:bg-primary-2/30 rounded-full p-0.5">
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </span>
            )}
            {selectedSchool && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary-2/20 text-secondary-2 rounded-lg text-xs border border-secondary-2/30">
                <GraduationCap className="w-2.5 h-2.5" />
                <span className="truncate max-w-20">{getSchoolName(selectedSchool)}</span>
                <button onClick={() => setSelectedSchool(null)} className="ml-0.5 hover:bg-secondary-2/30 rounded-full p-0.5">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            
            {(selectedProject || selectedSchool || selectedDate) && (
              <button
                onClick={clearFilters}
                className="text-xs text-red-400 hover:text-red-300 underline"
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