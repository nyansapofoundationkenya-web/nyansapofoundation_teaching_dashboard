// components/Moderations/NumeracyModerationView.jsx
"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Calculator, Volume2, Image as ImageIcon, AlertCircle, Edit, ThumbsUp, Trash2, TrendingUp } from "lucide-react";
import AudioPlayer from "./numeracy/AudioPlayer";

export default function NumeracyModerationView({ 
  currentResult, 
  currentSection, 
  currentIndex, 
  assessmentData,
  updateNumeracyResult,
  onDeleteRound,
  editMode,
  setEditMode,
  editedTranscript,
  setEditedTranscript,
  setError
}) {
  const [showImage, setShowImage] = useState(false);
  const [validationStatus, setValidationStatus] = useState("unvalidated");

  // Handler functions for moderation actions
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
      ...(currentSection === "count_and_match" && { passed: true }),
      ...(currentSection === "highest_value" && { passed: true })
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
    
    await updateNumeracyResult({
      metadata: {
        transcript: editedTranscript,
        originalmodeltranscript: currentResult.metadata?.transcript || "",
        modeltranscriptionverified: true,
        moderated: true
      }
    });
    
    setEditMode(false);
    setError(null);
  };

  // Render transcript editing field
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

  // Render transcript display
  const renderTranscriptDisplay = (transcript) => {
    if (!transcript) return null;
    
    return (
      <div className="mt-4">
        <div className="text-sm text-gray-400 mb-2">Transcript</div>
        <div className={`text-lg font-medium p-3 rounded-lg ${
          currentResult.metadata?.passed || currentResult.passed
            ? "bg-secondary-2/20 text-secondary-2 border border-secondary-2/30"
            : "bg-red-400/20 text-red-400 border border-red-400/30"
        }`}>
          "{transcript}"
        </div>
        {renderTranscriptEdit()}
      </div>
    );
  };

  // Render Moderation Actions
  const renderModerationActions = () => {
    return (
      <div className="flex gap-3 justify-center mb-6 flex-wrap pt-4 border-t border-gray-600">
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
  };

  const renderSectionContent = () => {
    switch (currentSection) {
      case "count_and_match":
        return renderCountAndMatchCard();
      case "highest_value":
        return renderHighestValueCard();
      case "number_recognition":
        return renderNumberRecognitionCard();
      case "number_operations":
        return renderNumberOperationsCard();
      case "word_problem":
        return renderWordProblemCard();
      default:
        return null;
    }
  };

  const renderCountAndMatchCard = () => {
    return (
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
              currentResult.passed
                ? "bg-secondary-2/20 text-secondary-2"
                : "bg-red-400/20 text-red-400"
            }`}>
              {currentResult.passed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              {currentResult.passed ? "Correct" : "Incorrect"}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Expected Count Card */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
              <div className="text-center mb-4">
                <div className="text-sm text-gray-400 mb-2">Expected Count</div>
                <div className="text-7xl font-bold text-secondary-2">
                  {currentResult.expected_number}
                </div>
              </div>
              <div className="text-center text-sm text-gray-400">
                Target number to match
              </div>
            </div>
            
            {/* Student Count Card */}
            <div className={`rounded-xl p-6 border-2 ${
              currentResult.passed
                ? "border-secondary-2/30 bg-secondary-2/10"
                : "border-red-400/30 bg-red-400/10"
            }`}>
              <div className="text-center mb-4">
                <div className="text-sm text-gray-400 mb-2">Student Count</div>
                <div className={`text-7xl font-bold ${
                  currentResult.passed ? "text-secondary-2" : "text-red-400"
                }`}>
                  {currentResult.student_count}
                </div>
              </div>
              <div className="text-center text-sm text-gray-400">
                Student's response
              </div>
            </div>
          </div>
        </div>
        {renderModerationActions()}
      </>
    );
  };

  const renderHighestValueCard = () => {
    const hasAudio = currentResult.metadata?.audio_url;
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
                <h3 className="text-lg font-semibold text-foreground">
                  {currentResult.type || "Highest Value"}
                </h3>
                <p className="text-sm text-gray-400">Identify the highest value from a set</p>
              </div>
            </div>
            
            <div className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
              currentResult.passed
                ? "bg-secondary-2/20 text-secondary-2"
                : "bg-red-400/20 text-red-400"
            }`}>
              {currentResult.passed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              {currentResult.passed ? "Correct" : "Incorrect"}
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Values Set Display */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-primary-3" />
                <div className="text-sm text-gray-400">Number Set</div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                {currentResult.values && currentResult.values.map((value, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border-2 text-center ${
                      value === currentResult.expected_number && currentResult.passed
                        ? "border-green-500 bg-green-500/10"
                        : value === currentResult.student_number && !currentResult.passed
                        ? "border-red-500 bg-red-500/10"
                        : "border-gray-600 bg-gray-700/50"
                    }`}
                  >
                    <div className={`text-3xl font-bold ${
                      value === currentResult.expected_number && currentResult.passed
                        ? "text-green-400"
                        : value === currentResult.student_number && !currentResult.passed
                        ? "text-red-400"
                        : "text-gray-300"
                    }`}>
                      {value}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {value === currentResult.expected_number 
                        ? "Correct Answer" 
                        : value === currentResult.student_number 
                          ? "Student's Choice" 
                          : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Expected vs Student Answer */}
            <div className="grid grid-cols-2 gap-6">
              {/* Expected Highest Value */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-3">Expected Highest Value</div>
                  <div className="text-7xl font-bold text-secondary-2">
                    {currentResult.expected_number}
                  </div>
                </div>
              </div>
              
              {/* Student's Answer */}
              <div className={`rounded-xl p-6 border-2 ${
                currentResult.passed
                  ? "border-secondary-2/30 bg-secondary-2/10"
                  : "border-red-400/30 bg-red-400/10"
              }`}>
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-3">Student's Answer</div>
                  <div className={`text-7xl font-bold ${
                    currentResult.passed ? "text-secondary-2" : "text-red-400"
                  }`}>
                    {currentResult.student_number}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Audio Response Card */}
            {hasAudio && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                <div className="flex items-center gap-3 mb-4">
                  <Volume2 className="w-5 h-5 text-primary-3" />
                  <div className="text-sm text-gray-400">Audio Response</div>
                </div>
                <AudioPlayer currentResult={currentResult} />
              </div>
            )}
            
            {/* Transcript */}
            {renderTranscriptDisplay(transcript)}
          </div>
        </div>
        {renderModerationActions()}
      </>
    );
  };

  const renderNumberRecognitionCard = () => {
    const hasAudio = currentResult.metadata?.audio_url;
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
              currentResult.metadata?.passed
                ? "bg-secondary-2/20 text-secondary-2"
                : "bg-red-400/20 text-red-400"
            }`}>
              {currentResult.metadata?.passed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              {currentResult.metadata?.passed ? "Correct" : "Incorrect"}
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Number Display Card */}
            <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-600">
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-3">Number to Recognize</div>
                <div className="text-8xl font-bold text-primary-3">
                  {currentResult.content}
                </div>
              </div>
            </div>
            
            {/* Audio Response Card */}
            {hasAudio && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                <div className="flex items-center gap-3 mb-4">
                  <Volume2 className="w-5 h-5 text-primary-3" />
                  <div className="text-sm text-gray-400">Audio Response</div>
                </div>
                <AudioPlayer currentResult={currentResult} />
              </div>
            )}
            
            {/* Transcript */}
            {renderTranscriptDisplay(transcript)}
          </div>
        </div>
        {renderModerationActions()}
      </>
    );
  };

  const renderNumberOperationsCard = () => {
    const getOperationSymbol = (type) => {
      switch(type?.toLowerCase()) {
        case 'addition': return '+';
        case 'subtraction': return '-';
        case 'multiplication': return '×';
        case 'division': return '÷';
        default: return '';
      }
    };

    const operationSymbol = getOperationSymbol(currentResult.type);
    const hasScreenshot = currentResult.metadata?.screenshot_url;
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
                <h3 className="text-lg font-semibold text-foreground capitalize">
                  {currentResult.type}
                </h3>
                <p className="text-sm text-gray-400">Math operation</p>
              </div>
            </div>
            
            <div className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
              currentResult.metadata?.passed
                ? "bg-secondary-2/20 text-secondary-2"
                : "bg-red-400/20 text-red-400"
            }`}>
              {currentResult.metadata?.passed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              {currentResult.metadata?.passed ? "Correct" : "Incorrect"}
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Math Operation Card */}
            <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-600">
              <div className="text-center space-y-2">
                <div className="text-6xl font-bold text-gray-300">
                  {currentResult.operations_number1}
                </div>
                <div className="text-4xl text-gray-400">
                  {operationSymbol} {currentResult.operations_number2}
                </div>
                <div className="border-t-4 border-gray-600 my-6 pt-6">
                  <div className="text-xl text-gray-500 mb-2">Expected Answer:</div>
                  <div className="text-5xl font-bold text-secondary-2">
                    {currentResult.expected_answer}
                  </div>
                </div>
              </div>
            </div>

            {/* Student Response Card */}
            <div className={`rounded-xl p-6 border-2 ${
              currentResult.metadata?.passed
                ? "border-secondary-2/30 bg-secondary-2/10"
                : "border-red-400/30 bg-red-400/10"
            }`}>
              <div className="text-sm text-gray-400 mb-4">Student's Response</div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-background-lighter rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-2">Answer Given</div>
                  <div className={`text-4xl font-bold ${
                    currentResult.metadata?.passed ? "text-secondary-2" : "text-red-400"
                  }`}>
                    {currentResult.student_answer || "No answer"}
                  </div>
                </div>
                
                <div className="bg-background-lighter rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-2">Verbal Response</div>
                  <div className="text-lg font-medium">
                    "{transcript || "No transcript"}"
                  </div>
                </div>
              </div>

              {/* Transcript Edit */}
              {editMode && renderTranscriptEdit()}

              {/* Screenshot Section */}
              {hasScreenshot && (
                <div className="mt-6 pt-6 border-t border-gray-600">
                  <button
                    onClick={() => setShowImage(!showImage)}
                    className="flex items-center gap-2 text-gray-400 hover:text-foreground transition-colors mb-3"
                  >
                    <ImageIcon className="w-4 h-4" />
                    {showImage ? "Hide Work Screenshot" : "Show Work Screenshot"}
                  </button>
                  
                  {showImage && (
                    <div className="mt-4">
                      <img
                        src={currentResult.metadata.screenshot_url}
                        alt="Student's written work"
                        className="w-full rounded-lg border border-gray-600 max-h-64 object-contain"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {renderModerationActions()}
      </>
    );
  };

  const renderWordProblemCard = () => {
    const hasAudio = currentResult.metadata?.screenshot_url?.endsWith('.wav') || 
                     currentResult.metadata?.screenshot_url?.includes('audio');
    const transcript = editMode ? editedTranscript : 
                     (currentResult.metadata?.transcript || currentResult.student_answer || "");

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
              currentResult.metadata?.passed
                ? "bg-secondary-2/20 text-secondary-2"
                : "bg-red-400/20 text-red-400"
            }`}>
              {currentResult.metadata?.passed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              {currentResult.metadata?.passed ? "Correct" : "Incorrect"}
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Problem Statement Card */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
              <div className="text-sm text-gray-400 mb-3">Problem Statement</div>
              <div className="text-lg font-medium text-foreground leading-relaxed p-4 bg-background-lighter rounded-lg">
                "{currentResult.question}"
              </div>
            </div>

            {/* Answers Comparison Card */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
              <div className="text-sm text-gray-400 mb-4">Answers</div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-900/50 rounded-lg p-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-2">Expected Answer</div>
                    <div className="text-5xl font-bold text-secondary-2 py-4">
                      {currentResult.expected_number}
                    </div>
                  </div>
                </div>
                
                <div className={`rounded-lg p-6 ${
                  currentResult.metadata?.passed
                    ? "bg-secondary-2/10 border-2 border-secondary-2/30"
                    : "bg-red-400/10 border-2 border-red-400/30"
                }`}>
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-2">Student Answer</div>
                    <div className="text-5xl font-bold py-4">
                      <span className={currentResult.metadata?.passed ? "text-secondary-2" : "text-red-400"}>
                        {transcript}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transcript Edit */}
              {editMode && renderTranscriptEdit()}
            </div>

            {/* Audio Response Card */}
            {hasAudio && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                <div className="flex items-center gap-3 mb-4">
                  <Volume2 className="w-5 h-5 text-primary-3" />
                  <div className="text-sm text-gray-400">Student Response Audio</div>
                </div>
                <AudioPlayer currentResult={currentResult} />
              </div>
            )}
          </div>
        </div>
        {renderModerationActions()}
      </>
    );
  };

  return (
    <div className="bg-background-light rounded-xl shadow-lg border border-gray-600 overflow-hidden">
      {/* Header with Status */}
      <div className="border-b border-gray-600 p-4 bg-background-lighter">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-3 text-foreground font-bold">
              {currentIndex + 1}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground capitalize">
                {currentSection.replace(/_/g, ' ')}
              </h2>
              <p className="text-sm text-gray-400">
                Item {currentIndex + 1} of {assessmentData?.numeracy_results?.[currentSection]?.length || 0}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {currentResult.metadata?.moderated ? (
              <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">
                <CheckCircle className="w-4 h-4" />
                Moderated
              </div>
            ) : (
              <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm">
                <XCircle className="w-4 h-4" />
                Unmoderated
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="p-4">
        {renderSectionContent()}
      </div>
    </div>
  );
}