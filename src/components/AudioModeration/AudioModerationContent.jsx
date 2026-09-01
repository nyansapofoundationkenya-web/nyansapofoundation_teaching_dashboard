// components/AudioModeration/AudioModerationContent.jsx
"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getAuth } from "firebase/auth";
import { db, storage } from "@/firebase/config";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import AssessmentResults from "./AssessmentResults";
import AudioPlayer from "./AudioPlayer";
import ModerationActions from "./ModerationActions";
import LiteracyNavigationControls from "./LiteracyNavigationControls";
import { useFlagReasons } from "@/hooks/useFlagReasons";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function AudioModerationContent({
  router, searchParams, organizationId, assessmentId, studentId
}) {
  const [assessmentData, setAssessmentData]         = useState(null);
  const [studentName, setStudentName]               = useState("Loading...");
  const [groupedResults, setGroupedResults]         = useState({});
  const [currentSection, setCurrentSection]         = useState("");
  const [currentLocalIndex, setCurrentLocalIndex]   = useState(0);
  const [editMode, setEditMode]                     = useState(false);
  const [editedTranscript, setEditedTranscript]     = useState("");
  const [validationStatus, setValidationStatus]     = useState("unvalidated");
  const [studentIds, setStudentIds]                 = useState([]);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [loading, setLoading]                       = useState(true);
  const [error, setError]                           = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm]   = useState(false);
  const [moderationHistory, setModerationHistory]   = useState([]);
  const [savingFlagReasons, setSavingFlagReasons]   = useState(false);
  const [retranscribing, setRetranscribing]         = useState(false); // NEW

  const backUrl = `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}`;
  const { saveFlagReasons, incrementResolved } = useFlagReasons(assessmentId, studentId);

  // NEW — super admin check
  const { user: currentUser } = useSelector((state) => state.auth);
  const isSuperAdmin = currentUser?.role === "super_admin";

  const groupResultsByType = (results) => {
    const groups = { letter: [], word: [], paragraph: [], story: [] };
    if (!results || !Array.isArray(results)) return groups;
    results.forEach((result, globalIndex) => {
      const type = (result?.metadata?.type || result?.type || '').toLowerCase();
      if (groups[type] !== undefined) {
        groups[type].push({ ...result, globalIndex, localIndex: groups[type].length });
      }
    });
    return groups;
  };

  // Helper function to remove undefined values from objects
  const cleanUndefined = (obj) => {
    if (!obj) return {};
    const cleaned = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined && obj[key] !== null) {
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          cleaned[key] = cleanUndefined(obj[key]);
        } else {
          cleaned[key] = obj[key];
        }
      }
    });
    return cleaned;
  };

  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        const assessmentRef  = doc(db, `assessments`, assessmentId);
        const resultsRef     = doc(db, `assessments/${assessmentId}/assessments-results`, `${assessmentId}_${studentId}`);
        const collectionRef  = collection(db, `assessments/${assessmentId}/assessments-results`);

        const [assessmentSnap, resultsSnap, querySnapshot] = await Promise.all([
          getDoc(assessmentRef), getDoc(resultsRef), getDocs(collectionRef)
        ]);

        if (assessmentSnap.exists()) {
          const data             = assessmentSnap.data();
          const assignedStudents = data.assigned_students || [];
          const student          = assignedStudents.find(s => s.id === studentId);
          setStudentName(student ? `${student.first_name} ${student.last_name}` : "Student Not Found");
        } else {
          setStudentName("Assessment Not Found");
        }

        const ids = querySnapshot.docs.map(d => d.id.split("_")[1]);
        setStudentIds(ids);
        setCurrentStudentIndex(ids.indexOf(studentId));

        if (resultsSnap.exists()) {
          const data = resultsSnap.data();
          if (!data.literacy_results) data.literacy_results = {};
          if (!data.literacy_results.reading_results) data.literacy_results.reading_results = [];

          setAssessmentData(data);
          const grouped    = groupResultsByType(data.literacy_results.reading_results);
          setGroupedResults(grouped);

          const section    = searchParams.get("section") || "letter";
          const localIndex = parseInt(searchParams.get("index") || "0", 10);
          setCurrentSection(section);
          setCurrentLocalIndex(localIndex);

          const sectionResults = grouped[section] || [];
          if (sectionResults[localIndex]) {
            setEditedTranscript(sectionResults[localIndex].metadata?.transcript || "");
          }
        } else {
          setError("Assessment data not found");
        }
      } catch (err) {
        console.error("Error initializing data:", err);
        setError("Failed to load assessment data");
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, [assessmentId, studentId]);

  // Handle URL param changes
  useEffect(() => {
    const section  = searchParams.get("section");
    const index    = searchParams.get("index");

    if (section && section !== currentSection) setCurrentSection(section);

    if (index !== null) {
      const localIdx = parseInt(index, 10);
      if (localIdx !== currentLocalIndex) {
        setCurrentLocalIndex(localIdx);
        const sectionResults = groupedResults[section || currentSection] || [];
        if (sectionResults[localIdx]) {
          setEditedTranscript(sectionResults[localIdx].metadata?.transcript || "");
        }
      }
    }
  }, [searchParams]);

  // ── Update assessment result ──────────────────────────────────────────────
  const updateAssessmentResult = async (updates) => {
    try {
      const sectionResults = groupedResults[currentSection] || [];
      const currentResult  = sectionResults[currentLocalIndex];
      if (!currentResult) { setError("Result not found"); return; }

      const globalIndex  = currentResult.globalIndex;
      const updatedData  = { ...assessmentData };
      const allResults   = [...updatedData.literacy_results.reading_results];

      // Clean updates to remove undefined values
      const cleanedUpdates = cleanUndefined(updates);

      allResults[globalIndex] = {
        ...allResults[globalIndex],
        metadata: { 
          ...allResults[globalIndex].metadata, 
          ...cleanedUpdates 
        },
      };

      // Handle flagged separately if provided
      if (updates.flagged !== undefined) {
        allResults[globalIndex].flagged = updates.flagged;
      }

      updatedData.literacy_results.reading_results = allResults;
      const allVerified = areAllResultsModerated(allResults);
      updatedData.verified = allVerified;

      setAssessmentData(updatedData);
      const newGrouped = groupResultsByType(allResults);
      setGroupedResults(newGrouped);

      const docRef = doc(db, `assessments/${assessmentId}/assessments-results`, `${assessmentId}_${studentId}`);
      await updateDoc(docRef, {
        "literacy_results.reading_results": allResults,
        "verified": allVerified,
      });

      // If reopening (setting verified to false), handle counter
      const isReopening = updates.modeltranscriptionverified === false;
      if (isReopening) {
        console.log("Moderation reopened for item", currentLocalIndex);
      } else {
        // If this flagged item just got moderated → increment resolved counter
        if (updates.modeltranscriptionverified === true && currentResult.flagged) {
          await incrementResolved();
        }
      }

      setModerationHistory(prev => [{
        section: currentSection,
        index: currentLocalIndex + 1,
        action: updates.modeltranscriptionverified === true ? "moderated" : 
                updates.modeltranscriptionverified === false ? "reopened" : "updated",
        timestamp: new Date().toISOString(),
      }, ...prev.slice(0, 9)]);

    } catch (err) {
      console.error("Error updating assessment:", err);
      setError(`Failed to update assessment: ${err.message}`);
    }
  };

  const handleSaveFlagReasons = async (newReasons) => {
    const sectionResults = groupedResults[currentSection] || [];
    const currentResult  = sectionResults[currentLocalIndex];
    if (!currentResult) return;

    // Convert array to comma-separated string
    const flagReviewString = newReasons.join(', ');
    
    // Get existing flag review string
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
      await updateAssessmentResult({ 
        flag_review: flagReviewString
      });
      
      // Also increment resolved counter
      await incrementResolved();
      
      setModerationHistory(prev => [{
        section: currentSection,
        index: currentLocalIndex + 1,
        action: "flag_review_updated",
        details: `Reasons: ${flagReviewString}`,
        timestamp: new Date().toISOString(),
      }, ...prev.slice(0, 9)]);
      
    } catch (err) {
      console.error("Failed to save flag reasons:", err);
      setError(`Failed to save flag reasons: ${err.message}`);
    } finally {
      setSavingFlagReasons(false);
    }
  };

  // ── Re-transcribe (super admin only, unmoderated only) ─────────────────────
  // Uses the same globalIndex concept as updateAssessmentResult — no separate
  // entry_key field needed, the array position from the current snapshot is
  // the identifier the server uses to find the record.
  //
  // IMPORTANT: this endpoint can legitimately take a while (Gradio cold
  // starts, rate-limit backoff, long paragraph/story audio). If the
  // platform kills the function before it responds, the client gets back
  // an HTML/plain-text error page instead of JSON — so we always read the
  // body as text first and parse defensively, rather than calling
  // res.json() directly and blowing up with a SyntaxError.
  const handleRetranscribe = async () => {
    const sectionResults = groupedResults[currentSection] || [];
    const currentResult  = sectionResults[currentLocalIndex];
    if (!currentResult) return;

    setRetranscribing(true);
    setError(null);
    try {
      const auth  = getAuth();
      const token = await auth.currentUser.getIdToken();

      const res = await fetch("/api/retranscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assessmentId,
          studentId,
          globalIndex: currentResult.globalIndex,
        }),
      });

      const rawText = await res.text();
      let data;
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        // Not JSON — most likely a platform-level timeout/error page
        // (e.g. a 504 from the hosting proxy) rather than our route
        // actually responding.
        if (res.status === 504) {
          throw new Error(
            "Re-transcription timed out. The model may be slow to respond right now — please try again."
          );
        }
        throw new Error(
          `Re-transcription failed (HTTP ${res.status}): ${rawText.slice(0, 200) || "no response body"}`
        );
      }

      if (!res.ok) {
        throw new Error(data.error || `Re-transcription failed (HTTP ${res.status})`);
      }
      if (!data.transcript) {
        throw new Error("Re-transcription succeeded but returned no transcript");
      }

      // Reuse the existing update path — only touches metadata.transcript
      await updateAssessmentResult({ transcript: data.transcript });
      setEditedTranscript(data.transcript);

      setModerationHistory(prev => [{
        section: currentSection,
        index: currentLocalIndex + 1,
        action: "retranscribed",
        timestamp: new Date().toISOString(),
      }, ...prev.slice(0, 9)]);

    } catch (err) {
      console.error("Error retranscribing:", err);
      setError(`Failed to re-transcribe: ${err.message}`);
    } finally {
      setRetranscribing(false);
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
      if (!assessmentData?.literacy_results?.reading_results) {
        setError("No assessment data found"); return;
      }
      const sectionResults = groupedResults[currentSection] || [];
      const currentResult  = sectionResults[currentLocalIndex];
      if (!currentResult) { setError("Result not found"); return; }

      const globalIndex  = currentResult.globalIndex;
      const audioUrl     = currentResult?.metadata?.audio_url;
      const updatedResults = [...assessmentData.literacy_results.reading_results];
      updatedResults.splice(globalIndex, 1);

      const updatedData = {
        ...assessmentData,
        literacy_results: { ...assessmentData.literacy_results, reading_results: updatedResults },
      };
      const allVerified    = areAllResultsModerated(updatedResults);
      updatedData.verified = allVerified;

      setAssessmentData(updatedData);
      const newGrouped = groupResultsByType(updatedResults);
      setGroupedResults(newGrouped);

      const docRef = doc(db, `assessments/${assessmentId}/assessments-results`, `${assessmentId}_${studentId}`);
      await updateDoc(docRef, { "literacy_results.reading_results": updatedResults, "verified": allVerified });

      if (audioUrl?.includes('firebasestorage.googleapis.com')) {
        try {
          const filePath = extractFilePathFromUrl(audioUrl);
          if (filePath) await deleteObject(ref(storage, filePath));
        } catch (storageError) {
          console.warn("⚠️ Could not delete audio file:", storageError);
        }
      }

      const newSectionResults = newGrouped[currentSection] || [];
      if (newSectionResults.length === 0) {
        const sections = getAvailableSections(newGrouped);
        router.push(sections.length > 0
          ? `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?section=${sections[0].id}&index=0`
          : backUrl
        );
      } else if (currentLocalIndex >= newSectionResults.length) {
        router.push(`/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?section=${currentSection}&index=${newSectionResults.length - 1}`);
      } else {
        router.push(`/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?section=${currentSection}&index=${currentLocalIndex}`);
      }

      setShowDeleteConfirm(false);
      setError(null);
    } catch (err) {
      console.error("❌ Error deleting round:", err);
      setError(`Failed to delete round: ${err.message}`);
    }
  };

  // ── Handle reopen moderation (sets modeltranscriptionverified: false) ──
  const handleReopenModeration = async () => {
    try {
      const sectionResults = groupedResults[currentSection] || [];
      const currentResult = sectionResults[currentLocalIndex];
      if (!currentResult) return;
      
      // Prepare previous moderation data (only include defined values)
      const previousModeration = {};
      if (currentResult.metadata?.passed !== undefined) previousModeration.passed = currentResult.metadata.passed;
      if (currentResult.metadata?.transcript !== undefined) previousModeration.transcript = currentResult.metadata.transcript;
      previousModeration.timestamp = new Date().toISOString();
      
      // Set modeltranscriptionverified back to false
      await updateAssessmentResult({
        modeltranscriptionverified: false,
        previous_moderation: previousModeration,
      });
      
      // Clear any error states
      setError(null);
      
      console.log("Moderation reopened successfully");
      
    } catch (err) {
      console.error("Error reopening moderation:", err);
      setError(`Failed to reopen moderation: ${err.message}`);
    }
  };

  // ── Handle final confirmation (sets modeltranscriptionverified: true + flagged: false) ──
  const handleConfirmModeration = async () => {
    await updateAssessmentResult({ 
      modeltranscriptionverified: true,
      flagged: false,
    });
  };

  // ── Handle save edit (NO modeltranscriptionverified) ──
  const handleSaveEdit = async () => {
    if (editedTranscript.trim() === "") { 
      setError("Transcript cannot be empty"); 
      return; 
    }
    const sectionResults     = groupedResults[currentSection] || [];
    const currentResult      = sectionResults[currentLocalIndex];
    const originalTranscript = currentResult?.metadata?.transcript || "";
    
    await updateAssessmentResult({
      transcript: editedTranscript,
      originalmodeltranscript: originalTranscript,
    });
    setEditMode(false);
    setError(null);
  };

  // ── Handle correct (sets passed: true only) ──
  const handleCorrect = async () => {
    setValidationStatus("validated");
    await updateAssessmentResult({ 
      passed: true,
    });
  };

  // ── Handle incorrect (sets passed: false only) ──
  const handleIncorrect = async () => {
    setValidationStatus("invalid");
    await updateAssessmentResult({ 
      passed: false,
    });
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isResultModerated    = (result) => result.metadata?.modeltranscriptionverified === true;
  const areAllResultsModerated = (results) => results.every(r => isResultModerated(r));
  const getModerationStats   = (results) => {
    const total     = results.length;
    const moderated = results.filter(r => isResultModerated(r)).length;
    return { total, moderated, unmoderated: total - moderated };
  };

  const getNextUnmoderatedIndex = (results, startIndex = 0) => {
    for (let i = startIndex; i < results.length; i++) {
      if (!isResultModerated(results[i])) return i;
    }
    return -1;
  };

  const getTotalModerationStats = () => {
    if (!assessmentData?.literacy_results?.reading_results)
      return { total: 0, moderated: 0, unmoderated: 0 };
    return getModerationStats(assessmentData.literacy_results.reading_results);
  };

  const getAvailableSections = (grouped = groupedResults) => {
    const sectionNames = { letter: 'Letter', word: 'Word', paragraph: 'Paragraph', story: 'Story' };
    return ['letter', 'word', 'paragraph', 'story']
      .filter(id => (grouped[id] || []).length > 0)
      .map(id => ({ id, name: sectionNames[id], results: grouped[id] }));
  };

  const getNextUnmoderatedItem = () => {
    const sectionResults = groupedResults[currentSection] || [];
    for (let i = currentLocalIndex + 1; i < sectionResults.length; i++) {
      if (!isResultModerated(sectionResults[i])) return { section: currentSection, index: i };
    }
    const sections             = getAvailableSections();
    const currentSectionIndex  = sections.findIndex(s => s.id === currentSection);
    for (let s = currentSectionIndex + 1; s < sections.length; s++) {
      const section = sections[s];
      for (let i = 0; i < section.results.length; i++) {
        if (!isResultModerated(section.results[i])) return { section: section.id, index: i };
      }
    }
    for (let s = 0; s < sections.length; s++) {
      const section = sections[s];
      for (let i = 0; i < section.results.length; i++) {
        if (!isResultModerated(section.results[i])) return { section: section.id, index: i };
      }
    }
    return null;
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error && !groupedResults[currentSection]) {
    return <div className="text-center p-8 text-red-400">{error}</div>;
  }

  const sectionResults  = groupedResults[currentSection] || [];
  const currentResult   = sectionResults[currentLocalIndex];
  const hasNoResults    = sectionResults.length === 0;
  const totalStats      = getTotalModerationStats();
  const availableSections = getAvailableSections();
  const isModerated     = currentResult?.metadata?.modeltranscriptionverified === true;

  const hasMadeDecision = editMode || 
    (currentResult?.metadata?.passed !== undefined) || 
    (currentResult?.metadata?.passed === false);

  if (!currentResult && !hasNoResults && !loading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-yellow-400 mb-4">Invalid Index</h2>
          <p className="text-gray-300 mb-4">
            Index {currentLocalIndex} doesn't exist in the {currentSection} section.
            This section has {sectionResults.length} items (indices 0–{sectionResults.length - 1}).
          </p>
          <button
            onClick={() => router.push(
              `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?section=${currentSection}&index=0`
            )}
            className="px-4 py-2 bg-primary-3 hover:bg-primary-3/80 rounded-lg transition-colors text-foreground"
          >
            Go to First Item
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      {/* Back Button */}
      <div
        onClick={() => router.push(backUrl)}
        className="flex items-center text-gray-300 hover:text-white cursor-pointer mb-2 w-fit"
      >
        <ArrowLeft size={18} className="mr-1" />
        <span className="text-sm font-medium">Back</span>
      </div>

      {/* Student Header */}
      <div className="bg-background-light rounded-xl shadow-md border border-gray-600 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{studentName}</h1>
            <p className="text-gray-400">Literacy Assessment Moderation</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Moderation Progress</div>
            <div className="text-lg font-semibold text-foreground">
              {totalStats.moderated} / {totalStats.total} items
            </div>
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-secondary-2 transition-all duration-300"
                style={{ width: `${totalStats.total ? (totalStats.moderated / totalStats.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="px-3 py-1.5 bg-secondary-2/20 text-secondary-2 rounded-lg">
            Section: <span className="font-semibold capitalize">{currentSection}</span>
          </div>
          <div className="px-3 py-1.5 bg-primary-3/20 text-primary-3 rounded-lg">
            Item: <span className="font-semibold">{currentLocalIndex + 1} of {sectionResults.length}</span>
          </div>
          <div className={`px-3 py-1.5 rounded-lg ${
            isModerated ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
          }`}>
            Status: <span className="font-semibold">{isModerated ? "Moderated" : "Pending"}</span>
          </div>
        </div>
      </div>

      {/* Main Moderation Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-background-light rounded-xl shadow-lg border border-gray-600 overflow-hidden">
            {/* Content Header */}
            <div className="border-b border-gray-600 p-4 bg-background-lighter">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-3 text-foreground font-bold">
                    {currentLocalIndex + 1}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground capitalize">{currentSection}</h2>
                    <p className="text-sm text-gray-400">Item {currentLocalIndex + 1} of {sectionResults.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isModerated ? (
                    <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">
                      ✓ Moderated
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm">
                      ⏳ Pending
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-4">
              <AssessmentResults
                hasNoResults={hasNoResults}
                results={sectionResults}
                currentIndex={currentLocalIndex}
                currentResult={currentResult}
                editMode={editMode}
                editedTranscript={editedTranscript}
                setEditedTranscript={setEditedTranscript}
                error={error}
                areAllResultsModerated={() => areAllResultsModerated(sectionResults)}
                getModerationStats={getModerationStats}
                isResultModerated={isResultModerated}
                getNextUnmoderatedIndex={getNextUnmoderatedIndex}
              >
                {!hasNoResults && (
                  <>
                    <AudioPlayer currentResult={currentResult} />
                    <ModerationActions
                      editMode={editMode}
                      setEditMode={setEditMode}
                      editedTranscript={editedTranscript}
                      setError={setError}
                      onCorrect={handleCorrect}
                      onIncorrect={handleIncorrect}
                      onSaveEdit={handleSaveEdit}
                      onDeleteRound={() => setShowDeleteConfirm(true)}
                      onConfirmModeration={handleConfirmModeration}
                      onReopenModeration={handleReopenModeration}
                      disabled={isModerated}
                      isFlagged={currentResult?.flagged === true}
                      existingFlagReasons={currentResult?.metadata?.flag_review ? currentResult.metadata.flag_review.split(',') : []}
                      onSaveFlagReasons={handleSaveFlagReasons}
                      savingFlagReasons={savingFlagReasons}
                      hasMadeDecision={hasMadeDecision}
                      currentPassedStatus={currentResult?.metadata?.passed}
                      isSuperAdmin={isSuperAdmin}
                      onRetranscribe={handleRetranscribe}
                      retranscribing={retranscribing}
                    />
                  </>
                )}
              </AssessmentResults>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-background-light rounded-xl border border-gray-600 p-4">
            <h3 className="font-semibold text-foreground mb-4">Sections</h3>
            <div className="space-y-2">
              {availableSections.map((section, idx) => {
                const stats = getModerationStats(section.results);
                return (
                  <button
                    key={idx}
                    onClick={() => router.push(
                      `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?section=${section.id}&index=0`
                    )}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-sm ${
                      section.id === currentSection
                        ? "bg-primary-3/20 text-primary-3 border border-primary-3/30"
                        : "hover:bg-gray-700/50 text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${section.id === currentSection ? "bg-primary-3" : "bg-gray-500"}`} />
                      <span>{section.name}</span>
                    </div>
                    <div className="text-xs">{stats.moderated}/{stats.total}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-background-light rounded-xl border border-gray-600 p-4">
            <h3 className="font-semibold text-foreground mb-4">Navigation</h3>
            <LiteracyNavigationControls
              currentSection={currentSection}
              currentIndex={currentLocalIndex}
              currentStudentIndex={currentStudentIndex}
              assessmentData={assessmentData}
              studentIds={studentIds}
              organizationId={organizationId}
              assessmentId={assessmentId}
              studentId={studentId}
              router={router}
              getNextUnmoderatedItem={getNextUnmoderatedItem}
              onNavigateToItem={(section, index) => router.push(
                `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?section=${section}&index=${index}`
              )}
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

          {moderationHistory.length > 0 && (
            <div className="bg-background-light rounded-xl border border-gray-600 p-4">
              <h3 className="font-semibold text-foreground mb-4">Recent Actions</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {moderationHistory.map((entry, idx) => (
                  <div key={idx} className="text-sm p-2 rounded-lg bg-background-lighter">
                    <div className="flex justify-between">
                      <span className="text-gray-300 capitalize">{entry.section} #{entry.index}</span>
                      <span className="text-gray-400 text-xs">
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-gray-400 capitalize">{entry.action}</div>
                    {entry.details && <div className="text-gray-500 text-xs mt-1">{entry.details}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background-light rounded-lg p-6 max-w-md w-full mx-4 border border-gray-600">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Delete Round?</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this round? This will also delete the associated audio file. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm border border-gray-600 rounded hover:bg-gray-700 transition-colors text-foreground">
                Cancel
              </button>
              <button onClick={deleteCurrentRound} className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}