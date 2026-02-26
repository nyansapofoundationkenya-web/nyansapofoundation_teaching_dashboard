"use client";

import { useSelector } from "react-redux";
import { School, MapPin, Users, X, Lock } from "lucide-react";

export default function SchoolsListModal({ 
  isOpen, 
  onClose, 
  schools, 
  onSchoolClick,
  organizationId,
  projectId,
}) {
  const { user: currentUser } = useSelector((state) => state.auth);
  const userRole = currentUser?.role;

  if (!isOpen) return null;

  //Get assigned school IDs for restricted roles 
  const getAssignedSchoolIds = () => {
     if (userRole === "school_head" || userRole === "teacher") {
    const userOrg = (currentUser?.organizations || []).find((o) => o.id === organizationId);
    const userProject = (userOrg?.projects || []).find((p) => p.id === projectId);
    return (userProject?.schools || []).map((s) => s.id ?? s);
  }
  return null;
  };

  const assignedSchoolIds = getAssignedSchoolIds();

  const isSchoolAccessible = (schoolId) => {
    if (assignedSchoolIds === null) return true; // all accessible
    return assignedSchoolIds.includes(schoolId);
  };

  return (
    <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-light rounded-xl shadow-lg max-w-2xl w-full max-h-[85vh] overflow-hidden border border-gray-600 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Schools</h2>
            <p className="text-sm text-gray-400 mt-1">
              {schools.length} school{schools.length !== 1 ? "s" : ""}
              {assignedSchoolIds && (
                <span className="ml-2 text-primary-3">
                  ({assignedSchoolIds.length} assigned to you)
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-lighter rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Schools List */}
        <div className="overflow-y-auto flex-1 p-6 scrollbar-hide pb-8">
          {schools.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <School className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No schools found in this project.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schools.map((school) => {
                const accessible = isSchoolAccessible(school.id);

                return (
                  <div
                    key={school.id}
                    onClick={() => accessible && onSchoolClick(school)}
                    className={`bg-background-lighter rounded-lg p-4 border transition-colors group relative
                      ${accessible
                        ? "border-gray-600 cursor-pointer hover:border-primary-2"
                        : "border-gray-700 cursor-not-allowed opacity-50"
                      }`}
                  >
                    {/* Lock icon for inaccessible schools */}
                    {!accessible && (
                      <div className="absolute top-3 right-3">
                        <Lock className="w-4 h-4 text-gray-500" />
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-3">
                      <School className={`w-5 h-5 flex-shrink-0 mt-1 ${accessible ? "text-primary-2" : "text-gray-600"}`} />
                    </div>

                    <h3 className={`text-lg font-semibold truncate mb-2 transition-colors
                      ${accessible
                        ? "text-foreground group-hover:text-primary-2"
                        : "text-gray-500"
                      }`}
                    >
                      {school.name}
                    </h3>

                    <div className="space-y-2 text-sm text-gray-400">
                      {school.location && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{school.location}</span>
                        </div>
                      )}
                      {school.totalStudents !== undefined && (
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{school.totalStudents} students</span>
                        </div>
                      )}
                      {school.totalTeachers !== undefined && (
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{school.totalTeachers} teachers</span>
                        </div>
                      )}
                    </div>

                    {/* Not assigned label */}
                    {!accessible && (
                      <p className="text-xs text-gray-600 mt-2">Not assigned to you</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-600 flex-shrink-0 bg-background-light">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}