"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Dashboard/SideBar";
import Filter from "@/components/Students/Filter";
import StudentsTable from "@/components/Students/StudentsTable";
import { useStudents } from "@/hooks/students/useStudents";
import { FiMenu, FiX } from "react-icons/fi";

export default function StudentsPage() {
  const { organizationId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentFilter, setCurrentFilter] = useState(null);

  // Use the students hook with the current filter
  const { 
    students, 
    loading, 
    error, 
    addStudent, 
    updateStudent, 
    deleteStudent 
  } = useStudents(
    currentFilter?.organizationId, 
    currentFilter?.projectId, 
    currentFilter?.schoolId
  );

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleFilterChange = (filter) => {
    setCurrentFilter(filter);
  };

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="bg-white rounded-lg shadow border p-6">
      <div className="animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        
        {/* Search Bar Skeleton */}
        <div className="flex justify-between items-center mb-6">
          <div className="h-10 bg-gray-200 rounded w-64"></div>
          <div className="flex gap-4">
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        
        {/* Table Skeleton */}
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-4 mb-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 rounded"></div>
            ))}
          </div>
          
          {/* Table Rows */}
          {[...Array(5)].map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-5 gap-4 py-3">
              {[...Array(5)].map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          ))}
        </div>
        
        {/* Pagination Skeleton */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-8"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-8"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-blue-50" style={{ height: "calc(var(--vh, 1vh) * 100)" }}>
      {/* Mobile/iPad Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-30 z-40" onClick={toggleSidebar} />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {isMobile && sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="absolute top-4 right-4 z-50 p-2 rounded-full shadow-md bg-white"
            aria-label="Close menu"
          >
            <FiX className="w-5 h-5 text-indigo-600" />
          </button>
        )}
        <Sidebar title="Students" organizationId={organizationId} />
      </div>

      {/* Main Content */}
      <div
        className={`
          flex-1 transition-all duration-300 ease-in-out
          ${!isMobile && sidebarOpen ? "ml-64" : "ml-0"}
        `}
      >
        <div className="h-full p-6 space-y-6 bg-blue-50 flex-1 overflow-auto">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {isMobile && !sidebarOpen && (
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-md shadow-sm bg-white"
                  aria-label="Open menu"
                >
                  <FiMenu className="w-5 h-5 text-indigo-600" />
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-800">Students Management</h1>
            </div>
          </div>

          {/* Filter Section */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Filter Students</h2>
              <p className="text-sm text-gray-600">
                Select an organization, project, and school to view students
              </p>
            </div>
            
            <Filter 
              onFilterChange={handleFilterChange}
              organizationId={organizationId}
            />
          </div>

          {/* Content Area */}
          {!currentFilter ? (
            <SkeletonLoader />
          ) : (
            <StudentsTable
              students={students}
              loading={loading}
              error={error}
              currentFilter={currentFilter}
              onAddStudent={addStudent}
              onUpdateStudent={updateStudent}
              onDeleteStudent={deleteStudent}
            />
          )}
        </div>
      </div>
    </div>
  );
}