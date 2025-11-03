// components/Students/StudentsTable.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MoreVertical, Edit, Trash2, UserPlus, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import StudentModal from "./StudentModal";

export default function StudentsTable({
  students,
  loading,
  error,
  currentFilter,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  const filteredStudents = students.filter((student) =>
    student.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  // Enhanced duplicate detection: first name + last name + grade + gender
  const [duplicates, setDuplicates] = useState(new Set());
  
  useEffect(() => {
    const duplicateMap = new Map();
    
    students.forEach(student => {
      if (student.first_name && student.last_name && student.grade && student.sex) {
        const key = `${student.first_name.toLowerCase()}_${student.last_name.toLowerCase()}_${student.grade}_${student.sex.toLowerCase()}`;
        
        if (duplicateMap.has(key)) {
          duplicateMap.get(key).push(student);
        } else {
          duplicateMap.set(key, [student]);
        }
      }
    });

    // Create a set of student IDs that are duplicates
    const duplicateIds = new Set();
    duplicateMap.forEach((studentGroup, key) => {
      if (studentGroup.length > 1) {
        studentGroup.forEach(student => {
          duplicateIds.add(student.id);
        });
      }
    });

    setDuplicates(duplicateIds);
  }, [students]);

  const isDuplicateStudent = (student) => {
    return duplicates.has(student.id);
  };

  const handleAddClick = () => {
    setSelectedStudent(null);
    setIsModalOpen(true);
    setActionMenuOpen(null);
  };

  const handleEditClick = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
    setActionMenuOpen(null);
  };

  const handleDeleteClick = async (studentId) => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }

    try {
      await onDeleteStudent(studentId);
      setActionMenuOpen(null);
    } catch (err) {
      alert(`Error deleting student: ${err.message}`);
    }
  };

  // Handle student click to navigate to student detail page
  const handleStudentClick = (student) => {
    if (!currentFilter?.organizationId || !currentFilter?.projectId || !currentFilter?.schoolId) {
      return;
    }

    router.push(
      // `/dashboard/${currentFilter.organizationId}/projects/${currentFilter.projectId}/schools/${currentFilter.schoolId}/students/${student.id}`
    );
  };

  const handleModalSubmit = async (studentData) => {
    try {
      if (selectedStudent) {
        // Update existing student
        await onUpdateStudent(selectedStudent.id, studentData);
      } else {
        // Add new student
        await onAddStudent(studentData);
      }
    } catch (err) {
      // Error is handled in the modal
      throw err;
    }
  };

  // Get duplicate count for display
  const duplicateCount = duplicates.size;

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuOpen && !event.target.closest('.action-menu-container')) {
        setActionMenuOpen(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [actionMenuOpen]);

  if (loading) {
    return (
      <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-3 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading students from {currentFilter.schoolName}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600">
        {/* Table Header */}
        <div className="p-6 border-b border-gray-600">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Students at {currentFilter.schoolName}
              </h3>
              <p className="text-sm text-gray-300">
                {students.length} students found
                {duplicateCount > 0 && (
                  <span className="text-primary-3 ml-2">
                    • {duplicateCount} potential duplicate(s)
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handleAddClick}
              className="flex items-center gap-2 px-4 py-2 bg-primary-3 hover:bg-yellow-400 text-primary-1 font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg"
            >
              <UserPlus className="w-4 h-4" />
              Add Student
            </button>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="p-6 border-b border-gray-600">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-auto sm:max-w-md">
              <input
                type="text"
                placeholder="Search students by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-500 rounded-xl 
                          focus:outline-none focus:ring-2 focus:ring-primary-2 focus:border-primary-2
                          bg-background-lighter text-foreground placeholder-gray-400 shadow-md"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Show:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-500 rounded-xl px-3 py-2 text-sm 
                          focus:outline-none focus:ring-1 focus:ring-primary-2 focus:border-primary-2
                          bg-background-lighter text-foreground cursor-pointer shadow-md"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
              <span className="text-sm text-gray-300">per page</span>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-background-lighter border-b border-gray-600">
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Student Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Grade</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Gender</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Group</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentStudents.length > 0 ? (
                currentStudents.map((student) => {
                  const isDuplicate = isDuplicateStudent(student);
                  
                  return (
                    <tr 
                      key={student.id} 
                      className="border-b border-gray-600 hover:bg-background-lighter cursor-pointer transition-colors"
                      // onClick={() => handleStudentClick(student)}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          {student.displayName}
                          <Eye className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        Grade {student.grade}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {student.sex}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {student.group || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {isDuplicate ? (
                          <span 
                            className="px-2 py-1 bg-primary-3/20 text-primary-3 text-xs rounded-full border border-primary-3/30 cursor-help"
                            title="Same first name, last name, grade, and gender as another student"
                          >
                            Potential Duplicate
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-secondary-2/20 text-secondary-2 text-xs rounded-full border border-secondary-2/30">
                            Unique
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="relative action-menu-container">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuOpen(actionMenuOpen === student.id ? null : student.id);
                            }}
                            className="p-2 rounded-xl hover:bg-primary-3/20 text-primary-3 hover:text-yellow-400 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {actionMenuOpen === student.id && (
                            <div 
                              className="absolute right-0 mt-1 w-56 bg-background-light rounded-2xl shadow-xl z-10 border border-gray-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* <button
                                onClick={() => handleStudentClick(student)}
                                className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-primary-2/20 hover:text-primary-2 transition-colors border-b border-gray-600 rounded-t-2xl"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </button> */}
                              <button
                                onClick={() => handleEditClick(student)}
                                className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-primary-3/20 hover:text-primary-3 transition-colors border-b border-gray-600"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Update
                              </button>
                              <button
                                onClick={() => handleDeleteClick(student.id)}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors rounded-b-2xl"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">
                    No students found in the selected school.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-600">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-300">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredStudents.length)} of {filteredStudents.length} students
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-3/20 hover:border-primary-3 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-foreground" />
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm rounded-xl border ${
                        currentPage === page
                          ? 'bg-primary-3 text-primary-1 border-primary-3 font-semibold shadow-md'
                          : 'border-gray-500 hover:bg-primary-3/20 hover:border-primary-3 text-foreground'
                      } transition-colors`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-3/20 hover:border-primary-3 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Student Modal */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStudent(null);
        }}
        onSubmit={handleModalSubmit}
        student={selectedStudent}
        isDuplicate={selectedStudent ? isDuplicateStudent(selectedStudent) : false}
      />
    </>
  );
}