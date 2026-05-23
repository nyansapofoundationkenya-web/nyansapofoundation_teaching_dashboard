"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import Search from "@/components/Assessments/Search";
import GradeFilter from "@/components/Assessments/GradeFIlter";
import StudentsList from "@/components/Assessments/StudentsList";
import StudentMetrics from "@/components/Assessments/StudentMetrics";
import DurationStatsModal from "@/components/Assessments/DurationStatsModal";
import AssessmentContentModal from "@/components/Moderations/assessments/AssessmentContentModal";
import DashboardLayout from "@/app/dashboard/[organizationId]/DashboardLayout";
import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft, RotateCw, Clock, FileText } from "lucide-react";

export default function AssessmentDetailsPage() {
  const { organizationId, assessmentId } = useParams();
  const router = useRouter();
  const { user: currentUser } = useSelector((state) => state.auth);
  const userRole = currentUser?.role;

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All Grades");
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [reprocessMessage, setReprocessMessage] = useState(null);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);

  const backUrl = `/dashboard/${organizationId}/moderations`;

  // Fetch the assessment from Firestore
  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const assessmentRef = doc(db, "assessments", assessmentId);
        const snap = await getDoc(assessmentRef);

        if (!snap.exists()) throw new Error("Assessment not found");

        const assessmentData = { id: snap.id, ...snap.data() };
        setAssessment(assessmentData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [assessmentId]);

  const handleSearchChange = (q) => setSearchQuery(q);
  const handleGradeFilterChange = (g) => setGradeFilter(g);

  // Get assessment type and normalize it
  const assessmentTypeRaw = assessment?.type || "literacy";
  const assessmentType =
    assessmentTypeRaw.toLowerCase() === "numeracy" ? "numeracy" : "literacy";
  const displayAssessmentType =
    assessmentType === "numeracy" ? "Numeracy" : "Literacy";

  // Filter students (search + grade)
  const filteredStudents = useMemo(() => {
    if (!assessment?.assigned_students) return [];

    return assessment.assigned_students.filter((student) => {
      const fullName =
        `${student.first_name || ""} ${student.last_name || ""}`.trim().toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase().trim());
      const matchesGrade =
        gradeFilter === "All Grades" ||
        String(student.grade ?? "") === gradeFilter;
      return matchesSearch && matchesGrade;
    });
  }, [assessment?.assigned_students, searchQuery, gradeFilter]);

  // Handle reprocess assessment (super admin only)
  const handleReprocessAssessment = async () => {
    if (
      !confirm(
        "Are you sure you want to reprocess this assessment? This will recalculate all student results."
      )
    ) return;

    setIsReprocessing(true);
    setReprocessMessage(null);

    try {
      const response = await fetch(
        "https://us-east1-nyansapoai-v2.cloudfunctions.net/reprocess_assessment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assessmentId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to reprocess assessment");
      }

      setReprocessMessage({ type: "success", text: "Assessment reprocessed successfully!" });
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error("Reprocess error:", err);
      setReprocessMessage({ type: "error", text: `Error: ${err.message}` });
    } finally {
      setIsReprocessing(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout
        title="Assessment Details"
        organizationId={organizationId}
        currentSection="assessments"
      >
        <div className="p-6 space-y-6">
          <StudentMetrics loading={true} />
          <div className="bg-background-light rounded-2xl shadow-lg p-6 border border-gray-600">
            <div className="animate-pulse">
              <div className="h-6 bg-background-lighter rounded w-48 mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-background-lighter rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout
        title="Assessment Details"
        organizationId={organizationId}
        currentSection="assessments"
      >
        <div className="p-6 flex items-center justify-center min-h-[300px]">
          <div className="text-red-400">Error: {error}</div>
        </div>
      </DashboardLayout>
    );
  }

  // Not-found state
  if (!assessment) {
    return (
      <DashboardLayout
        title="Assessment Details"
        organizationId={organizationId}
        currentSection="assessments"
      >
        <div className="p-6 flex items-center justify-center min-h-[300px]">
          <div className="text-foreground">Assessment not found</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={assessment.name}
      organizationId={organizationId}
      currentSection="assessments"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-background-light border-b border-gray-600 px-6 py-4 rounded-2xl shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Left — back + title */}
            <div className="flex flex-col">
              <div
                onClick={() => router.push(backUrl)}
                className="flex items-center text-gray-300 hover:text-white cursor-pointer w-fit mb-2"
              >
                <ArrowLeft size={18} className="mr-1" />
                <span className="text-sm font-medium">Back</span>
              </div>
              <h1 className="text-xl font-semibold text-foreground">{assessment.name}</h1>
              <p className="text-sm text-gray-400 mt-1">{displayAssessmentType} Assessment</p>
            </div>

            {/* Right — action buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* View Assessment Content */}
              <button
                onClick={() => setShowContentModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 bg-primary-2/20 hover:bg-primary-2/30 border border-primary-2/40 text-primary-2 shadow-sm hover:shadow-md"
              >
                <FileText size={18} />
                View Content
              </button>

              {/* View Duration Stats */}
              <button
                onClick={() => setShowDurationModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
              >
                <Clock size={18} />
                View Duration Stats
              </button>

              {/* Reprocess — super_admin only */}
              {userRole === "super_admin" && (
                <button
                  onClick={handleReprocessAssessment}
                  disabled={isReprocessing}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    isReprocessing
                      ? "bg-gray-600 cursor-not-allowed opacity-50"
                      : "bg-amber-600 hover:bg-amber-700 text-white shadow-lg hover:shadow-xl"
                  }`}
                >
                  <RotateCw size={18} className={isReprocessing ? "animate-spin" : ""} />
                  {isReprocessing ? "Processing..." : "Recalculate"}
                </button>
              )}

              <GradeFilter
                selectedGrade={gradeFilter}
                onGradeChange={handleGradeFilterChange}
                students={assessment.assigned_students}
              />
              <Search
                onSearchChange={handleSearchChange}
                placeholder="Search for a student"
              />
            </div>
          </div>

          {/* Reprocess message */}
          {reprocessMessage && (
            <div
              className={`mt-4 p-3 rounded-xl text-sm ${
                reprocessMessage.type === "success"
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : "bg-red-500/20 text-red-300 border border-red-500/30"
              }`}
            >
              {reprocessMessage.text}
            </div>
          )}
        </div>

        {/* Student metrics */}
        <StudentMetrics
          students={filteredStudents}
          loading={loading}
          assessmentId={assessmentId}
        />

        {/* Students list */}
        <div className="bg-background-light rounded-2xl shadow-lg p-6 border border-gray-600">
          <h2 className="text-lg font-semibold mb-4 text-foreground">
            Assigned Students ({filteredStudents.length})
          </h2>

          {filteredStudents.length > 0 ? (
            <StudentsList
              students={filteredStudents}
              organizationId={organizationId}
              assessmentId={assessmentId}
            />
          ) : (
            <div className="text-center py-8 text-gray-400">
              {searchQuery || gradeFilter !== "All Grades"
                ? "No students match your search criteria"
                : "No students assigned to this assessment yet"}
            </div>
          )}
        </div>
      </div>

      {/* Duration Stats Modal */}
      <DurationStatsModal
        isOpen={showDurationModal}
        onClose={() => setShowDurationModal(false)}
        assessmentId={assessmentId}
        assessmentType={assessmentType}
      />

      {/* Assessment Content Side Panel */}
      <AssessmentContentModal
        isOpen={showContentModal}
        onClose={() => setShowContentModal(false)}
        assessmentId={assessmentId}
        assessmentType={assessmentType}
      />
    </DashboardLayout>
  );
}