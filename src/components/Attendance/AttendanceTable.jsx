"use client";

import { useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  Download,
} from "lucide-react";
import { useSelector } from "react-redux";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useExportAllSchoolsAttendance } from "@/hooks/attendance/useExportAllSchoolsAttendance";

export default function AttendanceTable({
  currentFilter,
  attendanceData,
  students,
  dates,
  loading,
  error,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isExporting, setIsExporting] = useState(false);

  // Modal & update state
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingChange, setPendingChange] = useState(null); // { studentId, date, currentStatus, newStatus }
  const [updating, setUpdating] = useState(false);

  // Get user from Redux
  const { user: currentUser } = useSelector((state) => state.auth);
  const isSuperAdmin = currentUser?.role === "super_admin";

  const { exportAllSchoolsAttendance } = useExportAllSchoolsAttendance();

  // Sort dates from oldest to newest
  const sortedDates = [...dates].sort((a, b) => new Date(a) - new Date(b));

  // Filter students based on search
  const filteredStudents = students.filter((student) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return student.name.toLowerCase().includes(searchLower);
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  // Get attendance status
  const getAttendanceStatus = (studentId, date) => {
    const studentAttendance = attendanceData.get(studentId);
    return studentAttendance ? studentAttendance.get(date) : undefined;
  };

  // Date stats
  const getDateStats = (date) => {
    let presentCount = 0;
    let totalCount = 0;

    students.forEach((student) => {
      const attendance = getAttendanceStatus(student.id, date);
      if (attendance !== undefined) {
        totalCount++;
        if (attendance === true) presentCount++;
      }
    });

    return { present: presentCount, total: totalCount };
  };

  const getAttendancePercentage = (present, total) =>
    total > 0 ? Math.round((present / total) * 100) : 0;

  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return "text-green-400";
    if (percentage >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportAllSchoolsAttendance({
        orgId: currentFilter.organizationId,
        projectId: currentFilter.projectId,
        projectName: currentFilter.projectName || "Project",
      });
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Reusable Attendance Cell
  const AttendanceCell = ({ studentId, date, currentStatus }) => {
    const handleClick = () => {
      if (!isSuperAdmin) {
        alert("Only super admins can modify attendance records.");
        return;
      }

      const newStatus = currentStatus === undefined ? true : !currentStatus;

      setPendingChange({
        studentId,
        date,
        currentStatus,
        newStatus,
      });
      setModalOpen(true);
    };

    return (
      <div
        onClick={handleClick}
        className={`flex items-center justify-center transition-all cursor-pointer group
          ${isSuperAdmin 
            ? "hover:bg-gray-700/40" 
            : "cursor-not-allowed opacity-70"
          }`}
        title={isSuperAdmin ? "Click to edit" : "Only super admins can edit"}
      >
        {currentStatus === true ? (
          <CheckCircle className="w-7 h-7 text-green-500 group-hover:text-green-400 transition-colors" />
        ) : currentStatus === false ? (
          <XCircle className="w-7 h-7 text-red-500 group-hover:text-red-400 transition-colors" />
        ) : (
          <span className="text-gray-500 text-xs font-medium">–</span>
        )}
      </div>
    );
  };

  // Firebase update function
  const updateSingleAttendance = async () => {
    if (!pendingChange) return;

    const { studentId, date, newStatus } = pendingChange;
    const path = `organization/${currentFilter.organizationId}/projects/${currentFilter.projectId}/schools/${currentFilter.schoolId}/attendance`;
    const docRef = doc(db, path, date);

    try {
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error("Attendance record not found");

      const data = docSnap.data();
      const updatedStudents = data.students.map((s) =>
        s.id === studentId ? { ...s, attendance: newStatus } : s
      );

      await updateDoc(docRef, { students: updatedStudents });

      // Optimistic UI update
      const newMap = new Map(attendanceData);
      if (!newMap.has(studentId)) newMap.set(studentId, new Map());
      newMap.get(studentId).set(date, newStatus);
      setAttendanceData(newMap);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update attendance. Please try again.");
      throw err;
    }
  };

  // Loading & error states
  if (loading) {
    return (
      <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-3 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading attendance data...</p>
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

  if (students.length === 0 && sortedDates.length === 0) {
    return (
      <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-12 text-center">
        <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Attendance Data</h3>
        <p className="text-gray-300">
          No attendance records found for {currentFilter.schoolName}.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600">
        {/* Header */}
        <div className="p-6 border-b border-gray-600">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Attendance - {currentFilter.schoolName}
              </h3>
              <p className="text-sm text-gray-300">
                {filteredStudents.length} students, {sortedDates.length} attendance days
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Calendar className="w-4 h-4" />
                <span>{sortedDates.length} days</span>
              </div>

              <button
                onClick={handleExport}
                disabled={isExporting}
                className={`flex items-center gap-3 px-5 py-2.5 font-medium rounded-xl transition-all shadow-lg ${
                  isExporting
                    ? "bg-gray-600 cursor-not-allowed opacity-90"
                    : "bg-secondary-2 hover:bg-primary-2 text-white hover:shadow-blue-500/30"
                }`}
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Export Attendance to Excel</span>
                  </>
                )}
              </button>
            </div>
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
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-500 rounded-xl 
                          focus:outline-none focus:ring-2 focus:ring-primary-2 focus:border-primary-2
                          bg-background-lighter text-foreground placeholder-gray-400 shadow-md"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            <div className="flex items-center gap-4">
              {sortedDates.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const container = document.getElementById("dates-container");
                      if (container) container.scrollLeft -= 120;
                    }}
                    className="p-2 rounded-xl border border-gray-500 hover:bg-primary-3/20 hover:border-primary-3 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-foreground" />
                  </button>
                  <span className="text-sm text-gray-300 hidden sm:block">Scroll Dates</span>
                  <button
                    onClick={() => {
                      const container = document.getElementById("dates-container");
                      if (container) container.scrollLeft += 120;
                    }}
                    className="p-2 rounded-xl border border-gray-500 hover:bg-primary-3/20 hover:border-primary-3 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-foreground" />
                  </button>
                </div>
              )}

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
                <span className="text-sm text-gray-300">students</span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="overflow-hidden">
          <div className="hidden lg:block">
            <div className="flex">
              <div className="w-64 flex-shrink-0 border-r border-gray-600 bg-background-lighter">
                <div className="p-4 h-28 flex items-center border-b border-gray-600">
                  <span className="text-sm font-medium text-foreground">Student Name</span>
                </div>
                {currentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="p-4 h-16 border-b border-gray-600 flex items-center hover:bg-background-lighter transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground truncate">
                      {student.name}
                    </span>
                  </div>
                ))}
              </div>

              <div id="dates-container" className="flex-1 overflow-x-auto">
                <div className="flex min-w-max border-b border-gray-600">
                  {sortedDates.map((date) => {
                    const stats = getDateStats(date);
                    const percentage = getAttendancePercentage(stats.present, stats.total);

                    return (
                      <div key={date} className="w-28 flex-shrink-0 border-r border-gray-600 last:border-r-0">
                        <div className="p-3 h-28 flex flex-col items-center justify-center bg-background-lighter">
                          <div className="text-center mb-2">
                            <span className="text-sm font-normal text-gray-400 block mb-1">
                              {new Date(date).toLocaleDateString("en-US", { month: "short" })}
                            </span>
                            <span className="text-lg font-bold text-foreground block">
                              {new Date(date).getDate()}
                            </span>
                            <span className="text-xs text-gray-400 block mt-1">
                              {new Date(date).toLocaleDateString("en-US", { weekday: "short" })}
                            </span>
                          </div>
                          {stats.total > 0 && (
                            <div className="text-center mt-2">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span className={`text-sm font-semibold ${getPercentageColor(percentage)}`}>
                                  {percentage}%
                                </span>
                              </div>
                              <div className="text-sm text-gray-300 bg-background-light rounded-full px-3 py-1 border border-gray-600">
                                {stats.present}/{stats.total}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {currentStudents.map((student) => (
                  <div key={student.id} className="flex min-w-max border-b border-gray-600 last:border-b-0">
                    {sortedDates.map((date) => {
                      const attended = getAttendanceStatus(student.id, date);
                      return (
                        <div key={date} className="w-28 flex-shrink-0 border-r border-gray-600 last:border-r-0">
                          <div className="p-2 h-16">
                            <AttendanceCell
                              studentId={student.id}
                              date={date}
                              currentStatus={attended}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden">
            {currentStudents.length > 0 ? (
              <div className="divide-y divide-gray-600">
                {currentStudents.map((student) => (
                  <div key={student.id} className="p-4">
                    <div className="mb-4 pb-3 border-b border-gray-600">
                      <h4 className="text-base font-semibold text-foreground truncate">{student.name}</h4>
                    </div>
                    <div className="overflow-x-auto pb-3">
                      <div className="flex gap-4 min-w-max">
                        {sortedDates.map((date) => {
                          const attended = getAttendanceStatus(student.id, student.date);
                          const stats = getDateStats(date);

                          return (
                            <div
                              key={date}
                              className="flex flex-col items-center w-24 flex-shrink-0 bg-background-lighter rounded-lg p-4 border border-gray-600"
                            >
                              <div className="text-center mb-3">
                                <div className="text-sm text-gray-400 mb-1">
                                  {new Date(date).toLocaleDateString("en-US", { month: "short" })}
                                </div>
                                <div className="text-xl font-bold text-foreground">{new Date(date).getDate()}</div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {new Date(date).toLocaleDateString("en-US", { weekday: "short" })}
                                </div>
                              </div>
                              <div className="mb-3">
                                <AttendanceCell
                                  studentId={student.id}
                                  date={date}
                                  currentStatus={attended}
                                />
                              </div>
                              {stats.total > 0 && (
                                <div className="text-center">
                                  <div className="text-sm text-gray-300 bg-background-light rounded-full px-3 py-1 border border-gray-600">
                                    {stats.present}/{stats.total}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-gray-400">
                {students.length === 0 ? "No students found in the selected school." : "No students match the current search."}
              </div>
            )}
          </div>
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
                          ? "bg-primary-3 text-primary-1 border-primary-3 font-semibold shadow-md"
                          : "border-gray-500 hover:bg-primary-3/20 hover:border-primary-3 text-foreground"
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

      {/* Confirmation Modal */}
      {modalOpen && pendingChange && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-background-light border border-gray-600 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Confirm Attendance Change
            </h3>

            <div className="space-y-4 text-gray-300 mb-6">
              <p>Change attendance for this student on:</p>
              <p className="font-semibold text-foreground">
                {new Date(pendingChange.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>

              <div className="flex items-center justify-center gap-8 py-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-3">Current</p>
                  {pendingChange.currentStatus === true ? (
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                  ) : pendingChange.currentStatus === false ? (
                    <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                  ) : (
                    <span className="text-3xl text-gray-500">–</span>
                  )}
                  <p className="mt-2 font-medium">
                    {pendingChange.currentStatus === true ? "Present" : pendingChange.currentStatus === false ? "Absent" : "No Record"}
                  </p>
                </div>

                <div className="text-3xl text-gray-500">→</div>

                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-3">New</p>
                  {pendingChange.newStatus ? (
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                  ) : (
                    <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                  )}
                  <p className="mt-2 font-medium">
                    {pendingChange.newStatus ? "Present" : "Absent"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setPendingChange(null);
                }}
                disabled={updating}
                className="px-5 py-2.5 rounded-xl border border-gray-500 hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setUpdating(true);
                  try {
                    await updateSingleAttendance();
                    setModalOpen(false);
                  } catch (err) {
                    // Error already handled inside function
                  } finally {
                    setUpdating(false);
                    setPendingChange(null);
                  }
                }}
                disabled={updating}
                className="px-6 py-2.5 bg-primary-3 hover:bg-primary-2 text-white font-medium rounded-xl transition-all flex items-center gap-2 shadow-lg"
              >
                {updating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  "Confirm Change"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}