import { ArrowLeft } from "lucide-react";

export default function NavigationControls({
  currentIndex,
  results,
  studentIds,
  currentStudentIndex,
  organizationId,
  assessmentId,
  studentId,
  router,
  setCurrentIndex,
  setValidationStatus,
  setEditMode,
  setEditedTranscript,
  areAllResultsModerated,
  getNextUnmoderatedIndex,
  isResultModerated
}) {
  const resetAudioPlayer = () => {
    // This would ideally be handled through a ref or context
    // For now, we'll rely on the AudioPlayer component's internal reset
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      resetAudioPlayer();
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setValidationStatus("unvalidated");
      setEditMode(false);
      setEditedTranscript(results[newIndex]?.metadata?.transcript || "");
      router.push(
        `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?round=${newIndex}`
      );
    } else {
      router.back();
    }
  };

  const handleNext = () => {
    if (currentIndex < results.length - 1) {
      resetAudioPlayer();
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setValidationStatus("unvalidated");
      setEditMode(false);
      setEditedTranscript(results[newIndex]?.metadata?.transcript || "");
      router.push(
        `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?round=${newIndex}`
      );
      return;
    }

    const nextUnmoderatedIndex = getNextUnmoderatedIndex(results, 0);
    if (nextUnmoderatedIndex !== -1) {
      resetAudioPlayer();
      setCurrentIndex(nextUnmoderatedIndex);
      setValidationStatus("unvalidated");
      setEditMode(false);
      setEditedTranscript(results[nextUnmoderatedIndex]?.metadata?.transcript || "");
      router.push(
        `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?round=${nextUnmoderatedIndex}`
      );
    }
  };

  const handleNextStudent = () => {
    const allModerated = areAllResultsModerated(results);
    
    if (!allModerated) {
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

    if (currentStudentIndex < studentIds.length - 1) {
      resetAudioPlayer();
      const nextStudentId = studentIds[currentStudentIndex + 1];
      router.push(
        `/dashboard/${organizationId}/moderations/${assessmentId}/students/${nextStudentId}/audiomoderation?round=0`
      );
    }
  };

  const allModerated = areAllResultsModerated(results);
  const hasUnmoderatedItems = getNextUnmoderatedIndex(results, 0) !== -1;
  const nextUnmoderatedFromStart = getNextUnmoderatedIndex(results, 0);
  const isAtLastIndex = currentIndex >= results.length - 1;

  return (
    <div className="flex justify-between items-center flex-wrap gap-3">
      <button
        onClick={handleBack}
        className={`flex items-center gap-2 px-3 py-1.5 ${
          currentIndex > 0
            ? "text-gray-300 hover:text-foreground"
            : "text-gray-500 cursor-not-allowed"
        } transition-colors flex-shrink-0`}
        disabled={currentIndex <= 0}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      
      <button
        onClick={handleNextStudent}
        className={`px-4 py-1.5 ${
          allModerated && currentStudentIndex < studentIds.length - 1
            ? "bg-primary-2 text-foreground hover:bg-primary-2/90"
            : hasUnmoderatedItems
            ? "bg-primary-3 text-primary-1 hover:bg-primary-3/90"
            : "bg-gray-600 text-gray-300 cursor-not-allowed"
        } rounded-xl transition-colors flex-shrink-0`}
        disabled={currentStudentIndex >= studentIds.length - 1}
        title={hasUnmoderatedItems ? "Some items are not yet moderated" : ""}
      >
        NEXT STUDENT
      </button>
      
      <button
        onClick={handleNext}
        className={`flex items-center gap-2 px-3 py-1.5 ${
          currentIndex < results.length - 1 || (isAtLastIndex && nextUnmoderatedFromStart !== -1)
            ? "text-gray-300 hover:text-foreground"
            : "text-gray-500 cursor-not-allowed"
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
  );
}