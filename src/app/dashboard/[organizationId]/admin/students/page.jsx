"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Filter from "@/components/Students/Filter";
import StudentsTable from "@/components/Students/StudentsTable";
import { useStudents } from "@/hooks/students/useStudents";
import DashboardLayout from "../../DashboardLayout";

export default function StudentsPage() {
  const { organizationId } = useParams();
  const [currentFilter, setCurrentFilter] = useState(null);

  const {
    students,
    loading,
    error,
    addStudent,
    updateStudent,
    deleteStudent,
  } = useStudents(
    currentFilter?.organizationId,
    currentFilter?.projectId,
    currentFilter?.schoolId
  );

  const handleFilterChange = (filter) => {
    setCurrentFilter(filter);
  };

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-6">
      <div className="animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-background-lighter rounded w-48"></div>
          <div className="h-10 bg-background-lighter rounded w-32"></div>
        </div>
        <div className="flex justify-between items-center mb-6">
          <div className="h-10 bg-background-lighter rounded w-64"></div>
          <div className="flex gap-4">
            <div className="h-8 bg-background-lighter rounded w-20"></div>
            <div className="h-8 bg-background-lighter rounded w-24"></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-4 mb-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-6 bg-background-lighter rounded"></div>
            ))}
          </div>
          {[...Array(5)].map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-5 gap-4 py-3">
              {[...Array(5)].map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-background-lighter rounded"></div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-600">
          <div className="h-4 bg-background-lighter rounded w-32"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-background-lighter rounded w-8"></div>
            <div className="h-8 bg-background-lighter rounded w-24"></div>
            <div className="h-8 bg-background-lighter rounded w-8"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Students" organizationId={organizationId} currentSection={"students"}>
      <div className="p-6 space-y-6">
        {/* Filter Section */}
        <div className="bg-background-light p-6 rounded-2xl shadow-lg border border-gray-600">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground mb-2">Filter Students</h2>
            <p className="text-sm text-gray-300">
              Select an organization, project, and school to view students
            </p>
          </div>
          <Filter onFilterChange={handleFilterChange} organizationId={organizationId} />
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
    </DashboardLayout>
  );
}