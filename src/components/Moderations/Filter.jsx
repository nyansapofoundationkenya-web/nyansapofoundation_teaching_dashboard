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

  // Helper function to check if a student's baseline data is not empty
  const hasValidBaselineData = async (studentId, assessmentId) => {
    try {
      // Check if baseline data exists for this student
      const baselineRef = doc(db, `assessments/${assessmentId}/baseline_data/${studentId}`)
      const baselineDoc = await getDoc(baselineRef)
      
      if (baselineDoc.exists()) {
        const baselineData = baselineDoc.data()
        // Check if baseline data has actual content (not just metadata)
        const hasContent = 
          (baselineData.score !== undefined && baselineData.score !== null) ||
          (baselineData.responses && Object.keys(baselineData.responses).length > 0) ||
          (baselineData.data && Object.keys(baselineData.data).length > 0) ||
          (baselineData.completed === true) ||
          (baselineData.status && baselineData.status !== 'empty')
        
        return hasContent
      }
      return false
    } catch (error) {
      console.error("Error checking baseline data:", error)
      return false
    }
  }

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
    
    const unsubscribe = onSnapshot(assessmentsQuery, async (snapshot) => {
      const assessmentsByDate = {}
      
      // Process assessments in batches to avoid too many concurrent requests
      const assessmentsToProcess = []
      
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
          
          // Check if assessment has assigned students with has_done: true
          if (Array.isArray(data.assigned_students)) {
            const studentsWithHasDone = data.assigned_students.filter(student => 
              student.has_done === true
            )
            
            // Only process if at least one student has has_done: true
            if (studentsWithHasDone.length > 0) {
              assessmentsToProcess.push({
                assessmentId,
                data,
                dateStr,
                studentsWithHasDone
              })
            }
          }
        }
      })

      // Process each assessment to check baseline data
      for (const { assessmentId, data, dateStr, studentsWithHasDone } of assessmentsToProcess) {
        let validCompletedCount = 0
        
        // Check each student who has has_done: true
        for (const student of studentsWithHasDone) {
          const hasBaselineData = await hasValidBaselineData(student.id || student.student_id, assessmentId)
          
          if (hasBaselineData) {
            validCompletedCount++
          }
        }
        
        // Only include assessment if at least one student has valid baseline data
        if (validCompletedCount > 0) {
          if (!assessmentsByDate[dateStr]) {
            assessmentsByDate[dateStr] = []
          }
          
          assessmentsByDate[dateStr].push({
            id: assessmentId,
            completedCount: validCompletedCount,
            name: data.name || "Unnamed Assessment",
            created_at: data.created_at,
            date: dateStr,
            type: data.type || "Literacy",
            level: data.level || "Baseline"
          })
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
              <option value="Endline">Endline</option>
              <option value="Baseline">Baseline</option>
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