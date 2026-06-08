"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import StudentChart from "@/components/Students/StudentChart";
import MediaUploadProgress from "@/components/Moderations/MediaUploadProgress";
import StudentAssessmentResults from "@/components/Moderations/StudentAssessmentResults";
import InsightsModal from "@/components/Moderations/InsightsModal";
import DashboardLayout from "@/app/dashboard/[organizationId]/DashboardLayout";
import { db } from "@/firebase/config";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import {
  ArrowLeft,
  User,
  CheckCircle,
  Lightbulb,
  AlertTriangle,
  Loader2,
  Clock,
  ShieldCheck,
  MessageSquare,
  X,
  Trash2,
  Edit2,
} from "lucide-react";

export default function StudentDetailsPage() {
  const { organizationId, assessmentId, studentId } = useParams();
  const { user: currentUser } = useSelector((state) => state.auth);
  const userRole = currentUser?.role;

  const [student, setStudent] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [instructorName, setInstructorName] = useState(null);
  const [instructorComment, setInstructorComment] = useState(null);
  const [showAssessedBy, setShowAssessedBy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(null);
  const [isFlaggingComplete, setIsFlaggingComplete] = useState(false);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [hasResults, setHasResults] = useState(false);
  const [hasAnswers, setHasAnswers] = useState(false);

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({ first_name: "", last_name: "" });

  const router = useRouter();

  // Called by StudentAssessmentResults once autoFlagAll finishes
  const handleFlaggingComplete = useCallback(async () => {
    try {
      const resultRef = doc(
        db,
        "assessments",
        assessmentId,
        "assessments-results",
        `${assessmentId}_${studentId}`
      );
      const resultSnap = await getDoc(resultRef);

      if (resultSnap.exists()) {
        const data = resultSnap.data();
        const readingItems = data?.literacy_results?.reading_results || [];
        const numeracyItems = Object.values(data?.numeracy_results || {}).flat();
        const count = [...readingItems, ...numeracyItems].filter(
          (item) => item?.flagged === true
        ).length;
        setFlaggedCount(count);
      }
    } catch (err) {
      console.error("Error reading flagged count after flagging:", err);
    } finally {
      setIsFlaggingComplete(true);
    }
  }, [assessmentId, studentId]);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const assessmentRef = doc(db, "assessments", assessmentId);
        const assessmentSnap = await getDoc(assessmentRef);
        if (!assessmentSnap.exists()) throw new Error("Assessment not found");

        const assessmentData = assessmentSnap.data();
        setAssessment(assessmentData);

        const resultId = `${assessmentId}_${studentId}`;
        const resultRef = doc(
          db,
          "assessments",
          assessmentId,
          "assessments-results",
          resultId
        );
        const resultSnap = await getDoc(resultRef);

        const resultsExist = resultSnap.exists();
        setHasResults(resultsExist);

        if (resultsExist) {
          const resultData = resultSnap.data();
          const instructorId = resultData.instructor_id;

          setIsVerified(resultData.is_verified || false);

          if (resultData.instructor_comment) {
            setInstructorComment(resultData.instructor_comment);
          }

          if (resultData.duration_millis) {
            setDurationMinutes(Math.round(resultData.duration_millis / 60000));
          }

          if (instructorId) {
            try {
              const userRef = doc(db, "user", instructorId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const userData = userSnap.data();
                setInstructorName(
                  userData.name || userData.email || "Unknown Instructor"
                );
                setShowAssessedBy(true);
              }
            } catch (instructorErr) {
              console.error("Error fetching instructor:", instructorErr);
            }
          }
        }

        const assignedStudents = assessmentData.assigned_students || [];
        const foundStudent = assignedStudents.find((s) => s.id === studentId);
        if (!foundStudent) throw new Error("Student not found in assessment");

        setStudent({
          id: foundStudent.id,
          first_name: foundStudent.first_name,
          last_name: foundStudent.last_name,
          grade: foundStudent.grade,
          sex: foundStudent.sex,
          baseline: foundStudent.baseline,
          has_done: foundStudent.has_done,
          group: foundStudent.group,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (organizationId && assessmentId && studentId) fetchData();
  }, [organizationId, assessmentId, studentId]);

  // Confirm results function
  const handleConfirmResults = async () => {
    try {
      setVerifying(true);

      const resultId = `${assessmentId}_${studentId}`;
      const resultRef = doc(
        db,
        "assessments",
        assessmentId,
        "assessments-results",
        resultId
      );

      await updateDoc(resultRef, {
        is_verified: true,
        verified_at: new Date().toISOString(),
        verified_by: instructorName || "Teacher",
      });

      setIsVerified(true);
      setError(null);
      setShowConfirmModal(false);
    } catch (err) {
      console.error("Error confirming results:", err);
      setError("Failed to confirm results. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirmClick = () => {
    setShowConfirmModal(true);
  };

  const handleGoToModeration = () => {
    setShowConfirmModal(false);
    const flaggedSection = document.getElementById("flagged-items-section");
    if (flaggedSection) {
      flaggedSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Edit student (super admin only)
  const handleEditStudent = async () => {
    if (userRole !== "super_admin") {
      setError("You don't have permission to edit students.");
      return;
    }
    try {
      setEditing(true);

      const assessmentRef = doc(db, "assessments", assessmentId);
      const assessmentSnap = await getDoc(assessmentRef);
      if (!assessmentSnap.exists()) throw new Error("Assessment not found");

      const currentStudents = assessmentSnap.data().assigned_students || [];
      const updatedStudents = currentStudents.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            first_name: editFormData.first_name.trim(),
            last_name: editFormData.last_name.trim(),
            name: `${editFormData.first_name.trim()} ${editFormData.last_name.trim()}`,
          };
        }
        return s;
      });

      await updateDoc(assessmentRef, { assigned_students: updatedStudents });

      // Update local state
      setStudent((prev) => ({
        ...prev,
        first_name: editFormData.first_name.trim(),
        last_name: editFormData.last_name.trim(),
      }));

      setShowEditModal(false);
      setError(null);
    } catch (err) {
      console.error("Error editing student:", err);
      setError("Failed to edit student. Please try again.");
    } finally {
      setEditing(false);
    }
  };

  const openEditModal = () => {
    setEditFormData({
      first_name: student.first_name,
      last_name: student.last_name,
    });
    setShowEditModal(true);
  };

  // Delete student (super admin only)
  const handleDeleteStudent = async () => {
    if (userRole !== "super_admin") {
      setError("You don't have permission to delete students.");
      return;
    }
    try {
      setDeleting(true);

      const assessmentRef = doc(db, "assessments", assessmentId);
      const assessmentSnap = await getDoc(assessmentRef);
      if (!assessmentSnap.exists()) throw new Error("Assessment not found");

      const currentStudents = assessmentSnap.data().assigned_students || [];
      const updatedStudents = currentStudents.filter((s) => s.id !== studentId);

      await updateDoc(assessmentRef, { assigned_students: updatedStudents });

      const resultId = `${assessmentId}_${studentId}`;
      const resultRef = doc(
        db,
        "assessments",
        assessmentId,
        "assessments-results",
        resultId
      );
      const resultSnap = await getDoc(resultRef);
      if (resultSnap.exists()) {
        await deleteDoc(resultRef);
      }

      router.push(`/dashboard/${organizationId}/moderations/${assessmentId}`);
    } catch (err) {
      console.error("Error deleting student:", err);
      setError("Failed to delete student. Please try again.");
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  // View insights
  const handleViewInsights = async () => {
    try {
      setLoadingInsights(true);
      setShowInsightsModal(true);

      const insightsRef = doc(
        db,
        "assessments",
        assessmentId,
        "assessments-results",
        `${assessmentId}_${studentId}`,
        "recommendations",
        "latest"
      );
      const insightsSnap = await getDoc(insightsRef);

      setInsights(
        insightsSnap.exists()
          ? insightsSnap.data()
          : { error: "No insights available for this student yet." }
      );
    } catch (err) {
      console.error("Error fetching insights:", err);
      setInsights({ error: "Failed to load insights. Please try again." });
    } finally {
      setLoadingInsights(false);
    }
  };

  // Download helpers
  const downloadInsightsAsPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to download the insights");
      return;
    }

    const studentName = `${student?.first_name || ""} ${
      student?.last_name || ""
    }`.trim();
    const assessmentTypeFormatted =
      assessment?.type?.charAt(0).toUpperCase() +
        assessment?.type?.slice(1) || "Literacy";

    printWindow.document.write(`
      <html>
        <head>
          <title>${studentName} - Assessment Insights</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #142848; border-bottom: 2px solid #f7cc1c; padding-bottom: 10px; }
            h2 { color: #5aa2ce; margin-top: 30px; }
            .section { margin-bottom: 25px; }
            ul { margin-top: 5px; }
            li { margin-bottom: 8px; line-height: 1.5; }
            .grade-context { background-color: #e3e6eb; padding: 15px; border-radius: 8px; font-style: italic; color: #142848; }
            .score-card { background: linear-gradient(135deg, #142848 0%, #5aa2ce 100%); color: white; padding: 20px; border-radius: 10px; margin: 20px 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
            .score-item { text-align: center; }
            .score-value { font-size: 24px; font-weight: bold; display: block; }
            .score-label { font-size: 14px; opacity: 0.9; }
            .instructor-comment { background-color: #e3e6eb; border-left: 4px solid #e67e22; padding: 15px; margin: 20px 0; border-radius: 4px; color: #142848; }
            .instructor-comment strong { color: #e67e22; }
            .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Assessment Insights: ${studentName}</h1>
          <p><strong>Assessment:</strong> ${assessmentTypeFormatted}</p>
          <p><strong>Grade:</strong> ${student?.grade || "N/A"}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Time taken:</strong> ${
            durationMinutes
              ? `${durationMinutes} minute${durationMinutes !== 1 ? "s" : ""}`
              : "N/A"
          }</p>
          ${
            instructorComment
              ? `
            <div class="instructor-comment">
              <strong>Instructor Note:</strong> "${instructorComment}"
            </div>
          `
              : ""
          }
          ${
            insights?.insights
              ? `
            ${
              insights.scores
                ? `
              <div class="score-card">
                ${insights.scores.letters ? `<div class="score-item"><span class="score-value">${insights.scores.letters.passed}/${insights.scores.letters.total}</span><span class="score-label">Letters</span></div>` : ""}
                ${insights.scores.words ? `<div class="score-item"><span class="score-value">${insights.scores.words.passed}/${insights.scores.words.total}</span><span class="score-label">Words</span></div>` : ""}
                ${insights.scores.fluency ? `<div class="score-item"><span class="score-value">${insights.scores.fluency.passed}/${insights.scores.fluency.total}</span><span class="score-label">Fluency</span></div>` : ""}
                ${insights.scores.comprehension ? `<div class="score-item"><span class="score-value">${insights.scores.comprehension.passed}/${insights.scores.comprehension.total}</span><span class="score-label">Comprehension</span></div>` : ""}
              </div>
            `
                : ""
            }
            ${
              insights.insights.grade_context
                ? `<div class="section"><h2>Overall Assessment</h2><div class="grade-context">${insights.insights.grade_context}</div></div>`
                : ""
            }
            ${
              insights.insights.strengths?.length > 0
                ? `<div class="section"><h2>Strengths</h2><ul>${insights.insights.strengths
                    .map((s) => `<li>${s}</li>`)
                    .join("")}</ul></div>`
                : ""
            }
            ${
              insights.insights.gaps?.length > 0
                ? `<div class="section"><h2>Areas for Improvement</h2><ul>${insights.insights.gaps
                    .map((g) => `<li>${g}</li>`)
                    .join("")}</ul></div>`
                : ""
            }
            ${
              insights.insights.teaching_actions?.length > 0
                ? `<div class="section"><h2>Recommended Teaching Actions</h2><ul>${insights.insights.teaching_actions
                    .map((a) => `<li>${a}</li>`)
                    .join("")}</ul></div>`
                : ""
            }
          `
              : insights?.error
              ? `<p style="color: #e67e22;">${insights.error}</p>`
              : ""
          }
          <div class="footer">Generated from Assessment Platform • ${new Date().toLocaleString()}</div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const downloadInsightsAsText = () => {
    const studentName = `${student?.first_name || ""} ${
      student?.last_name || ""
    }`.trim();
    const assessmentTypeFormatted =
      assessment?.type?.charAt(0).toUpperCase() +
        assessment?.type?.slice(1) || "Literacy";

    let content = `ASSESSMENT INSIGHTS: ${studentName}\n`;
    content += `Assessment: ${assessmentTypeFormatted}\n`;
    content += `Grade: ${student?.grade || "N/A"}\n`;
    content += `Time taken: ${
      durationMinutes
        ? `${durationMinutes} minute${durationMinutes !== 1 ? "s" : ""}`
        : "N/A"
    }\n`;
    if (instructorComment) {
      content += `Instructor Note: "${instructorComment}"\n`;
    }
    content += `Date: ${new Date().toLocaleDateString()}\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `========================================\n\n`;

    if (insights?.scores) {
      content += `SCORE OVERVIEW:\n`;
      if (insights.scores.letters)
        content += `- Letters: ${insights.scores.letters.passed}/${insights.scores.letters.total}\n`;
      if (insights.scores.words)
        content += `- Words: ${insights.scores.words.passed}/${insights.scores.words.total}\n`;
      if (insights.scores.fluency)
        content += `- Fluency: ${insights.scores.fluency.passed}/${insights.scores.fluency.total}\n`;
      if (insights.scores.comprehension)
        content += `- Comprehension: ${insights.scores.comprehension.passed}/${insights.scores.comprehension.total}\n`;
      content += `\n`;
    }

    if (insights?.insights) {
      if (insights.insights.grade_context) {
        content += `OVERALL ASSESSMENT:\n${insights.insights.grade_context}\n\n`;
      }
      if (insights.insights.strengths?.length > 0) {
        content += `STRENGTHS:\n`;
        insights.insights.strengths.forEach((s) => (content += `- ${s}\n`));
        content += `\n`;
      }
      if (insights.insights.gaps?.length > 0) {
        content += `AREAS FOR IMPROVEMENT:\n`;
        insights.insights.gaps.forEach((g) => (content += `- ${g}\n`));
        content += `\n`;
      }
      if (insights.insights.teaching_actions?.length > 0) {
        content += `RECOMMENDED TEACHING ACTIONS:\n`;
        insights.insights.teaching_actions.forEach(
          (a) => (content += `- ${a}\n`)
        );
        content += `\n`;
      }
    } else if (insights?.error) {
      content += `ERROR: ${insights.error}\n`;
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${studentName.replace(/\s+/g, "_")}_insights_${new Date()
      .toISOString()
      .split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Render guards
  if (loading) {
    return (
      <DashboardLayout
        title="Student Details"
        organizationId={organizationId}
        currentSection="assessments"
      >
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-foreground">Loading student data...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !student) {
    return (
      <DashboardLayout
        title="Student Details"
        organizationId={organizationId}
        currentSection="assessments"
      >
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-red-400">Error: {error}</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!student || !assessment) {
    return (
      <DashboardLayout
        title="Student Details"
        organizationId={organizationId}
        currentSection="assessments"
      >
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-foreground">Data not found</div>
        </div>
      </DashboardLayout>
    );
  }

  // Derived UI state
  const pageTitle = `${student.first_name} ${student.last_name}`;
  const assessmentType = assessment.type?.toLowerCase() || "literacy";
  const baseline = student?.baseline || "";
  const backUrl = `/dashboard/${organizationId}/moderations/${assessmentId}`;
  const hasPendingFlags = flaggedCount > 0;

  const isConfirmDisabled =
    verifying || !isFlaggingComplete || !hasResults || !hasAnswers;
  const showConfirmButton = hasResults && !isVerified;
  const showInsightsButton = hasResults && isVerified;

  const buttonContent = () => {
    if (verifying) {
      return (
        <>
          <Loader2 size={20} className="animate-spin" /> Confirming…
        </>
      );
    }
    if (!isFlaggingComplete) {
      return (
        <>
          <Loader2 size={20} className="animate-spin" /> Checking…
        </>
      );
    }
    return (
      <>
        <ShieldCheck size={20} /> Confirm Results
      </>
    );
  };

  const getStatusMessage = () => {
    if (hasPendingFlags) {
      return `${flaggedCount} flagged item${
        flaggedCount > 1 ? "s" : ""
      } need${flaggedCount === 1 ? "s" : ""} review`;
    }
    if (!hasAnswers) {
      return "Student has not answered any questions yet";
    }
    return "Student has not done the assessment/data has not uploaded yet";
  };

  return (
    <DashboardLayout
      title={pageTitle}
      organizationId={organizationId}
      currentSection="assessments"
    >
      <div className="h-full overflow-auto">
        <div className="p-6 space-y-6">
          {/* Student Header */}
          <div className="bg-background-light rounded-2xl shadow-lg p-6 border border-gray-600">
            <div
              onClick={() => router.push(backUrl)}
              className="flex items-center text-gray-300 hover:text-white cursor-pointer w-fit mb-4"
            >
              <ArrowLeft size={18} className="mr-1" />
              <span className="text-sm font-medium">Back</span>
            </div>

            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {student.first_name} {student.last_name}
                </h1>

                {isVerified && (
                  <h2 className="text-lg text-gray-300 mt-1 font-medium">
                    Baseline: {baseline || "Not assessed"}
                  </h2>
                )}

                {showAssessedBy && instructorName && (
                  <div className="mt-3 flex items-center gap-2 text-gray-300">
                    <User size={16} className="text-gray-400" />
                    <span className="text-sm">
                      <span className="font-medium">Assessed by:</span>{" "}
                      {instructorName}
                    </span>
                  </div>
                )}

                {instructorComment && (
                  <div
                    className="mt-3 flex items-start gap-2 rounded-lg p-3 max-w-lg"
                    style={{
                      backgroundColor: "rgba(230, 126, 34, 0.1)",
                      borderColor: "rgba(230, 126, 34, 0.3)",
                      borderWidth: "1px",
                      borderStyle: "solid",
                    }}
                  >
                    <MessageSquare
                      size={16}
                      className="shrink-0 mt-0.5"
                      style={{ color: "#e67e22" }}
                    />
                    <span className="text-sm">
                      <span className="font-medium" style={{ color: "#e67e22" }}>
                        Instructor note:
                      </span>
                      <span className="text-gray-300"> "{instructorComment}"</span>
                    </span>
                  </div>
                )}

                {isVerified && (
                  <div className="mt-2 flex items-center gap-2" style={{ color: "#4caf50" }}>
                    <CheckCircle size={16} />
                    <span className="text-sm font-medium">Results Verified</span>
                  </div>
                )}

                {durationMinutes && (
                  <div className="mt-2 flex items-center gap-2" style={{ color: "#5aa2ce" }}>
                    <Clock size={16} />
                    <span className="text-sm">
                      <span className="font-medium">Time taken:</span>{" "}
                      {durationMinutes} minute{durationMinutes !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className="inline-block text-white px-3 py-1 rounded-full text-sm font-medium"
                    style={{ backgroundColor: "#5aa2ce" }}
                  >
                    {assessmentType.charAt(0).toUpperCase() +
                      assessmentType.slice(1)}{" "}
                    Assessment
                  </span>
                  {student.grade && (
                    <span
                      className="inline-block text-white px-3 py-1 rounded-full text-sm font-medium"
                      style={{ backgroundColor: "rgba(76, 175, 80, 0.8)" }}
                    >
                      Grade {student.grade}
                    </span>
                  )}
                  {student.sex && (
                    <span
                      className="inline-block text-white px-3 py-1 rounded-full text-sm font-medium capitalize"
                      style={{ backgroundColor: "rgba(230, 126, 34, 0.8)" }}
                    >
                      {student.sex}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Area */}
              <div className="flex flex-col items-end gap-3">
                {userRole === "super_admin" && (
                  <>
                    <button
                      onClick={openEditModal}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Edit2 size={18} />
                      Edit Student
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 size={18} />
                      Delete Student
                    </button>
                  </>
                )}

                {showConfirmButton && (
                  <>
                    {(hasPendingFlags || !hasAnswers) && isFlaggingComplete && (
                      <div
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm max-w-[280px]"
                        style={{
                          color: "#e67e22",
                          backgroundColor: "rgba(230, 126, 34, 0.1)",
                          borderColor: "rgba(230, 126, 34, 0.3)",
                          borderWidth: "1px",
                          borderStyle: "solid",
                        }}
                      >
                        <AlertTriangle size={15} className="shrink-0" />
                        <span>{getStatusMessage()}</span>
                      </div>
                    )}

                    <button
                      onClick={handleConfirmClick}
                      disabled={isConfirmDisabled}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                        isConfirmDisabled
                          ? "bg-gray-600 text-gray-400 cursor-not-allowed opacity-60"
                          : "hover:opacity-90 text-white"
                      }`}
                      style={!isConfirmDisabled ? { backgroundColor: "#4caf50" } : {}}
                    >
                      {buttonContent()}
                    </button>

                    {error && (
                      <p
                        className="text-xs text-right max-w-[220px]"
                        style={{ color: "#e67e22" }}
                      >
                        {error}
                      </p>
                    )}
                  </>
                )}

                {showInsightsButton && (
                  <button
                    onClick={handleViewInsights}
                    className="flex items-center gap-2 text-white px-6 py-3 rounded-xl font-medium transition-colors hover:opacity-90"
                    style={{ backgroundColor: "#5aa2ce" }}
                  >
                    <Lightbulb size={20} />
                    View Insights
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RESULTS SECTION */}
          {hasResults && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-background-light rounded-2xl shadow-lg p-6 border border-gray-600">
                  <h2 className="text-xl font-semibold mb-4 text-foreground">
                    Baseline Progress —{" "}
                    {assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)}
                  </h2>
                  <StudentChart
                    baseline={baseline}
                    assessmentType={assessmentType}
                    calculationType={assessment?.calculation_type || ""}
                    isVerified={isVerified}
                  />
                </div>

                <div className="bg-background-light rounded-2xl shadow-lg p-6 border border-gray-600">
                  <MediaUploadProgress
                    assessmentId={assessmentId}
                    studentId={studentId}
                  />
                </div>
              </div>

              <div
                id="flagged-items-section"
                className="bg-background-light rounded-2xl shadow-lg p-6 border border-gray-600"
              >
                <StudentAssessmentResults
                  assessmentId={assessmentId}
                  studentId={studentId}
                  organizationId={organizationId}
                  assessmentType={assessmentType}
                  onFlaggingComplete={handleFlaggingComplete}
                  onHasAnswersChange={setHasAnswers}
                />
              </div>
            </>
          )}

          {/* No Results Placeholder */}
          {!hasResults && (
            <div className="bg-background-light rounded-2xl shadow-lg p-6 border border-gray-600 text-center">
              <div className="flex flex-col items-center gap-3 py-8">
                <AlertTriangle size={48} className="text-gray-500" />
                <p className="text-gray-400">No assessment results available</p>
                <p className="text-sm text-gray-500">
                  This student hasn't completed the assessment yet
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && userRole === "super_admin" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-background-light rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-600">
            <div className="flex justify-between items-center p-6 border-b border-gray-600">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Edit2 size={24} className="text-blue-500" />
                Edit Student Name
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={editFormData.first_name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, first_name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-gray-600 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary-2"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={editFormData.last_name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, last_name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-gray-600 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary-2"
                  placeholder="Last name"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditStudent}
                  disabled={
                    editing ||
                    !editFormData.first_name.trim() ||
                    !editFormData.last_name.trim()
                  }
                  className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editing ? (
                    <>
                      <Loader2 size={18} className="animate-spin inline mr-2" /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Results Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-background-light rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-600">
            <div className="flex justify-between items-center p-6 border-b border-gray-600">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle size={24} className="text-yellow-500" />
                Confirm Results
              </h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {hasPendingFlags ? (
                <>
                  <p className="text-foreground">
                    There {flaggedCount === 1 ? "is" : "are"}{" "}
                    <span className="font-bold text-yellow-500">{flaggedCount}</span> flagged
                    item{flaggedCount > 1 ? "s" : ""} that{" "}
                    {flaggedCount === 1 ? "requires" : "require"} review.
                  </p>
                  <p className="text-gray-300">
                    Confirming results now will mark this assessment as verified despite the
                    flagged items.
                  </p>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-sm text-yellow-400">
                      <strong>Recommendation:</strong> Review and address flagged items before
                      confirming for best assessment accuracy.
                    </p>
                  </div>
                </>
              ) : !hasAnswers ? (
                <>
                  <p className="text-foreground">
                    This student hasn't answered any questions yet.
                  </p>
                  <p className="text-gray-300">
                    Confirming results now will mark this assessment as verified with no
                    answers recorded.
                  </p>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-sm text-yellow-400">
                      <strong>Note:</strong> No answers have been submitted for this
                      assessment.
                    </p>
                  </div>
                </>
              ) : null}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleGoToModeration}
                  className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Go to Moderation
                </button>
                <button
                  onClick={handleConfirmResults}
                  disabled={verifying}
                  className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? (
                    <>
                      <Loader2 size={18} className="animate-spin inline mr-2" /> Confirming...
                    </>
                  ) : (
                    "Confirm Anyway"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userRole === "super_admin" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-background-light rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-600">
            <div className="flex justify-between items-center p-6 border-b border-gray-600">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Trash2 size={24} className="text-red-500" />
                Delete Student
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-foreground">
                Are you sure you want to remove{" "}
                <strong>
                  {student.first_name} {student.last_name}
                </strong>{" "}
                from this assessment?
              </p>
              <p className="text-gray-300">
                This will permanently delete the student's assessment data and remove them
                from the assigned students list. This action cannot be undone.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStudent}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={18} className="animate-spin inline mr-2" /> Deleting...
                    </>
                  ) : (
                    "Yes, Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <InsightsModal
        isOpen={showInsightsModal}
        onClose={() => setShowInsightsModal(false)}
        insights={insights}
        loading={loadingInsights}
        student={student}
        assessment={assessment}
        onDownloadPDF={downloadInsightsAsPDF}
        onDownloadText={downloadInsightsAsText}
      />
    </DashboardLayout>
  );
}