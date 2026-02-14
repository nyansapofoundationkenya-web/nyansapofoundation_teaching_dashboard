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
import KeyBarriers from "@/components/Welcome/KeyBarriers";
import WeeklyEngagementChart from "@/components/Welcome/WeeklyEngagementChart";
import ProgramImpact from "@/components/Welcome/ProgramImpact";
import AssessmentHealth from "@/components/Welcome/AssessmentHealth";
import AttendanceOverview from "@/components/Welcome/AttendanceOverview";

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

  // Dummy state for Key Barriers
  const [barrierLoading] = useState(false);
  const [barrierError] = useState(null);
  const [barriersData] = useState({
    top_3_missed: [
      { letter: "A", number: 1 },
      { letter: "B", number: 2 },
      { letter: "C", number: 3 },
    ],
    stats: { success_rate: 85 },
  });
  const [assessmentType, setAssessmentType] = useState("Literacy");

  // Dummy state for Assessment Health
  const [healthLoading] = useState(false);
  const [healthError] = useState(null);
  const [healthData] = useState({
  literacy: {
    completion_rate: 85,
    total_assessments: 450,
    total_students_completed: 450,
    total_students_assigned: 500,
  },
  numeracy: {
    completion_rate: 78,
    total_assessments: 390,
    total_students_completed: 390,
    total_students_assigned: 500,
  },
});


  // Dummy state for Attendance Overview
  const [attendanceLoading] = useState(false);
  const [attendanceError] = useState(null);
  const [attendanceData] = useState({
  today: {
    attendance_rate: 88,
    total_present: 440,
    total_students: 500,
    date: new Date().toISOString(),
    schools_took_attendance: 8,
    schools_pending_attendance: 2,
    total_schools: 10,
  },
  last_7_days: [
    { day: "Mon", attendance_rate: 85, total_present: 425, total_students: 500 },
    { day: "Tue", attendance_rate: 87, total_present: 435, total_students: 500 },
    { day: "Wed", attendance_rate: 90, total_present: 450, total_students: 500 },
    { day: "Thu", attendance_rate: 88, total_present: 440, total_students: 500 },
    { day: "Fri", attendance_rate: 86, total_present: 430, total_students: 500 },
    { day: "Sat", attendance_rate: 84, total_present: 420, total_students: 500 },
    { day: "Sun", attendance_rate: 89, total_present: 445, total_students: 500 },
  ],
  last_30_days: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - i * 86400000).toISOString(),
    attendance_rate: 80 + Math.random() * 10,
    total_present: 400 + Math.floor(Math.random() * 100),
    total_students: 500,
  })).reverse(),
  weekly_comparison: {
    this_week_avg: 87,
    last_week_avg: 84,
    change: 3,
    trend: "up",
  },
  monthly_comparison: {
    this_month_avg: 86,
    last_month_avg: 82,
    change: 4,
    trend: "up",
  },
});


  // Dummy state for Program Impact
  const [impactLoading] = useState(false);
  const [impactError] = useState(null);
  const [impactData] = useState({
    students_improved: 125,
    improvement_percentage: 75,
    students_assessed: 450,
    total_students: 500,
  });

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

            {/* Key Barriers + Student Levels Distribution Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <KeyBarriers
                  organizationId={organizationId}
                  loading={barrierLoading}
                  error={barrierError}
                  barriersData={barriersData}
                  assessmentType={assessmentType}
                  onAssessmentTypeChange={setAssessmentType}
                  onFetchData={() => console.log("Fetching barriers data for project")}
                />
              </div>
              <div className="lg:col-span-2">
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
            </div>

            {/* Weekly Engagement + Program Impact */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <WeeklyEngagementChart organizationId={organizationId} />
              </div>
              <div className="lg:col-span-1">
                <ProgramImpact
                  organizationId={organizationId}
                  loading={impactLoading}
                  error={impactError}
                  impactData={impactData}
                  onFetchData={() => console.log("Fetching impact data for project")}
                />
              </div>
            </div>

            {/* Assessment Health */}
            <div className="grid grid-cols-1">
              <AssessmentHealth
                organizationId={organizationId}
                loading={healthLoading}
                error={healthError}
                data={healthData}
                onFetchData={() => console.log("Fetching health data for project")}
              />
            </div>

            {/* Attendance Overview */}
            <div className="grid grid-cols-1">
              <AttendanceOverview
                organizationId={organizationId}
                loading={attendanceLoading}
                error={attendanceError}
                data={attendanceData}
                onFetchData={() => console.log("Fetching attendance data for project")}
              />
            </div>
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