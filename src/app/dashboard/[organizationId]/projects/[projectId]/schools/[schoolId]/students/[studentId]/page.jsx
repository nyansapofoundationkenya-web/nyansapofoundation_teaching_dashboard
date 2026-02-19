// app/organization/[organizationId]/projects/[projectId]/schools/[schoolId]/students/[studentId]/page.js
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Dashboard/SideBar";
import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { 
  User, 
  BookOpen, 
  Calculator,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { FiMenu, FiX } from "react-icons/fi";

// Assessment configuration with proper level ordering
const ASSESSMENT_CONFIG = {
  numeracy: {
    levels: ["beginner", "addition", "subtraction", "multiplication", "division", "above"],
    labels: {
      beginner: "Beginner",
      addition: "Addition",
      subtraction: "Subtraction", 
      multiplication: "Multiplication",
      division: "Division",
      above: "Above"
    },
    levelValues: {
      beginner: 0,
      addition: 1,
      subtraction: 2,
      multiplication: 3,
      division: 4,
      above: 5
    },
    color: "blue",
    icon: Calculator
  },
  literacy: {
    levels: ["beginner", "letter", "word", "paragraph", "story", "above"],
    labels: {
      beginner: "Beginner",
      letter: "Letter",
      word: "Word",
      paragraph: "Paragraph", 
      story: "Story",
      above: "Above"
    },
    levelValues: {
      beginner: 0,
      letter: 1,
      word: 2,
      paragraph: 3,
      story: 4,
      above: 5
    },
    color: "green",
    icon: BookOpen
  }
};

// Performance Graph Component
const PerformanceGraph = ({ data, subject, height = 300 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center">
          <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p>No assessment data available</p>
          <p className="text-sm text-gray-400">Start assessments to see progress</p>
        </div>
      </div>
    );
  }

  const config = ASSESSMENT_CONFIG[subject];
  const values = data.map(item => item.levelValue);
  
  // Calculate trend
  const trend = values.length > 1 ? values[values.length - 1] - values[0] : 0;
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-gray-500";

  // Get all unique levels from data for Y-axis
  const allLevels = config.levels;
  const levelCount = allLevels.length;
  const maxLevelValue = levelCount - 1;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">Performance Over Time</span>
        <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
          <span>{trend > 0 ? "Improving" : trend < 0 ? "Declining" : "Stable"}</span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border">
        <div className="flex" style={{ height: `${height}px` }}>
          {/* Y-axis with levels (beginner at bottom, above at top) */}
          <div className="flex flex-col justify-between mr-4 py-2">
            {[...allLevels].reverse().map((level) => (
              <div
                key={level}
                className="text-xs font-medium text-gray-600 flex items-center h-0"
              >
                {config.labels[level]}
              </div>
            ))}
          </div>

          {/* Graph area */}
          <div className="flex-1 relative" style={{ paddingBottom: '50px' }}>
            {/* Horizontal grid lines */}
            {allLevels.map((_, index) => (
              <div
                key={index}
                className="absolute left-0 right-0 border-t border-gray-200"
                style={{
                  top: `${(index / maxLevelValue) * 100}%`
                }}
              />
            ))}

            {/* Data points and connecting line */}
            <svg
              width="100%"
              height="100%"
              className="absolute inset-0"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <linearGradient id={`gradient-${subject}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={config.color === "blue" ? "#3b82f6" : "#10b981"} stopOpacity="0.1" />
                  <stop offset="100%" stopColor={config.color === "blue" ? "#3b82f6" : "#10b981"} stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Smooth curved line between points */}
              {data.length > 1 && (() => {
                // Calculate points in viewBox coordinates (0-100)
                const points = data.map((point, index) => ({
                  x: data.length === 1 ? 50 : (index / (data.length - 1)) * 100,
                  y: 100 - ((point.levelValue / maxLevelValue) * 100)
                }));

                // Create smooth curve path using cubic Bezier curves
                let pathD = `M ${points[0].x} ${points[0].y}`;

                for (let i = 0; i < points.length - 1; i++) {
                  const current = points[i];
                  const next = points[i + 1];
                  
                  // Calculate control points for smooth curve
                  const tension = 0.4; // Adjust this for more/less curve (0-1)
                  const dx = next.x - current.x;
                  
                  const cp1x = current.x + dx * tension;
                  const cp1y = current.y;
                  const cp2x = next.x - dx * tension;
                  const cp2y = next.y;
                  
                  pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
                }

                // Create area fill path
                const areaPathD = pathD + ` L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`;

                return (
                  <>
                    {/* Area fill under the curve */}
                    <path
                      d={areaPathD}
                      fill={`url(#gradient-${subject})`}
                      vectorEffect="non-scaling-stroke"
                    />
                    {/* Curved line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={config.color === "blue" ? "#3b82f6" : "#10b981"}
                      strokeWidth="0.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </>
                );
              })()}

              {/* Data points */}
              {data.map((point, index) => {
                const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
                // Invert Y: high levels at top (0%), low levels at bottom (100%)
                const y = 100 - ((point.levelValue / maxLevelValue) * 100);
                
                return (
                  <g key={index}>
                    {/* Main data point */}
                    <circle
                      cx={x}
                      cy={y}
                      r="1"
                      fill={config.color === "blue" ? "#3b82f6" : "#10b981"}
                      stroke="white"
                      strokeWidth="0.3"
                      vectorEffect="non-scaling-stroke"
                    />
                    
                    {/* Hover area with tooltip */}
                    <circle
                      cx={x}
                      cy={y}
                      r="2"
                      fill="transparent"
                      className="cursor-pointer"
                      vectorEffect="non-scaling-stroke"
                    >
                      <title>{config.labels[point.baseline]} - {point.dateLabel}</title>
                    </circle>
                  </g>
                );
              })}
            </svg>

            {/* X-axis dates at bottom */}
            <div className="absolute left-0 right-0 flex justify-between" style={{ bottom: '-30px' }}>
              {data.map((point, index) => {
                const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
                
                // Status display configuration
                const statusConfig = {
                  completed: { label: 'Completed', color: 'text-green-600', bg: 'bg-green-100', dot: 'bg-green-500' },
                  started_not_completed: { label: 'In Progress', color: 'text-yellow-600', bg: 'bg-yellow-100', dot: 'bg-yellow-500' },
                  not_started: { label: 'Not Started', color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-400' }
                };
                
                const status = statusConfig[point.status] || statusConfig.not_started;
                
                return (
                  <div
                    key={index}
                    className="absolute flex flex-col items-center gap-1"
                    style={{ 
                      left: `${x}%`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <div className="text-xs text-gray-700 font-medium whitespace-nowrap">
                      {point.dateLabel}
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${status.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                      <span className={`text-[10px] font-medium ${status.color} whitespace-nowrap`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Current Level Indicator */}
      {data.length > 0 && (
        <div className="bg-white rounded-lg p-3 border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Current Level</span>
            <span className="text-sm font-semibold" style={{ color: config.color === "blue" ? "#3b82f6" : "#10b981" }}>
              {config.labels[data[data.length - 1].baseline]}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function StudentDetailPage() {
  const params = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { organizationId, projectId, schoolId, studentId } = params;

  useEffect(() => {
    const fetchStudent = async () => {
      if (!organizationId || !projectId || !schoolId || !studentId) {
        setError("Missing required parameters");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const studentRef = doc(
          db,
          `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students`,
          studentId
        );
        
        const studentDoc = await getDoc(studentRef);
        
        if (!studentDoc.exists()) {
          setError("Student not found");
          setLoading(false);
          return;
        }

        const studentData = {
          id: studentDoc.id,
          ...studentDoc.data(),
          displayName: studentDoc.data().first_name && studentDoc.data().last_name 
            ? `${studentDoc.data().first_name} ${studentDoc.data().last_name}`
            : studentDoc.data().name || 'Unknown Student'
        };

        setStudent(studentData);
      } catch (err) {
        console.error("Error fetching student:", err);
        setError("Failed to load student data");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [organizationId, projectId, schoolId, studentId]);

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

  const getAssessmentHistory = (subject) => {
    if (!student || !student[subject] || !student[subject].history) return [];
    return student[subject].history || [];
  };

  // Prepare graph data with proper level values and date formatting
  const getGraphData = (subject) => {
    const history = getAssessmentHistory(subject);
    if (history.length === 0) return [];

    const config = ASSESSMENT_CONFIG[subject];
    
    // Filter out assessments without baseline and sort by date
    const validHistory = history.filter(assessment => 
      assessment.baseline && 
      assessment.baseline.trim() !== '' &&
      config.levelValues[assessment.baseline] !== undefined
    );

    if (validHistory.length === 0) return [];

    const sortedHistory = [...validHistory].sort((a, b) => {
      const dateA = a.lastUpdated?.toDate ? a.lastUpdated.toDate() : new Date(a.lastUpdated);
      const dateB = b.lastUpdated?.toDate ? b.lastUpdated.toDate() : new Date(b.lastUpdated);
      return dateA - dateB;
    });

    return sortedHistory.map((assessment) => {
      const levelValue = config.levelValues[assessment.baseline];
      const date = assessment.lastUpdated?.toDate ? assessment.lastUpdated.toDate() : new Date(assessment.lastUpdated);
      
      return {
        levelValue: levelValue,
        baseline: assessment.baseline,
        date: date,
        dateLabel: new Intl.DateTimeFormat('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        }).format(date),
        status: assessment.status || 'not_started',
        completed: assessment.completed || false,
        assessmentId: assessment.assessmentId
      };
    });
  };

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Graph Skeletons */}
      {[...Array(2)].map((_, sectionIndex) => (
        <div key={sectionIndex} className="bg-white rounded-lg shadow border p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
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
          <Sidebar title="Student Details" organizationId={organizationId} currentSection={"students"}/>
        </div>

        {/* Main Content */}
        <div
          className={`
            flex-1 transition-all duration-300 ease-in-out
            ${!isMobile && sidebarOpen ? "ml-64" : "ml-0"}
          `}
        >
          <div className="h-full p-6 space-y-6 bg-blue-50 flex-1 overflow-auto">
            <SkeletonLoader />
          </div>
        </div>
      </div>
    );
  }

  if (error || !student) {
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
          <Sidebar title="Student Details" organizationId={organizationId} />
        </div>

        {/* Main Content */}
        <div
          className={`
            flex-1 transition-all duration-300 ease-in-out
            ${!isMobile && sidebarOpen ? "ml-64" : "ml-0"}
          `}
        >
          <div className="h-full p-6 bg-blue-50 flex-1 overflow-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 font-medium">{error || "Student not found"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const numeracyGraphData = getGraphData('numeracy');
  const literacyGraphData = getGraphData('literacy');

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
        <Sidebar title="Student Details" organizationId={organizationId} />
      </div>

      {/* Main Content */}
      <div
        className={`
          flex-1 transition-all duration-300 ease-in-out
          ${!isMobile && sidebarOpen ? "ml-64" : "ml-0"}
        `}
      >
        <div className="h-full p-6 space-y-6 bg-blue-50 flex-1 overflow-auto">
          {/* Student Header Card */}
          <div className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-yellow-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{student.displayName}</h1>
                <p className="text-gray-600">Grade {student.grade} • {student.sex}</p>
              </div>
            </div>
          </div>

          {/* Numeracy Assessment Section */}
          <div className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calculator className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-800">Numeracy Progress</h2>
            </div>

            <PerformanceGraph 
              data={numeracyGraphData} 
              subject="numeracy"
              height={300}
            />
          </div>

          {/* Literacy Assessment Section */}
          <div className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-semibold text-gray-800">Literacy Progress</h2>
            </div>

            <PerformanceGraph 
              data={literacyGraphData} 
              subject="literacy"
              height={300}
            />
          </div>
        </div>
      </div>
    </div>
  );
}