"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where, onSnapshot, doc, getDoc } from "firebase/firestore"
import { db } from "@/firebase/config"
import { ChevronDown, FolderOpen, GraduationCap, X, Filter as FilterIcon } from "lucide-react"
import AssessmentGraph from "./AssessmentGraph"

export default function Filter({ organizationId, onFilterChange, currentFilters }) {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [type, setType] = useState(currentFilters?.type || "Literacy") // Default: Literacy
  const [level, setLevel] = useState(currentFilters?.level || "all") // Default: All Levels (changed from "All Levels" to "all" for consistency)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [assessmentData, setAssessmentData] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [organizationId])

  // Update local state when currentFilters prop changes
  useEffect(() => {
    if (currentFilters) {
      setSelectedProject(currentFilters.projectId || null)
      setSelectedSchool(currentFilters.schoolId || null)
      setType(currentFilters.type || "Literacy")
      setLevel(currentFilters.level || "all") // Changed to "all"
    }
  }, [currentFilters])

  // Notify parent component of filter changes on mount and when filters change
  useEffect(() => {
    onFilterChange({ 
      projectId: selectedProject, 
      schoolId: selectedSchool,
      type: type,
      level: level === "all" ? null : level // Send null when "all" is selected
    })
  }, [selectedProject, selectedSchool, type, level])
  // Real-time listener for daily assessment counts from cloud function
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
    
    const unsubscribe = onSnapshot(assessmentsQuery, async (snapshot) => {
      const assessmentsByDate = {}
      
      // Get all assessments
      const assessments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // For each assessment, fetch daily_assessment_counts subcollection
      for (const assessment of assessments) {
        try {
          const dailyCountsRef = collection(db, `assessments/${assessment.id}/daily_assessment_counts`)
          const dailyCountsSnapshot = await getDocs(dailyCountsRef)

          // Process each daily count
          dailyCountsSnapshot.docs.forEach(doc => {
            const dailyData = doc.to_dict ? doc.to_dict() : doc.data()
            const date = dailyData.date || doc.id // date should be YYYY-MM-DD format

            // Determine which count field to use based on assessment type
            const assessmentType = (assessment.type || "Literacy").toLowerCase()
            const countField = `${assessmentType}_student_count`
            const count = dailyData[countField] || 0

            if (count > 0) {
              if (!assessmentsByDate[date]) {
                assessmentsByDate[date] = []
              }

              assessmentsByDate[date].push({
                id: assessment.id,
                completedCount: count,
                name: assessment.name || "Unnamed Assessment",
                created_at: assessment.created_at,
                date: date,
                type: assessment.type || "Literacy",
                level: assessment.level || "Baseline"
              })
            }
          })
        } catch (error) {
          console.error(`Error fetching daily counts for assessment ${assessment.id}:`, error)
        }
      }

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
        assessments: assessmentsByDate[dateStr]
          .filter(assessment => {
            // Filter by type (default is "Literacy")
            if (type && type !== "all" && assessment.type !== type) return false
            // Filter by level (don't filter if "all" is selected)
            if (level && level !== "all" && assessment.level !== level) return false
            return true
          })
          .sort((a, b) => b.completedCount - a.completedCount)
      })).filter(dateData => dateData.assessments.length > 0) // Only include dates with assessments after filtering

      // Reverse to show from oldest to most recent (left to right)
      setAssessmentData(assessmentDataList.reverse())
      setLoadingData(false)
    })

    return () => unsubscribe()
  }, [organizationId, type, level])

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

  const handleTypeChange = (value) => {
    setType(value)
  }

  const handleLevelChange = (value) => {
    setLevel(value)
  }

  const clearAllFilters = () => {
    setSelectedProject(null)
    setSelectedSchool(null)
    // Reset to defaults
    setType("Literacy")
    setLevel("all") // Changed to "all"
  }

  const clearSpecificFilter = (filterType) => {
    switch(filterType) {
      case 'type':
        setType("Literacy") // Reset to default
        break;
      case 'level':
        setLevel("all") // Reset to "all"
        break;
      case 'project':
        setSelectedProject(null)
        break;
      case 'school':
        setSelectedSchool(null)
        break;
    }
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
      {/* Filters Section (Above the Graph) */}
      <div className="mb-6">
        {/* Quick Filters Row */}
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Type Filter */}
          <div className="flex-1 sm:flex-none sm:w-40">
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-500 rounded-lg bg-background-light text-gray-300 focus:ring-2 focus:ring-primary-2 focus:border-primary-2 outline-none"
            >
              <option value="Literacy">Literacy</option>
              <option value="Numeracy">Numeracy</option>
              <option value="all">All Types</option>
            </select>
          </div>

          {/* Level Filter - Make sure "All Levels" is first */}
          <div className="flex-1 sm:flex-none sm:w-40">
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Level
            </label>
            <select
              value={level}
              onChange={(e) => handleLevelChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-500 rounded-lg bg-background-light text-gray-300 focus:ring-2 focus:ring-primary-2 focus:border-primary-2 outline-none"
            >
              <option value="all">All Levels</option>
              <option value="Baseline">Baseline</option>
              <option value="Midline">Midline</option>
              <option value="Endline">Endline</option>
            </select>
          </div>

          {/* Project/School Filter Button */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Project & School
            </label>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-500 rounded-xl bg-background-light hover:bg-background-lighter transition-colors text-gray-300 text-sm shadow-md hover:shadow-lg min-w-[140px] justify-center"
            >
              <FilterIcon className="w-4 h-4" />
              {selectedProject || selectedSchool ? "Filtered" : "Add Filter"}
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 md:w-72 bg-background-light border border-gray-600 rounded-2xl shadow-xl z-50">
                <div className="p-3 border-b border-gray-600">
                  <h3 className="font-medium text-gray-300 text-sm md:text-base">Filter by Project & School</h3>
                </div>

                <div className="max-h-72 overflow-y-auto text-gray-300">
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
              </div>
            )}

            {/* Backdrop */}
            {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedProject || selectedSchool || type !== "Literacy" || level !== "all") && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-300 font-medium">Active filters:</span>
            
            {/* Show Type filter if it's not the default (Literacy) */}
            {type !== "Literacy" && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-sm border border-blue-500/30">
                Type: {type === "all" ? "All Types" : type}
                <button onClick={() => clearSpecificFilter('type')} className="ml-1 hover:bg-blue-500/30 rounded-full p-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {/* Show Level filter if it's not the default (all) */}
            {level !== "all" && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-sm border border-purple-500/30">
                Level: {level}
                <button onClick={() => clearSpecificFilter('level')} className="ml-1 hover:bg-purple-500/30 rounded-full p-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {selectedProject && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-2/20 text-primary-2 rounded-lg text-sm border border-primary-2/30">
                <FolderOpen className="w-3 h-3" />
                <span className="truncate max-w-32">{getProjectName(selectedProject)}</span>
                {!selectedSchool && (
                  <button onClick={() => clearSpecificFilter('project')} className="ml-1 hover:bg-primary-2/30 rounded-full p-1">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            )}
            {selectedSchool && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary-2/20 text-secondary-2 rounded-lg text-sm border border-secondary-2/30">
                <GraduationCap className="w-3 h-3" />
                <span className="truncate max-w-32">{getSchoolName(selectedSchool)}</span>
                <button onClick={() => clearSpecificFilter('school')} className="ml-1 hover:bg-secondary-2/30 rounded-full p-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {(selectedProject || selectedSchool || type !== "Literacy" || level !== "all") && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-400 hover:text-red-300 underline ml-2"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Graph Component */}
      <AssessmentGraph 
        organizationId={organizationId}
        assessmentData={assessmentData}
        loading={loadingData}
        filters={{ type, level, projectId: selectedProject, schoolId: selectedSchool }}
      />
    </div>
  )
}