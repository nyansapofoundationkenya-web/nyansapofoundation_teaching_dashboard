// components/Students/StudentsTable.js
"use client";

import { useState } from "react";
import { Search, MoreVertical, Edit, Trash2, UserPlus, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";

export default function StudentsTable({
  students,
  loading,
  error,
  currentFilter,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const filteredStudents = students.filter((student) =>
    student.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students from {currentFilter.schoolName}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border">
      {/* Table Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Students at {currentFilter.schoolName}
            </h3>
            <p className="text-sm text-gray-600">
              {students.length} students found
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="p-6 border-b">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-auto sm:max-w-md">
            <input
              type="text"
              placeholder="Search students by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
                          focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400
                          bg-white text-gray-900 placeholder-gray-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Show:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-3 py-2 text-sm 
                          focus:outline-none focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400
                          bg-white text-gray-900 cursor-pointer"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-sm text-gray-700">per page</span>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Student Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Grade</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Gender</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentStudents.map((student) => (
              <tr key={student.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {student.displayName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  Grade {student.grade}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {student.sex}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedStudent(student);
                        setIsModalOpen(true);
                      }}
                      className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this student?')) {
                          onDeleteStudent(student.id);
                        }
                      }}
                      className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-6 border-t">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredStudents.length)} of {filteredStudents.length} students
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-50 hover:border-yellow-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm rounded border ${
                      currentPage === page
                        ? 'bg-yellow-500 text-white border-yellow-500 font-semibold'
                        : 'border-gray-300 hover:bg-yellow-50 hover:border-yellow-300 text-gray-700'
                    } transition-colors`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-50 hover:border-yellow-300 transition-colors"
              >
                 <ChevronRight className="w-4 h-4 text-gray-800" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}