"use client";

import { useRouter } from "next/navigation";
import { FaChalkboardTeacher } from "react-icons/fa";
import { GraduationCap, Tent } from "lucide-react";

export default function SchoolCard({ school, organizationId }) {
  const router = useRouter();

  const handleViewDashboard = () => {
    router.push(`/dashboard/${organizationId}/schools/${school.projectId}/${school.id}`);
  };

  // Process location for display as an array
  const locations = Array.isArray(school.location) ? school.location : school.location ? [school.location] : ["Unknown"];

  return (
    <div className="rounded-xl p-6 bg-gradient-to-r from-indigo-500 to-blue-400 text-white shadow-lg w-full max-w-md">
      {/* Title */}
      <h2 className="text-xl font-semibold mb-2">{school.name || "Unnamed School"}</h2>

      {/* Location tags */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {locations.map((loc) => (
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
          <FaChalkboardTeacher size={20} />
          <span>{school.instructorCount || 0} Instructor{school.instructorCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          <GraduationCap size={20} />
          <span>{school.studentCount || 0} Student{school.studentCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          <Tent size={20} />
          <span>{school.campCount || 0} Camp{school.campCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Dashboard Button */}
      <button
        onClick={handleViewDashboard}
        className="mt-6 w-full bg-yellow-400 hover:bg-yellow-300 text-indigo-800 font-semibold py-2 px-4 rounded-full flex items-center justify-center gap-2"
      >
        <GraduationCap size={16} />
        View Dashboard
      </button>
    </div>
  );
}