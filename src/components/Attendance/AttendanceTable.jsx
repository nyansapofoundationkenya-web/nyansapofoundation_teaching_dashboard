"use client";
import { useState, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  Check,
  X,
  Trash2,
  Lock,
} from "lucide-react";
import { useSelector } from "react-redux"; // Make sure this is imported if not already

export default function AttendanceTable({
  currentFilter,
  attendanceData, // Map<string, Map<string, boolean>>
  students, // [{ id: string, name: string }]
  dates, // string[] (ISO dates)
  loading = false,
  error,
  onUpdateAttendance = async () => {},
}) {
  // Get user role from Redux
  const { user: currentUser } = useSelector((state) => state.auth);
  const userRole = currentUser?.role;
  const isSuperAdmin = userRole === "super_admin";

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // { studentId, date, currentStatus }

  // Optimistic local copy
  const [localAttendance, setLocalAttendance] = useState(attendanceData);

  // Sync when parent data changes
  useEffect(() => {
    setLocalAttendance(attendanceData);
  }, [attendanceData]);

  const sortedDates = [...dates].sort((a, b) => new Date(a) - new Date(b));

  // Filter & pagination
  const filteredStudents = students.filter((student) =>
    searchTerm
      ? student.name.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  // Get status from local data
  const getAttendanceStatus = (studentId, date) => {
    const studentMap = localAttendance.get(studentId);
    return studentMap ? studentMap.get(date) : undefined;
  };

  // Only super_admin can trigger edit
  const handleCellClick = (studentId, date, currentStatus) => {
    if (!isSuperAdmin) {
      return; // Silently ignore clicks
    }
    setEditing({ studentId, date, currentStatus });
    setModalOpen(true);
  };

  const updateAttendance = async (newStatus) => {
    if (!editing || !isSuperAdmin) return;

    // Optimistic update
    setLocalAttendance((prev) => {
      const newMap = new Map(prev);
      const studentMap = new Map(prev.get(editing.studentId) || new Map());
      if (newStatus === undefined) {
        studentMap.delete(editing.date);
      } else {
        studentMap.set(editing.date, newStatus);
      }
      newMap.set(editing.studentId, studentMap);
      return newMap;
    });

    try {
      await onUpdateAttendance({
        studentId: editing.studentId,
        date: editing.date,
        status: newStatus,
      });
    } catch (err) {
      console.error("Failed to update attendance", err);
      setLocalAttendance(attendanceData); // rollback
    }

    setModalOpen(false);
    setEditing(null);
  };

  // Stats helpers
  const getDateStats = (date) => {
    let present = 0;
    let total = 0;
    students.forEach((s) => {
      const status = getAttendanceStatus(s.id, date);
      if (status !== undefined) {
        total++;
        if (status) present++;
      }
    });
    return { present, total };
  };

  const getPercentage = (present, total) =>
    total > 0 ? Math.round((present / total) * 100) : 0;

  const getPercentageColor = (p) =>
    p >= 80 ? "text-green-400" : p >= 60 ? "text-yellow-400" : "text-red-400";

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

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
          <div className="flex justify-between items-center">
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
              {!isSuperAdmin && (
                <div className="flex items-center gap-2 text-amber-400 text-sm">
                  <Lock className="w-4 h-4" />
                  <span>Read-only</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search & Controls */}
        <div className="p-6 border-b border-gray-600">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-auto sm:max-w-md">
              <input
                type="text"
                placeholder="Search students by name..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-2 focus:border-primary-2 bg-background-lighter text-foreground placeholder-gray-400 shadow-md"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-center gap-4">
              {sortedDates.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const el = document.getElementById("dates-container");
                      if (el) el.scrollLeft -= 120;
                    }}
                    className="p-2 rounded-xl border border-gray-500 hover:bg-primary-3/20 hover:border-primary-3 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-foreground" />
                  </button>
                  <span className="text-sm text-gray-300 hidden sm:block">Scroll Dates</span>
                  <button
                    onClick={() => {
                      const el = document.getElementById("dates-container");
                      if (el) el.scrollLeft += 120;
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
                  className="border border-gray-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-2 focus:border-primary-2 bg-background-lighter text-foreground cursor-pointer shadow-md"
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

        {/* Table */}
        <div className="overflow-hidden">
          {/* Desktop */}
          <div className="hidden lg:block">
            <div className="flex">
              {/* Fixed student column */}
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

              {/* Scrollable dates */}
              <div id="dates-container" className="flex-1 overflow-x-auto">
                {/* Header */}
                <div className="flex min-w-max border-b border-gray-600">
                  {sortedDates.map((date) => {
                    const { present, total } = getDateStats(date);
                    const percentage = getPercentage(present, total);
                    return (
                      <div
                        key={date}
                        className="w-28 flex-shrink-0 border-r border-gray-600 last:border-r-0"
                      >
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
                          {total > 0 && (
                            <div className="text-center mt-2">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span className={`text-sm font-semibold ${getPercentageColor(percentage)}`}>
                                  {percentage}%
                                </span>
                              </div>
                              <div className="text-sm text-gray-300 bg-background-light rounded-full px-3 py-1 border border-gray-600">
                                {present}/{total}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Rows */}
                {currentStudents.map((student) => (
                  <div key={student.id} className="flex min-w-max border-b border-gray-600 last:border-b-0">
                    {sortedDates.map((date) => {
                      const status = getAttendanceStatus(student.id, date);
                      return (
                        <div
                          key={date}
                          className="w-28 flex-shrink-0 border-r border-gray-600 last:border-r-0"
                        >
                          <button
                            onClick={() => handleCellClick(student.id, date, status)}
                            disabled={!isSuperAdmin}
                            className={`w-full p-2 h-16 flex items-center justify-center transition-all rounded-md ${
                              isSuperAdmin
                                ? "hover:bg-background-lighter/60 cursor-pointer"
                                : "cursor-not-allowed opacity-60"
                            }`}
                          >
                            {status === true ? (
                              <CheckCircle className="w-8 h-8 text-green-500" />
                            ) : status === false ? (
                              <XCircle className="w-8 h-8 text-red-500" />
                            ) : (
                              <span className="text-gray-500 text-2xl leading-none">–</span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile */}
          <div className="lg:hidden">
            {currentStudents.map((student) => (
              <div key={student.id} className="p-4 border-b border-gray-600">
                <h4 className="text-base font-semibold mb-3 truncate">{student.name}</h4>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {sortedDates.map((date) => {
                    const status = getAttendanceStatus(student.id, date);
                    const { present, total } = getDateStats(date);
                    return (
                      <button
                        key={date}
                        onClick={() => handleCellClick(student.id, date, status)}
                        disabled={!isSuperAdmin}
                        className={`flex flex-col items-center w-24 flex-shrink-0 bg-background-lighter rounded-lg p-4 border border-gray-600 transition-all ${
                          isSuperAdmin
                            ? "hover:bg-background-lighter/60 cursor-pointer"
                            : "cursor-not-allowed opacity-60"
                        }`}
                      >
                        <div className="text-center mb-2">
                          <div className="text-xs text-gray-400">
                            {new Date(date).toLocaleDateString("en-US", { month: "short" })}
                          </div>
                          <div className="text-lg font-bold">{new Date(date).getDate()}</div>
                        </div>
                        {status === true ? (
                          <CheckCircle className="w-7 h-7 text-green-500" />
                        ) : status === false ? (
                          <XCircle className="w-7 h-7 text-red-500" />
                        ) : (
                          <span className="text-gray-500 text-2xl">–</span>
                        )}
                        {total > 0 && (
                          <div className="mt-2 text-xs text-gray-300 bg-background-light rounded-full px-2 py-1 border border-gray-600">
                            {present}/{total}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
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
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-gray-500 disabled:opacity-50 hover:bg-primary-3/20 hover:border-primary-3 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 text-sm rounded-xl border ${
                      currentPage === i + 1
                        ? "bg-primary-3 text-primary-1 border-primary-3 font-semibold"
                        : "border-gray-500 hover:bg-primary-3/20 hover:border-primary-3"
                    } transition-colors`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-gray-500 disabled:opacity-50 hover:bg-primary-3/20 hover:border-primary-3 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal - Only visible to super_admin */}
      {modalOpen && editing && isSuperAdmin && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-background-light border border-gray-600 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-semibold mb-6 text-center">
              {new Date(editing.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <button
                onClick={() => updateAttendance(true)}
                className={`flex flex-col items-center p-5 rounded-xl border-2 transition-all ${
                  editing.currentStatus === true
                    ? "border-green-500 bg-green-500/10"
                    : "border-gray-600 hover:border-green-500 hover:bg-green-500/10"
                }`}
              >
                <Check className="w-10 h-10 text-green-500 mb-2" />
                <span className="text-sm font-medium">Present</span>
              </button>
              <button
                onClick={() => updateAttendance(false)}
                className={`flex flex-col items-center p-5 rounded-xl border-2 transition-all ${
                  editing.currentStatus === false
                    ? "border-red-500 bg-red-500/10"
                    : "border-gray-600 hover:border-red-500 hover:bg-red-500/10"
                }`}
              >
                <X className="w-10 h-10 text-red-500 mb-2" />
                <span className="text-sm font-medium">Absent</span>
              </button>
              <button
                onClick={() => updateAttendance(undefined)}
                className={`flex flex-col items-center p-5 rounded-xl border-2 transition-all ${
                  editing.currentStatus === undefined
                    ? "border-gray-400 bg-gray-400/10"
                    : "border-gray-600 hover:border-gray-400 hover:bg-gray-400/10"
                }`}
              >
                <Trash2 className="w-10 h-10 text-gray-400 mb-2" />
                <span className="text-sm font-medium">Clear</span>
              </button>
            </div>
            <button
              onClick={() => {
                setModalOpen(false);
                setEditing(null);
              }}
              className="w-full py-3 rounded-xl border border-gray-500 hover:bg-gray-800 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}