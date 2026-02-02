"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import {
  GraduationCap,
  School,
  Tent,
  Users,
  Bookmark,
  Download,
  ChevronDown,
  Building2,
} from "lucide-react";
import { FaChalkboardTeacher } from "react-icons/fa";

import StatsCard from "@/components/ProjectDetails/StatsCard";
import SchoolModal from "@/components/ui/SchoolModal";
import SchoolsListModal from "@/components/ui/SchoolsListModal";
import InstructorModal from "@/components/ui/InstructorModal";
import Modal from "@/components/ui/Modal";
import ProjectCharts from "@/components/Charts/ProjectCharts";
import MultiSheetUploadModal from "@/components/ui/MultipleSheetUploadModal";

import DashboardLayout from "@/app/dashboard/[organizationId]/DashboardLayout";

export default function ProjectDetails() {
  const { organizationId, projectId } = useParams();
  const router = useRouter();

  // -------------------------------------------------------------------------
  // Auth & Role
  // -------------------------------------------------------------------------
  const { user: currentUser, loading: userLoading } = useSelector(
    (state) => state.auth
  );
  const isAdminOrSuperAdmin =
    currentUser?.role === "admin" || currentUser?.role === "super_admin";

  // -------------------------------------------------------------------------
  // Project data hook
  // -------------------------------------------------------------------------
  const {
    project,
    schools,
    loading,
    error,
    fetchProjectById,
    fetchSchools,
    createCamp,
    createInstructor,
  } = useProjectDetails(organizationId);

  // -------------------------------------------------------------------------
  // UI state
  // -------------------------------------------------------------------------
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [isSchoolsListModalOpen, setIsSchoolsListModalOpen] = useState(false);
  const [isCampModalOpen, setIsCampModalOpen] = useState(false);
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  // -------------------------------------------------------------------------
  // Load project & schools
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (organizationId && projectId) {
      fetchProjectById(projectId);
      fetchSchools(projectId);
    }
  }, [organizationId, projectId]);

  // -------------------------------------------------------------------------
  // Click-outside for dropdown
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // -------------------------------------------------------------------------
  // Handle Schools card click
  // -------------------------------------------------------------------------
  const handleSchoolsCardClick = () => {
    if (schools.length > 0) {
      setIsSchoolsListModalOpen(true);
    }
  };

  // -------------------------------------------------------------------------
  // Handle individual school click
  // -------------------------------------------------------------------------
  const handleSchoolClick = (school) => {
    router.push(`/dashboard/${organizationId}/projects/${projectId}/schools/${school.id}/schoolDetails`);
    setIsSchoolsListModalOpen(false);
  };

  // -------------------------------------------------------------------------
  // Camp creation
  // -------------------------------------------------------------------------
  const handleCreateCamp = async (values) => {
    const { name, subject, schools, startDate, endDate } = values;
    if (!name || !subject || !schools || !startDate || !endDate) {
      alert("All fields are required.");
      return;
    }
    try {
      const schoolIds = schools;
      await createCamp(projectId, schoolIds, {
        name,
        subject,
        startDate,
        endDate,
      });
      alert("Camp created successfully!");
      setIsCampModalOpen(false);
      await fetchSchools(projectId);
    } catch (err) {
      console.error(err);
      alert(`Failed to create camp: ${err.message}`);
    }
  };

  // -------------------------------------------------------------------------
  // Instructor creation
  // -------------------------------------------------------------------------
  const handleAddInstructor = async (values) => {
    const { name, email, phone, school, camp } = values;
    if (!name || !email || !phone || !school || !camp) {
      alert("All fields are required.");
      return;
    }
    try {
      await createInstructor(
        organizationId,
        projectId,
        school.value,
        camp.value,
        { name, email, phone }
      );
      alert("Instructor added successfully!");
      setIsInstructorModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(`Failed to add instructor: ${err.message}`);
    }
  };

  // -------------------------------------------------------------------------
  // Upload complete → refresh
  // -------------------------------------------------------------------------
  const handleUploadComplete = async () => {
    await fetchProjectById(projectId);
    await fetchSchools(projectId);
    setIsUploadModalOpen(false);
  };

  // -------------------------------------------------------------------------
  // Camp modal fields
  // -------------------------------------------------------------------------
  const campFields = [
    {
      name: "name",
      label: "Camp Name",
      type: "text",
      required: true,
      placeholder: "Enter camp name",
    },
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
      options: schools.map((s) => ({ value: s.id, label: s.name })),
    },
    { name: "startDate", label: "Start Date", type: "date", required: true },
    { name: "endDate", label: "End Date", type: "date", required: true },
  ];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <DashboardLayout
      title={project?.name || "Project Details"}
      organizationId={organizationId}
    >
      <div className="p-4 space-y-6 overflow-auto">
        {/* -----------------------------------------------------------------
            Action buttons – admin only
          ----------------------------------------------------------------- */}
        {!userLoading && isAdminOrSuperAdmin && (
          <div className="flex flex-col sm:flex-row gap-2" ref={dropdownRef}>
            <button
              className="flex items-center justify-center px-3 py-2 border border-primary-3 rounded-xl bg-primary-3/20 hover:bg-primary-3/30 text-base text-foreground transition-colors w-full sm:w-auto"
              onClick={() => console.log("Download clicked")}
            >
              <span>Download Data</span>
              <Download className="w-4 h-4 ml-2 flex-shrink-0" />
            </button>

            <div className="relative w-full sm:w-auto">
              <button
                onClick={() => setDropdownOpen((p) => !p)}
                className="flex items-center justify-center px-3 py-2 bg-primary-3 text-primary-1 rounded-xl hover:bg-yellow-400 text-base transition-colors w-full sm:w-auto font-medium"
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
                          setIsSchoolModalOpen(true);
                          setDropdownOpen(false);
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
                          setIsInstructorModalOpen(true);
                          setDropdownOpen(false);
                        }}
                        className="flex items-center justify-between w-full px-4 py-2 hover:bg-background-lighter transition-colors"
                      >
                        <span>Add Instructor</span>
                        <FaChalkboardTeacher className="w-4 h-4 flex-shrink-0" />
                      </button>
                    </li> */}
                    <li>
                      <button
                        onClick={() => {
                          setIsUploadModalOpen(true);
                          setDropdownOpen(false);
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

        {/* -----------------------------------------------------------------
            Loading / error
          ----------------------------------------------------------------- */}
        {loading && <p className="text-gray-300 text-sm">Loading project details...</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* -----------------------------------------------------------------
            Project content
          ----------------------------------------------------------------- */}
        {project && (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <StatsCard
                icon={<School />}
                label="Schools"
                value={project.total_schools ?? 0}
                iconColor="text-primary-2"
                valueColor="text-primary-2"
                onClick={handleSchoolsCardClick}
                clickable={true}
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

            {/* Charts */}
            <ProjectCharts
              chartData={project.learning_level_distribution || []}
              ageGenderData={project.age_gender_distribution || null}
            />
          </div>
        )}
      </div>

      {/* -----------------------------------------------------------------
          Modals (outside the scroll container)
        ----------------------------------------------------------------- */}
      <SchoolModal
        isOpen={isSchoolModalOpen}
        onClose={() => setIsSchoolModalOpen(false)}
        organizationId={organizationId}
        projectId={projectId}
      />

      <SchoolsListModal
        isOpen={isSchoolsListModalOpen}
        onClose={() => setIsSchoolsListModalOpen(false)}
        schools={schools}
        onSchoolClick={handleSchoolClick}
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
    </DashboardLayout>
  );
}