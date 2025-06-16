"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import Sidebar from "@/components/Dashboard/SideBar"
import { useProjectDetails } from "@/hooks/useProjectDetails"
import { GraduationCap, School, Tent, Users, Bookmark, Download, ChevronDown, Building2, MapPin } from "lucide-react"
import { FaChalkboardTeacher } from "react-icons/fa"
import StatsCard from "@/components/ProjectDetails/StatsCard"
import SchoolModal from "@/components/ui/SchoolModal"
import InstructorModal from "@/components/ui/InstructorModal"
import Modal from "@/components/ui/Modal"
import ProjectCharts from "@/components/Charts/ProjectCharts"
import { FiMenu, FiX } from "react-icons/fi"
import MultiSheetUploadModal from "@/components/ui/MultipleSheetUploadModal"

export default function ProjectDetails() {
  const { organizationId, projectId } = useParams()
  const [sidebarOpen, setSidebarOpen] = useState(false) // Start closed on mobile
  const [isMobile, setIsMobile] = useState(false)
  const {
    project,
    schools,
    loading,
    error,
    fetchProjectById,
    fetchSchools,
    fetchCampsByIds,
    createCamp,
    createInstructor,
  } = useProjectDetails(organizationId)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false)
  const [isCampModalOpen, setIsCampModalOpen] = useState(false)
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (organizationId && projectId) {
      fetchProjectById(projectId)
      fetchSchools(projectId)
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [organizationId, projectId])

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setSidebarOpen(!mobile)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleCreateCamp = async (values) => {
    const { name, subject, schools, startDate, endDate } = values
    if (!name || !subject || !schools || !startDate || !endDate) {
      alert("All fields are required.")
      return
    }
    try {
      const schoolIds = schools
      await createCamp(projectId, schoolIds, { name, subject, startDate, endDate })
      alert("Camp created successfully!")
      setIsCampModalOpen(false)
      await fetchSchools(projectId)
    } catch (err) {
      console.error("Error creating camp:", err)
      alert(`Failed to create camp: ${err.message}`)
    }
  }

  const handleAddInstructor = async (values) => {
    const { name, email, phone, school, camp } = values
    if (!name || !email || !phone || !school || !camp) {
      alert("All fields are required.")
      return
    }
    try {
      const schoolId = school.value
      const campId = camp.value
      await createInstructor(organizationId, projectId, schoolId, campId, { name, email, phone })
      alert("Instructor added successfully!")
    } catch (err) {
      console.error("Error adding instructor:", err)
      alert(`Failed to add instructor: ${err.message}`)
    }
  }

  const handleUploadComplete = async () => {
    // Refresh project data after upload
    await fetchProjectById(projectId)
    await fetchSchools(projectId)
    setIsUploadModalOpen(false)
  }

  const campFields = [
    { name: "name", label: "Camp Name", type: "text", required: true, placeholder: "Enter camp name" },
    {
      name: "subject",
      label: "Subject",
      type: "select",
      required: true,
      options: [
        { value: "numeracy", label: "Numeracy" },
        { value: "literacy", label: "Literacy" },
      ],
    },
    {
      name: "schools",
      label: "Schools",
      type: "multiselect",
      required: true,
      options: schools.map((school) => ({
        value: school.id,
        label: school.name,
      })),
    },
    { name: "startDate", label: "Start Date", type: "date", required: true },
    { name: "endDate", label: "End Date", type: "date", required: true },
  ]

  return (
    <div className="flex min-h-screen bg-blue-50">
      {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black z-40" onClick={toggleSidebar} />}

      <div
        className={`
          fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {isMobile && sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="absolute top-4 right-4 z-50 p-2 rounded-full shadow-md"
            aria-label="Close menu"
          >
            <FiX className="w-5 h-5 text-indigo-600" />
          </button>
        )}
        <Sidebar title="Dashboard" organizationId={organizationId} />
      </div>

      <div
        className={`
          flex-1 transition-all duration-300 ease-in-out
          ${!isMobile && sidebarOpen ? "ml-64" : "ml-0"}
        `}
      >
        <div className="min-h-screen p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              {isMobile && !sidebarOpen && (
                <button onClick={toggleSidebar} className="p-2 rounded-md shadow-sm" aria-label="Open menu">
                  <FiMenu className="w-5 h-5 text-indigo-600" />
                </button>
              )}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                {project?.name || "Project Details"}
              </h1>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto" ref={dropdownRef}>
              <button
                className="flex items-center justify-center px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-200 hover:bg-yellow-300 text-sm text-gray-700 transition-colors"
                onClick={() => console.log("Download clicked")}
              >
                <span>Download Data</span>
                <Download className="w-4 h-4 ml-2" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center justify-center px-3 py-2 bg-yellow-400 text-gray-800 rounded-lg hover:bg-yellow-500 text-sm transition-colors"
                >
                  Actions
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
                    <ul className="py-1 text-sm text-gray-700">
                      <li>
                        <button
                          onClick={() => {
                            setIsSchoolModalOpen(true)
                            setDropdownOpen(false)
                          }}
                          className="flex items-center justify-between w-full px-4 py-2 hover:bg-yellow-100 transition-colors"
                        >
                          Add Schools
                          <Building2 className="w-4 h-4 ml-2" />
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            setIsCampModalOpen(true)
                            setDropdownOpen(false)
                          }}
                          className="flex items-center justify-between w-full px-4 py-2 hover:bg-yellow-100 transition-colors"
                        >
                          Create Camp
                          <MapPin className="w-4 h-4 ml-2" />
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            setIsInstructorModalOpen(true)
                            setDropdownOpen(false)
                          }}
                          className="flex items-center justify-between w-full px-4 py-2 hover:bg-yellow-100 transition-colors"
                        >
                          Add Instructor
                          <FaChalkboardTeacher className="w-4 h-4 ml-2" />
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            setIsUploadModalOpen(true)
                            setDropdownOpen(false)
                          }}
                          className="flex items-center justify-between w-full px-4 py-2 hover:bg-yellow-100 transition-colors"
                        >
                          Upload Students
                          <Users className="w-4 h-4 ml-2" />
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading && <p className="text-gray-500">Loading project details...</p>}
          {error && <p className="text-red-500">{error}</p>}

          {project && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <StatsCard
                  icon={<School />}
                  label="Schools"
                  value={project.total_schools ?? 0}
                  iconColor="text-indigo-800"
                  valueColor="text-indigo-800"
                />
                <StatsCard
                  icon={<FaChalkboardTeacher />}
                  label="Instructors"
                  value={project.total_teachers ?? 0}
                  iconColor="text-yellow-400"
                  valueColor="text-yellow-400"
                />
                <StatsCard
                  icon={<Bookmark />}
                  label="Sessions Completion Rate"
                  value={`${project.sessions_completion_rate ?? 0}%`}
                  iconColor="text-indigo-900"
                  valueColor="text-indigo-900"
                />
                <StatsCard
                  icon={<GraduationCap />}
                  label="Total Students"
                  value={project.total_students ?? 0}
                  iconColor="text-green-500"
                  valueColor="text-green-500"
                />
                <StatsCard
                  icon={<Tent />}
                  label="Learning Camps"
                  value={project.total_camps ?? 0}
                  iconColor="text-yellow-500"
                  valueColor="text-yellow-500"
                />
                <StatsCard
                  icon={<Users />}
                  label="Instructor/Student Ratio"
                  value={project.teacher_to_student_ratio ?? 0}
                  iconColor="text-green-600"
                  valueColor="text-green-600"
                />
              </div>

              <div className="w-full overflow-hidden">
                <ProjectCharts
                  chartData={project.learning_level_distribution || []}
                  ageGenderData={project.age_gender_distribution || null}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <SchoolModal
        isOpen={isSchoolModalOpen}
        onClose={() => setIsSchoolModalOpen(false)}
        organizationId={organizationId}
        projectId={projectId}
      />

      <Modal
        isOpen={isCampModalOpen}
        onClose={() => setIsCampModalOpen(false)}
        title="Create Camp"
        fields={campFields}
        onSubmit={handleCreateCamp}
      />

      <InstructorModal
        isOpen={isInstructorModalOpen}
        onClose={() => setIsInstructorModalOpen(false)}
        onSubmit={handleAddInstructor}
        schools={schools}
        projectId={projectId}
        fetchCampsByIds={fetchCampsByIds}
      />

      <MultiSheetUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        organizationId={organizationId}
        projectId={projectId}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  )
}
