"use client";

import { School, MapPin, Users, X } from "lucide-react";

export default function SchoolsListModal({ 
  isOpen, 
  onClose, 
  schools, 
  onSchoolClick 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-light rounded-xl shadow-lg max-w-2xl w-full max-h-[85vh] overflow-hidden border border-gray-600 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Schools</h2>
            <p className="text-sm text-gray-400 mt-1">
              {schools.length} school{schools.length !== 1 ? 's' : ''}
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
              {schools.map((school) => (
                <div
                  key={school.id}
                  onClick={() => onSchoolClick(school)}
                  className="bg-background-lighter rounded-lg p-4 border border-gray-600 cursor-pointer hover:border-primary-2 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <School className="w-5 h-5 text-primary-2 flex-shrink-0 mt-1" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground truncate mb-2 group-hover:text-primary-2 transition-colors">
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer (Always visible) */}
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
