"use client";

import { useRouter } from "next/navigation";
import { FaChalkboardTeacher } from "react-icons/fa";
import { GraduationCap, Tent } from "lucide-react";

export default function SchoolCard({ school, organizationId }) {
  const router = useRouter();

  const handleViewDashboard = () => {
    router.push(`/dashboard/${organizationId}/schools/${school.projectId}/${school.id}`);
  };

  const locations = Array.isArray(school.location) ? school.location : school.location ? [school.location] : ["Unknown"];

  return (
    <div className="rounded-xl p-4 sm:p-6 bg-gradient-to-r from-indigo-500 to-blue-400 text-white shadow-lg w-full transition-transform hover:scale-105 duration-200">
      {/* Title */}
      <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 line-clamp-2 leading-tight">{school.name || "Unnamed School"}</h2>

      {/* Location tags */}
      <div className="flex gap-1 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
        {locations.slice(0, 3).map((loc) => (
          <span
            key={loc}
            className="bg-white text-indigo-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium truncate max-w-[80px] sm:max-w-none"
            title={loc}
          >
            {loc}
          </span>
        ))}
        {locations.length > 3 && (
          <span className="bg-white/20 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
            +{locations.length - 3}
          </span>
        )}
      </div>

      {/* Statistics */}
      <div className="border-t border-white/40 pt-3 sm:pt-4 space-y-2 xl:grid xl:grid-cols-2 xl:gap-3 xl:space-y-0">
        <div className="flex items-center gap-2 text-sm sm:text-base">
          <FaChalkboardTeacher size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="truncate">
            <span className="font-medium">{school.instructorCount || 0}</span>
            <span className="hidden sm:inline"> Instructor{school.instructorCount !== 1 ? "s" : ""}</span>
            <span className="sm:hidden"> Inst</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm sm:text-base">
          <GraduationCap size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="truncate">
            <span className="font-medium">{school.studentCount || 0}</span>
            <span className="hidden sm:inline"> Student{school.studentCount !== 1 ? "s" : ""}</span>
            <span className="sm:hidden"> Std</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm sm:text-base">
          <Tent size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="truncate">
            <span className="font-medium">{school.campCount || 0}</span>
            <span className="hidden sm:inline"> Camp{school.campCount !== 1 ? "s" : ""}</span>
            <span className="sm:hidden"> Camps</span>
          </span>
        </div>
      </div>

      {/* Dashboard Button */}
      <button
        onClick={handleViewDashboard}
        className="mt-4 sm:mt-6 w-full bg-yellow-400 hover:bg-yellow-300 text-indigo-800 font-semibold py-2 sm:py-2.5 px-4 rounded-full flex items-center justify-center gap-2 transition-colors duration-200 text-sm sm:text-base"
      >
        <GraduationCap size={14} className="sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">View Dashboard</span>
        <span className="sm:hidden">Dashboard</span>
      </button>
    </div>
  );
}