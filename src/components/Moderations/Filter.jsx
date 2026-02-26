"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { collection, getDocs, query, where, onSnapshot, doc, getDoc } from "firebase/firestore"
import { db } from "@/firebase/config"
import { ChevronDown, FolderOpen, GraduationCap, X, Filter as FilterIcon } from "lucide-react"
import AssessmentGraph from "./AssessmentGraph"

export default function Filter({ organizationId, onFilterChange, currentFilters }) {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [type, setType] = useState(currentFilters?.type || "all")
  const [level, setLevel] = useState(currentFilters?.level || "all")
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [assessmentData, setAssessmentData] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  const { user: currentUser } = useSelector((state) => state.auth)
  const userRole = currentUser?.role

  useEffect(() => {
    fetchProjects()
  }, [organizationId])

  useEffect(() => {
    if (currentFilters) {
      setSelectedProject(currentFilters.projectId || null)
      setSelectedSchool(currentFilters.schoolId || null)
      setType(currentFilters.type || "all")
      setLevel(currentFilters.level || "all")
    }
  }, [currentFilters])

  useEffect(() => {
    onFilterChange({
      projectId: selectedProject,
      schoolId: selectedSchool,
      type: type,
      level: level === "all" ? null : level
    })
  }, [selectedProject, selectedSchool, type, level])

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
      let assessments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      // ─── Scope assessments based on role ──────────────────────────────────
      if (userRole !== "super_admin" && userRole !== "admin") {
        const userOrg = (currentUser?.organizations || []).find((o) => o.id === organizationId)
        const assignedProjectIds = (userOrg?.projects || []).map((p) => p.id ?? p)

        if (userRole === "project_manager") {
          assessments = assessments.filter(a => assignedProjectIds.includes(a.project_id))
        } else {
          // school_head & teacher → scope to assigned schools
          const assignedSchoolIds = (userOrg?.projects || []).flatMap((p) =>
            (p.schools || []).map((s) => s.id ?? s)
          )
          assessments = assessments.filter(a => assignedSchoolIds.includes(a.school_id))
        }
      }

      const assessmentsByDate = {}

      for (const assessment of assessments) {
        try {
          const dailyCountsRef = collection(db, `assessments/${assessment.id}/daily_assessment_counts`)
          const dailyCountsSnapshot = await getDocs(dailyCountsRef)

          dailyCountsSnapshot.docs.forEach(doc => {
            const dailyData = doc.data()
            const date = dailyData.date || doc.id
            const assessmentType = (assessment.type || "Literacy").toLowerCase()
            const countField = `${assessmentType}_student_count`
            const count = dailyData[countField] || 0

            if (count > 0) {
              if (!assessmentsByDate[date]) assessmentsByDate[date] = []
              assessmentsByDate[date].push({
                id: assessment.id,
                completedCount: count,
                name: assessment.name || "Unnamed Assessment",
                created_at: assessment.created_at,
                date,
                type: assessment.type || "Literacy",
                level: assessment.level || "Baseline"
              })
            }
          })
        } catch (error) {
          console.error(`Error fetching daily counts for assessment ${assessment.id}:`, error)
        }
      }

      const datesWithAssessments = Object.keys(assessmentsByDate).sort((a, b) => new Date(b) - new Date(a))

      if (datesWithAssessments.length === 0) {
        setAssessmentData([])
        setLoadingData(false)
        return
      }

      const last10Dates = datesWithAssessments.slice(0, 10)

      const assessmentDataList = last10Dates.map(dateStr => ({
        date: dateStr,
        displayDate: new Date(dateStr),
        assessments: assessmentsByDate[dateStr]
          .filter(assessment => {
            if (type && type !== "all" && assessment.type !== type) return false
            if (level && level !== "all" && assessment.level !== level) return false
            return true
          })
          .sort((a, b) => b.completedCount - a.completedCount)
      })).filter(dateData => dateData.assessments.length > 0)

      setAssessmentData(assessmentDataList.reverse())
      setLoadingData(false)
    })

    return () => unsubscribe()
  }, [organizationId, type, level, userRole, currentUser])

  // ─── Fetch Projects (role-aware) ─────────────────────────────────────────────
  const fetchProjects = async () => {
    try {
      setLoading(true)

      // super_admin & admin → all projects with their schools
      if (userRole === "super_admin" || userRole === "admin") {
        const projectsSnapshot = await getDocs(
          collection(db, `organization/${organizationId}/projects`)
        )

        const projectsData = await Promise.all(
          projectsSnapshot.docs.map(async (projectDoc) => {
            const schoolsSnapshot = await getDocs(
              collection(db, `organization/${organizationId}/projects`, projectDoc.id, "schools")
            )
            return {
              id: projectDoc.id,
              ...projectDoc.data(),
              schools: schoolsSnapshot.docs.map((s) => ({ id: s.id, ...s.data() }))
            }
          })
        )

        setProjects(projectsData)
        return
      }

      // Everyone else → only assigned projects and their assigned schools
      const userOrg = (currentUser?.organizations || []).find((o) => o.id === organizationId)
      const assignedProjects = userOrg?.projects || []

      if (!assignedProjects.length) { setProjects([]); return }

      const projectsData = await Promise.all(
        assignedProjects.map(async (assignedProject) => {
          const projectSnap = await getDoc(
            doc(db, "organization", organizationId, "projects", assignedProject.id)
          )
          if (!projectSnap.exists()) return null

          // project_manager → all schools in the project
          if (userRole === "project_manager") {
            const schoolsSnapshot = await getDocs(
              collection(db, `organization/${organizationId}/projects`, assignedProject.id, "schools")
            )
            return {
              id: projectSnap.id,
              ...projectSnap.data(),
              schools: schoolsSnapshot.docs.map((s) => ({ id: s.id, ...s.data() }))
            }
          }

          // school_head & teacher → only their assigned schools
          const assignedSchoolIds = (assignedProject.schools || []).map((s) => s.id ?? s)

          const schoolDocs = await Promise.all(
            assignedSchoolIds.map((sid) =>
              getDoc(doc(db, `organization/${organizationId}/projects/${assignedProject.id}/schools`, sid))
            )
          )

          return {
            id: projectSnap.id,
            ...projectSnap.data(),
            schools: schoolDocs
              .filter((d) => d.exists())
              .map((d) => ({ id: d.id, ...d.data() }))
          }
        })
      )

      setProjects(projectsData.filter(Boolean))

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

  const handleTypeChange = (value) => setType(value)
  const handleLevelChange = (value) => setLevel(value)

  const clearAllFilters = () => {
    setSelectedProject(null)
    setSelectedSchool(null)
    setType("Literacy")
    setLevel("all")
  }

  const clearSpecificFilter = (filterType) => {
    switch (filterType) {
      case 'type': setType("Literacy"); break
      case 'level': setLevel("all"); break
      case 'project': setSelectedProject(null); break
      case 'school': setSelectedSchool(null); break
    }
  }

  const getProjectName = (projectId) => projects.find((p) => p.id === projectId)?.name || ""

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
      <div className="mb-6">
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Type Filter */}
          <div className="flex-1 sm:flex-none sm:w-40">
            <label className="block text-xs font-medium text-gray-300 mb-1">Type</label>
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

          {/* Level Filter */}
          <div className="flex-1 sm:flex-none sm:w-40">
            <label className="block text-xs font-medium text-gray-300 mb-1">Level</label>
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
            <label className="block text-xs font-medium text-gray-300 mb-1">Project & School</label>
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

            {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedProject || selectedSchool || type !== "Literacy" || level !== "all") && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-300 font-medium">Active filters:</span>

            {type !== "Literacy" && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-sm border border-blue-500/30">
                Type: {type === "all" ? "All Types" : type}
                <button onClick={() => clearSpecificFilter('type')} className="ml-1 hover:bg-blue-500/30 rounded-full p-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

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

            <button onClick={clearAllFilters} className="text-sm text-red-400 hover:text-red-300 underline ml-2">
              Clear all
            </button>
          </div>
        )}
      </div>

      <AssessmentGraph
        organizationId={organizationId}
        assessmentData={assessmentData}
        loading={loadingData}
        filters={{ type, level, projectId: selectedProject, schoolId: selectedSchool }}
      />
    </div>
  )
}