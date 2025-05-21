"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Dashboard/SideBar";
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
  MapPin,
} from "lucide-react";
import { FaChalkboardTeacher } from "react-icons/fa";
import StatsCard from "@/components/ProjectDetails/StatsCard";
import SchoolModal from "@/components/ui/SchoolModal";
import Modal from "@/components/ui/Modal";

export default function ProjectDetails() {
  const { organizationId, projectId } = useParams();
  const { project, schools, loading, error, fetchProjectById, fetchSchools, createCamp } = useProjectDetails(organizationId);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [isCampModalOpen, setIsCampModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (organizationId && projectId) {
      fetchProjectById(projectId);
      fetchSchools(projectId);
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [organizationId, projectId]);

  const handleCreateCamp = async (values) => {
    const { name, subject, schools, startDate, endDate } = values;
    // console.log(values)

    // Validation
    if (!name || !subject || !schools || !startDate || !endDate) {
      alert("All fields are required.");
      return;
    }

    try {
      const schoolIds = schools
    //   console.log(schoolIds)
      await createCamp(projectId, schoolIds, { name, subject, startDate, endDate });
      alert("Camp created successfully!");
      setIsCampModalOpen(false);
    } catch (err) {
      console.error("Error creating camp:", err);
      alert(`Failed to create camp: ${err.message}`);
    }
  };

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
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar title="Dashboard" organizationId={organizationId} />

      <div className="p-6 space-y-6 bg-blue-50 flex-1 overflow-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {project?.name || "Project Details"}
          </h1>

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
                          setIsSchoolModalOpen(true);
                          setDropdownOpen(false);
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
                          setIsCampModalOpen(true);
                          setDropdownOpen(false);
                        }}
                        className="flex items-center justify-between w-full px-4 py-2 hover:bg-yellow-100"
                      >
                        Create Camp
                        <MapPin className="w-4 h-4 ml-2" />
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => console.log("Add Instructor")}
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
        )}
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
    </div>
  );
}