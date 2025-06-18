const { useState, useMemo } = require("react");
const { useParams } = require("next/navigation");
const { useSchoolStudents } = require("@/hooks/useSchoolStudents");
const {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} = require("recharts");
const { ChevronDown, Users, Calendar } = require("lucide-react");

const COLORS = {
  present: "#22c55e", // green
  absent: "#ef4444", // red
};

// Inline UI Components
const Card = ({ children, className = "" }) => (
  <div className={`rounded-lg border bg-white shadow-sm ${className}`}>{children}</div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`flex flex-col space-y-1.5 p-3 sm:p-4 lg:p-6 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3
    className={`text-sm sm:text-base lg:text-lg font-semibold leading-none tracking-tight text-gray-900 ${className}`}
  >
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-3 sm:p-4 lg:p-6 pt-0 ${className}`}>{children}</div>
);

const Select = ({ children, value, onValueChange, placeholder = "Select...", displayValue, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 sm:h-10 w-full items-center justify-between rounded-md border-2 border-gray-400 bg-white px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium shadow-sm hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <span className="truncate text-gray-900 font-medium">{displayValue || value || placeholder}</span>
        <ChevronDown
          className={`h-3 w-3 sm:h-4 sm:w-4 text-gray-700 transition-transform flex-shrink-0 ml-1 sm:ml-2 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          {/* Dropdown */}
          <div className="absolute top-full left-0 z-50 min-w-full overflow-hidden rounded-md border-2 border-gray-300 bg-white shadow-xl mt-1 max-h-48 sm:max-h-60 overflow-y-auto">
            {children.map((child, index) => (
              <div
                key={index}
                onClick={() => {
                  onValueChange(child.props.value);
                  setIsOpen(false);
                }}
                className="relative flex cursor-pointer select-none items-center px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-900 hover:bg-blue-50 hover:text-blue-900 border-b border-gray-200 last:border-b-0"
              >
                {child.props.children}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const SelectItem = ({ children, value }) => ({ children, value });

// Custom Tooltip for Pie Charts
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-2 sm:p-3 border-2 border-gray-300 rounded-lg shadow-xl text-xs sm:text-sm">
        <p className="font-bold text-gray-900">{data.name}</p>
        <p className="text-gray-700 font-medium">Count: {data.value}</p>
        <p className="text-gray-700 font-medium">
          Percentage: {((data.value / (payload[0].payload.total || 1)) * 100).toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

const AttendanceDashboard = () => {
  const { organizationId, projectId, schoolId } = useParams();
  const [selectedGroupForChart, setSelectedGroupForChart] = useState("Group 1");
  const [selectedGroupForTable, setSelectedGroupForTable] = useState("Group 1");
  const [selectedGroupForStudent, setSelectedGroupForStudent] = useState("Group 1");
  const [selectedStudent, setSelectedStudent] = useState("");

  const { students, attendance, loading, error, getAllSessions, schoolInfo } = useSchoolStudents(
    organizationId,
    projectId,
    schoolId
  );

  const sessions = useMemo(() => getAllSessions(), [attendance]);
  const groups = useMemo(() => ["Group 1", "Group 2", "Group 3"], []);

  // Get all unique students from attendance data
  const allStudentsFromAttendance = useMemo(() => {
    const studentMap = new Map();

    attendance.forEach((session) => {
      if (session.students && Array.isArray(session.students)) {
        session.students.forEach((student) => {
          if (student.studentId && student.name) {
            studentMap.set(student.studentId, {
              id: student.studentId,
              name: student.name,
              group: student.group || session.group,
            });
          }
        });
      }
    });

    return Array.from(studentMap.values());
  }, [attendance]);

  // Overall school attendance data for first pie chart
  const schoolAttendanceData = useMemo(() => {
    let totalPresent = 0;
    let totalAbsent = 0;

    attendance.forEach((session) => {
      if (session.students && Array.isArray(session.students)) {
        session.students.forEach((student) => {
          if (student.attended === true) {
            totalPresent++;
          } else if (student.attended === false) {
            totalAbsent++;
          }
        });
      }
    });

    const total = totalPresent + totalAbsent;
    return [
      { name: "Present", value: totalPresent, color: COLORS.present, total },
      { name: "Absent", value: totalAbsent, color: COLORS.absent, total },
    ];
  }, [attendance]);

  // Group-specific attendance data for second pie chart
  const groupAttendanceData = useMemo(() => {
    let totalPresent = 0;
    let totalAbsent = 0;

    attendance.forEach((session) => {
      if (session.group === selectedGroupForChart && session.students && Array.isArray(session.students)) {
        session.students.forEach((student) => {
          if (student.group === selectedGroupForChart) {
            if (student.attended === true) {
              totalPresent++;
            } else if (student.attended === false) {
              totalAbsent++;
            }
          }
        });
      }
    });

    const total = totalPresent + totalAbsent;
    return [
      { name: "Present", value: totalPresent, color: COLORS.present, total },
      { name: "Absent", value: totalAbsent, color: COLORS.absent, total },
    ];
  }, [attendance, selectedGroupForChart]);

  // Students for the selected group (for table)
  const groupStudents = useMemo(() => {
    return allStudentsFromAttendance.filter((student) => student.group === selectedGroupForTable);
  }, [allStudentsFromAttendance, selectedGroupForTable]);

  // Students for the selected group (for individual graph)
  const groupStudentsForGraph = useMemo(() => {
    return allStudentsFromAttendance.filter((student) => student.group === selectedGroupForStudent);
  }, [allStudentsFromAttendance, selectedGroupForStudent]);

  // Sessions for the selected group (for table)
  const groupSessions = useMemo(() => {
    return attendance.filter((session) => session.group === selectedGroupForTable);
  }, [attendance, selectedGroupForTable]);

  // Create attendance matrix for table
  const attendanceMatrix = useMemo(() => {
    return groupStudents.map((student) => {
      const studentAttendance = {};

      groupSessions.forEach((session) => {
        const attendanceRecord = session.students?.find((s) => s.studentId === student.id);
        studentAttendance[session.id] = attendanceRecord ? attendanceRecord.attended : null;
      });

      return {
        student,
        attendance: studentAttendance,
      };
    });
  }, [groupStudents, groupSessions]);

  // Individual student attendance data for graph
  const studentAttendanceData = useMemo(() => {
    if (!selectedStudent) return [];

    const studentAttendanceRecords = [];

    attendance.forEach((session) => {
      if (session.students && Array.isArray(session.students)) {
        const studentRecord = session.students.find((s) => s.studentId === selectedStudent);
        if (studentRecord) {
          studentAttendanceRecords.push({
            date: session.date,
            session: session.session,
            attended: studentRecord.attended,
          });
        }
      }
    });

    return studentAttendanceRecords
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((record, index) => ({
        session: index + 1,
        date: record.date,
        sessionName: record.session,
        attended: record.attended ? 1 : 0,
      }));
  }, [selectedStudent, attendance]);

  // Find the selected student's name for display
  const selectedStudentName = useMemo(() => {
    const student = allStudentsFromAttendance.find((s) => s.id === selectedStudent);
    return student ? student.name : "";
  }, [allStudentsFromAttendance, selectedStudent]);

  // Reset selected student when group changes
  const handleGroupForStudentChange = (newGroup) => {
    setSelectedGroupForStudent(newGroup);
    setSelectedStudent(""); // Reset student selection
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base font-medium">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 sm:p-6 text-center">
        <p className="text-red-700 font-bold text-sm sm:text-base">Error loading attendance data</p>
        <p className="text-red-600 text-xs sm:text-sm mt-2 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="space-y-1 sm:space-y-2 px-1">
          <p className="text-gray-700 text-xs sm:text-sm lg:text-base font-medium">
            {schoolInfo?.name || "School"} - Attendance Overview
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-blue-600 flex-shrink-0" />
                <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-gray-700">Total Students</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    {allStudentsFromAttendance.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-green-600 flex-shrink-0" />
                <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-gray-700">Total Sessions</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{attendance.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 bg-green-100 rounded-full flex-items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold text-xs sm:text-sm lg:text-base">%</span>
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-gray-700">Overall Attendance</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    {schoolAttendanceData.length > 0
                      ? Math.round(
                          (schoolAttendanceData[0].value /
                            (schoolAttendanceData[0].value + schoolAttendanceData[1].value)) *
                            100
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pie Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* School Overall Attendance */}
          <Card>
            <CardHeader>
              <CardTitle>🏫 School Overall Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] sm:h-[320px] lg:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={schoolAttendanceData}
                      cx="50%"
                      cy="40%"
                      outerRadius="55%"
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      labelLine={false}
                    >
                      {schoolAttendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{ paddingTop: "10px", fontSize: "14px", fontWeight: "600" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Group Specific Attendance */}
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-2 sm:space-y-3">
                <CardTitle>👥 Group Attendance</CardTitle>
                <Select
                  value={selectedGroupForChart}
                  onValueChange={setSelectedGroupForChart}
                  placeholder="Select Group"
                  className="w-full sm:w-32 lg:w-40"
                >
                  {groups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] sm:h-[320px] lg:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={groupAttendanceData}
                      cx="50%"
                      cy="40%"
                      outerRadius="55%"
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      labelLine={false}
                    >
                      {groupAttendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{ paddingTop: "10px", fontSize: "14px", fontWeight: "600" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-2 sm:space-y-3">
              <CardTitle>📋 Student Attendance Table</CardTitle>
              <Select
                value={selectedGroupForTable}
                onValueChange={setSelectedGroupForTable}
                placeholder="Select Group"
                className="w-full sm:w-32 lg:w-40"
              >
                {groups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile Card View */}
            <div className="block sm:hidden">
              <div className="space-y-3 p-3">
                {attendanceMatrix.map((row) => (
                  <div key={row.student.id} className="bg-gray-50 rounded-lg p-3 border-2 border-gray-200">
                    <div className="font-bold text-sm mb-2 text-gray-900">{row.student.name}</div>
                    <div className="text-xs text-gray-600 mb-2 font-medium">{row.student.group}</div>
                    <div className="grid grid-cols-4 gap-2">
                      {groupSessions.slice(0, 8).map((session) => (
                        <div key={session.id} className="text-center">
                          <div className="text-xs text-gray-700 mb-1 font-medium">{session.date}</div>
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold ${
                              row.attendance[session.id] === true
                                ? "bg-green-500"
                                : row.attendance[session.id] === false
                                ? "bg-red-500"
                                : "bg-gray-300 text-gray-600"
                            }`}
                          >
                            {row.attendance[session.id] === true
                              ? "P"
                              : row.attendance[session.id] === false
                              ? "A"
                              : "-"}
                          </span>
                        </div>
                      ))}
                    </div>
                    {groupSessions.length > 8 && (
                      <div className="text-xs text-gray-600 mt-2 text-center font-medium">
                        +{groupSessions.length - 8} more sessions
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full border-collapse border-2 border-gray-300 min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border-2 border-gray-300 p-2 lg:p-3 text-left font-bold sticky left-0 bg-gray-100 z-10 w-40 lg:w-48">
                      <div className="text-xs lg:text-sm text-gray-900">Student Name</div>
                    </th>
                    {groupSessions.map((session) => (
                      <th
                        key={session.id}
                        className="border-2 border-gray-300 p-1 lg:p-2 text-center font-bold w-16 lg:w-20"
                      >
                        <div className="text-xs">
                          <div className="font-bold text-gray-900">{session.date}</div>
                          <div className="text-gray-700 text-xs font-medium">{session.session}</div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendanceMatrix.map((row, index) => (
                    <tr key={row.student.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border-2 border-gray-300 p-2 lg:p-3 font-bold sticky left-0 bg-inherit z-10">
                        <div>
                          <div className="font-bold text-xs lg:text-sm text-gray-900">{row.student.name}</div>
                          <div className="text-xs text-gray-600 font-medium">{row.student.group}</div>
                        </div>
                      </td>
                      {groupSessions.map((session) => (
                        <td key={session.id} className="border-2 border-gray-300 p-1 lg:p-2 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 lg:w-6 lg:h-6 rounded-full text-white text-xs font-bold ${
                              row.attendance[session.id] === true
                                ? "bg-green-500"
                                : row.attendance[session.id] === false
                                ? "bg-red-500"
                                : "bg-gray-300 text-gray-600"
                            }`}
                          >
                            {row.attendance[session.id] === true
                              ? "P"
                              : row.attendance[session.id] === false
                              ? "A"
                              : "-"}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Individual Student Attendance Graph */}
        <Card>
          <CardHeader>
            <div className="space-y-2 sm:space-y-3">
              <CardTitle>📈 Individual Student Attendance</CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Select Group:</label>
                  <Select
                    value={selectedGroupForStudent}
                    onValueChange={handleGroupForStudentChange}
                    placeholder="Select group first..."
                    className="w-full"
                  >
                    {groups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Select Student:</label>
                  <Select
                    value={selectedStudent}
                    onValueChange={setSelectedStudent}
                    displayValue={selectedStudentName}
                    placeholder={groupStudentsForGraph.length > 0 ? "Select a student..." : "No students in this group"}
                    className="w-full"
                  >
                    {groupStudentsForGraph.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedStudent && selectedStudentName ? (
              <div className="space-y-3 sm:space-y-4">
                {/* Student Info */}
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border-2 border-blue-200">
                  <h4 className="font-bold text-blue-900 text-sm sm:text-base">👤 {selectedStudentName}</h4>
                  <p className="text-blue-700 text-xs sm:text-sm font-medium">
                    Group: {allStudentsFromAttendance.find((s) => s.id === selectedStudent)?.group || "N/A"}
                  </p>
                  <p className="text-blue-700 text-xs sm:text-sm font-bold">
                    Attendance Rate:{" "}
                    <span className="text-blue-900">
                      {studentAttendanceData.length > 0
                        ? Math.round(
                            (studentAttendanceData.filter((d) => d.attended === 1).length /
                              studentAttendanceData.length) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </p>
                </div>

                {/* Student Graph */}
                {studentAttendanceData.length > 0 ? (
                  <div className="h-[250px] sm:h-[300px] lg:h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={studentAttendanceData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="session"
                          label={{ value: "Session Number", position: "insideBottom", offset: -10 }}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis
                          domain={[0, 1]}
                          tickFormatter={(value) => (value === 1 ? "Present" : "Absent")}
                          label={{ value: "Attendance", angle: -90, position: "insideLeft" }}
                          tick={{ fontSize: 10 }}
                        />
                        <Tooltip
                          formatter={(value, name) => [value === 1 ? "Present" : "Absent", "Status"]}
                          labelFormatter={(label) => `Session ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="attended"
                          stroke="#22c55e"
                          strokeWidth={3}
                          dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, fill: "#16a34a" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8 text-gray-600 text-sm bg-gray-50 rounded-lg border-2 border-gray-200">
                    <p className="font-medium">No attendance data available for this student.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-600 text-sm bg-gray-50 rounded-lg border-2 border-gray-200">
                <p className="font-medium">
                  {!selectedGroupForStudent
                    ? "Please select a group first, then choose a student to view their attendance graph."
                    : groupStudentsForGraph.length === 0
                      ? "No students found in the selected group."
                      : "Please select a student to view their attendance graph."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

module.exports = AttendanceDashboard;