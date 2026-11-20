"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { getAuth } from "firebase/auth";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import {
  ArrowLeft,
  RotateCw,
  Loader2,
  Clock,
  FileText,
  Download,
  UploadCloud,
  CheckCircle2,
  X,
  AlertTriangle,
} from "lucide-react";
import { exportAssessmentData } from "@/utils/exportAssessmentData";
import { determinePassedFromTranscript } from "@/utils/transcriptionUtils";
import * as XLSX from "xlsx";

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
  const [isRetranscribing, setIsRetranscribing] = useState(false);
  const [retranscribeProgress, setRetranscribeProgress] = useState({ done: 0, total: 0 });
  const [retranscribeMessage, setRetranscribeMessage] = useState(null);
  const [missingTranscriptCount, setMissingTranscriptCount] = useState(null);
  const [isDownloadingTranscripts, setIsDownloadingTranscripts] = useState(false);

  // Group-name modal state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupInput, setGroupInput] = useState("");

  const backUrl = `/dashboard/${organizationId}/moderations`;
  const assessmentTypeRaw = assessment?.type || "literacy";
  const assessmentType =
    assessmentTypeRaw.toLowerCase() === "numeracy" ? "numeracy" : "literacy";

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

  const fetchAssessmentResults = useCallback(async () => {
    const resultsSnapshot = await getDocs(
      collection(db, "assessments", assessmentId, "assessments-results")
    );
    return resultsSnapshot.docs.map((resultDoc) => ({
      id: resultDoc.id,
      ref: resultDoc.ref,
      data: resultDoc.data(),
    }));
  }, [assessmentId]);

  useEffect(() => {
    if (!isSuperAdmin || assessmentType !== "literacy" || !assessment) return;

    let cancelled = false;
    const loadMissingTranscriptCount = async () => {
      try {
        const resultDocs = await fetchAssessmentResults();
        const count = resultDocs.reduce((total, { data }) => {
          const readingResults = data?.literacy_results?.reading_results || [];
          return (
            total +
            readingResults.filter((item) => {
              const transcript = item?.metadata?.transcript;
              return (
                !!item?.metadata?.audio_url &&
                !(typeof transcript === "string" && transcript.trim())
              );
            }).length
          );
        }, 0);
        if (!cancelled) setMissingTranscriptCount(count);
      } catch (err) {
        console.error("Failed to count missing assessment transcripts:", err);
        if (!cancelled) {
          setRetranscribeMessage({
            type: "error",
            text: `Failed to check missing transcripts: ${err.message}`,
          });
        }
      }
    };

    loadMissingTranscriptCount();
    return () => {
      cancelled = true;
    };
  }, [assessment, assessmentId, assessmentType, fetchAssessmentResults, isSuperAdmin]);

  const handleRetranscribeAssessment = async () => {
    if (!isSuperAdmin || isRetranscribing || assessmentType !== "literacy") return;

    setIsRetranscribing(true);
    setRetranscribeMessage(null);

    try {
      const resultDocs = await fetchAssessmentResults();
      const targets = resultDocs.flatMap(({ id, data }) => {
        const readingResults = data?.literacy_results?.reading_results || [];
        const studentId = data?.student_id || id.slice(`${assessmentId}_`.length);

        return readingResults
          .map((item, globalIndex) => ({ id, studentId, item, globalIndex }))
          .filter(({ item }) => {
            const transcript = item?.metadata?.transcript;
            return (
              !!item?.metadata?.audio_url &&
              !(typeof transcript === "string" && transcript.trim())
            );
          });
      });

      if (targets.length === 0) {
        setMissingTranscriptCount(0);
        setRetranscribeMessage({
          type: "success",
          text: "All items with audio already have a transcript.",
        });
        return;
      }

      setRetranscribeProgress({ done: 0, total: targets.length });
      const auth = getAuth();
      const currentAuthUser = auth.currentUser;
      if (!currentAuthUser) throw new Error("You must be signed in to retranscribe.");
      const token = await currentAuthUser.getIdToken();
      const retranscribedBy =
        currentUser?.name ||
        currentUser?.displayName ||
        currentUser?.email ||
        currentAuthUser.displayName ||
        currentAuthUser.email ||
        currentAuthUser.uid;
      const resultsById = new Map(resultDocs.map((result) => [result.id, result]));
      const failures = [];
      let successCount = 0;
      let gradedPassed = 0;
      let gradedFailed = 0;

      for (let i = 0; i < targets.length; i++) {
        const { id, studentId, item, globalIndex } = targets[i];
        setRetranscribeProgress({ done: i, total: targets.length });

        try {
          const response = await fetch("/api/retranscription", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              assessmentId,
              studentId,
              globalIndex,
              language: assessment?.language || "english",
            }),
          });
          const rawText = await response.text();
          let responseData;
          try {
            responseData = rawText ? JSON.parse(rawText) : {};
          } catch {
            throw new Error(
              response.status === 504
                ? "Timed out — model may be slow right now"
                : `HTTP ${response.status}`
            );
          }
          if (!response.ok) {
            throw new Error(responseData.error || `HTTP ${response.status}`);
          }
          if (!responseData.transcript) throw new Error("No transcript returned");

          const itemType = (item?.metadata?.type || item?.type || "").toLowerCase();
          const passed = determinePassedFromTranscript(
            itemType,
            item?.content,
            responseData.transcript
          );
          const retranscribedAt =
            responseData.retranscribedAt || new Date().toISOString();
          if (passed === true) gradedPassed++;
          if (passed === false) gradedFailed++;

          const result = resultsById.get(id);
          const updatedReadingResults = [
            ...(result.data.literacy_results?.reading_results || []),
          ];
          updatedReadingResults[globalIndex] = {
            ...updatedReadingResults[globalIndex],
            metadata: {
              ...updatedReadingResults[globalIndex].metadata,
              transcript: responseData.transcript,
              retranscribed_by: retranscribedBy,
              retranscribed_by_uid:
                responseData.retranscribedBy || currentAuthUser.uid,
              retranscribed_at: retranscribedAt,
              transcription_confidence: responseData.confidence ?? null,
              transcription_low_confidence:
                responseData.low_confidence ?? null,
              transcription_chunks: Array.isArray(responseData.chunks)
                ? responseData.chunks
                : [],
              transcription_stats: responseData.stats ?? null,
              transcription_model_id: responseData.model_id ?? null,
              ...(passed !== undefined ? { passed } : {}),
            },
          };
          await updateDoc(result.ref, {
            "literacy_results.reading_results": updatedReadingResults,
          });
          result.data = {
            ...result.data,
            literacy_results: {
              ...result.data.literacy_results,
              reading_results: updatedReadingResults,
            },
          };
          successCount++;
        } catch (err) {
          console.error(`Retranscription failed for reading_results[${globalIndex}]:`, err);
          failures.push({
            student: assessment?.assigned_students?.find((student) => student.id === studentId)?.name || studentId,
            item: item?.content || `Item #${globalIndex + 1}`,
            error: err.message,
          });
        }
      }

      setRetranscribeMessage({
        type: failures.length > 0 ? "error" : "success",
        text: `Done: ${successCount} succeeded${failures.length ? `, ${failures.length} failed` : ""}. Auto-graded letters/words: ${gradedPassed} passed, ${gradedFailed} failed.`,
        failures,
      });
      setMissingTranscriptCount(failures.length);
    } catch (err) {
      console.error("Assessment retranscription failed:", err);
      setRetranscribeMessage({ type: "error", text: err.message || "Failed to retranscribe assessment." });
    } finally {
      setRetranscribeProgress((progress) => ({ ...progress, done: progress.total }));
      setIsRetranscribing(false);
    }
  };

  const handleDownloadTranscriptReport = async () => {
    if (isDownloadingTranscripts) return;
    setIsDownloadingTranscripts(true);

    try {
      const resultDocs = await fetchAssessmentResults();
      const studentsById = new Map(
        (assessment?.assigned_students || []).map((student) => [student.id, student])
      );
      const rows = resultDocs.flatMap(({ id, data }) => {
        const studentId = data?.student_id || id.slice(`${assessmentId}_`.length);
        const student = studentsById.get(studentId);
        const readingResults = data?.literacy_results?.reading_results || [];

        return readingResults.map((item, index) => {
          const transcript =
            typeof item?.metadata?.transcript === "string"
              ? item.metadata.transcript
              : "";
          const hasAudio = !!item?.metadata?.audio_url;
          return {
            "Student name":
              student?.name ||
              data?.student_name ||
              `${student?.first_name || data?.student_first_name || ""} ${student?.last_name || data?.student_last_name || ""}`.trim(),
            "Student ID": studentId,
            Grade: student?.grade ?? data?.student_grade ?? "",
            "Item number": index + 1,
            "Item type": item?.metadata?.type || item?.type || "",
            "Target text": item?.content || "",
            Transcript: transcript,
            "Transcript status": transcript.trim()
              ? "Available"
              : hasAudio
              ? "Missing"
              : "No audio",
            "Has audio": hasAudio ? "Yes" : "No",
            "Audio URL": item?.metadata?.audio_url || "",
            "Moderated": item?.metadata?.modeltranscriptionverified ? "Yes" : "No",
            "Passed": typeof item?.metadata?.passed === "boolean" ? (item.metadata.passed ? "Yes" : "No") : "",
            "Retranscribed by": item?.metadata?.retranscribed_by || "",
            "Retranscribed by user ID": item?.metadata?.retranscribed_by_uid || "",
            "Retranscribed at": item?.metadata?.retranscribed_at || "",
            "Confidence": item?.metadata?.transcription_confidence ?? "",
            "Low confidence": item?.metadata?.transcription_low_confidence ?? "",
            "Model ID": item?.metadata?.transcription_model_id || "",
            "Audio duration (seconds)":
              item?.metadata?.transcription_stats?.audio_duration_seconds ?? "",
            "Inference time (seconds)":
              item?.metadata?.transcription_stats?.inference_time_seconds ?? "",
            "Real-time factor":
              item?.metadata?.transcription_stats?.real_time_factor ?? "",
            "Transcript chunks": JSON.stringify(
              item?.metadata?.transcription_chunks || []
            ),
            "Transcription stats": JSON.stringify(
              item?.metadata?.transcription_stats || {}
            ),
          };
        });
      });

      const columns = [
        "Student name",
        "Student ID",
        "Grade",
        "Item number",
        "Item type",
        "Target text",
        "Transcript",
        "Transcript status",
        "Has audio",
        "Audio URL",
        "Moderated",
        "Passed",
        "Retranscribed by",
        "Retranscribed by user ID",
        "Retranscribed at",
        "Confidence",
        "Low confidence",
        "Model ID",
        "Audio duration (seconds)",
        "Inference time (seconds)",
        "Real-time factor",
        "Transcript chunks",
        "Transcription stats",
      ];
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: columns });
      worksheet["!cols"] = [
        { wch: 24 }, { wch: 22 }, { wch: 10 }, { wch: 12 }, { wch: 18 },
        { wch: 28 }, { wch: 42 }, { wch: 20 }, { wch: 12 }, { wch: 48 },
        { wch: 12 }, { wch: 10 }, { wch: 24 }, { wch: 30 }, { wch: 26 },
        { wch: 14 }, { wch: 16 }, { wch: 32 }, { wch: 22 }, { wch: 22 },
        { wch: 18 }, { wch: 60 }, { wch: 60 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reading Transcripts");
      const filename = `${(assessment?.name || "assessment")
        .replace(/[^a-z0-9-_]+/gi, "_")
        .replace(/^_+|_+$/g, "")}_transcripts.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error("Transcript report download failed:", err);
      setRetranscribeMessage({
        type: "error",
        text: `Failed to download transcript report: ${err.message}`,
      });
    } finally {
      setIsDownloadingTranscripts(false);
    }
  };

  // Assessment type
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

        {isSuperAdmin && assessmentType === "literacy" && (
          <section className="bg-background-light rounded-2xl shadow-lg p-5 border border-gray-600">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Assessment transcripts
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Retranscribe all missing audio transcripts across this assessment, or download an Excel report of every reading item.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleRetranscribeAssessment}
                  disabled={
                    isRetranscribing ||
                    missingTranscriptCount === null ||
                    missingTranscriptCount === 0
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-primary-2/20 hover:bg-primary-2/30 border border-primary-2/40 text-primary-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRetranscribing ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <RotateCw size={17} />
                  )}
                  {isRetranscribing
                    ? `Retranscribing ${retranscribeProgress.done}/${retranscribeProgress.total}...`
                    : missingTranscriptCount === null
                    ? "Checking transcripts..."
                    : `Retranscribe Missing (${missingTranscriptCount})`}
                </button>
                <button
                  onClick={handleDownloadTranscriptReport}
                  disabled={isDownloadingTranscripts}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloadingTranscripts ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Download size={17} />
                  )}
                  {isDownloadingTranscripts ? "Preparing Excel..." : "Download Excel"}
                </button>
              </div>
            </div>

            {retranscribeMessage && (
              <div
                className={`mt-4 p-3 rounded-xl text-sm ${
                  retranscribeMessage.type === "success"
                    ? "bg-green-500/20 text-green-300 border border-green-500/30"
                    : "bg-red-500/20 text-red-300 border border-red-500/30"
                }`}
              >
                <p>{retranscribeMessage.text}</p>
                {retranscribeMessage.failures?.length > 0 && (
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {retranscribeMessage.failures.map((failure, index) => (
                      <li key={`${failure.student}-${failure.item}-${index}`}>
                        {failure.student} — {failure.item}: {failure.error}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        )}

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