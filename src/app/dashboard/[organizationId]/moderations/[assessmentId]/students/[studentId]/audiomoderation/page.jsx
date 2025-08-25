"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { ArrowLeft, Play, Pause, Volume2, Edit, ThumbsUp, AlertCircle } from "lucide-react";
import { db } from "@/firebase/config";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import Sidebar from "@/components/Dashboard/SideBar";
import Header from "@/components/Dashboard/Header";

export default function AudioModerationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organizationId, assessmentId, studentId } = useParams();
  const audioRef = useRef(null);

  // State management
  const [assessmentData, setAssessmentData] = useState(null);
  const [studentName, setStudentName] = useState("Loading...");
  const [currentIndex, setCurrentIndex] = useState(parseInt(searchParams.get("round") || "0", 10));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState("");
  const [validationStatus, setValidationStatus] = useState("unvalidated");
  const [studentIds, setStudentIds] = useState([]);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to check if a result is moderated (has modeltranscriptionverified)
  const isResultModerated = (result) => {
    return result.metadata?.modeltranscriptionverified === true;
  };

  // Helper function to get next unmoderated index
  const getNextUnmoderatedIndex = (results, startIndex = 0) => {
    for (let i = startIndex; i < results.length; i++) {
      if (!isResultModerated(results[i])) {
        return i;
      }
    }
    return -1; // All results are moderated
  };

  // Helper function to check if all results are moderated
  const areAllResultsModerated = (results) => {
    return results.every(result => isResultModerated(result));
  };

  // Helper function to get moderation statistics
  const getModerationStats = (results) => {
    const total = results.length;
    const moderated = results.filter(result => isResultModerated(result)).length;
    const unmoderated = total - moderated;
    return { total, moderated, unmoderated };
  };

  // Reset audio player when navigating
  const resetAudioPlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  };

  // Fetch student name from assessment data
  useEffect(() => {
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

    fetchStudentName();
  }, [assessmentId, studentId]);

  // Fetch assessment data and student IDs
  useEffect(() => {
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
          
          // Check if there are no assessment results
          if (data.literacy_results.reading_results.length === 0) {
            // Student has no assessment rounds - this is handled in the UI
            setCurrentIndex(0);
          } else {
            const index = parseInt(searchParams.get("round") || "0", 10);
            if (data.literacy_results.reading_results[index]) {
              setEditedTranscript(data.literacy_results.reading_results[index].metadata?.transcript || "");
              setCurrentIndex(index);
              console.log("Audio URL:", data.literacy_results.reading_results[index].metadata?.audio_url);
            } else {
              setError("Invalid round index");
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

    fetchAssessmentData();
    fetchStudentIds();
  }, [assessmentId, studentId, searchParams]);

  // Audio player handlers
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((err) => {
          console.error("Audio playback error:", err);
          setError("Failed to play audio");
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const progressBar = e.currentTarget;
    const clickX = e.nativeEvent.offsetX;
    const width = progressBar.offsetWidth;
    const newTime = (clickX / width) * duration;

    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Color words based on transcript match
  const getColoredWords = (content, transcript) => {
    if (!content) return null;

    const contentWords = content.trim().split(/\s+/);
    const transcriptWords = (transcript || "").trim().toLowerCase().split(/\s+/);

    let transcriptIndex = 0;

    return contentWords.map((word, index) => {
      const cleanWord = word.replace(/[.,!?;:"""'']/g, "").toLowerCase();
      let matched = false;

      while (transcriptIndex < transcriptWords.length) {
        const transcriptWord = transcriptWords[transcriptIndex];
        if (transcriptWord === cleanWord) {
          matched = true;
          transcriptIndex++;
          break;
        } else {
          transcriptIndex++;
        }
      }

      return (
        <span
          key={index}
          className={`mr-1 font-semibold ${
            matched ? "text-green-600" : "text-red-500"
          }`}
        >
          {word}
        </span>
      );
    });
  };

  // Update assessment result in Firestore
  const updateAssessmentResult = async (updatedResult) => {
    try {
      const updatedData = { ...assessmentData };
      updatedData.literacy_results.reading_results[currentIndex].metadata = {
        ...updatedData.literacy_results.reading_results[currentIndex].metadata,
        ...updatedResult,
      };

      // Check if all results have modeltranscriptionverified set to true
      const allVerified = areAllResultsModerated(updatedData.literacy_results.reading_results);
      if (allVerified) {
        updatedData.verified = true;
      } else {
        // If not all are verified, make sure verified is false
        updatedData.verified = false;
      }

      setAssessmentData(updatedData);

      // Update Firestore document
      const docRef = doc(db, `assessments/${assessmentId}/assessments-results`, `${assessmentId}_${studentId}`);
      await updateDoc(docRef, updatedData);
    } catch (error) {
      console.error("Error updating assessment:", error);
      setError("Failed to update assessment");
    }
  };

  // Handlers for moderation actions
  const handleBadAudio = () => {
    setValidationStatus("bad_audio");
    updateAssessmentResult({
      badaudio: true,
      modeltranscriptionverified: true,
    });
  };

  const handleOk = () => {
    setValidationStatus("validated");
    updateAssessmentResult({
      passed: true,
      badaudio: false,
      modeltranscriptionverified: true,
    });
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (editedTranscript.trim() === "") {
      setError("Transcript cannot be empty");
      return;
    }
    
    // Save original transcript if it doesn't exist
    const currentResult = assessmentData.literacy_results.reading_results[currentIndex];
    const originalTranscript = currentResult.metadata?.transcript || "";
    
    await updateAssessmentResult({
      transcript: editedTranscript,
      originalmodeltranscript: originalTranscript,
      modeltranscriptionverified: true,
    });
    
    setEditMode(false);
    setError(null);
  };

  // Enhanced navigation handlers
  const handleBack = () => {
    if (currentIndex > 0) {
      resetAudioPlayer();
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setValidationStatus("unvalidated");
      setEditMode(false);
      setEditedTranscript(assessmentData.literacy_results.reading_results[newIndex]?.metadata?.transcript || "");
      console.log("Back Audio URL:", assessmentData.literacy_results.reading_results[newIndex]?.metadata?.audio_url);
      router.push(
        `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?round=${newIndex}`
      );
    } else {
      router.back();
    }
  };

  const handleNext = () => {
    const results = assessmentData.literacy_results.reading_results;
    
    // If we're not at the last item, just go to next
    if (currentIndex < results.length - 1) {
      resetAudioPlayer();
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setValidationStatus("unvalidated");
      setEditMode(false);
      setEditedTranscript(results[newIndex]?.metadata?.transcript || "");
      console.log("Next Audio URL:", results[newIndex]?.metadata?.audio_url);
      router.push(
        `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?round=${newIndex}`
      );
      return;
    }

    // If we're at the last item, check for unmoderated results starting from beginning
    const nextUnmoderatedIndex = getNextUnmoderatedIndex(results, 0);
    if (nextUnmoderatedIndex !== -1) {
      // Found an unmoderated result, navigate to it
      resetAudioPlayer();
      setCurrentIndex(nextUnmoderatedIndex);
      setValidationStatus("unvalidated");
      setEditMode(false);
      setEditedTranscript(results[nextUnmoderatedIndex]?.metadata?.transcript || "");
      console.log("Going to unmoderated item at index:", nextUnmoderatedIndex);
      console.log("Unmoderated Audio URL:", results[nextUnmoderatedIndex]?.metadata?.audio_url);
      router.push(
        `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?round=${nextUnmoderatedIndex}`
      );
    } else {
      // All results are moderated, at the end
      console.log("All results are moderated, at end of list");
    }
  };

  const handleNextStudent = () => {
    const results = assessmentData.literacy_results.reading_results;
    
    // Check if all results are moderated
    if (!areAllResultsModerated(results)) {
      // Show warning or automatically go to next unmoderated
      const nextUnmoderatedIndex = getNextUnmoderatedIndex(results, 0);
      if (nextUnmoderatedIndex !== -1) {
        const shouldNavigate = window.confirm(
          `There are still unmoderated items for this student. Do you want to go to the next unmoderated item (${nextUnmoderatedIndex + 1}/${results.length})?`
        );
        if (shouldNavigate) {
          resetAudioPlayer();
          setCurrentIndex(nextUnmoderatedIndex);
          setValidationStatus("unvalidated");
          setEditMode(false);
          setEditedTranscript(results[nextUnmoderatedIndex]?.metadata?.transcript || "");
          router.push(
            `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?round=${nextUnmoderatedIndex}`
          );
          return;
        }
      }
    }

    // Proceed to next student only if all are moderated or user chose to skip
    if (currentStudentIndex < studentIds.length - 1) {
      resetAudioPlayer();
      const nextStudentId = studentIds[currentStudentIndex + 1];
      router.push(
        `/dashboard/${organizationId}/moderations/${assessmentId}/students/${nextStudentId}/audiomoderation?round=0`
      );
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex bg-gray-50">
        <div className="fixed top-0 left-0 h-full w-64">
          <Sidebar organizationId={organizationId} />
        </div>
        <div className="flex-1 flex flex-col ml-64">
          <div className="fixed top-0 left-64 right-0 z-10">
            <Header />
          </div>
          <div className="flex-1 mt-16 p-6 text-center overflow-x-hidden">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex bg-gray-50">
        <div className="fixed top-0 left-0 h-full w-64">
          <Sidebar organizationId={organizationId} />
        </div>
        <div className="flex-1 flex flex-col ml-64">
          <div className="fixed top-0 left-64 right-0 z-10">
            <Header />
          </div>
          <div className="flex-1 mt-16 p-6 text-center text-red-500 overflow-x-hidden">{error}</div>
        </div>
      </div>
    );
  }

  const currentResult = assessmentData.literacy_results.reading_results[currentIndex];
  const results = assessmentData.literacy_results.reading_results;
  const hasNoResults = results.length === 0;
  const allModerated = areAllResultsModerated(results);
  const stats = getModerationStats(results);
  const isVerified = assessmentData.verified === true;
  const displayStatus = isVerified ? "Verified" : "Unverified";
  const hasUnmoderatedItems = getNextUnmoderatedIndex(results, 0) !== -1;
  const nextUnmoderatedFromStart = getNextUnmoderatedIndex(results, 0);
  const isAtLastIndex = currentIndex >= results.length - 1;

  return (
    <div className="fixed inset-0 flex bg-gray-50">
      <div className="fixed top-0 left-0 h-full w-64">
        <Sidebar organizationId={organizationId} />
      </div>
      <div className="flex-1 flex flex-col ml-64">
        <div className="fixed top-0 left-64 right-0 z-10">
          <Header />
        </div>
        <div className="flex-1 mt-16 pt-20 p-6 overflow-y-auto overflow-x-hidden">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-full">
              {hasNoResults ? (
                // No assessment results view
                <div className="text-center py-12">
                  <div className="mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">No Assessment Results</h2>
                    <p className="text-gray-500 max-w-md mx-auto">
                      This student doesn't have any assessment rounds to moderate. 
                      You can proceed to the next student.
                    </p>
                  </div>
                  
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => router.back()}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to List
                    </button>
                    
                    <button
                      onClick={handleNextStudent}
                      className={`px-6 py-2 rounded-lg transition-colors ${
                        currentStudentIndex < studentIds.length - 1
                          ? "bg-blue-500 text-white hover:bg-blue-600"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                      disabled={currentStudentIndex >= studentIds.length - 1}
                    >
                      {currentStudentIndex < studentIds.length - 1 ? "Next Student" : "No More Students"}
                    </button>
                  </div>
                </div>
              ) : (
                // Normal assessment moderation view
                <>
                  <div className="mb-6 flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-700 mb-2">
                        {allModerated ? "All Results Validated" : "Unvalidated Results"}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {stats.moderated}/{stats.total} results validated
                        {!allModerated && ` (${stats.unmoderated} remaining)`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {currentIndex + 1}/{results.length}
                      </div>
                      {currentResult && !isResultModerated(currentResult) && (
                        <div className="text-xs text-orange-600 mt-1">Not Moderated</div>
                      )}
                    </div>
                  </div>

                  <div className="mb-8 text-center">
                    <div className="text-2xl mb-6 leading-relaxed max-w-full break-words">
                      {currentResult.type === "Letter Recognition" || currentResult.type === "Word" ? (
                        <span
                          className={`font-medium ${
                            currentResult.metadata?.passed ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {currentResult.content}
                        </span>
                      ) : (
                        getColoredWords(currentResult.content, currentResult.metadata?.transcript)
                      )}
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                      <h3 className="font-medium text-gray-700 mb-2">Model Prediction</h3>
                      {editMode ? (
                        <>
                          <input
                            type="text"
                            value={editedTranscript}
                            onChange={(e) => setEditedTranscript(e.target.value)}
                            className="w-full p-2 border rounded max-w-full text-gray-600"
                            placeholder="Enter transcript"
                          />
                          {error && <p className="text-red-500 text-sm mt-2 max-w-full break-words">{error}</p>}
                        </>
                      ) : (
                        <p className="text-gray-600 max-h-20 overflow-y-auto max-w-full break-words">
                          {currentResult?.metadata?.transcript 
                          ? currentResult?.metadata?.transcript
                          : "No transcript available"
                          }
                        </p>
                      )}
                    </div>
                    <div className="bg-yellow-400 rounded-lg p-4 mb-6 max-w-md mx-auto">
                      <div className="flex items-center gap-3">
                        <button onClick={togglePlayPause} className="flex-shrink-0">
                          {isPlaying ? (
                            <Pause className="w-6 h-6 text-black" />
                          ) : (
                            <Play className="w-6 h-6 text-black" />
                          )}
                        </button>
                        <div className="flex-1 max-w-full">
                          <div className="text-sm font-medium text-black mb-1">
                            {formatTime(currentTime)}/{formatTime(duration)}
                          </div>
                          <div
                            className="w-full h-2 bg-black bg-opacity-20 rounded-full cursor-pointer"
                            onClick={handleSeek}
                          >
                            <div
                              className="h-full bg-black rounded-full"
                              style={{
                                width: duration ? `${(currentTime / duration) * 100}%` : "0%",
                              }}
                            />
                          </div>
                        </div>
                        <Volume2 className="w-5 h-5 text-black flex-shrink-0" />
                      </div>
                      {currentResult.metadata?.audio_url ? (
                        <audio
                          ref={audioRef}
                          src={currentResult.metadata.audio_url}
                          onTimeUpdate={handleTimeUpdate}
                          onLoadedMetadata={handleLoadedMetadata}
                          onEnded={() => setIsPlaying(false)}
                        />
                      ) : (
                        <p className="text-red-500 text-sm mt-2 max-w-full">No audio available</p>
                      )}
                    </div>
                    <div className="flex gap-3 justify-center mb-8 flex-wrap">
                      <button
                        onClick={handleBadAudio}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Bad Audio
                      </button>
                      {editMode ? (
                        <button
                          onClick={handleSaveEdit}
                          className="flex items-center gap-2 px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex-shrink-0"
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          onClick={handleEdit}
                          className="flex items-center gap-2 px-4 py-2 border-2 border-yellow-500 text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors flex-shrink-0"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                      )}
                      <button
                        onClick={handleOk}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors flex-shrink-0"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        Ok
                      </button>
                    </div>
                    <div className="flex justify-between items-center flex-wrap gap-4">
                      <button
                        onClick={handleBack}
                        className={`flex items-center gap-2 px-4 py-2 ${
                          currentIndex > 0
                            ? "text-gray-600 hover:text-gray-900"
                            : "text-gray-400 cursor-not-allowed"
                        } transition-colors flex-shrink-0`}
                        disabled={currentIndex <= 0}
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </button>
                      <button
                        onClick={handleNextStudent}
                        className={`px-4 py-2 ${
                          allModerated && currentStudentIndex < studentIds.length - 1
                            ? "bg-blue-500 text-white hover:bg-blue-600"
                            : hasUnmoderatedItems
                            ? "bg-orange-500 text-white hover:bg-orange-600"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        } rounded-lg transition-colors flex-shrink-0`}
                        disabled={currentStudentIndex >= studentIds.length - 1}
                        title={hasUnmoderatedItems ? "Some items are not yet moderated" : ""}
                      >
                        NEXT STUDENT
                      </button>
                      <button
                        onClick={handleNext}
                        className={`flex items-center gap-2 px-4 py-2 ${
                          currentIndex < results.length - 1 || (isAtLastIndex && nextUnmoderatedFromStart !== -1)
                            ? "text-gray-600 hover:text-gray-900"
                            : "text-gray-400 cursor-not-allowed"
                        } transition-colors flex-shrink-0`}
                        disabled={currentIndex >= results.length - 1 && nextUnmoderatedFromStart === -1}
                      >
                        {isAtLastIndex && nextUnmoderatedFromStart !== -1 
                          ? `Go to Unmoderated (${nextUnmoderatedFromStart + 1})` 
                          : "Next"
                        }
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="fixed top-16 left-64 right-0 bg-white border-b border-gray-200 px-6 py-4 z-0 max-w-full">
          <div className="flex items-center justify-between max-w-full">
            <div>
              <p className="text-lg font-semibold text-gray-900 max-w-full break-words">{studentName}</p>
              <p className="text-gray-500 max-w-full break-words">
                {hasNoResults 
                  ? "No Assessment Results" 
                  : `${displayStatus} • ${stats.moderated}/${stats.total} validated`
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}