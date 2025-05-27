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

export default function ProjectDetails() {
  const { organizationId, projectId } = useParams()
  const [sidebarOpen, setSidebarOpen] = useState(true)
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
      setIsMobile(window.innerWidth < 768)
      setSidebarOpen(window.innerWidth >= 768)
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
      const schoolIds = Array.isArray(schools) ? schools.map((school) => school.value) : [schools.value]
      await createCamp(projectId, schoolIds, { name, subject: subject.value, startDate, endDate })
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
      {/* Sidebar - Fixed positioning */}
      <div className="fixed left-0 top-0 h-full z-30">
        <div className={`${isMobile ? (sidebarOpen ? "fixed left-0 z-40" : "fixed -left-full") : "relative"} transition-all duration-300 ease-in-out h-full`}>
        <Sidebar title="Dashboard" organizationId={organizationId} />
      </div>

      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={toggleSidebar}></div>
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="bg-white px-6 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="text-indigo-600 p-2 rounded-md hover:bg-gray-100"
              >
                {sidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
              </button>
            )}
            {/* <h1 className="text-xl font-semibold text-[#162947]">Attendance</h1> */}
          </div>
      
      </div>
      </div>
      </div>
      {/* Main content area - with proper margin to account for fixed sidebar */}
      <div className="flex-1 ml-64">
        {" "}
        {/* Adjust ml-64 based on your sidebar width */}
        <div className="min-h-screen">
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">{project?.name || "Project Details"}</h1>

              <div className="flex gap-2 relative" ref={dropdownRef}>
                <button
                  className="flex items-center px-4 py-2 border border-yellow-300 rounded-lg bg-yellow-200 hover:bg-yellow-300 text-sm text-gray-700"
                  onClick={() => console.log("Download clicked")}
                >
                  Download Data
                  <Download className="w-4 h-4 ml-2" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className="flex items-center px-4 py-2 bg-yellow-400 text-gray-800 rounded-lg hover:bg-yellow-500 text-sm"
                  >
                    Actions
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <ul className="py-1 text-sm text-gray-700">
                        <li>
                          <button
                            onClick={() => {
                              setIsSchoolModalOpen(true)
                              setDropdownOpen(false)
                            }}
                            className="flex items-center justify-between w-full px-4 py-2 hover:bg-yellow-100"
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
                            className="flex items-center justify-between w-full px-4 py-2 hover:bg-yellow-100"
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
                            className="flex items-center justify-between w-full px-4 py-2 hover:bg-yellow-100"
                          >
                            Add Instructor
                            <FaChalkboardTeacher className="w-4 h-4 ml-2" />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-blue-50 p-6 rounded-xl">
                  <StatsCard
                    icon={<GraduationCap />}
                    label="Total Students"
                    value={project.total_students ?? 0}
                    iconColor="text-green-500"
                    valueColor="text-green-500"
                  />
                  <StatsCard
                    icon={<School />}
                    label="Schools"
                    value={project.total_schools ?? 0}
                    iconColor="text-indigo-800"
                    valueColor="text-indigo-800"
                  />
                  <StatsCard
                    icon={<Tent />}
                    label="Learning Camps"
                    value={project.total_camps ?? 0}
                    iconColor="text-yellow-500"
                    valueColor="text-yellow-500"
                  />
                  <StatsCard
                    icon={<FaChalkboardTeacher />}
                    label="Instructors"
                    value={project.total_teachers ?? 0}
                    iconColor="text-yellow-400"
                    valueColor="text-yellow-400"
                  />
                  <StatsCard
                    icon={<Users />}
                    label="Instructor/Student Ratio"
                    value={project.teacher_to_student_ratio ?? 0}
                    iconColor="text-green-600"
                    valueColor="text-green-600"
                  />
                  <StatsCard
                    icon={<Bookmark />}
                    label="Sessions Completion Rate"
                    value={`${project.sessions_completion_rate ?? 0}%`}
                    iconColor="text-indigo-900"
                    valueColor="text-indigo-900"
                  />
                </div>

                {/* Charts Section */}
                <ProjectCharts
                  chartData={project.learning_level_distribution || []}
                  ageGenderData={project.age_gender_distribution || null}
                />
              </>
            )}
          </div>
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
        onSubmit={handleAddInstructor}
        schools={schools}
        projectId={projectId}
        fetchCampsByIds={fetchCampsByIds}
      />
    </div>
  )
}
