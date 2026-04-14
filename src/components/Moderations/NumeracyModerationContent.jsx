// components/Moderations/NumeracyModerationContent.jsx
"use client";

import { useState, useEffect } from "react";
import { db, storage } from "@/firebase/config";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import NumeracyModerationView from "./NumeracyModerationView";
import NumeracyNavigationControls from "./NumeracyNavigationControls";
import { useNumeracyFlagReasons } from "@/hooks/useFlagReasons";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NumeracyModerationContent({
  router, searchParams, organizationId, assessmentId, studentId
}) {
  const [assessmentData, setAssessmentData]           = useState(null);
  const [studentName, setStudentName]                 = useState("Loading...");
  const [currentSection, setCurrentSection]           = useState("");
  const [currentIndex, setCurrentIndex]               = useState(0);
  const [editMode, setEditMode]                       = useState(false);
  const [editedTranscript, setEditedTranscript]       = useState("");
  const [studentIds, setStudentIds]                   = useState([]);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [loading, setLoading]                         = useState(true);
  const [error, setError]                             = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm]     = useState(false);
  const [savingFlagReasons, setSavingFlagReasons]     = useState(false);

  const backUrl = `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}`;
  const { incrementResolved } = useNumeracyFlagReasons(assessmentId, studentId);

  // ── URL param sync ────────────────────────────────────────────────────────
  useEffect(() => {
    const section = searchParams.get("section") || "";
    const index   = parseInt(searchParams.get("index") || "0", 10);
    setCurrentSection(section);
    setCurrentIndex(index);
  }, [searchParams]);

  // ── Data fetching ─────────────────────────────────────────────────────────
  useEffect(() => { fetchStudentName(); }, [assessmentId, studentId]);

  useEffect(() => {
    if (currentSection) fetchAssessmentData();
    fetchStudentIds();
  }, [assessmentId, studentId, currentSection, currentIndex]);

  const fetchStudentName = async () => {
    try {
      const snap = await getDoc(doc(db, "assessments", assessmentId));
      if (snap.exists()) {
        const student = (snap.data().assigned_students || []).find(s => s.id === studentId);
        setStudentName(student ? `${student.first_name} ${student.last_name}` : "Student Not Found");
      } else {
        setStudentName("Assessment Not Found");
      }
    } catch { setStudentName("Unknown Student"); }
  };

  const fetchAssessmentData = async () => {
    try {
      setLoading(true);
      const docRef  = doc(db, `assessments/${assessmentId}/assessments-results`, `${assessmentId}_${studentId}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAssessmentData(data);
        const results = data.numeracy_results?.[currentSection] || [];
        if (results[currentIndex]) {
          const result = results[currentIndex];
          setEditedTranscript(result.metadata?.transcript || result.student_answer || "");
        }
        setError(null);
      } else {
        setError("Assessment data not found");
      }
    } catch { setError("Failed to load assessment data"); }
    finally { setLoading(false); }
  };

  const fetchStudentIds = async () => {
    try {
      const snap = await getDocs(collection(db, `assessments/${assessmentId}/assessments-results`));
      const ids  = snap.docs.map(d => d.id.split("_")[1]);
      setStudentIds(ids);
      setCurrentStudentIndex(ids.indexOf(studentId));
    } catch { /* silent */ }
  };

  // ── Update result ─────────────────────────────────────────────────────────
  const updateNumeracyResult = async (updates) => {
    try {
      if (!assessmentData || !currentSection) return false;

      const freshIndex   = parseInt(searchParams.get("index") || "0", 10);
      const freshSection = searchParams.get("section") || currentSection;
      const docRef       = doc(db, `assessments/${assessmentId}/assessments-results`, `${assessmentId}_${studentId}`);
      const freshSnap    = await getDoc(docRef);
      if (!freshSnap.exists()) { setError("Document not found"); return false; }

      const freshData    = freshSnap.data();
      const freshResults = [...(freshData.numeracy_results?.[freshSection] || [])];
      if (!freshResults[freshIndex]) { setError("Result not found"); return false; }

      // Split top-level fields (like flagged) from the rest
      const { flagged, metadata: metadataUpdates, ...otherTopLevel } = updates;

      const updatedResult = {
        ...freshResults[freshIndex],
        ...otherTopLevel,
        ...(flagged !== undefined && { flagged }),
        metadata: {
          ...freshResults[freshIndex].metadata,
          ...(metadataUpdates || {}),
          moderation_timestamp: new Date().toISOString(),
        },
      };
      freshResults[freshIndex] = updatedResult;

      await updateDoc(docRef, { [`numeracy_results.${freshSection}`]: freshResults });

      // If this flagged item just got moderated → increment resolved counter
      const justModerated = metadataUpdates?.modeltranscriptionverified === true;
      if (justModerated && freshResults[freshIndex]?.flagged === false && freshData.numeracy_results?.[freshSection]?.[freshIndex]?.flagged === true) {
        await incrementResolved();
      }

      setAssessmentData(prev => ({
        ...prev,
        numeracy_results: { ...prev.numeracy_results, [freshSection]: freshResults },
      }));

      return true;
    } catch (err) {
      console.error("Error updating numeracy result:", err);
      setError("Failed to update result");
      return false;
    }
  };

  // ── Handle correct (sets passed: true only) ──
  const handleCorrect = async () => {
    await updateNumeracyResult({
      metadata: {
        passed: true,
        badaudio: false,
        moderation_decision: "approved",
      },
      ...(currentSection === "count_and_match" && { passed: true }),
      ...(currentSection === "highest_value" && { passed: true }),
    });
  };

  // ── Handle incorrect (sets passed: false only) ──
  const handleIncorrect = async () => {
    await updateNumeracyResult({
      metadata: {
        passed: false,
        moderation_decision: "rejected",
      },
      ...(currentSection === "count_and_match" && { passed: false }),
      ...(currentSection === "highest_value" && { passed: false }),
    });
  };

  // ── Handle save edit (NO modeltranscriptionverified) ──
  const handleSaveEdit = async () => {
    if (editedTranscript.trim() === "") {
      setError("Transcript cannot be empty");
      return;
    }
    await updateNumeracyResult({
      metadata: {
        transcript: editedTranscript,
        original_transcript: getCurrentResult()?.metadata?.transcript || getCurrentResult()?.student_answer || "",
      }
    });
    setEditMode(false);
    setError(null);
  };

  // ── Handle final confirmation (sets modeltranscriptionverified: true + flagged: false) ──
  const handleConfirmModeration = async () => {
    await updateNumeracyResult({
      flagged: false,
      metadata: {
        modeltranscriptionverified: true,
        moderated: true,
      }
    });
  };

  // ── Save flag reasons — now saves as comma-separated string in metadata ─
  const handleSaveFlagReasons = async (reasonType, newReasons, prevReasons) => {
    const currentResult = getCurrentResult();
    if (!currentResult) return;

    // Convert array to comma-separated string
    const flagReviewString = newReasons.join(', ');
    
    // Get existing flag review string from metadata
    const existingFlagReview = currentResult?.metadata?.flag_review || '';
    const existingReasonsArray = existingFlagReview ? existingFlagReview.split(',').map(r => r.trim()) : [];
    
    // Check if reasons actually changed
    const hasChanged = existingReasonsArray.length !== newReasons.length ||
      existingReasonsArray.some(r => !newReasons.includes(r)) ||
      newReasons.some(r => !existingReasonsArray.includes(r));
    
    if (!hasChanged) return;

    setSavingFlagReasons(true);
    try {
      // Save flag review to metadata
      await updateNumeracyResult({
        metadata: {
          flag_review: flagReviewString
        }
      });
      
      // Also increment resolved counter
      await incrementResolved();
      
    } catch (err) {
      console.error("Failed to save flag reasons:", err);
      setError("Failed to process flag reasons");
    } finally {
      setSavingFlagReasons(false);
    }
  };

  // ── Delete round ──────────────────────────────────────────────────────────
  const extractFilePathFromUrl = (url) => {
    try {
      const path  = decodeURIComponent(new URL(url).pathname);
      const match = path.match(/\/v0\/b\/[^/]+\/o\/(.+)/);
      return match?.[1] || null;
    } catch { return null; }
  };

  const deleteCurrentRound = async () => {
    try {
      if (!assessmentData?.numeracy_results?.[currentSection]) {
        setError("No assessment data found"); return;
      }
      const updatedResults = [...assessmentData.numeracy_results[currentSection]];
      const currentResult  = updatedResults[currentIndex];
      if (!currentResult) { setError("Result not found"); return; }

      const { audio_url, screenshot_url, workout_screenshot_url } = currentResult?.metadata || {};
      updatedResults.splice(currentIndex, 1);

      setAssessmentData({
        ...assessmentData,
        numeracy_results: { ...assessmentData.numeracy_results, [currentSection]: updatedResults },
      });

      const docRef = doc(db, `assessments/${assessmentId}/assessments-results`, `${assessmentId}_${studentId}`);
      await updateDoc(docRef, { [`numeracy_results.${currentSection}`]: updatedResults });

      const deletePromises = [];
      for (const url of [audio_url, screenshot_url, workout_screenshot_url]) {
        if (url?.includes("firebasestorage.googleapis.com")) {
          const fp = extractFilePathFromUrl(url);
          if (fp) deletePromises.push(deleteObject(ref(storage, fp)));
        }
      }
      if (deletePromises.length > 0) await Promise.allSettled(deletePromises);

      if (updatedResults.length === 0) {
        router.push(`/dashboard/${organizationId}/assessments/${assessmentId}/students/${studentId}/results`);
      } else if (currentIndex >= updatedResults.length) {
        const newIndex = updatedResults.length - 1;
        setCurrentIndex(newIndex);
        router.push(`/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/numeracymoderation?section=${currentSection}&index=${newIndex}`);
      } else {
        router.push(`/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/numeracymoderation?section=${currentSection}&index=${currentIndex}`);
      }

      setShowDeleteConfirm(false);
      setError(null);
    } catch (err) {
      console.error("❌ Error deleting round:", err);
      setError("Failed to delete round");
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isResultModerated = (result) =>
    result.metadata?.modeltranscriptionverified === true;

  const getNextUnmoderatedIndex = (results, startIndex = 0) => {
    if (!Array.isArray(results)) return -1;
    for (let i = startIndex; i < results.length; i++) {
      if (!isResultModerated(results[i])) return i;
    }
    return -1;
  };

  const areAllResultsModerated = (results) =>
    !Array.isArray(results) || results.every(r => isResultModerated(r));

  const getModerationStats = () => {
    if (!assessmentData?.numeracy_results) return { total: 0, moderated: 0, unmoderated: 0 };
    let total = 0, moderated = 0;
    Object.values(assessmentData.numeracy_results).forEach(section => {
      if (Array.isArray(section)) {
        section.forEach(item => { total++; if (isResultModerated(item)) moderated++; });
      }
    });
    return { total, moderated, unmoderated: total - moderated };
  };

  const getCurrentResults = () =>
    (!assessmentData || !currentSection) ? [] : (assessmentData.numeracy_results?.[currentSection] || []);

  const getCurrentResult = () => getCurrentResults()[currentIndex] || null;

  const hasMadeDecision = editMode || 
    (getCurrentResult()?.metadata?.passed !== undefined);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return <div className="text-center p-8 text-foreground">Loading...</div>;

  if (error && !getCurrentResult()) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <h2 className="text-lg font-semibold text-red-400">Error Loading Data</h2>
          </div>
          <p className="text-gray-300 mb-4">{error}</p>
          <button onClick={() => router.back()} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-foreground">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentResult = getCurrentResult();
  const results       = getCurrentResults();
  const stats         = getModerationStats();
  const isModerated   = currentResult ? isResultModerated(currentResult) : false;

  if (!currentResult) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-yellow-400 mb-4">No Result Found</h2>
          <p className="text-gray-300 mb-4">Could not find the requested numeracy assessment item.</p>
          <button onClick={() => router.back()} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-foreground">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <div onClick={() => router.push(backUrl)} className="flex items-center text-gray-300 hover:text-white cursor-pointer mb-2 w-fit">
        <ArrowLeft size={18} className="mr-1" />
        <span className="text-sm font-medium">Back</span>
      </div>

      {/* Student Header */}
      <div className="bg-background-light rounded-xl shadow-md border border-gray-600 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{studentName}</h1>
            <p className="text-gray-400">Numeracy Assessment Moderation</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Moderation Progress</div>
            <div className="text-lg font-semibold text-foreground">{stats.moderated} / {stats.total} items</div>
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-secondary-2 transition-all duration-300"
                style={{ width: `${stats.total ? (stats.moderated / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="px-3 py-1.5 bg-secondary-2/20 text-secondary-2 rounded-lg">
            Section: <span className="font-semibold capitalize">{currentSection.replace(/_/g, " ")}</span>
          </div>
          <div className="px-3 py-1.5 bg-primary-3/20 text-primary-3 rounded-lg">
            Item: <span className="font-semibold">{currentIndex + 1} of {assessmentData.numeracy_results?.[currentSection]?.length || 0}</span>
          </div>
          <div className={`px-3 py-1.5 rounded-lg ${isModerated ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
            Status: <span className="font-semibold">{isModerated ? "Moderated" : "Pending"}</span>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NumeracyModerationView
            currentResult={currentResult}
            currentSection={currentSection}
            currentIndex={currentIndex}
            assessmentData={assessmentData}
            assessmentId={assessmentId}
            studentId={studentId}
            updateNumeracyResult={updateNumeracyResult}
            onDeleteRound={() => setShowDeleteConfirm(true)}
            editMode={editMode}
            setEditMode={setEditMode}
            editedTranscript={editedTranscript}
            setEditedTranscript={setEditedTranscript}
            setError={setError}
            isModerated={isModerated}
            isFlagged={currentResult?.flagged === true}
            existingFlagReview={currentResult?.metadata?.flag_review || ""}
            onSaveFlagReasons={handleSaveFlagReasons}
            savingFlagReasons={savingFlagReasons}
            onCorrect={handleCorrect}
            onIncorrect={handleIncorrect}
            onSaveEdit={handleSaveEdit}
            onConfirmModeration={handleConfirmModeration}
            hasMadeDecision={hasMadeDecision}
            currentPassedStatus={currentResult?.metadata?.passed}
          />
        </div>

        <div className="space-y-6">
          <div className="bg-background-light rounded-xl border border-gray-600 p-4">
            <h3 className="font-semibold text-foreground mb-4">Navigation</h3>
            <NumeracyNavigationControls
              currentIndex={currentIndex}
              results={results}
              studentIds={studentIds}
              currentStudentIndex={currentStudentIndex}
              organizationId={organizationId}
              assessmentId={assessmentId}
              studentId={studentId}
              router={router}
              setCurrentIndex={setCurrentIndex}
              setEditMode={setEditMode}
              setEditedTranscript={setEditedTranscript}
              areAllResultsModerated={() => areAllResultsModerated(results)}
              getNextUnmoderatedIndex={(results, start) => getNextUnmoderatedIndex(results, start)}
              isResultModerated={isResultModerated}
              currentSection={currentSection}
              assessmentData={assessmentData}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h4 className="font-medium text-red-400">Error</h4>
              </div>
              <p className="text-sm text-gray-300">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background-light rounded-lg p-6 max-w-md w-full mx-4 border border-gray-600">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Delete Round?</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this round? This will also delete any associated audio files or screenshots. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm border border-gray-600 rounded hover:bg-gray-700 transition-colors text-foreground">
                Cancel
              </button>
              <button onClick={deleteCurrentRound} className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                Delete Round
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}