"use client";
import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

export default function StudentAssessmentResults({ assessmentId, studentId, organizationId }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Get user data directly from Redux store
  const { user: currentUser, loading: userLoading } = useSelector((state) => state.auth);
  const userRole = currentUser?.role;

  // components/StudentAssessmentResults.jsx - Updated handleResultsClick
const handleResultsClick = (result, type, filteredIndex) => {
  // Map the type to URL-friendly format
  const typeMap = {
    'Letter Recognition': 'letter',
    'Word': 'word',
    'Paragraph': 'paragraph',
    'Story': 'story'
  };
  
  const section = typeMap[type] || type.toLowerCase();
  
  // Role-based check: Only allow admin or super_admin to proceed
  if (userRole === 'admin' || userRole === 'super_admin') {
    console.log(`Navigating to: section=${section}, index=${filteredIndex}`);
    
    router.push(
      `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?section=${section}&index=${filteredIndex}`
    );
  } else {
    alert('You do not have permission to access audio moderation. Please contact an administrator if you believe this is an error.');
  }
};

  const fetchStudentResults = async () => {
    try {
      setLoading(true);
      const resultsRef = doc(
        db,
        "assessments",
        assessmentId,
        "assessments-results",
        `${assessmentId}_${studentId}`
      );
      const resultsSnap = await getDoc(resultsRef);
      if (!resultsSnap.exists()) {
        throw new Error("Assessment results not found");
      }
      const data = resultsSnap.data();
      data.literacy_results = data.literacy_results || [];
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assessmentId && studentId) {
      fetchStudentResults();
    }
  }, [assessmentId, studentId]);

  // Updated function based on countMistakes logic
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

  if (loading) return <div className="text-foreground">Loading...</div>;
  if (error) return <div className="text-red-400">Error: {error}</div>;
  if (!results) return <div className="text-foreground">No data available</div>;

  const letterResults = results?.literacy_results?.reading_results?.filter(
    (result) => result?.metadata?.type === "Letter" || result?.type === "Letter"
  ) || [];
  const wordResults = results?.literacy_results?.reading_results?.filter(
    (result) => result?.metadata?.type === "Word"|| result?.type === "Word"
  ) || [];
  const paragraphResults = Array.isArray(results?.literacy_results?.reading_results)
    ? results.literacy_results.reading_results.filter((r) => r?.metadata?.type === "Paragraph" || r?.type === "Paragraph")
    : [];
  const storyResults = Array.isArray(results?.literacy_results?.reading_results)
    ? results.literacy_results.reading_results.filter((r) => r?.metadata?.type === "Story" || r?.type === "Story")
    : [];

  // Check for comprehension multiple choice questions in both formats
  const comprehensionMultipleChoice = results?.literacy_results?.comprehension_multiple_choice_questions || [];
  const flatMultipleChoice = results?.literacy_results?.multiple_choice_questions || [];

  // console.log(comprehensionMultipleChoice)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Literacy Assessment</h1>
      
      {/* Letter Results */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2 text-primary-3">Letter Results</h2>
        {letterResults.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {letterResults.map((result, index) => (
              <div
                key={index}
                onClick={() => handleResultsClick(result, "Letter Recognition", index)}
                className={`relative px-4 py-2 rounded-xl text-lg font-semibold border-2 min-w-[48px] text-center cursor-pointer hover:opacity-80 transition-opacity shadow-md hover:shadow-lg
                  ${result?.metadata?.passed
                    ? "border-secondary-2 text-foreground bg-secondary-2/10"
                    : "border-red-400 text-foreground bg-red-400/10"
                  }`}
              >
                <span className="block">{result.content}</span>
                {/* Status Badge */}
                <span
                  className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center shadow
                    ${result?.metadata?.passed ? "bg-secondary-2" : "bg-red-400"}`}
                >
                  {result?.metadata?.passed ? "✓" : "✕"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400">No letter results available</div>
        )}
      </div>

      {/* Word Results */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2 text-primary-3">Word Results</h2>
        {wordResults.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {wordResults.map((result, index) => (
              <div
                key={index}
                onClick={() => handleResultsClick(result, "Word", index)}
                className={`relative px-4 py-2 rounded-xl text-base font-semibold border-2 min-w-[72px] text-center cursor-pointer hover:opacity-80 transition-opacity shadow-md hover:shadow-lg
                  ${result?.metadata?.passed
                    ? "border-secondary-2 text-foreground bg-secondary-2/10"
                    : "border-red-400 text-foreground bg-red-400/10"
                  }`}
              >
                <span className="block">{result.content}</span>
                {/* Status Badge */}
                <span
                  className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center shadow
                    ${result?.metadata?.passed ? "bg-secondary-2" : "bg-red-400"}`}
                >
                  {result?.metadata?.passed ? "✓" : "✕"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400">No word results available</div>
        )}
      </div>

      {/* Paragraph Results */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-primary-3">Paragraph Results</h2>
        {paragraphResults.length > 0 ? (
          paragraphResults.map((result, index) => {
            const { coloredWords, stats } = getColoredWords(result.content, result?.metadata?.transcript);
            return (
              <div
                key={index}
                onClick={() => handleResultsClick(result, "Paragraph", index)}
                className="border-b border-gray-600 py-2 flex items-start justify-between gap-2 cursor-pointer hover:bg-background-lighter transition-colors px-2 rounded-xl"
              >
                <div className="flex-1 flex flex-wrap">
                  {coloredWords}
                </div>
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <span>{stats.mistakes}/{stats.totalWords} mistakes</span>
                  <span>›</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-gray-400">No paragraph results available</div>
        )}
      </div>

      {/* Story Results */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-primary-3">Story Results</h2>
        {storyResults.length > 0 ? (
          storyResults.map((result, index) => {
            const { coloredWords, stats } = getColoredWords(result.content, result?.metadata?.transcript);
            return (
              <div
                key={index}
                onClick={() => handleResultsClick(result, "Story", index)}
                className="border-b border-gray-600 py-2 flex items-start justify-between gap-2 cursor-pointer hover:bg-background-lighter transition-colors px-2 rounded-xl"
              >
                <div className="flex-1 flex flex-wrap">
                  {coloredWords}
                </div>
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <span>{stats.mistakes}/{stats.totalWords} mistakes</span>
                  <span>›</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-gray-400">No story results available</div>
        )}
      </div>

      {/* Comprehension Questions - New Structure (Grouped by Content) */}
      {comprehensionMultipleChoice.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-primary-3">Comprehension Questions</h2>
          {comprehensionMultipleChoice.map((contentGroup, contentIndex) => (
            <div key={contentIndex} className="mb-6 p-4 bg-background-lighter rounded-xl border border-gray-600">
              {/* Content/Story */}
              <div className="mb-4">
                <h3 className="font-medium text-sm text-gray-400 mb-2">Reading Passage:</h3>
                <div className="p-3 bg-background-light rounded-lg border border-gray-700">
                  <p className="text-foreground leading-relaxed">{contentGroup.content}</p>
                </div>
              </div>
              
              {/* Questions for this content */}
              <div className="space-y-4">
                {contentGroup.questions?.map((question, questionIndex) => (
                  <div key={questionIndex} className="p-4 bg-background-light rounded-lg border border-gray-700">
                    <p className="font-medium mb-3 text-foreground">{question.question}</p>
                    <ul className="list-none pl-0 space-y-2">
                      {question.options?.map((option, optIndex) => (
                        <li
                          key={optIndex}
                          className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                            option === question.student_answer
                              ? question.passed
                                ? "bg-secondary-2/20 text-secondary-2 border border-secondary-2/30"
                                : "bg-red-400/20 text-red-400 border border-red-400/30"
                              : "text-foreground hover:bg-gray-700/50"
                          }`}
                        >
                          <span>{option}</span>
                          {option === question.student_answer && (
                            <span className={`font-bold text-lg ${question.passed ? "text-secondary-2" : "text-red-400"}`}>
                              {question.passed ? "✓" : "✗"}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                    {/* Result summary for this question */}
                    <div className={`mt-2 text-sm font-medium ${question.passed ? "text-secondary-2" : "text-red-400"}`}>
                      {question.passed ? "Correct" : "Incorrect"}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Summary for this content group */}
              <div className="mt-4 pt-3 border-t border-gray-700">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">
                    Total questions: {contentGroup.questions?.length || 0}
                  </span>
                  <span className="font-medium text-foreground">
                    Score: {contentGroup.questions?.filter(q => q.passed).length || 0}/{contentGroup.questions?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comprehension Questions - Old Structure (Flat Array) */}
      {flatMultipleChoice.length > 0 && comprehensionMultipleChoice.length === 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-primary-3">Comprehension Questions</h2>
          {flatMultipleChoice.map((question, index) => (
            <div key={index} className="mb-4 p-4 bg-background-light rounded-xl border border-gray-600">
              <p className="font-medium mb-2 text-foreground">{question.question}</p>
              <ul className="list-none pl-0 text-gray-300">
                {question.options.map((option, optIndex) => (
                  <li
                    key={optIndex}
                    className={`flex items-center justify-between py-1 px-2 rounded-lg ${
                      option === question.student_answer
                        ? question.passed
                          ? "bg-secondary-2/20 text-secondary-2 border border-secondary-2/30"
                          : "bg-red-400/20 text-red-400 border border-red-400/30"
                        : "text-foreground"
                    }`}
                  >
                    <span>{option}</span>
                    {option === question.student_answer && (
                      <span className={`font-bold ${question.passed ? "text-secondary-2" : "text-red-400"}`}>
                        {question.passed ? "✓" : "✗"}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Show message if no comprehension questions in either format */}
      {comprehensionMultipleChoice.length === 0 && flatMultipleChoice.length === 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-primary-3">Comprehension Questions</h2>
          <div className="text-gray-400">No comprehension questions available</div>
        </div>
      )}
    </div>
  );
}