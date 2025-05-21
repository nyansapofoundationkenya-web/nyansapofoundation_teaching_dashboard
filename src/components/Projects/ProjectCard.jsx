import React from "react";
import { useRouter } from "next/navigation";
import { Building, Users, Tent, Gauge } from "lucide-react";
import { FaChalkboardTeacher } from "react-icons/fa";

export default function ProjectCard({ project, organizationId }) {
  const router = useRouter();

  const handleViewDashboard = () => {
    router.push(`/dashboard/${organizationId}/projectDetails/${project.id}`);
  };

  return (
    <div className="rounded-xl p-6 bg-gradient-to-r from-indigo-500 to-blue-400 text-white shadow-lg w-full max-w-md">
      {/* Title */}
      <h2 className="text-xl font-semibold mb-2">{project?.name}</h2>

      {/* Location tags */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {project.location?.map((loc) => (
          <span
            key={loc}
            className="bg-white text-indigo-600 px-3 py-1 rounded-full text-sm font-medium"
          >
            {loc}
          </span>
        ))}
      </div>

      {/* Statistics */}
      <div className="border-t border-white/40 pt-4 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Building size={20} /> <span>{project.total_schools || 0} Schools</span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={20} /> <span>{project.total_students || 0} Students</span>
        </div>
        <div className="flex items-center gap-2">
          <Tent size={20} /> <span>{project.total_camps || 0} Camps</span>
        </div>
        <div className="flex items-center gap-2">
          <FaChalkboardTeacher size={20} /> <span>{project.total_teachers || 0} Instructors</span>
        </div>
      </div>

      {/* Dashboard Button */}
      <button
        onClick={handleViewDashboard}
        className="mt-6 w-full bg-yellow-400 hover:bg-yellow-300 text-indigo-800 font-semibold py-2 px-4 rounded-full flex items-center justify-center gap-2"
      >
        <Gauge size={16} /> View Dashboard
      </button>
    </div>
  );
}
