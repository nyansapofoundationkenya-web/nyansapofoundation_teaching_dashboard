import { AlertCircle, Edit, ThumbsUp } from "lucide-react";

export default function ModerationActions({
  editMode,
  setEditMode,
  editedTranscript,
  setError,
  updateAssessmentResult,
  setValidationStatus,
  handleSaveEdit
}) {
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

  return (
    <div className="flex gap-3 justify-center mb-6 flex-wrap">
      <button
        onClick={handleBadAudio}
        className="flex items-center gap-2 px-3 py-1.5 border-2 border-red-400 text-red-300 rounded-xl hover:bg-red-500/20 transition-colors flex-shrink-0"
      >
        <AlertCircle className="w-4 h-4" />
        Bad Audio
      </button>
      {editMode ? (
        <button
          onClick={handleSaveEdit}
          className="flex items-center gap-2 px-3 py-1.5 border-2 border-primary-2 text-primary-1 rounded-xl hover:bg-primary-2/20 transition-colors flex-shrink-0"
        >
          Save
        </button>
      ) : (
        <button
          onClick={handleEdit}
          className="flex items-center gap-2 px-3 py-1.5 border-2 border-primary-3 text-primary-1 rounded-xl hover:bg-primary-3/20 transition-colors flex-shrink-0"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
      )}
      <button
        onClick={handleOk}
        className="flex items-center gap-2 px-3 py-1.5 border-2 border-secondary-2 text-secondary-1 rounded-xl hover:bg-secondary-2/20 transition-colors flex-shrink-0"
      >
        <ThumbsUp className="w-4 h-4" />
        Ok
      </button>
    </div>
  );
}