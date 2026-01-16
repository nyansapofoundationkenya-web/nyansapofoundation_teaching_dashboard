"use client";

import { useRouter } from "next/navigation";
import { FaChalkboardTeacher } from "react-icons/fa";
import { GraduationCap, Tent } from "lucide-react";

export default function SchoolCard({ school, organizationId }) {
  // console.log(school)
  const router = useRouter();

  const handleViewDashboard = () => {
    router.push(`/dashboard/${organizationId}/projects/${school.projectId}/schools/${school.id}/schoolDetails`);
  };

  const locations = Array.isArray(school.location) ? school.location : school.location ? [school.location] : ["Unknown"];

  return (
    <div className="rounded-2xl p-4 bg-background-light text-foreground shadow-lg w-full transition-all hover:shadow-xl duration-200 border border-gray-600">
      {/* Title */}
      <h2 className="text-lg font-semibold mb-3 line-clamp-2 leading-tight">{school.name || "Unnamed School"}</h2>

      {/* Location tags */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {locations.slice(0, 3).map((loc) => (
          <span
            key={loc}
            className="bg-background-lighter text-foreground px-2 py-1 rounded-full text-sm font-medium truncate max-w-[80px] border border-gray-500"
            title={loc}
          >
            {loc}
          </span>
        ))}
        {locations.length > 3 && (
          <span className="bg-primary-2/20 text-primary-2 px-2 py-1 rounded-full text-sm font-medium border border-primary-2/30">
            +{locations.length - 3}
          </span>
        )}
      </div>

      {/* Statistics */}
      <div className="border-t border-gray-600 pt-3 space-y-2 xl:grid xl:grid-cols-2 xl:gap-2 xl:space-y-0">
        <div className="flex items-center gap-2 text-base">
          <FaChalkboardTeacher size={16} className="flex-shrink-0 text-primary-2" />
          <span className="truncate">
            <span className="font-medium">{school.total_teachers || 0}</span>
            <span className="hidden sm:inline"> Instructor{school.total_teachers !== 1 ? "s" : ""}</span>
            <span className="sm:hidden"> Inst</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-base">
          <GraduationCap size={16} className="flex-shrink-0 text-primary-2" />
          <span className="truncate">
            <span className="font-medium">{school.total_students || 0}</span>
            <span className="hidden sm:inline"> Student{school.total_students !== 1 ? "s" : ""}</span>
            <span className="sm:hidden"> Std</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-base">
          <Tent size={16} className="flex-shrink-0 text-primary-2" />
          <span className="truncate">
            <span className="font-medium">{school.total_camps || 0}</span>
            <span className="hidden sm:inline"> Camp{school.total_camps !== 1 ? "s" : ""}</span>
            <span className="sm:hidden"> Camps</span>
          </span>
        </div>
      </div>

      {/* Dashboard Button */}
      <button
        onClick={handleViewDashboard}
        className="mt-4 w-full bg-primary-3 hover:bg-yellow-400 text-primary-1 font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors duration-200 text-base shadow-md hover:shadow-lg"
      >
        <GraduationCap size={14} />
        <span>View Dashboard</span>
      </button>
    </div>
  );
}