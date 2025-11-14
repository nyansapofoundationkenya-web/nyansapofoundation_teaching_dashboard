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
  
  const getColoredWords = (content, transcript) => {
    if (!content) return { coloredWords: null, stats: { totalWords: 0, mistakes: 0, isCompleteMismatch: false } };

    // Clean and split expected content into words (for matching only)
    const expectedClean = content.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(word => word.length > 0);
    
    // Clean and split transcript into words (consistent cleaning)
    const transcriptWords = (transcript || "").toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);

    const totalWords = expectedClean.length;
    let mistakes = 0;
    let transcriptIndex = 0;
    let matchedIndices = new Set(); // Track which expected words were matched (by clean index)

    // Sequential matching like countMistakes
    for (let i = 0; i < expectedClean.length; i++) {
      const expectedWord = expectedClean[i];
      let found = false;
      for (let j = transcriptIndex; j < transcriptWords.length; j++) {
        if (transcriptWords[j] === expectedWord) {
          transcriptIndex = j + 1;
          found = true;
          matchedIndices.add(i);
          break;
        }
      }
      if (!found) {
        mistakes++;
      }
    }

    const isCompleteMismatch = mistakes === totalWords;

    // Now generate colored JSX using original content words
    // Split original content to preserve punctuation/spacing
    const contentWords = content.trim().split(/\s+/);
    const coloredWords = contentWords.map((word, index) => {
      // Map original word index to clean index (approximate, assuming 1:1 after cleaning)
      // This is a simplification; for exact mapping, you'd need to align cleaned vs original positions
      // But since cleaning mostly removes punctuation (not adding/removing words), index ≈ clean index
      const cleanIndex = index; // Fallback assumption
      const cleanWord = word.replace(/[^\w\s]/g, '').toLowerCase();
      
      // Check if this clean word was matched (using the set)
      const matched = matchedIndices.has(cleanIndex) || (expectedClean[cleanIndex] === cleanWord && matchedIndices.has(cleanIndex));
      
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
      stats: { totalWords, mistakes, isCompleteMismatch } 
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