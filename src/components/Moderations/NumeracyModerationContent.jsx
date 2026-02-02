// components/Moderations/NumeracyModerationContent.jsx
"use client";

import { useState, useEffect } from "react";
import { db, storage } from "@/firebase/config";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import NumeracyModerationView from "./NumeracyModerationView";
import NumeracyNavigationControls from "./NumeracyNavigationControls";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NumeracyModerationContent({ router, searchParams, organizationId, assessmentId, studentId }) {
  const [assessmentData, setAssessmentData] = useState(null);
  const [studentName, setStudentName] = useState("Loading...");
  const [currentSection, setCurrentSection] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState("");
  const [studentIds, setStudentIds] = useState([]);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Back URL
  const backUrl = `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}`;

  // Get section and index from URL
  useEffect(() => {
    const section = searchParams.get("section") || "";
    const index = parseInt(searchParams.get("index") || "0", 10);
    setCurrentSection(section);
    setCurrentIndex(index);
  }, [searchParams]);

  // Data fetching effects
  useEffect(() => {
    fetchStudentName();
  }, [assessmentId, studentId]);

  useEffect(() => {
    if (currentSection) {
      fetchAssessmentData();
    }
    fetchStudentIds();
  }, [assessmentId, studentId, currentSection, currentIndex]);

  const fetchStudentName = async () => {
    try {
      const assessmentRef = doc(db, `assessments`, assessmentId);
      const assessmentSnap = await getDoc(assessmentRef);
      
      if (assessmentSnap.exists()) {
        const assessmentData = assessmentSnap.data();
        const assignedStudents = assessmentData.assigned_students || [];
        const student = assignedStudents.find(s => s.id === studentId);
        
        if (student) {
          setStudentName(`${student.first_name} ${student.last_name}`);
        } else {
          setStudentName("Student Not Found");
        }
      } else {
        setStudentName("Assessment Not Found");
      }
    } catch (error) {
      console.error("Error fetching student name:", error);
      setStudentName("Unknown Student");
    }
  };

  const fetchAssessmentData = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, `assessments/${assessmentId}/assessments-results`, `${assessmentId}_${studentId}`);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAssessmentData(data);
        
        // Set initial transcript if result exists
        const results = data.numeracy_results?.[currentSection] || [];
        if (results[currentIndex]) {
          const currentResult = results[currentIndex];
          setEditedTranscript(
            currentResult.metadata?.transcript || 
            currentResult.student_answer || 
            ""
          );
        }
        
        setError(null);
      } else {
        setError("Assessment data not found");
      }
    } catch (error) {
      console.error("Error fetching assessment data:", error);
      setError("Failed to load assessment data");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentIds = async () => {
    try {
      const collectionRef = collection(db, `assessments/${assessmentId}/assessments-results`);
      const querySnapshot = await getDocs(collectionRef);
      const ids = querySnapshot.docs.map((doc) => doc.id.split("_")[1]);
      setStudentIds(ids);
      setCurrentStudentIndex(ids.indexOf(studentId));
    } catch (error) {
      console.error("Error fetching student IDs:", error);
    }
  };

  const updateNumeracyResult = async (updates) => {
    try {
      if (!assessmentData || !currentSection) return false;

      const docRef = doc(db, `assessments/${assessmentId}/assessments-results`, `${assessmentId}_${studentId}`);
      const currentResults = [...(assessmentData.numeracy_results?.[currentSection] || [])];
      
      if (!currentResults[currentIndex]) {
        setError("Result not found");
        return false;
      }

      // Create updated result
      const currentResult = currentResults[currentIndex];
      const updatedResult = {
        ...currentResult,
        ...updates,
        metadata: {
          ...currentResult.metadata,
          ...updates.metadata,
          moderation_timestamp: new Date().toISOString()
        }
      };

      currentResults[currentIndex] = updatedResult;

      // Update local state
      const updatedData = {
        ...assessmentData,
        numeracy_results: {
          ...assessmentData.numeracy_results,
          [currentSection]: currentResults
        }
      };

      setAssessmentData(updatedData);

      // Update Firebase
      const updatePath = `numeracy_results.${currentSection}.${currentIndex}`;
      await updateDoc(docRef, {
        [updatePath]: updatedResult
      });

      return true;
    } catch (error) {
      console.error("Error updating numeracy result:", error);
      setError("Failed to update result");
      return false;
    }
  };

  // Helper function to extract file path from Firebase Storage URL
  const extractFilePathFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const path = decodeURIComponent(urlObj.pathname);
      // Remove the leading "/v0/b/bucket-name/o/" part
      const match = path.match(/\/v0\/b\/[^/]+\/o\/(.+)/);
      if (match && match[1]) {
        return match[1];
      }
      return null;
    } catch (error) {
      console.error("Error parsing URL:", error);
      return null;
    }
  };

  // Delete round function with file deletion
  const deleteCurrentRound = async () => {
    try {
      if (!assessmentData || !currentSection || !assessmentData.numeracy_results?.[currentSection]) {
        setError("No assessment data found");
        return;
      }

      const updatedResults = [...assessmentData.numeracy_results[currentSection]];
      const currentResult = updatedResults[currentIndex];
      
      if (!currentResult) {
        setError("Result not found");
        return;
      }

      // Get file URLs before deleting the result
      const audioUrl = currentResult?.metadata?.audio_url;
      const screenshotUrl = currentResult?.metadata?.screenshot_url;
      
      // Remove the current round
      updatedResults.splice(currentIndex, 1);

      const updatedData = {
        ...assessmentData,
        numeracy_results: {
          ...assessmentData.numeracy_results,
          [currentSection]: updatedResults
        }
      };

      // Update local state
      setAssessmentData(updatedData);

      // Update Firebase Firestore
      const docRef = doc(db, `assessments/${assessmentId}/assessments-results`, `${assessmentId}_${studentId}`);
      await updateDoc(docRef, {
        [`numeracy_results.${currentSection}`]: updatedResults
      });

      // Delete files from Firebase Storage
      const deletePromises = [];
      
      // Delete audio file if it exists (for number_recognition)
      if (audioUrl && audioUrl.includes('firebasestorage.googleapis.com')) {
        try {
          const filePath = extractFilePathFromUrl(audioUrl);
          if (filePath) {
            const audioRef = ref(storage, filePath);
            deletePromises.push(deleteObject(audioRef));
            console.log("✅ Audio file deletion queued:", filePath);
          }
        } catch (error) {
          console.warn("⚠️ Could not queue audio file deletion:", error);
        }
      }
      
      // Delete screenshot file if it exists (for number_operations)
      if (screenshotUrl && screenshotUrl.includes('firebasestorage.googleapis.com')) {
        try {
          const filePath = extractFilePathFromUrl(screenshotUrl);
          if (filePath) {
            const screenshotRef = ref(storage, filePath);
            deletePromises.push(deleteObject(screenshotRef));
            console.log("✅ Screenshot file deletion queued:", filePath);
          }
        } catch (error) {
          console.warn("⚠️ Could not queue screenshot file deletion:", error);
        }
      }
      
      // Execute all deletions, but don't fail if deletions fail
      if (deletePromises.length > 0) {
        const results = await Promise.allSettled(deletePromises);
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            console.log(`✅ File ${index + 1} deleted successfully`);
          } else {
            console.warn(`⚠️ File ${index + 1} deletion failed:`, result.reason);
          }
        });
      }

      // Adjust current index if needed
      if (updatedResults.length === 0) {
        // If no items left in this section, go back to results page
        router.push(`/dashboard/${organizationId}/assessments/${assessmentId}/students/${studentId}/results`);
      } else if (currentIndex >= updatedResults.length) {
        // If we deleted the last item, go to the new last item
        const newIndex = updatedResults.length - 1;
        setCurrentIndex(newIndex);
        router.push(
          `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/numeracymoderation?section=${currentSection}&index=${newIndex}`
        );
      } else {
        // Stay at same index (items shifted up)
        router.push(
          `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/numeracymoderation?section=${currentSection}&index=${currentIndex}`
        );
      }

      // Close confirmation dialog
      setShowDeleteConfirm(false);
      setError(null);

    } catch (error) {
      console.error("❌ Error deleting round:", error);
      setError("Failed to delete round");
    }
  };

  // Helper functions
  const isResultModerated = (result) => {
    return result.metadata?.modeltranscriptionverified === true || 
           result.metadata?.moderated === true ||
           (currentSection === "count_and_match" && result.moderated === true);
  };

  const getNextUnmoderatedIndex = (results, startIndex = 0) => {
    if (!results || !Array.isArray(results)) return -1;
    
    for (let i = startIndex; i < results.length; i++) {
      if (!isResultModerated(results[i])) {
        return i;
      }
    }
    return -1;
  };

  const areAllResultsModerated = (results) => {
    if (!results || !Array.isArray(results)) return true;
    return results.every(result => isResultModerated(result));
  };

  const getModerationStats = () => {
    if (!assessmentData || !assessmentData.numeracy_results) {
      return { total: 0, moderated: 0, unmoderated: 0 };
    }

    let total = 0;
    let moderated = 0;

    Object.values(assessmentData.numeracy_results).forEach(section => {
      if (Array.isArray(section)) {
        section.forEach(item => {
          total++;
          if (isResultModerated(item)) {
            moderated++;
          }
        });
      }
    });

    return { total, moderated, unmoderated: total - moderated };
  };

  const getCurrentResults = () => {
    if (!assessmentData || !currentSection) return [];
    return assessmentData.numeracy_results?.[currentSection] || [];
  };

  const getCurrentResult = () => {
    const results = getCurrentResults();
    return results[currentIndex] || null;
  };

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
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-foreground"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentResult = getCurrentResult();
  const results = getCurrentResults();
  const stats = getModerationStats();

  if (!currentResult) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-yellow-400 mb-4">No Result Found</h2>
          <p className="text-gray-300 mb-4">Could not find the requested numeracy assessment item.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-foreground"
          >
            Go Back
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
            <p className="text-gray-400">Numeracy Assessment Moderation</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Moderation Progress</div>
            <div className="text-lg font-semibold text-foreground">
              {stats.moderated} / {stats.total} items
            </div>
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
            Section: <span className="font-semibold capitalize">{currentSection.replace(/_/g, ' ')}</span>
          </div>
          <div className="px-3 py-1.5 bg-primary-3/20 text-primary-3 rounded-lg">
            Item: <span className="font-semibold">{currentIndex + 1} of {assessmentData.numeracy_results?.[currentSection]?.length || 0}</span>
          </div>
          <div className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg">
            Status: <span className="font-semibold">{currentResult.metadata?.moderated ? "Moderated" : "Pending"}</span>
          </div>
        </div>
      </div>

      {/* Main Moderation Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Moderation View with Actions */}
        <div className="lg:col-span-2">
          <NumeracyModerationView
            currentResult={currentResult}
            currentSection={currentSection}
            currentIndex={currentIndex}
            assessmentData={assessmentData}
            updateNumeracyResult={updateNumeracyResult}
            onDeleteRound={() => setShowDeleteConfirm(true)}
            editMode={editMode}
            setEditMode={setEditMode}
            editedTranscript={editedTranscript}
            setEditedTranscript={setEditedTranscript}
            setError={setError}
          />
        </div>

        {/* Right Column: Navigation & History */}
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

          {/* Error Display */}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background-light rounded-lg p-6 max-w-md w-full mx-4 border border-gray-600">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Delete Round?</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this round? This will also delete any associated audio files or screenshots.
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm border border-gray-600 rounded hover:bg-gray-700 transition-colors text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={deleteCurrentRound}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete Round
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}