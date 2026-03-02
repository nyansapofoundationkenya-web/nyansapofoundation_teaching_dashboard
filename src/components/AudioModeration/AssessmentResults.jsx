// components/AudioModeration/AssessmentResults.jsx
"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getColoredWords, getComparisonStats } from "@/utils/wordComparison";

export default function AssessmentResults({
  hasNoResults,
  results,
  currentIndex,
  currentResult,
  editMode,
  editedTranscript,
  setEditedTranscript,
  error,
  areAllResultsModerated,
  getModerationStats,
  isResultModerated,
  getNextUnmoderatedIndex,
  children
}) {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    // Check if content overflows its container
    if (contentRef.current) {
      const element = contentRef.current;
      setIsOverflowing(element.scrollHeight > element.clientHeight || 
                       element.scrollWidth > element.clientWidth);
    }
  }, [currentResult]);

  if (hasNoResults) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto mb-3 bg-background-lighter/50 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-2">No Assessment Results</h2>
          <p className="text-gray-300 max-w-md mx-auto">
            This student doesn't have any assessment rounds to moderate. 
            You can proceed to the next student.
          </p>
        </div>
        {children}
      </div>
    );
  }

  const allModerated = areAllResultsModerated(results);
  const stats = getModerationStats(results);
  
  // Get colored words for paragraph/story content
  const coloredWordsResult = getColoredWords(
    currentResult.content, 
    currentResult.metadata?.transcript,
    {
      correctClass: "text-secondary-2",
      incorrectClass: "text-red-400",
      wordClassName: "", // Add any additional classes if needed
      showSpace: true
    }
  );

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Round Progress</span>
          <span>{currentIndex + 1}/{results.length}</span>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-secondary-2 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / results.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Content Display */}
      <div className="space-y-6">
        {/* Expected Text Card */}
        <div className="bg-background-lighter rounded-xl border border-gray-600 overflow-hidden">
          <div className="p-6 border-b border-gray-600">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Expected Text</h3>
              {currentResult.type === "Letter" || currentResult.type === "Word" ? (
                <div className={`px-3 py-1 rounded-lg font-medium ${
                  currentResult.metadata?.passed 
                    ? "bg-secondary-2/20 text-secondary-2" 
                    : "bg-red-400/20 text-red-400"
                }`}>
                  {currentResult.metadata?.passed ? "✓ Correct" : "✗ Incorrect"}
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  {coloredWordsResult.stats.mistakes} mistakes
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6">
            {currentResult.type === "Letter" || currentResult.type === "Word" ? (
              <div className={`text-4xl font-bold text-center py-4 ${
                currentResult.metadata?.passed ? "text-secondary-2" : "text-red-400"
              }`}>
                {currentResult.content}
              </div>
            ) : (
              <div 
                ref={contentRef}
                className="text-lg leading-relaxed whitespace-pre-wrap break-words overflow-y-auto max-h-[400px]"
              >
                {coloredWordsResult.coloredWords}
                {isOverflowing && (
                  <div className="text-xs text-gray-500 text-right mt-2">
                    Scroll to see more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Model Prediction Card */}
        <div className="bg-background-lighter rounded-xl border border-gray-600 overflow-hidden">
          <div className="p-6 border-b border-gray-600">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Model Prediction</h3>
              <div className="text-sm text-gray-400">
                {currentResult.metadata?.transcript ? 
                  `${currentResult.metadata.transcript.split(/\s+/).length} words` : 
                  "No transcript"
                }
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {editMode ? (
              <div className="space-y-3">
                <textarea
                  value={editedTranscript}
                  onChange={(e) => setEditedTranscript(e.target.value)}
                  className="w-full p-3 border border-gray-500 rounded-lg text-gray-300 bg-background resize-y min-h-32 text-base leading-relaxed"
                  placeholder="Enter transcript"
                  rows={6}
                />
                {error && <p className="text-red-400 text-sm max-w-full break-words">{error}</p>}
              </div>
            ) : (
              <div 
                className="w-full p-3 rounded-lg bg-background border border-transparent text-gray-300 break-words whitespace-pre-wrap max-h-[400px] overflow-y-auto text-base leading-relaxed cursor-text"
              >
                {currentResult?.metadata?.transcript 
                  ? currentResult.metadata.transcript
                  : "No transcript available"
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Children (Audio Player & Actions) */}
      {children}
    </div>
  );
}