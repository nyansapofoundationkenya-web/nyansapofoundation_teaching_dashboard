import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  
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
        className={`mr-1 font-semibold ${
          matched ? "text-secondary-2" : "text-red-400"
        }`}
      >
        {word}
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

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-base font-semibold text-foreground mb-2">
            {allModerated ? "All Results Validated" : "Unvalidated Results"}
          </h2>
          <p className="text-sm text-gray-300">
            {stats.moderated}/{stats.total} results validated
            {!allModerated && ` (${stats.unmoderated} remaining)`}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-300">
            {currentIndex + 1}/{results.length}
          </div>
          {currentResult && !isResultModerated(currentResult) && (
            <div className="text-xs text-primary-3 mt-1">Not Moderated</div>
          )}
        </div>
      </div>

      <div className="mb-6 text-center">
        <div className="text-xl mb-4 leading-relaxed max-w-full break-words">
          {currentResult.type === "Letter" || currentResult.type === "Word" ? (
            <span
              className={`font-medium ${
                currentResult.metadata?.passed ? "text-secondary-2" : "text-red-400"
              }`}
            >
              {currentResult.content}
            </span>
          ) : (
            getColoredWords(currentResult.content, currentResult.metadata?.transcript).coloredWords
          )}
        </div>
        
        <div className="bg-background-lighter border border-gray-600 rounded-xl p-3 mb-4 max-w-md mx-auto">
          <h3 className="font-medium text-foreground mb-2">Model Prediction</h3>
          {editMode ? (
            <>
              <input
                type="text"
                value={editedTranscript}
                onChange={(e) => setEditedTranscript(e.target.value)}
                className="w-full p-2 border border-gray-500 rounded text-gray-300 bg-background"
                placeholder="Enter transcript"
              />
              {error && <p className="text-red-400 text-sm mt-2 max-w-full break-words">{error}</p>}
            </>
          ) : (
            <p className="text-gray-300 max-h-20 overflow-y-auto max-w-full break-words">
              {currentResult?.metadata?.transcript 
                ? currentResult?.metadata?.transcript
                : "No transcript available"
              }
            </p>
          )}
        </div>

        {children}
      </div>
    </>
  );
}