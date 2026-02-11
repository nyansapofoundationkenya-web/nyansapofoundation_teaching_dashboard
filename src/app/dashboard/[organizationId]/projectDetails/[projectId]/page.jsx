"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { useStats } from "@/hooks/stats/useStats";
import {
  GraduationCap,
  School,
  Users,
  Download,
  ChevronDown,
  Building2,
} from "lucide-react";
import { FaChalkboardTeacher } from "react-icons/fa";

import StatsCard from "@/components/ProjectDetails/StatsCard";
import SchoolModal from "@/components/ui/SchoolModal";
import SchoolsListModal from "@/components/ui/SchoolsListModal";
import InstructorModal from "@/components/ui/InstructorModal";
import MultiSheetUploadModal from "@/components/ui/MultipleSheetUploadModal";
import StudentLevelsChart from "@/components/Welcome/StudentLevelChart";

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
  // Hooks
  // -------------------------------------------------------------------------
  const {
    project,
    schools,
    loading: projectLoading,
    error: projectError,
    fetchProjectById,
    fetchSchools,
    createInstructor,
  } = useProjectDetails(organizationId);

  const {
    stats: studentLevelsStats,
    loading: levelsLoading,
    error: levelsError,
    fetchProjectStats,
    refreshProjectStats,
  } = useStats();

  // -------------------------------------------------------------------------
  // UI state
  // -------------------------------------------------------------------------
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [isSchoolsListModalOpen, setIsSchoolsListModalOpen] = useState(false);
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [levelType, setLevelType] = useState("literacy");
  const dropdownRef = useRef(null);

  // -------------------------------------------------------------------------
  // Load data
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (organizationId && projectId) {
      fetchProjectById(projectId);
      fetchSchools(projectId);
      fetchProjectStats(organizationId, projectId);
    }
  }, [organizationId, projectId, fetchProjectById, fetchSchools, fetchProjectStats]);

  // -------------------------------------------------------------------------
  // Click outside dropdown
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
  // Handlers
  // -------------------------------------------------------------------------
  const handleSchoolsCardClick = () => {
    if (schools.length > 0) {
      setIsSchoolsListModalOpen(true);
    }
  };

  const handleSchoolClick = (school) => {
    router.push(`/dashboard/${organizationId}/projects/${projectId}/schools/${school.id}/schoolDetails`);
    setIsSchoolsListModalOpen(false);
  };

  const handleRefreshLevels = async () => {
    if (!organizationId || !projectId) return;
    try {
      await refreshProjectStats(organizationId, projectId);
    } catch (err) {
      console.error("Project levels refresh failed:", err);
    }
  };

  const handleDownload = () => {
    console.log("Download project data clicked");
    // → Replace with your actual project export logic, e.g.:
    // window.open(`/api/export/project-performance?organization_id=${organizationId}&project_id=${projectId}`);
  };

  // -------------------------------------------------------------------------
  // Prepare chart data
  // -------------------------------------------------------------------------
  const chartData = (() => {
    const source = levelType === "literacy"
      ? studentLevelsStats?.literacy
      : studentLevelsStats?.numeracy;

    if (!source) return [];

    const baseline = source.baseline || {};
    const endline  = source.endline  || {};

    let levels = Object.keys(baseline);
    if (levels.length === 0) {
      levels = levelType === "literacy"
        ? ["beginner", "letter", "word", "paragraph", "story", "above"]
        : ["beginner", "number_recognition", "addition", "subtraction", "multiplication", "division"];
    }

    const levelOrder = {
      literacy: { "non-reader":0, "beginner":0, "letter":1, "word":2, "paragraph":3, "story":4, "reading-comprehension":4, "above":5 },
      numeracy: { "beginner":0, "number_recognition":1, "addition":2, "subtraction":3, "multiplication":4, "division":5 }
    };

    const orderMap = levelOrder[levelType] || {};
    const sorted = [...levels].sort((a, b) => (orderMap[a] ?? 99) - (orderMap[b] ?? 99));

    return sorted.map(level => ({
      level: level.charAt(0).toUpperCase() + level.slice(1),
      baseline: Number(baseline[level] || 0),
      current: Number(endline[level] || 0),
      rawLevel: level
    })).reverse();
  })();

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <DashboardLayout
      title={project?.name || "Project Details"}
      organizationId={organizationId}
    >
      <div className="p-4 space-y-6 overflow-auto">
        {/* Action buttons – admin/superadmin only */}
        {!userLoading && isAdminOrSuperAdmin && (
          <div className="flex flex-col sm:flex-row gap-2" ref={dropdownRef}>
            <button
              className="flex items-center justify-center px-3 py-2 border border-primary-3 rounded-xl bg-primary-3/20 hover:bg-primary-3/30 text-base text-foreground transition-colors w-full sm:w-auto"
              onClick={handleDownload}
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

        {/* Loading / error states */}
        {(projectLoading || levelsLoading) && (
          <p className="text-gray-300 text-sm">Loading project details...</p>
        )}
        {(projectError || levelsError) && (
          <p className="text-red-400 text-sm">
            {projectError || levelsError || "An error occurred"}
          </p>
        )}

        {/* Project content */}
        {project && (
          <div className="space-y-6">
            {/* Stats cards – only the requested four */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                icon={<GraduationCap />}
                label="Total Students"
                value={project.total_students ?? 0}
                iconColor="text-green-400"
                valueColor="text-green-400"
              />
              <StatsCard
                icon={<Users />}
                label="Instructor/Student Ratio"
                value={project.teacher_to_student_ratio ?? "—"}
                iconColor="text-green-400"
                valueColor="text-green-400"
              />
            </div>

            {/* Student Levels Distribution Chart */}
            <StudentLevelsChart
              levelType={levelType}
              setLevelType={setLevelType}
              chartData={chartData}
              loading={levelsLoading}
              error={levelsError}
              onRefresh={handleRefreshLevels}
              onDownload={() => console.log("Export student levels for project")}
              downloadLoading={false}
              isSuperAdmin={isAdminOrSuperAdmin}
            />
          </div>
        )}
      </div>

      {/* Modals – no camp modal */}
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
        onUploadComplete={() => {
          fetchProjectById(projectId);
          fetchSchools(projectId);
          fetchProjectStats(organizationId, projectId);
        }}
      />
    </DashboardLayout>
  );
}