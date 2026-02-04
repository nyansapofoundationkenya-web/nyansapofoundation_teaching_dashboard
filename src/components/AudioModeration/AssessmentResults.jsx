// components/AudioModeration/AssessmentResults.jsx
"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useState, useRef } from "react";

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

  function normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // remove punctuation
      .split(/\s+/)
      .filter(Boolean);
  }

  function levenshteinAlignment(expectedWords, spokenWords) {
    const m = expectedWords.length;
    const n = spokenWords.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (expectedWords[i - 1] === spokenWords[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    // Backtrack to find matched and mismatched words
    const matchedIndices = new Set();
    let i = m, j = n;
    while (i > 0 && j > 0) {
      if (expectedWords[i - 1] === spokenWords[j - 1]) {
        matchedIndices.add(i - 1);
        i--;
        j--;
      } else if (dp[i - 1][j - 1] <= dp[i - 1][j] && dp[i - 1][j - 1] <= dp[i][j - 1]) {
        i--;
        j--;
      } else if (dp[i - 1][j] < dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    const mistakes = dp[m][n];
    return { mistakes, matchedIndices };
  }

  const getColoredWords = (content, transcript) => {
    if (!content) {
      return {
        coloredWords: null,
        stats: { totalWords: 0, mistakes: 0, accuracy: 0 },
      };
    }

    // Normalize both
    const expectedWords = normalizeText(content);
    const spokenWords = normalizeText(transcript || "");

    // Align using Levenshtein
    const { mistakes, matchedIndices } = levenshteinAlignment(expectedWords, spokenWords);

    const totalWords = expectedWords.length;
    const accuracy = totalWords ? Math.max(0, ((totalWords - mistakes) / totalWords) * 100) : 0;

    // Split original content (preserve punctuation for display)
    const contentWords = content.trim().split(/\s+/);

    const coloredWords = contentWords.map((word, index) => {
      const cleanWord = word.replace(/[^\w\s]/g, "").toLowerCase();
      const matched = matchedIndices.has(index);

      return (
        <span
          key={index}
          className={`${matched ? "text-secondary-2" : "text-red-400"}`}
        >
          {word}
          {index < contentWords.length - 1 && " "}
        </span>
      );
    });

    return {
      coloredWords,
      stats: { totalWords, mistakes, accuracy: accuracy.toFixed(1) },
    };
  };

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
  const coloredWords = getColoredWords(currentResult.content, currentResult.metadata?.transcript);

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
                  {coloredWords.stats.mistakes} mistakes
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
                {coloredWords.coloredWords}
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