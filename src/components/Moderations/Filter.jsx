"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/firebase/config"
import { ChevronDown, FolderOpen, GraduationCap, X } from "lucide-react"
import AssessmentGraph from "./AssessmentGraph"

export default function Filter({ organizationId, onFilterChange }) {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [assessmentData, setAssessmentData] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [organizationId])

  // Real-time listener for assessment data grouped by date
  useEffect(() => {
    if (!organizationId) {
      setAssessmentData([])
      setLoadingData(false)
      return
    }

    setLoadingData(true)
    const assessmentsQuery = query(
      collection(db, "assessments"),
      where("organization_id", "==", organizationId)
    )
    const unsubscribe = onSnapshot(assessmentsQuery, (snapshot) => {
      const assessmentsByDate = {}
      
      snapshot.docs.forEach(doc => {
        const data = doc.data()
        const assessmentId = doc.id
        
        // Get creation date
        if (data.created_at) {
          let dateStr
          if (data.created_at.includes('T')) {
            dateStr = data.created_at.split('T')[0]
          } else {
            dateStr = data.created_at
          }
          
          // Count completed students based on baseline data
          let completedCount = 0
          if (data.assigned_students && Array.isArray(data.assigned_students)) {
            completedCount = data.assigned_students.filter(student => 
              student.baseline && student.baseline !== ""
            ).length
          }
          
          // Only include assessments with completed students
          if (completedCount > 0) {
            if (!assessmentsByDate[dateStr]) {
              assessmentsByDate[dateStr] = []
            }
            
            assessmentsByDate[dateStr].push({
              id: assessmentId,
              completedCount: completedCount,
              name: data.name || "Unnamed Assessment",
              created_at: data.created_at,
              date: dateStr
            })
          }
        }
      })

      // Get dates with assessments and sort them (most recent first)
      const datesWithAssessments = Object.keys(assessmentsByDate)
        .sort((a, b) => new Date(b) - new Date(a))

      if (datesWithAssessments.length === 0) {
        setAssessmentData([])
        setLoadingData(false)
        return
      }

      // Take only the last 10 dates that have assessments
      const last10Dates = datesWithAssessments.slice(0, 10)
      
      // Build the assessment data structure
      const assessmentDataList = last10Dates.map(dateStr => ({
        date: dateStr,
        displayDate: new Date(dateStr),
        assessments: assessmentsByDate[dateStr].sort((a, b) => b.completedCount - a.completedCount)
      }))

      // Reverse to show from oldest to most recent (left to right)
      setAssessmentData(assessmentDataList.reverse())
      setLoadingData(false)
    })

    return () => unsubscribe()
  }, [organizationId])

  useEffect(() => {
    onFilterChange({ 
      projectId: selectedProject, 
      schoolId: selectedSchool
    })
  }, [selectedProject, selectedSchool])

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

  const clearFilters = () => {
    setSelectedProject(null)
    setSelectedSchool(null)
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
    return <div className="px-4 py-2 border border-gray-500 rounded-xl bg-background-light text-gray-300">Loading...</div>
  }

  return (
    <div className="w-full">
      {/* Graph Component */}
      <AssessmentGraph 
        organizationId={organizationId}
        assessmentData={assessmentData}
        loading={loadingData}
      />

      {/* Filters */}
      <div className="relative mt-4 md:mt-6">
        <div className="flex gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-500 rounded-xl bg-background-light hover:bg-background-lighter transition-colors text-foreground text-sm md:text-base shadow-md hover:shadow-lg"
          >
            Add Filter
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-64 md:w-72 bg-background-light border border-gray-600 rounded-2xl shadow-xl z-50">
            <div className="p-3 border-b border-gray-600">
              <h3 className="font-medium text-foreground text-sm md:text-base">Filter by Project & School</h3>
            </div>

            <div className="max-h-72 overflow-y-auto text-foreground">
              {projects.map((project) => (
                <div key={project.id} className="border-b border-gray-600 last:border-b-0">
                  <button
                    onClick={() => handleProjectSelect(project.id)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-background-lighter transition-colors text-sm md:text-base"
                  >
                    <FolderOpen className="w-4 h-4 text-primary-2" />
                    <span className="font-medium truncate">{project.name}</span>
                  </button>

                  {project.schools && project.schools.length > 0 && (
                    <div className="bg-background-lighter">
                      {project.schools.map((school) => (
                        <button
                          key={school.id}
                          onClick={() => handleSchoolSelect(project.id, school.id)}
                          className="w-full flex items-center gap-2 px-7 py-2 text-left hover:bg-background transition-colors text-xs md:text-sm"
                        >
                          <GraduationCap className="w-4 h-4 text-secondary-2" />
                          <span className="truncate">{school.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {(selectedProject || selectedSchool) && (
              <div className="p-3 border-t border-gray-600">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Active Filters Display */}
        {(selectedProject || selectedSchool) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-sm text-gray-300">Active filters:</span>
            
            {selectedProject && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-2/20 text-primary-2 rounded-lg text-sm border border-primary-2/30">
                <FolderOpen className="w-3 h-3" />
                <span className="truncate max-w-24 md:max-w-32">{getProjectName(selectedProject)}</span>
                {!selectedSchool && (
                  <button onClick={() => setSelectedProject(null)} className="ml-1 hover:bg-primary-2/30 rounded-full p-1">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            )}
            {selectedSchool && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary-2/20 text-secondary-2 rounded-lg text-sm border border-secondary-2/30">
                <GraduationCap className="w-3 h-3" />
                <span className="truncate max-w-24 md:max-w-32">{getSchoolName(selectedSchool)}</span>
                <button onClick={() => setSelectedSchool(null)} className="ml-1 hover:bg-secondary-2/30 rounded-full p-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {(selectedProject || selectedSchool) && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-400 hover:text-red-300 underline"
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