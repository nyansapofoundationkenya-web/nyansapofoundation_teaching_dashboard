"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserPlus, 
  ChevronLeft, 
  ChevronRight, 
  Eye,
  Filter,
  X,
  BookOpen,
  Calculator,
  AlertCircle,
  Info
} from "lucide-react";
import StudentModal from "./StudentModal";
import GuideModal from "./GuideModal";

// Competency levels constants
const LITERACY_LEVELS = [
  "non-reader",
  "beginner",
  "letter",
  "word",
  "paragraph",
  "story",
  "reading-comprehension",
  "above"
];

const NUMERACY_LEVELS = [
  "beginner",
  "number_recognition",
  "addition",
  "subtraction",
  "multiplication",
  "division",
  "above"
];

// Level options for dropdowns
const LITERACY_OPTIONS = LITERACY_LEVELS.map(level => ({
  value: level,
  label: level.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}));

const NUMERACY_OPTIONS = NUMERACY_LEVELS.map(level => ({
  value: level,
  label: level.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}));

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
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [duplicates, setDuplicates] = useState(new Set());
  
  // New filter states
  const [assessmentType, setAssessmentType] = useState(""); // "literacy" or "numeracy"
  const [levelType, setLevelType] = useState(""); // "baseline", "midline", "endline"
  const [competencyLevel, setCompetencyLevel] = useState("");
  const [showMissingOnly, setShowMissingOnly] = useState(false); // Filter for missing data

  // Enhanced duplicate detection: first name + last name + grade + gender
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

    const duplicateIds = new Set();
    duplicateMap.forEach((studentGroup) => {
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

  // Get the appropriate field based on assessment type and level
  const getStudentLevelValue = (student, type, level) => {
    if (!type || !level) return null;
    
    if (type === "literacy") {
      return student[`${level}`]; // baseline, midline, endline fields for literacy
    } else if (type === "numeracy") {
      return student[`${level}_numeracy`]; // baseline_numeracy, midline_numeracy, endline_numeracy
    }
    return null;
  };

  // Check if a student has missing data for a specific assessment type and level
  const hasMissingData = (student, type, level) => {
    if (!type || !level) return false;
    const value = getStudentLevelValue(student, type, level);
    return !value || value === "" || value === null || value === undefined;
  };

  // Apply filters to students
  const filteredStudents = students.filter(student => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        student.displayName?.toLowerCase().includes(searchLower) ||
        student.first_name?.toLowerCase().includes(searchLower) ||
        student.last_name?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    
    // Missing data filter
    if (showMissingOnly && assessmentType && levelType) {
      if (!hasMissingData(student, assessmentType, levelType)) {
        return false;
      }
    }
    
    // Assessment type, level, and competency filter
    if (assessmentType && levelType && competencyLevel) {
      const studentLevelValue = getStudentLevelValue(student, assessmentType, levelType);
      if (studentLevelValue !== competencyLevel) {
        return false;
      }
    }
    
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  // Clear all filters
  const clearFilters = () => {
    setAssessmentType("");
    setLevelType("");
    setCompetencyLevel("");
    setShowMissingOnly(false);
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = assessmentType || levelType || competencyLevel || showMissingOnly || searchTerm;

  // Get competency options based on selected assessment type
  const getCompetencyOptions = () => {
    if (assessmentType === "literacy") {
      return LITERACY_OPTIONS;
    } else if (assessmentType === "numeracy") {
      return NUMERACY_OPTIONS;
    }
    return [];
  };

  // Reset competency level when assessment type or level type changes
  useEffect(() => {
    setCompetencyLevel("");
    setShowMissingOnly(false);
  }, [assessmentType, levelType]);

  // Student actions
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

  const handleStudentClick = (student) => {
    if (!currentFilter?.organizationId || !currentFilter?.projectId || !currentFilter?.schoolId) {
      return;
    }
    // Uncomment and modify this route when you have student detail pages
    // router.push(
    //   `/dashboard/${currentFilter.organizationId}/projects/${currentFilter.projectId}/schools/${currentFilter.schoolId}/students/${student.id}`
    // );
  };

  const handleModalSubmit = async (studentData) => {
    try {
      if (selectedStudent) {
        await onUpdateStudent(selectedStudent.id, studentData);
      } else {
        await onAddStudent(studentData);
      }
    } catch (err) {
      throw err;
    }
  };

  // Get color for competency level badge
  const getLevelColor = (level, type = "literacy") => {
    const colors = {
      // Literacy levels
      "non-reader": "bg-gray-500/20 text-gray-400 border border-gray-500/30",
      "beginner": "bg-purple-500/20 text-purple-400 border border-purple-500/30",
      "letter": "bg-orange-500/20 text-orange-400 border border-orange-500/30",
      "word": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
      "paragraph": "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      "story": "bg-green-500/20 text-green-400 border border-green-500/30",
      "reading-comprehension": "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
      "above": "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
      // Numeracy levels
      "number_recognition": "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
      "addition": "bg-sky-500/20 text-sky-400 border border-sky-500/30",
      "subtraction": "bg-violet-500/20 text-violet-400 border border-violet-500/30",
      "multiplication": "bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30",
      "division": "bg-pink-500/20 text-pink-400 border border-pink-500/30",
    };
    
    return colors[level] || "bg-gray-500/20 text-gray-400 border border-gray-500/30";
  };

  // Format level name for display
  const formatLevelName = (level) => {
    if (!level) return "_";
    return level.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Get missing data count for a student
  const getMissingDataCount = (student) => {
    let count = 0;
    const literacyLevels = ['baseline', 'midline', 'endline'];
    const numeracyLevels = ['baseline_numeracy', 'midline_numeracy', 'endline_numeracy'];
    
    literacyLevels.forEach(level => {
      if (!student[level]) count++;
    });
    
    numeracyLevels.forEach(level => {
      if (!student[level]) count++;
    });
    
    return count;
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
                {filteredStudents.length} of {students.length} students match filters
                {duplicateCount > 0 && (
                  <span className="text-primary-3 ml-2">
                    • {duplicateCount} potential duplicate(s)
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsGuideOpen(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-500 hover:bg-gray-700/30 text-foreground rounded-xl transition-colors"
                title="How to read this table"
              >
                <Info className="w-4 h-4" />
                <span className="hidden sm:inline">Guide</span>
              </button>
              <button
                onClick={handleAddClick}
                className="flex items-center gap-2 px-4 py-2 bg-primary-3 hover:bg-yellow-400 text-primary-1 font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg"
              >
                <UserPlus className="w-4 h-4" />
                Add Student
              </button>
            </div>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="p-6 border-b border-gray-600">
          <div className="flex flex-col gap-4">
            {/* Search and Items Per Page Row */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="relative w-full sm:w-auto sm:max-w-md">
                <input
                  type="text"
                  placeholder="Search students by name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
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

            {/* Filter Controls Row */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">Filter by:</span>
                </div>
                
                {/* Assessment Type (Literacy/Numeracy) */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Assessment Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setAssessmentType("literacy");
                        setCurrentPage(1);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        assessmentType === "literacy"
                          ? 'bg-primary-3/20 text-primary-3 border border-primary-3/30'
                          : 'border border-gray-500 text-gray-300 hover:bg-gray-700/30'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      Literacy
                    </button>
                    <button
                      onClick={() => {
                        setAssessmentType("numeracy");
                        setCurrentPage(1);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        assessmentType === "numeracy"
                          ? 'bg-primary-3/20 text-primary-3 border border-primary-3/30'
                          : 'border border-gray-500 text-gray-300 hover:bg-gray-700/30'
                      }`}
                    >
                      <Calculator className="w-4 h-4" />
                      Numeracy
                    </button>
                  </div>
                </div>

                {/* Level Type (Baseline/Midline/Endline) */}
                {assessmentType && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">Level Type</label>
                    <select
                      value={levelType}
                      onChange={(e) => {
                        setLevelType(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="border border-gray-500 rounded-xl px-3 py-2 text-sm 
                                focus:outline-none focus:ring-1 focus:ring-primary-2 focus:border-primary-2
                                bg-background-lighter text-foreground cursor-pointer shadow-md min-w-[140px]"
                    >
                      <option value="">Select Level</option>
                      <option value="baseline">Baseline (B)</option>
                      <option value="midline">Midline (M)</option>
                      <option value="endline">Endline (E)</option>
                    </select>
                  </div>
                )}

                {/* Competency Level Dropdown */}
                {assessmentType && levelType && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">Competency Level</label>
                    <select
                      value={competencyLevel}
                      onChange={(e) => {
                        setCompetencyLevel(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="border border-gray-500 rounded-xl px-3 py-2 text-sm 
                                focus:outline-none focus:ring-1 focus:ring-primary-2 focus:border-primary-2
                                bg-background-lighter text-foreground cursor-pointer shadow-md min-w-[160px]"
                    >
                      <option value="">All Levels</option>
                      {getCompetencyOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Missing Data Filter */}
                {assessmentType && levelType && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">Data Status</label>
                    <button
                      onClick={() => {
                        setShowMissingOnly(!showMissingOnly);
                        setCurrentPage(1);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        showMissingOnly
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'border border-gray-500 text-gray-300 hover:bg-gray-700/30'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4" />
                      {showMissingOnly ? "Show Missing Only" : "All Data"}
                    </button>
                  </div>
                )}

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-gray-300 hover:text-foreground 
                              hover:bg-gray-700/30 rounded-xl transition-colors mt-6"
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Active Filters Badge */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                  <div className="text-xs text-primary-3 bg-primary-3/20 px-2 py-1 rounded-full border border-primary-3/30">
                    Filters Active
                  </div>
                  {assessmentType && (
                    <div className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full border border-blue-500/30">
                      {assessmentType === "literacy" ? "Literacy" : "Numeracy"}
                    </div>
                  )}
                  {levelType && (
                    <div className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full border border-purple-500/30">
                      {levelType === "baseline" ? "B" : levelType === "midline" ? "M" : "E"}
                    </div>
                  )}
                  {competencyLevel && (
                    <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">
                      {formatLevelName(competencyLevel)}
                    </div>
                  )}
                  {showMissingOnly && (
                    <div className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full border border-amber-500/30">
                      Missing Data
                    </div>
                  )}
                </div>
              )}
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
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Literacy <span className="text-xs text-gray-400 ml-1">(B/M/E)</span>
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Numeracy <span className="text-xs text-gray-400 ml-1">(B/M/E)</span>
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentStudents.length > 0 ? (
                currentStudents.map((student) => {
                  const isDuplicate = isDuplicateStudent(student);
                  const missingCount = getMissingDataCount(student);
                  
                  return (
                    <tr 
                      key={student.id} 
                      className="border-b border-gray-600 hover:bg-background-lighter cursor-pointer transition-colors group"
                      onClick={() => handleStudentClick(student)}
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
                      <td className="px-6 py-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400 w-4">B:</span>
                            {student.baseline ? (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(student.baseline)}`}>
                                {formatLevelName(student.baseline)}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs italic">_</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400 w-4">M:</span>
                            {student.midline ? (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(student.midline)}`}>
                                {formatLevelName(student.midline)}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs italic">_</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400 w-4">E:</span>
                            {student.endline ? (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(student.endline)}`}>
                                {formatLevelName(student.endline)}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs italic">_</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400 w-4">B:</span>
                            {student.baseline_numeracy ? (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(student.baseline_numeracy, "numeracy")}`}>
                                {formatLevelName(student.baseline_numeracy)}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs italic">_</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400 w-4">M:</span>
                            {student.midline_numeracy ? (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(student.midline_numeracy, "numeracy")}`}>
                                {formatLevelName(student.midline_numeracy)}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs italic">_</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400 w-4">E:</span>
                            {student.endline_numeracy ? (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(student.endline_numeracy, "numeracy")}`}>
                                {formatLevelName(student.endline_numeracy)}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs italic">_</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-col gap-1">
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
                          {missingCount > 0 && (
                            <span 
                              className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30 cursor-help"
                              title={`Missing ${missingCount} assessment(s)`}
                            >
                              {missingCount} Missing
                            </span>
                          )}
                        </div>
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
                              <button
                                onClick={() => handleEditClick(student)}
                                className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-primary-3/20 hover:text-primary-3 transition-colors border-b border-gray-600 rounded-t-2xl"
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
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-400">
                    {students.length === 0 
                      ? "No students found in the selected school." 
                      : "No students match the current filters."
                    }
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

      {/* Guide Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </>
  );
}