"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Volume2, TrendingUp, AlertCircle } from "lucide-react";
import AudioPlayer from "./numeracy/AudioPlayer";
import LazyImagePanel from "./numeracy/LazyImagePanel";
import NumeracyModerationActions from "./NumeracyModerationActions";
import { findNumberOperationsWorkoutUrl, findWordProblemWorkoutUrl } from "@/utils/numeracyStorageUtils";

export default function NumeracyModerationView({
  currentResult,
  currentSection,
  currentIndex,
  assessmentData,
  assessmentId,
  studentId,
  updateNumeracyResult,
  onDeleteRound,
  onReopenModeration,
  editMode,
  setEditMode,
  editedTranscript,
  setEditedTranscript,
  setError,
  // Flag props
  isFlagged,
  existingFlagReview,
  onSaveFlagReasons,
  savingFlagReasons,
  isModerated,
  // Action props
  onCorrect,
  onIncorrect,
  onSaveEdit,
  onConfirmModeration,
  currentPassedStatus,
}) {
  // Helper function to parse flag review string
  const getFlagReviewArray = (flagReviewString) => {
    if (!flagReviewString || typeof flagReviewString !== 'string') return [];
    return flagReviewString.split(',').map(reason => reason.trim()).filter(reason => reason);
  };

  const flagReviewArray = getFlagReviewArray(existingFlagReview);

  const handleWorkoutUrlResolved = (url) => {
    updateNumeracyResult({ metadata: { workout_screenshot_url: url } });
  };

  // Handle reopen moderation
  const handleReopenModeration = () => {
    if (onReopenModeration) {
      onReopenModeration();
    }
  };

  // ── Shared actions block ──────────────────────────────────────────────────
  const renderActions = () => (
    <NumeracyModerationActions
      currentSection={currentSection}
      editMode={editMode}
      setEditMode={setEditMode}
      onSaveEdit={onSaveEdit}
      onCorrect={onCorrect}
      onIncorrect={onIncorrect}
      onConfirmModeration={onConfirmModeration}
      onReopenModeration={handleReopenModeration}
      onDeleteRound={onDeleteRound}
      disabled={isModerated}
      isFlagged={isFlagged}
      existingAudioReasons={flagReviewArray}
      existingImageReasons={flagReviewArray}
      onSaveFlagReasons={onSaveFlagReasons}
      savingFlagReasons={savingFlagReasons}
      currentPassedStatus={currentPassedStatus}
    />
  );

  // ── Transcript helpers ────────────────────────────────────────────────────
  const renderTranscriptEdit = () => {
    if (!editMode) return null;
    return (
      <div className="mt-4 bg-background-light rounded-lg p-4 border border-primary-3">
        <div className="text-sm text-gray-400 mb-2">Edit Transcript</div>
        <textarea
          value={editedTranscript}
          onChange={(e) => setEditedTranscript(e.target.value)}
          className="w-full px-3 py-2 bg-background-lighter border border-gray-600 rounded-lg text-foreground"
          rows="2"
          placeholder="Enter corrected transcript..."
        />
      </div>
    );
  };

  const renderTranscriptDisplay = (transcript) => {
    if (!transcript && !editMode) return null;
    return (
      <div className="mt-4">
        <div className="text-sm text-gray-400 mb-2">Transcript</div>
        {!editMode && (
          <div className={`text-lg font-medium p-3 rounded-lg ${
            currentResult.metadata?.passed || currentResult.passed
              ? "bg-secondary-2/20 text-secondary-2 border border-secondary-2/30"
              : "bg-red-400/20 text-red-400 border border-red-400/30"
          }`}>
            "{transcript}"
          </div>
        )}
        {renderTranscriptEdit()}
      </div>
    );
  };

  // ── Section cards ─────────────────────────────────────────────────────────
  const renderSectionContent = () => {
    switch (currentSection) {
      case "count_and_match":    return renderCountAndMatchCard();
      case "highest_value":      return renderHighestValueCard();
      case "number_recognition": return renderNumberRecognitionCard();
      case "number_operations":  return renderNumberOperationsCard();
      case "word_problem":       return renderWordProblemCard();
      default:                   return null;
    }
  };

  const renderCountAndMatchCard = () => (
    <>
      <div className="bg-background-lighter rounded-xl p-6 border border-gray-600 mb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-3 text-foreground font-bold">
              {currentIndex + 1}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Count and Match</h3>
              <p className="text-sm text-gray-400">Expected number vs Student count</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
            currentResult.passed ? "bg-secondary-2/20 text-secondary-2" : "bg-red-400/20 text-red-400"
          }`}>
            {currentResult.passed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            {currentResult.passed ? "Correct" : "Incorrect"}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
            <div className="text-center mb-4">
              <div className="text-sm text-gray-400 mb-2">Expected Count</div>
              <div className="text-7xl font-bold text-secondary-2">{currentResult.expected_number}</div>
            </div>
            <div className="text-center text-sm text-gray-400">Target number to match</div>
          </div>
          <div className={`rounded-xl p-6 border-2 ${
            currentResult.passed ? "border-secondary-2/30 bg-secondary-2/10" : "border-red-400/30 bg-red-400/10"
          }`}>
            <div className="text-center mb-4">
              <div className="text-sm text-gray-400 mb-2">Student Count</div>
              <div className={`text-7xl font-bold ${currentResult.passed ? "text-secondary-2" : "text-red-400"}`}>
                {currentResult.student_count}
              </div>
            </div>
            <div className="text-center text-sm text-gray-400">Student's response</div>
          </div>
        </div>
      </div>
      {renderActions()}
    </>
  );

  const renderHighestValueCard = () => {
    const hasAudio   = currentResult.metadata?.audio_url;
    const transcript = editMode ? editedTranscript : (currentResult.metadata?.transcript || "");
    return (
      <>
        <div className="bg-background-lighter rounded-xl p-6 border border-gray-600 mb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-3 text-foreground font-bold">
                {currentIndex + 1}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{currentResult.type || "Highest Value"}</h3>
                <p className="text-sm text-gray-400">Identify the highest value from a set</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
              currentResult.passed ? "bg-secondary-2/20 text-secondary-2" : "bg-red-400/20 text-red-400"
            }`}>
              {currentResult.passed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              {currentResult.passed ? "Correct" : "Incorrect"}
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-primary-3" />
                <div className="text-sm text-gray-400">Number Set</div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {currentResult.values?.map((value, index) => (
                  <div key={index} className={`p-4 rounded-lg border-2 text-center ${
                    value === currentResult.expected_number && currentResult.passed   ? "border-green-500 bg-green-500/10"
                    : value === currentResult.student_number && !currentResult.passed ? "border-red-500 bg-red-500/10"
                    : "border-gray-600 bg-gray-700/50"
                  }`}>
                    <div className={`text-3xl font-bold ${
                      value === currentResult.expected_number && currentResult.passed   ? "text-green-400"
                      : value === currentResult.student_number && !currentResult.passed ? "text-red-400"
                      : "text-gray-300"
                    }`}>{value}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {value === currentResult.expected_number ? "Correct Answer"
                        : value === currentResult.student_number ? "Student's Choice" : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600 text-center">
                <div className="text-sm text-gray-400 mb-3">Expected Highest Value</div>
                <div className="text-7xl font-bold text-secondary-2">{currentResult.expected_number}</div>
              </div>
              <div className={`rounded-xl p-6 border-2 text-center ${
                currentResult.passed ? "border-secondary-2/30 bg-secondary-2/10" : "border-red-400/30 bg-red-400/10"
              }`}>
                <div className="text-sm text-gray-400 mb-3">Student's Answer</div>
                <div className={`text-7xl font-bold ${currentResult.passed ? "text-secondary-2" : "text-red-400"}`}>
                  {currentResult.student_number}
                </div>
              </div>
            </div>
            {hasAudio && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                <div className="flex items-center gap-3 mb-4">
                  <Volume2 className="w-5 h-5 text-primary-3" />
                  <div className="text-sm text-gray-400">Audio Response</div>
                </div>
                <AudioPlayer currentResult={currentResult} />
              </div>
            )}
            {renderTranscriptDisplay(transcript)}
          </div>
        </div>
        {renderActions()}
      </>
    );
  };

  const renderNumberRecognitionCard = () => {
    const hasAudio   = currentResult.metadata?.audio_url;
    const transcript = editMode ? editedTranscript : (currentResult.metadata?.transcript || "");
    return (
      <>
        <div className="bg-background-lighter rounded-xl p-6 border border-gray-600 mb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-3 text-foreground font-bold">
                {currentIndex + 1}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Number Recognition</h3>
                <p className="text-sm text-gray-400">Recognize and say the number</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
              currentResult.metadata?.passed ? "bg-secondary-2/20 text-secondary-2" : "bg-red-400/20 text-red-400"
            }`}>
              {currentResult.metadata?.passed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              {currentResult.metadata?.passed ? "Correct" : "Incorrect"}
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-600 text-center">
              <div className="text-sm text-gray-400 mb-3">Number to Recognize</div>
              <div className="text-8xl font-bold text-primary-3">{currentResult.content}</div>
            </div>
            {hasAudio && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                <div className="flex items-center gap-3 mb-4">
                  <Volume2 className="w-5 h-5 text-primary-3" />
                  <div className="text-sm text-gray-400">Audio Response</div>
                </div>
                <AudioPlayer currentResult={currentResult} />
              </div>
            )}
            {renderTranscriptDisplay(transcript)}
          </div>
        </div>
        {renderActions()}
      </>
    );
  };

const renderNumberOperationsCard = () => {
  const getOperationSymbol = (type) => {
    switch (type?.toLowerCase()) {
      case "addition":       return "+";
      case "subtraction":    return "-";
      case "multiplication": return "×";
      case "division":       return "÷";
      default:               return "";
    }
  };
  const operationSymbol = getOperationSymbol(currentResult.type);
  const transcript      = editMode ? editedTranscript : (currentResult.metadata?.transcript || "");
  const answerUrl       = currentResult.metadata?.screenshot_url || null;
  const savedWorkoutUrl = currentResult.metadata?.workout_screenshot_url || null;

  return (
    <>
      <div className="bg-background-lighter rounded-xl p-6 border border-gray-600 mb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-3 text-foreground font-bold">
              {currentIndex + 1}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground capitalize">{currentResult.type}</h3>
              <p className="text-sm text-gray-400">Math operation</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
            currentResult.metadata?.passed ? "bg-secondary-2/20 text-secondary-2" : "bg-red-400/20 text-red-400"
          }`}>
            {currentResult.metadata?.passed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            {currentResult.metadata?.passed ? "Correct" : "Incorrect"}
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-600 text-center space-y-2">
            <div className="text-6xl font-bold text-gray-300">{currentResult.operations_number1}</div>
            <div className="text-4xl text-gray-400">{operationSymbol} {currentResult.operations_number2}</div>
            <div className="border-t-4 border-gray-600 my-6 pt-6">
              {/* ✅ Show student's transcript instead of expected answer */}
              <div className={`text-5xl font-bold ${currentResult.metadata?.passed ? "text-secondary-2" : "text-red-400"}`}>
                {transcript || currentResult.student_answer || "No answer"}
              </div>
            </div>
          </div>
          <div className={`rounded-xl p-6 border-2 ${
            currentResult.metadata?.passed ? "border-secondary-2/30 bg-secondary-2/10" : "border-red-400/30 bg-red-400/10"
          }`}>
            <div className="text-sm text-gray-400 mb-4">Student's Response</div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-background-lighter rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-2">Answer Given</div>
                <div className={`text-4xl font-bold ${currentResult.metadata?.passed ? "text-secondary-2" : "text-red-400"}`}>
                  {currentResult.student_answer || "No answer"}
                </div>
              </div>
              <div className="bg-background-lighter rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-2">Verbal Response</div>
                <div className="text-lg font-medium">"{transcript || "No transcript"}"</div>
              </div>
            </div>
            {editMode && renderTranscriptEdit()}
            {answerUrl && (
              <LazyImagePanel
                label="Answer Screenshot"
                savedUrl={answerUrl}
                findUrl={() => Promise.resolve(answerUrl)}
                onUrlResolved={null}
              />
            )}
            <LazyImagePanel
              label="Workout Screenshot"
              savedUrl={savedWorkoutUrl}
              findUrl={() => findNumberOperationsWorkoutUrl(assessmentId, studentId, currentResult)}
              onUrlResolved={handleWorkoutUrlResolved}
            />
          </div>
        </div>
      </div>
      {renderActions()}
    </>
  );
};

  const renderWordProblemCard = () => {
    const transcript      = editMode ? editedTranscript : (currentResult.metadata?.transcript || currentResult.student_answer || "");
    const answerUrl       = currentResult.metadata?.screenshot_url || null;
    const savedWorkoutUrl = currentResult.metadata?.workout_screenshot_url || null;

    return (
      <>
        <div className="bg-background-lighter rounded-xl p-6 border border-gray-600 mb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-3 text-foreground font-bold">
                {currentIndex + 1}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Word Problem</h3>
                <p className="text-sm text-gray-400">Problem-solving question</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
              currentResult.metadata?.passed ? "bg-secondary-2/20 text-secondary-2" : "bg-red-400/20 text-red-400"
            }`}>
              {currentResult.metadata?.passed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              {currentResult.metadata?.passed ? "Correct" : "Incorrect"}
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
              <div className="text-sm text-gray-400 mb-3">Problem Statement</div>
              <div className="text-lg font-medium text-foreground leading-relaxed p-4 bg-background-lighter rounded-lg">
                "{currentResult.question}"
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
              <div className="text-sm text-gray-400 mb-4">Answers</div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-900/50 rounded-lg p-6 text-center">
                  <div className="text-sm text-gray-400 mb-2">Expected Answer</div>
                  <div className="text-5xl font-bold text-secondary-2 py-4">{currentResult.expected_number}</div>
                </div>
                <div className={`rounded-lg p-6 text-center ${
                  currentResult.metadata?.passed
                    ? "bg-secondary-2/10 border-2 border-secondary-2/30"
                    : "bg-red-400/10 border-2 border-red-400/30"
                }`}>
                  <div className="text-sm text-gray-400 mb-2">Student Answer</div>
                  <div className={`text-5xl font-bold py-4 ${currentResult.metadata?.passed ? "text-secondary-2" : "text-red-400"}`}>
                    {transcript}
                  </div>
                </div>
              </div>
              {editMode && renderTranscriptEdit()}
              {answerUrl && (
                <LazyImagePanel
                  label="Answer Screenshot"
                  savedUrl={answerUrl}
                  findUrl={() => Promise.resolve(answerUrl)}
                  onUrlResolved={null}
                />
              )}
              <LazyImagePanel
                label="Workout Screenshot"
                savedUrl={savedWorkoutUrl}
                findUrl={() => findWordProblemWorkoutUrl(assessmentId, studentId, currentResult, currentIndex)}
                onUrlResolved={handleWorkoutUrlResolved}
              />
            </div>
          </div>
        </div>
        {renderActions()}
      </>
    );
  };

  return (
    <div className="bg-background-light rounded-xl shadow-lg border border-gray-600 overflow-hidden">
      <div className="border-b border-gray-600 p-4 bg-background-lighter">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-3 text-foreground font-bold">
              {currentIndex + 1}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground capitalize">
                {currentSection.replace(/_/g, " ")}
              </h2>
              <p className="text-sm text-gray-400">
                Item {currentIndex + 1} of {assessmentData?.numeracy_results?.[currentSection]?.length || 0}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isModerated ? (
              <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">
                <CheckCircle className="w-4 h-4" /> Moderated
              </div>
            ) : (
              <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm">
                <XCircle className="w-4 h-4" /> Unmoderated
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Flag Review Display */}
      {flagReviewArray.length > 0 && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-yellow-400">Flag Review Reasons</h3>
            {!isModerated && (
              <span className="text-xs text-gray-400 ml-2">(Pending moderation)</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {flagReviewArray.map((reason, idx) => (
              <span 
                key={idx}
                className="px-3 py-1.5 text-sm rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="p-4">{renderSectionContent()}</div>
    </div>
  );
}