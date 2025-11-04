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
    <div className="rounded-2xl p-4 bg-background-light text-foreground shadow-lg w-full transition-all hover:shadow-xl duration-200 relative border border-gray-600">
      {/* Delete Button - Only for Admin */}
      {/* {userRole === 'admin' && !showDeleteConfirm && (
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="absolute top-3 right-3 p-1.5 bg-background-lighter hover:bg-background rounded-xl transition-colors duration-200 z-10"
          title="Delete Project"
        >
         <Trash2 size={16} className="text-red-400" />
        </button>
      )} */}

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/80 rounded-2xl flex items-center justify-center p-4 z-20">
          <div className="text-center bg-background-light rounded-xl p-4 max-w-[200px] border border-gray-600">
            <p className="text-foreground text-sm font-medium mb-3">
              Delete this project?
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      <h2 className="text-lg font-semibold mb-3 line-clamp-2 leading-tight pr-8">{project?.name}</h2>

      {/* Location tags */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {project.location?.slice(0, 3).map((loc) => (
          <span
            key={loc}
            className="bg-background-lighter text-foreground px-2 py-1 rounded-full text-sm font-medium truncate max-w-[80px] border border-gray-500"
            title={loc}
          >
            {loc}
          </span>
        ))}
        {project.location?.length > 3 && (
          <span className="bg-primary-2/20 text-primary-2 px-2 py-1 rounded-full text-sm font-medium border border-primary-2/30">
            +{project.location.length - 3}
          </span>
        )}
      </div>

      {/* Statistics */}
      <div className="border-t border-gray-600 pt-3 space-y-2 xl:grid xl:grid-cols-2 xl:gap-2 xl:space-y-0">
        <div className="flex items-center gap-2 text-base">
          <Building size={16} className="flex-shrink-0 text-primary-2" />
          <span className="truncate">
            <span className="font-medium">{project.total_schools || 0}</span>
            <span className="hidden sm:inline"> Schools</span>
            <span className="sm:hidden"> Schools</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-base">
          <Users size={16} className="flex-shrink-0 text-primary-2" />
          <span className="truncate">
            <span className="font-medium">{project.total_students || 0}</span>
            <span className="hidden sm:inline"> Students</span>
            <span className="sm:hidden"> Students</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-base">
          <Tent size={16} className="flex-shrink-0 text-primary-2" />
          <span className="truncate">
            <span className="font-medium">{project.total_camps || 0}</span>
            <span className="hidden sm:inline"> Camps</span>
            <span className="sm:hidden"> Camps</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-base">
          <FaChalkboardTeacher size={16} className="flex-shrink-0 text-primary-2" />
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
        className="mt-4 w-full bg-primary-3 hover:bg-yellow-400 text-primary-1 font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors duration-200 text-base shadow-md hover:shadow-lg"
      >
        <Gauge size={14} />
        <span>View Dashboard</span>
      </button>
    </div>
  );
}