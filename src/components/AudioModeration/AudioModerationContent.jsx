// components/AudioModeration/AudioModerationContent.jsx
"use client";

import { useState, useEffect } from "react";
import { db, storage } from "@/firebase/config";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import AssessmentResults from "./AssessmentResults";
import AudioPlayer from "./AudioPlayer";
import ModerationActions from "./ModerationActions";
import LiteracyNavigationControls from "./LiteracyNavigationControls";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function AudioModerationContent({ router, searchParams, organizationId, assessmentId, studentId }) {
  const [assessmentData, setAssessmentData] = useState(null);
  const [studentName, setStudentName] = useState("Loading...");
  const [currentSection, setCurrentSection] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState("");
  const [validationStatus, setValidationStatus] = useState("unvalidated");
  const [studentIds, setStudentIds] = useState([]);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [moderationHistory, setModerationHistory] = useState([]);

  // Back URL
  const backUrl = `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}`;

  // Get section and type from URL (we'll use 'section' param for literacy types)
  useEffect(() => {
    const section = searchParams.get("section") || "letter";
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
        if (!data.literacy_results) data.literacy_results = {};
        if (!data.literacy_results.reading_results) data.literacy_results.reading_results = [];
        setAssessmentData(data);
        
        // Get results for current section
        const sectionResults = getSectionResults(currentSection);
        
        if (sectionResults.length === 0) {
          setCurrentIndex(0);
        } else {
          const index = parseInt(searchParams.get("index") || "0", 10);
          if (sectionResults[index]) {
            setEditedTranscript(sectionResults[index].metadata?.transcript || "");
            setCurrentIndex(index);
          } else {
            setCurrentIndex(0);
            setEditedTranscript(sectionResults[0]?.metadata?.transcript || "");
          }
        }
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
      setError("Failed to load student list");
    }
  };

  // Helper function to get results by section/type
  const getSectionResults = (section) => {
    if (!assessmentData?.literacy_results?.reading_results) return [];
    
    const typeMap = {
      'letter': 'Letter',
      'word': 'Word', 
      'paragraph': 'Paragraph',
      'story': 'Story'
    };
    
    const targetType = typeMap[section] || section;
    return assessmentData.literacy_results.reading_results.filter(
      result => result?.metadata?.type === targetType || result?.type === targetType
    );
  };

  // Get all available sections
  const getAvailableSections = () => {
    if (!assessmentData?.literacy_results?.reading_results) return [];
    
    const sections = [];
    const types = ['Letter', 'Word', 'Paragraph', 'Story'];
    
    types.forEach(type => {
      const results = assessmentData.literacy_results.reading_results.filter(
        result => result?.metadata?.type === type || result?.type === type
      );
      if (results.length > 0) {
        sections.push({
          id: type.toLowerCase(),
          name: type,
          results: results
        });
      }
    });
    
    return sections;
  };

  const updateAssessmentResult = async (updates) => {
    try {
      const updatedData = { ...assessmentData };
      const allResults = updatedData.literacy_results.reading_results;
      
      // Find the current result in the full array
      const sectionResults = getSectionResults(currentSection);
      const currentResult = sectionResults[currentIndex];
      const globalIndex = allResults.findIndex(r => r === currentResult);
      
      if (globalIndex === -1) {
        setError("Result not found");
        return;
      }

      allResults[globalIndex].metadata = {
        ...allResults[globalIndex].metadata,
        ...updates,
      };

      const allVerified = areAllResultsModerated(allResults);
      if (allVerified) {
        updatedData.verified = true;
      } else {
        updatedData.verified = false;
      }

      setAssessmentData(updatedData);

      const docRef = doc(db, `assessments/${assessmentId}/assessments-results`, `${assessmentId}_${studentId}`);
      await updateDoc(docRef, updatedData);

      // Add to moderation history
      setModerationHistory(prev => [{
        section: currentSection,
        index: currentIndex + 1,
        action: updates.modeltranscriptionverified ? "moderated" : "updated",
        timestamp: new Date().toISOString()
      }, ...prev.slice(0, 9)]);

    } catch (error) {
      console.error("Error updating assessment:", error);
      setError("Failed to update assessment");
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

  // Delete round function with audio deletion
  const deleteCurrentRound = async () => {
    try {
      if (!assessmentData || !assessmentData.literacy_results?.reading_results) {
        setError("No assessment data found");
        return;
      }

      const updatedResults = [...assessmentData.literacy_results.reading_results];
      const sectionResults = getSectionResults(currentSection);
      const currentResult = sectionResults[currentIndex];
      const globalIndex = updatedResults.findIndex(r => r === currentResult);
      
      if (globalIndex === -1) {
        setError("Result not found");
        return;
      }

      // Get audio URL before deleting the result
      const audioUrl = currentResult?.metadata?.audio_url;
      
      // Remove the current round
      updatedResults.splice(globalIndex, 1);

      const updatedData = {
        ...assessmentData,
        literacy_results: {
          ...assessmentData.literacy_results,
          reading_results: updatedResults
        }
      };

      // Update verified status
      const allVerified = areAllResultsModerated(updatedResults);
      updatedData.verified = allVerified;

      // Update local state
      setAssessmentData(updatedData);

      // Update Firebase Firestore
      const docRef = doc(db, `assessments/${assessmentId}/assessments-results`, `${assessmentId}_${studentId}`);
      await updateDoc(docRef, {
        "literacy_results.reading_results": updatedResults,
        "verified": allVerified
      });

      // Delete audio file from Firebase Storage if it exists
      if (audioUrl && audioUrl.includes('firebasestorage.googleapis.com')) {
        try {
          const filePath = extractFilePathFromUrl(audioUrl);
          if (filePath) {
            const audioRef = ref(storage, filePath);
            await deleteObject(audioRef);
            console.log("✅ Audio file deleted successfully:", filePath);
          }
        } catch (storageError) {
          console.warn("⚠️ Could not delete audio file (may already be deleted):", storageError);
          // Don't throw error - continue with round deletion
        }
      }

      // Adjust navigation
      const newSectionResults = getSectionResults(currentSection);
      if (newSectionResults.length === 0) {
        // If no items left in this section, go to first available section
        const sections = getAvailableSections();
        if (sections.length > 0) {
          router.push(
            `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?section=${sections[0].id}&index=0`
          );
        } else {
          router.push(backUrl);
        }
      } else if (currentIndex >= newSectionResults.length) {
        // If we deleted the last item, go to the new last item
        const newIndex = newSectionResults.length - 1;
        setCurrentIndex(newIndex);
        router.push(
          `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?section=${currentSection}&index=${newIndex}`
        );
      } else {
        // Stay at same index (items shifted up)
        router.push(
          `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?section=${currentSection}&index=${currentIndex}`
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
    return result.metadata?.modeltranscriptionverified === true;
  };

  const getNextUnmoderatedIndex = (results, startIndex = 0) => {
    for (let i = startIndex; i < results.length; i++) {
      if (!isResultModerated(results[i])) {
        return i;
      }
    }
    return -1;
  };

  const areAllResultsModerated = (results) => {
    return results.every(result => isResultModerated(result));
  };

  const getModerationStats = (results) => {
    const total = results.length;
    const moderated = results.filter(result => isResultModerated(result)).length;
    const unmoderated = total - moderated;
    return { total, moderated, unmoderated };
  };

  const handleSaveEdit = async () => {
    if (editedTranscript.trim() === "") {
      setError("Transcript cannot be empty");
      return;
    }
    
    const originalTranscript = currentResult?.metadata?.transcript || "";
    await updateAssessmentResult({
      transcript: editedTranscript,
      originalmodeltranscript: originalTranscript,
      modeltranscriptionverified: true,
    });
    
    setEditMode(false);
    setError(null);
  };

  const getTotalModerationStats = () => {
    if (!assessmentData?.literacy_results?.reading_results) {
      return { total: 0, moderated: 0, unmoderated: 0 };
    }

    const allResults = assessmentData.literacy_results.reading_results;
    return getModerationStats(allResults);
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error && !currentResult) return <div className="text-center p-8 text-red-400">{error}</div>;

  const sectionResults = getSectionResults(currentSection);
  const currentResult = sectionResults[currentIndex];
  const hasNoResults = sectionResults.length === 0;
  const sectionStats = getModerationStats(sectionResults);
  const totalStats = getTotalModerationStats();
  const availableSections = getAvailableSections();

  if (!currentResult && !hasNoResults) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-yellow-400 mb-4">No Result Found</h2>
          <p className="text-gray-300 mb-4">Could not find the requested assessment item.</p>
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
            Item: <span className="font-semibold">{currentIndex + 1} of {sectionResults.length}</span>
          </div>
          <div className={`px-3 py-1.5 rounded-lg ${
            currentResult?.metadata?.modeltranscriptionverified 
              ? "bg-green-500/20 text-green-400" 
              : "bg-yellow-500/20 text-yellow-400"
          }`}>
            Status: <span className="font-semibold">
              {currentResult?.metadata?.modeltranscriptionverified ? "Moderated" : "Pending"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Moderation Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Moderation View */}
        <div className="lg:col-span-2">
          <div className="bg-background-light rounded-xl shadow-lg border border-gray-600 overflow-hidden">
            {/* Content Header */}
            <div className="border-b border-gray-600 p-4 bg-background-lighter">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-3 text-foreground font-bold">
                    {currentIndex + 1}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground capitalize">
                      {currentSection}
                    </h2>
                    <p className="text-sm text-gray-400">
                      Item {currentIndex + 1} of {sectionResults.length}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {currentResult?.metadata?.modeltranscriptionverified && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">
                      ✓ Moderated
                    </div>
                  )}
                  {!currentResult?.metadata?.modeltranscriptionverified && (
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
                currentIndex={currentIndex}
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
                      updateAssessmentResult={updateAssessmentResult}
                      setValidationStatus={setValidationStatus}
                      handleSaveEdit={handleSaveEdit}
                      onDeleteRound={() => setShowDeleteConfirm(true)}
                    />
                  </>
                )}
              </AssessmentResults>
            </div>
          </div>
        </div>

        {/* Right Column: Navigation & History */}
        <div className="space-y-6">
          {/* Section Navigation */}
          <div className="bg-background-light rounded-xl border border-gray-600 p-4">
            <h3 className="font-semibold text-foreground mb-4">Sections</h3>
            <div className="space-y-2">
              {availableSections.map((section, idx) => {
                const stats = getModerationStats(section.results);
                
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      router.push(
                        `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?section=${section.id}&index=0`
                      );
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-sm ${
                      section.id === currentSection
                        ? "bg-primary-3/20 text-primary-3 border border-primary-3/30"
                        : "hover:bg-gray-700/50 text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        section.id === currentSection ? "bg-primary-3" : "bg-gray-500"
                      }`} />
                      <span>{section.name}</span>
                    </div>
                    <div className="text-xs">
                      {stats.moderated}/{stats.total}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="bg-background-light rounded-xl border border-gray-600 p-4">
            <h3 className="font-semibold text-foreground mb-4">Navigation</h3>
            <LiteracyNavigationControls
              currentSection={currentSection}
              currentIndex={currentIndex}
              currentStudentIndex={currentStudentIndex}
              assessmentData={assessmentData}
              studentIds={studentIds}
              organizationId={organizationId}
              assessmentId={assessmentId}
              studentId={studentId}
              router={router}
              getNextUnmoderatedItem={() => {
                // Find next unmoderated item across all sections
                const allResults = assessmentData?.literacy_results?.reading_results || [];
                for (let i = currentIndex + 1; i < sectionResults.length; i++) {
                  if (!isResultModerated(sectionResults[i])) {
                    return { section: currentSection, index: i };
                  }
                }
                
                // Check other sections
                const sections = getAvailableSections();
                const currentSectionIndex = sections.findIndex(s => s.id === currentSection);
                
                for (let s = currentSectionIndex + 1; s < sections.length; s++) {
                  const section = sections[s];
                  for (let i = 0; i < section.results.length; i++) {
                    if (!isResultModerated(section.results[i])) {
                      return { section: section.id, index: i };
                    }
                  }
                }
                
                // Start from beginning
                for (let s = 0; s < sections.length; s++) {
                  const section = sections[s];
                  for (let i = 0; i < section.results.length; i++) {
                    if (!isResultModerated(section.results[i])) {
                      return { section: section.id, index: i };
                    }
                  }
                }
                
                return null;
              }}
              onNavigateToItem={(section, index) => {
                router.push(
                  `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?section=${section}&index=${index}`
                );
              }}
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

          {/* Moderation History */}
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
              Are you sure you want to delete this round? This will also delete the associated audio file.
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