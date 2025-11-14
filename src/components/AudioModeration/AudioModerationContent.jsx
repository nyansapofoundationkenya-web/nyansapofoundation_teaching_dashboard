import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import StudentHeader from "./StudentHeader";
import AssessmentResults from "./AssessmentResults";
import AudioPlayer from "./AudioPlayer";
import ModerationActions from "./ModerationActions";
import NavigationControls from "./NavigationControls";

export default function AudioModerationContent({ router, searchParams, organizationId, assessmentId, studentId }) {
  const [assessmentData, setAssessmentData] = useState(null);
  const [studentName, setStudentName] = useState("Loading...");
  const [currentIndex, setCurrentIndex] = useState(parseInt(searchParams.get("round") || "0", 10));
  const [editMode, setEditMode] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState("");
  const [validationStatus, setValidationStatus] = useState("unvalidated");
  const [studentIds, setStudentIds] = useState([]);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data fetching effects
  useEffect(() => {
    fetchStudentName();
  }, [assessmentId, studentId]);

  useEffect(() => {
    fetchAssessmentData();
    fetchStudentIds();
  }, [assessmentId, studentId, searchParams]);

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
        
        if (data.literacy_results.reading_results.length === 0) {
          setCurrentIndex(0);
        } else {
          const index = parseInt(searchParams.get("round") || "0", 10);
          if (data.literacy_results.reading_results[index]) {
            setEditedTranscript(data.literacy_results.reading_results[index].metadata?.transcript || "");
            setCurrentIndex(index);
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

  const updateAssessmentResult = async (updatedResult) => {
    try {
      const updatedData = { ...assessmentData };
      updatedData.literacy_results.reading_results[currentIndex].metadata = {
        ...updatedData.literacy_results.reading_results[currentIndex].metadata,
        ...updatedResult,
      };

      const allVerified = areAllResultsModerated(updatedData.literacy_results.reading_results);
      if (allVerified) {
        updatedData.verified = true;
      } else {
        updatedData.verified = false;
      }

      setAssessmentData(updatedData);

      const docRef = doc(db, `assessments/${assessmentId}/assessments-results`, `${assessmentId}_${studentId}`);
      await updateDoc(docRef, updatedData);
    } catch (error) {
      console.error("Error updating assessment:", error);
      setError("Failed to update assessment");
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

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error) return <div className="text-center p-8 text-red-400">{error}</div>;

  const results = assessmentData?.literacy_results?.reading_results || [];
  const currentResult = results[currentIndex];
  const hasNoResults = results.length === 0;
  const stats = getModerationStats(results);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <StudentHeader
        studentName={studentName}
        hasNoResults={hasNoResults}
        stats={stats}
        assessmentData={assessmentData}
      />
      
      <div className="bg-background-light rounded-xl shadow-md border border-gray-600 p-4">
        <AssessmentResults
          hasNoResults={hasNoResults}
          results={results}
          currentIndex={currentIndex}
          currentResult={currentResult}
          editMode={editMode}
          editedTranscript={editedTranscript}
          setEditedTranscript={setEditedTranscript}
          error={error}
          areAllResultsModerated={areAllResultsModerated}
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
                handleSaveEdit={async () => {
                  if (editedTranscript.trim() === "") {
                    setError("Transcript cannot be empty");
                    return;
                  }
                  
                  const originalTranscript = currentResult.metadata?.transcript || "";
                  await updateAssessmentResult({
                    transcript: editedTranscript,
                    originalmodeltranscript: originalTranscript,
                    modeltranscriptionverified: true,
                  });
                  
                  setEditMode(false);
                  setError(null);
                }}
              />

              <NavigationControls
                currentIndex={currentIndex}
                results={results}
                studentIds={studentIds}
                currentStudentIndex={currentStudentIndex}
                organizationId={organizationId}
                assessmentId={assessmentId}
                studentId={studentId}
                router={router}
                setCurrentIndex={setCurrentIndex}
                setValidationStatus={setValidationStatus}
                setEditMode={setEditMode}
                setEditedTranscript={setEditedTranscript}
                areAllResultsModerated={areAllResultsModerated}
                getNextUnmoderatedIndex={getNextUnmoderatedIndex}
                isResultModerated={isResultModerated}
              />
            </>
          )}
        </AssessmentResults>
      </div>
    </div>
  );
}