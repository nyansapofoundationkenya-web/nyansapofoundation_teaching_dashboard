"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { useSelector } from "react-redux"
import Sidebar from "@/components/Dashboard/SideBar"
import Header from "@/components/Dashboard/Header" // Add Header import
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Get user data directly from Redux store
  const { user: currentUser, loading: userLoading } = useSelector((state) => state.auth);
  const isAdminOrSuperAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  
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
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleSidebar} />}

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {isMobile && sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white shadow-md"
            aria-label="Close menu"
          >
            <FiX className="w-5 h-5 text-indigo-600" />
          </button>
        )}
        <Sidebar initialTitle="Projects" organizationId={organizationId} />
      </div>

      {/* Main content */}
      <div
        className={`
          flex-1 w-full max-w-full transition-all duration-300 ease-in-out flex flex-col
          ${!isMobile && sidebarOpen ? "ml-64" : "ml-0"}
        `}
      >
        {/* Header */}
        <div className="flex-shrink-0 mx-4">
          <div className="flex items-center">
            {isMobile && !sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="p-2 mx-4 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Open menu"
              >
                <FiMenu className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1">
              <Header title={project?.name || "Project Details"} />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 overflow-auto">
          {/* Action buttons - Visible only to admin or super_admin */}
          {!userLoading && isAdminOrSuperAdmin && (
            <div className="flex flex-col sm:flex-row gap-2 w-full mb-4" ref={dropdownRef}>
              <button
                className="flex items-center justify-center px-3 py-2 border border-primary-3 rounded-xl bg-primary-3/20 hover:bg-primary-3/30 text-sm text-foreground transition-colors w-full sm:w-auto"
                onClick={() => console.log("Download clicked")}
              >
                <span>Download Data</span>
                <Download className="w-4 h-4 ml-2 flex-shrink-0" />
              </button>

              <div className="relative w-full sm:w-auto">
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center justify-center px-3 py-2 bg-primary-3 text-primary-1 rounded-xl hover:bg-yellow-400 text-sm transition-colors w-full sm:w-auto font-medium"
                >
                  <span>Actions</span>
                  <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 right-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-48 bg-background-light border border-gray-600 rounded-xl shadow-lg z-30">
                    <ul className="py-1 text-sm text-foreground">
                      <li>
                        <button
                          onClick={() => {
                            setIsSchoolModalOpen(true)
                            setDropdownOpen(false)
                          }}
                          className="flex items-center justify-between w-full px-4 py-2 hover:bg-background-lighter transition-colors rounded-t-xl"
                        >
                          <span>Add Schools</span>
                          <Building2 className="w-4 h-4 flex-shrink-0" />
                        </button>
                      </li>
                      {/* <li>
                        <button
                          onClick={() => {
                            setIsCampModalOpen(true)
                            setDropdownOpen(false)
                          }}
                          className="flex items-center justify-between w-full px-4 py-2 hover:bg-background-lighter transition-colors"
                        >
                          <span>Create Camp</span>
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                        </button>
                      </li> */}
                      <li>
                        <button
                          onClick={() => {
                            setIsInstructorModalOpen(true)
                            setDropdownOpen(false)
                          }}
                          className="flex items-center justify-between w-full px-4 py-2 hover:bg-background-lighter transition-colors"
                        >
                          <span>Add Instructor</span>
                          <FaChalkboardTeacher className="w-4 h-4 flex-shrink-0" />
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            setIsUploadModalOpen(true)
                            setDropdownOpen(false)
                          }}
                          className="flex items-center justify-between w-full px-4 py-2 hover:bg-background-lighter transition-colors rounded-b-xl"
                        >
                          <span>Upload Students for multiple schools</span>
                          <Users className="w-4 h-4 flex-shrink-0" />
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading and error states */}
          {loading && <p className="text-gray-300 text-sm">Loading project details...</p>}
          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Project content */}
          {project && (
            <div className="w-full max-w-full">
              {/* Stats cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                <StatsCard
                  icon={<School />}
                  label="Schools"
                  value={project.total_schools ?? 0}
                  iconColor="text-primary-2"
                  valueColor="text-primary-2"
                />
                <StatsCard
                  icon={<FaChalkboardTeacher />}
                  label="Instructors"
                  value={project.total_teachers ?? 0}
                  iconColor="text-primary-3"
                  valueColor="text-primary-3"
                />
                <StatsCard
                  icon={<Bookmark />}
                  label="Sessions Completion Rate"
                  value={`${project.sessions_completion_rate ?? 0}%`}
                  iconColor="text-primary-2"
                  valueColor="text-primary-2"
                />
                <StatsCard
                  icon={<GraduationCap />}
                  label="Total Students"
                  value={project.total_students ?? 0}
                  iconColor="text-green-400"
                  valueColor="text-green-400"
                />
                <StatsCard
                  icon={<Tent />}
                  label="Learning Camps"
                  value={project.total_camps ?? 0}
                  iconColor="text-primary-3"
                  valueColor="text-primary-3"
                />
                <StatsCard
                  icon={<Users />}
                  label="Instructor/Student Ratio"
                  value={project.teacher_to_student_ratio ?? 0}
                  iconColor="text-green-400"
                  valueColor="text-green-400"
                />
              </div>

              {/* Charts section */}
              <div className="w-full max-w-full">
                <ProjectCharts
                  chartData={project.learning_level_distribution || []}
                  ageGenderData={project.age_gender_distribution || null}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
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
        organizationId={organizationId}
        projectId={projectId}
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