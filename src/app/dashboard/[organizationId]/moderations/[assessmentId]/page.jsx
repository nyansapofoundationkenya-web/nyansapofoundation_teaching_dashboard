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
import {
  ArrowLeft,
  RotateCw,
  Clock,
  FileText,
  UploadCloud,
  CheckCircle2,
  X,
  AlertTriangle,
} from "lucide-react";
import { exportAssessmentData } from "@/utils/exportAssessmentData";

const REPROCESS_API_URL = process.env.NEXT_PUBLIC_REPROCESS_API_URL;
const REPROCESS_SECRET = process.env.NEXT_PUBLIC_PROCESS_SECRET;

export default function AssessmentDetailsPage() {
  const { organizationId, assessmentId } = useParams();
  const router = useRouter();
  const { user: currentUser } = useSelector((state) => state.auth);
  const userRole = currentUser?.role;
  const isSuperAdmin = userRole === "super_admin";
  const migratedByName =
    currentUser?.name ||
    currentUser?.email ||
    currentUser?.displayName ||
    null;

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All Grades");
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [reprocessMessage, setReprocessMessage] = useState(null);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferMessage, setTransferMessage] = useState(null);

  // Group-name modal state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupInput, setGroupInput] = useState("");

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

  const handleStudentsUpdate = (updatedStudents) => {
    setAssessment((prev) => ({
      ...prev,
      assigned_students: updatedStudents,
    }));
  };

  const handleSearchChange = (q) => setSearchQuery(q);
  const handleGradeFilterChange = (g) => setGradeFilter(g);

  // Assessment type
  const assessmentTypeRaw = assessment?.type || "literacy";
  const assessmentType =
    assessmentTypeRaw.toLowerCase() === "numeracy" ? "numeracy" : "literacy";
  const isSwahiliAssessment =
    String(assessment?.language || "").trim().toLowerCase() === "swahili";
  const displayAssessmentType =
    assessmentType === "numeracy" ? "Numeracy" : "Literacy";

  // Transfer status flags
  const kiswahiliTransferred = assessment?.kiswahiliTransferred === true;
  const englishTransferred = assessment?.englishTransferred === true;
  const drawingsTransferred = assessment?.drawingsTransferred === true;

  // Only super admins can transfer
  const canTransfer =
    isSuperAdmin &&
    ((assessmentType === "literacy" && isSwahiliAssessment) ||
      (assessmentType === "literacy" && !isSwahiliAssessment) ||
      assessmentType === "numeracy");

  // Fully transferred = nothing left to move for this assessment type
  const fullyTransferred =
    (assessmentType === "literacy" && isSwahiliAssessment && kiswahiliTransferred) ||
    (assessmentType === "literacy" && !isSwahiliAssessment && englishTransferred) ||
    (assessmentType === "numeracy" && englishTransferred && drawingsTransferred);

  const transferButtonLabel = (() => {
    if (assessmentType === "literacy" && isSwahiliAssessment) return "Transfer Kiswahili Data";
    if (assessmentType === "literacy" && !isSwahiliAssessment) return "Transfer English Data";
    if (assessmentType === "numeracy") return "Transfer Numeracy Data";
    return "Transfer Data";
  })();

  // Build a suggested default group name e.g. "grade3-literacy-english-2026-10-07"
  const buildSuggestedGroup = () => {
    const dateStr = new Date().toISOString().split("T")[0];
    const grades = Array.from(
      new Set(
        (assessment?.assigned_students || [])
          .map((s) => s?.grade)
          .filter((g) => g !== undefined && g !== null && g !== "")
      )
    ).sort();
    const gradePart =
      grades.length === 1
        ? `grade${grades[0]}`
        : grades.length > 1
        ? `grades${grades.join("-")}`
        : null;

    const languagePart = isSwahiliAssessment ? "kiswahili" : "english";

    return [gradePart, assessmentType, languagePart, dateStr]
      .filter(Boolean)
      .join("-");
  };

  // Open the group modal (called from Transfer button)
  const handleTransferClick = () => {
    if (!isSuperAdmin || isTransferring || fullyTransferred) return;

    setGroupInput(buildSuggestedGroup());
    setTransferMessage(null);
    setShowGroupModal(true);
  };

  // Actual transfer (called from modal Confirm)
  const handleConfirmTransfer = async () => {
    if (!isSuperAdmin || isTransferring) return;

    const trimmed = groupInput.trim();
    if (!trimmed) {
      setTransferMessage({
        type: "error",
        text: "Please enter a group name — records need to be tagged for fine-tuning.",
      });
      return;
    }

    setIsTransferring(true);
    setTransferMessage(null);

    try {
      const result = await exportAssessmentData({
        assessment,
        assessmentId,
        group: trimmed,
        migratedBy: currentUser?.uid || null,
        migratedByName,
      });

      const parts = [];
      if (result.kiswahili) {
        parts.push(
          `${result.kiswahili.exported} Kiswahili record(s) (${result.kiswahili.skipped} skipped)`
        );
      }
      if (result.english) {
        const label =
          result.english.kind === "number_recognition"
            ? "English/number"
            : "English";
        parts.push(
          `${result.english.exported} ${label} record(s) (${result.english.skipped} skipped)`
        );
      }
      if (result.drawings) {
        parts.push(
          `${result.drawings.exported} drawings record(s) (${result.drawings.skipped} skipped)`
        );
      }

      setTransferMessage({
        type: "success",
        text: `Transferred from ${result.students} student result(s) into group "${result.group}": ${parts.join(
          ", "
        )}.`,
      });

      // Update local assessment flags so the UI reflects the transfer instantly
      setAssessment((prev) => {
        const updated = { ...prev };
        if (result.kiswahili) updated.kiswahiliTransferred = true;
        if (result.english) updated.englishTransferred = true;
        if (result.drawings) updated.drawingsTransferred = true;
        const existingGroups = Array.isArray(prev.transferGroups)
          ? prev.transferGroups
          : [];
        updated.transferGroups = existingGroups.includes(result.group)
          ? existingGroups
          : [...existingGroups, result.group];
        updated.lastTransferGroup = result.group;
        updated.transferredByName = migratedByName;
        return updated;
      });

      setShowGroupModal(false);
    } catch (err) {
      console.error("Transfer error:", err);
      setTransferMessage({
        type: "error",
        text: err.message || "Failed to transfer data.",
      });
    } finally {
      setIsTransferring(false);
    }
  };

  // Filter students
  const filteredStudents = useMemo(() => {
    if (!assessment?.assigned_students) return [];

    return assessment.assigned_students.filter((student) => {
      const fullName =
        `${student.first_name || ""} ${student.last_name || ""}`
          .trim()
          .toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase().trim());
      const matchesGrade =
        gradeFilter === "All Grades" ||
        String(student.grade ?? "") === gradeFilter;
      return matchesSearch && matchesGrade;
    });
  }, [assessment?.assigned_students, searchQuery, gradeFilter]);

  // Handle reprocess assessment (super admin only)
  const handleReprocessAssessment = async () => {
    if (!isSuperAdmin) return;

    if (
      !confirm(
        "Are you sure you want to reprocess this assessment? This will recalculate all student results."
      )
    )
      return;

    if (!REPROCESS_API_URL || !REPROCESS_SECRET) {
      setReprocessMessage({
        type: "error",
        text: "Reprocessing is not configured. Missing API URL or secret.",
      });
      return;
    }

    setIsReprocessing(true);
    setReprocessMessage(null);

    try {
      const response = await fetch(REPROCESS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          secret: REPROCESS_SECRET,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to reprocess assessment");
      }

      setReprocessMessage({
        type: "success",
        text: "Assessment reprocessed successfully!",
      });
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
                  <div
                    key={i}
                    className="h-12 bg-background-lighter rounded-xl"
                  ></div>
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
            {/* Left -- back + title */}
            <div className="flex flex-col">
              <div
                onClick={() => router.push(backUrl)}
                className="flex items-center text-gray-300 hover:text-white cursor-pointer w-fit mb-2"
              >
                <ArrowLeft size={18} className="mr-1" />
                <span className="text-sm font-medium">Back</span>
              </div>
              <h1 className="text-xl font-semibold text-foreground">
                {assessment.name}
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                {displayAssessmentType} Assessment
              </p>

              {/* Transferred indicators — super_admin only */}
              {isSuperAdmin &&
                (kiswahiliTransferred ||
                  englishTransferred ||
                  drawingsTransferred) && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {kiswahiliTransferred && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 size={12} />
                        Kiswahili transferred
                        {assessment?.lastTransferGroup
                          ? ` • ${assessment.lastTransferGroup}`
                          : ""}
                      </span>
                    )}
                    {englishTransferred && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 size={12} />
                        English transferred
                        {assessment?.lastTransferGroup
                          ? ` • ${assessment.lastTransferGroup}`
                          : ""}
                      </span>
                    )}
                    {drawingsTransferred && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 size={12} />
                        Drawings transferred
                        {assessment?.lastTransferGroup
                          ? ` • ${assessment.lastTransferGroup}`
                          : ""}
                      </span>
                    )}
                  </div>
                )}
            </div>

            {/* Right -- action buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowContentModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 bg-primary-2/20 hover:bg-primary-2/30 border border-primary-2/40 text-primary-2 shadow-sm hover:shadow-md"
              >
                <FileText size={18} />
                View Content
              </button>

              <button
                onClick={() => setShowDurationModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
              >
                <Clock size={18} />
                View Duration Stats
              </button>

              {/* Reprocess — super_admin only */}
              {isSuperAdmin && (
                <button
                  onClick={handleReprocessAssessment}
                  disabled={isReprocessing}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    isReprocessing
                      ? "bg-gray-600 cursor-not-allowed opacity-50"
                      : "bg-amber-600 hover:bg-amber-700 text-white shadow-lg hover:shadow-xl"
                  }`}
                >
                  <RotateCw
                    size={18}
                    className={isReprocessing ? "animate-spin" : ""}
                  />
                  {isReprocessing ? "Processing..." : "Recalculate"}
                </button>
              )}

              {/* Transfer Data — super_admin only, hidden once fully transferred */}
              {canTransfer && !fullyTransferred && (
                <button
                  onClick={handleTransferClick}
                  disabled={isTransferring}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    isTransferring
                      ? "bg-gray-600 cursor-not-allowed opacity-50"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl"
                  }`}
                >
                  <UploadCloud size={18} />
                  {isTransferring ? "Transferring..." : transferButtonLabel}
                </button>
              )}

              {canTransfer && fullyTransferred && (
                <button
                  disabled
                  title="Data has already been transferred. Re-transfer is disabled to avoid duplicates."
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-emerald-900/40 text-emerald-300 border border-emerald-600/40 cursor-not-allowed opacity-70"
                >
                  <CheckCircle2 size={18} />
                  Already Transferred
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

          {/* Reprocess message — super_admin only */}
          {isSuperAdmin && reprocessMessage && (
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

          {/* Transfer message — super_admin only */}
          {isSuperAdmin && transferMessage && (
            <div
              className={`mt-4 p-3 rounded-xl text-sm ${
                transferMessage.type === "success"
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : "bg-red-500/20 text-red-300 border border-red-500/30"
              }`}
            >
              {transferMessage.text}
            </div>
          )}
        </div>

        <StudentMetrics
          students={filteredStudents}
          loading={loading}
          assessmentId={assessmentId}
        />

        <div className="bg-background-light rounded-2xl shadow-lg p-6 border border-gray-600">
          <h2 className="text-lg font-semibold mb-4 text-foreground">
            Assigned Students ({filteredStudents.length})
          </h2>

          {filteredStudents.length > 0 ? (
            <StudentsList
              students={filteredStudents}
              organizationId={organizationId}
              assessmentId={assessmentId}
              onStudentsUpdate={handleStudentsUpdate}
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

      {/* Group Name Modal — super_admin only */}
      {isSuperAdmin && showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-background-light rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-600">
            <div className="flex justify-between items-center p-6 border-b border-gray-600">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <UploadCloud size={22} className="text-emerald-500" />
                Name this transfer group
              </h3>
              <button
                onClick={() => setShowGroupModal(false)}
                className="text-gray-400 hover:text-white transition"
                disabled={isTransferring}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-300">
                Every migrated record will be tagged with this group name so you
                can filter it on the fine-tuning tool (e.g.{" "}
                <code className="text-primary-2">
                  {buildSuggestedGroup() || "grade3-literacy-oct-2026"}
                </code>
                ).
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Group name
                </label>
                <input
                  type="text"
                  value={groupInput}
                  onChange={(e) => setGroupInput(e.target.value)}
                  autoFocus
                  disabled={isTransferring}
                  className="w-full px-3 py-2 bg-background border border-gray-600 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary-2 disabled:opacity-60"
                  placeholder="e.g. grade3-literacy-oct-2026"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && groupInput.trim() && !isTransferring) {
                      handleConfirmTransfer();
                    }
                  }}
                />
              </div>

              {Array.isArray(assessment?.transferGroups) &&
                assessment.transferGroups.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      Previously used groups:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {assessment.transferGroups.map((g) => (
                        <button
                          key={g}
                          onClick={() => setGroupInput(g)}
                          disabled={isTransferring}
                          className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 disabled:opacity-50"
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex gap-2">
                <AlertTriangle
                  size={16}
                  className="text-yellow-400 shrink-0 mt-0.5"
                />
                <p className="text-xs text-yellow-300">
                  This transfer is one-way. Once confirmed, the assessment will
                  be marked as transferred and re-transferring will be disabled
                  to prevent duplicate records.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowGroupModal(false)}
                  disabled={isTransferring}
                  className="flex-1 px-4 py-2 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmTransfer}
                  disabled={isTransferring || !groupInput.trim()}
                  className="flex-1 px-4 py-2 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTransferring ? "Transferring..." : "Confirm Transfer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DurationStatsModal
        isOpen={showDurationModal}
        onClose={() => setShowDurationModal(false)}
        assessmentId={assessmentId}
        assessmentType={assessmentType}
      />

      <AssessmentContentModal
        isOpen={showContentModal}
        onClose={() => setShowContentModal(false)}
        assessmentId={assessmentId}
        assessmentType={assessmentType}
      />
    </DashboardLayout>
  );
}