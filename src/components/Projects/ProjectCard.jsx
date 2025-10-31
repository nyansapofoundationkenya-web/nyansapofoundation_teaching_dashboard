"use client";

import { useRouter } from "next/navigation";
import { Building, Users, Tent, Gauge, Trash2 } from "lucide-react";
import { FaChalkboardTeacher } from "react-icons/fa";
import { useProjects } from "@/hooks/UseProjects";
import { useState } from "react";

export default function ProjectCard({ project, organizationId, userRole }) {
  const router = useRouter();
  const { deleteProject } = useProjects(organizationId);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleViewDashboard = () => {
    router.push(`/dashboard/${organizationId}/projectDetails/${project.id}`);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async (e) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      // The project will be removed from the list via the refresh trigger
    } catch (error) {
      console.error("Error deleting project:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <div className="rounded-xl p-4 sm:p-6 bg-gradient-to-r from-indigo-500 to-blue-400 text-white shadow-lg w-full transition-transform hover:scale-105 duration-200 relative">
      {/* Delete Button - Only for Admin */}
      {/* {userRole === 'admin' && !showDeleteConfirm && (
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors duration-200 z-10"
          title="Delete Project"
        >
         <Trash2 size={16} className="text-red-500" />
        </button>
      )} */}

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/80 rounded-xl flex items-center justify-center p-4 z-20">
          <div className="text-center bg-white rounded-lg p-4 max-w-[200px]">
            <p className="text-gray-800 text-sm font-medium mb-3">
              Delete this project?
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 line-clamp-2 leading-tight pr-8">{project?.name}</h2>

      {/* Location tags */}
      <div className="flex gap-1 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
        {project.location?.slice(0, 3).map((loc) => (
          <span
            key={loc}
            className="bg-white text-indigo-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium truncate max-w-[80px] sm:max-w-none"
            title={loc}
          >
            {loc}
          </span>
        ))}
        {project.location?.length > 3 && (
          <span className="bg-white/20 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
            +{project.location.length - 3}
          </span>
        )}
      </div>

      {/* Statistics */}
      <div className="border-t border-white/40 pt-3 sm:pt-4 space-y-2 xl:grid xl:grid-cols-2 xl:gap-3 xl:space-y-0">
        <div className="flex items-center gap-2 text-sm sm:text-base">
          <Building size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="truncate">
            <span className="font-medium">{project.total_schools || 0}</span>
            <span className="hidden sm:inline"> Schools</span>
            <span className="sm:hidden"> Schools</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm sm:text-base">
          <Users size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="truncate">
            <span className="font-medium">{project.total_students || 0}</span>
            <span className="hidden sm:inline"> Students</span>
            <span className="sm:hidden"> Students</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm sm:text-base">
          <Tent size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="truncate">
            <span className="font-medium">{project.total_camps || 0}</span>
            <span className="hidden sm:inline"> Camps</span>
            <span className="sm:hidden"> Camps</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm sm:text-base">
          <FaChalkboardTeacher size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="truncate">
            <span className="font-medium">{project.total_teachers || 0}</span>
            <span className="hidden sm:inline"> Instructors</span>
            <span className="sm:hidden"> Instructors</span>
          </span>
        </div>
      </div>

      {/* Dashboard Button */}
      <button
        onClick={handleViewDashboard}
        className="mt-4 sm:mt-6 w-full bg-yellow-400 hover:bg-yellow-300 text-indigo-800 font-semibold py-2 sm:py-2.5 px-4 rounded-full flex items-center justify-center gap-2 transition-colors duration-200 text-sm sm:text-base"
      >
        <Gauge size={14} className="sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">View Dashboard</span>
        <span className="sm:hidden">View Dashboard</span>
      </button>
    </div>
  );
}