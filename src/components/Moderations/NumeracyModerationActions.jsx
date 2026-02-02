// components/Moderations/NumeracyModerationActions.jsx
"use client";

import { AlertCircle, Edit, ThumbsUp, Trash2 } from "lucide-react";
import { useState } from "react";

export default function NumeracyModerationActions({
  editMode,
  setEditMode,
  editedTranscript,
  setError,
  updateNumeracyResult,
  currentResult,
  currentSection,
  currentIndex,
  handleSaveEdit,
  onDeleteRound
}) {
  const [validationStatus, setValidationStatus] = useState("unvalidated");

  const handleBadAudio = () => {
    // Only for number recognition with audio
    if (currentSection === "number_recognition") {
      setValidationStatus("bad_audio");
      updateNumeracyResult({
        metadata: {
          passed: false,
          badaudio: true,
          moderated: true,
          modeltranscriptionverified: true,
          moderation_decision: "bad_audio"
        }
      });
    }
  };

  const handleOk = () => {
    setValidationStatus("validated");
    const passed = currentResult.metadata?.passed || currentResult.passed || false;
    
    updateNumeracyResult({
      metadata: {
        passed: true,
        badaudio: false,
        moderated: true,
        modeltranscriptionverified: true,
        moderation_decision: "approved"
      },
      ...(currentSection === "count_and_match" && { passed: true })
    });
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  return (
    <div className="flex gap-3 justify-center mb-6 flex-wrap">
      {/* Bad Audio button - only for number recognition */}
      {currentSection === "number_recognition" && (
        <button
          onClick={handleBadAudio}
          className="flex items-center gap-2 px-3 py-1.5 border-2 border-red-400 text-red-300 rounded-xl hover:bg-red-500/20 transition-colors flex-shrink-0"
        >
          <AlertCircle className="w-4 h-4" />
          Bad Audio
        </button>
      )}
      
      {/* Edit/Save button */}
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
      
      {/* OK button */}
      <button
        onClick={handleOk}
        className="flex items-center gap-2 px-3 py-1.5 border-2 border-secondary-2 text-secondary-1 rounded-xl hover:bg-secondary-2/20 transition-colors flex-shrink-0"
      >
        <ThumbsUp className="w-4 h-4" />
        Ok
      </button>
      
      {/* Delete Round button */}
      <button
        onClick={onDeleteRound}
        disabled={editMode}
        className="flex items-center gap-2 px-3 py-1.5 border-2 border-red-400 text-red-300 rounded-xl hover:bg-red-500/20 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Trash2 className="w-4 h-4" />
        Delete Round
      </button>
    </div>
  );
}