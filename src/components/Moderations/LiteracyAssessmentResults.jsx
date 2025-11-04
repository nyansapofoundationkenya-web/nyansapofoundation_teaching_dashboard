"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function StudentAssessmentResults({ assessmentId, studentId, organizationId }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleResultsClick = (result, type, filteredIndex) => {
    // Calculate the original index in reading_results
    const readingResults = results?.literacy_results?.reading_results || [];
    const originalIndex = readingResults.findIndex((r) => r === result);

    router.push(
      // `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?round=${originalIndex}`
    );
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

  const getColoredWords = (content, transcript) => {
    if (!content) return null;

    const contentWords = content.trim().split(/\s+/);
    const transcriptWords = (transcript || "").trim().toLowerCase().split(/\s+/);

    let transcriptIndex = 0;

    return contentWords.map((word, index) => {
      const cleanWord = word.replace(/[.,!?;:"""'']/g, "").toLowerCase();
      let matched = false;

      while (transcriptIndex < transcriptWords.length) {
        const transcriptWord = transcriptWords[transcriptIndex];
        if (transcriptWord === cleanWord) {
          matched = true;
          transcriptIndex++;
          break;
        } else {
          transcriptIndex++;
        }
      }

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
          paragraphResults.map((result, index) => (
            <div
              key={index}
              onClick={() => handleResultsClick(result, "Paragraph", index)}
              className="border-b border-gray-600 py-2 flex items-start justify-between gap-2 cursor-pointer hover:bg-background-lighter transition-colors px-2 rounded-xl"
            >
              <div className="flex-1 flex flex-wrap">
                {getColoredWords(result.content, result?.metadata?.transcript)}
              </div>
              <div className="text-sm text-gray-400">›</div>
            </div>
          ))
        ) : (
          <div className="text-gray-400">No paragraph results available</div>
        )}
      </div>

      {/* Story Results */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-primary-3">Story Results</h2>
        {storyResults.length > 0 ? (
          storyResults.map((result, index) => (
            <div
              key={index}
              onClick={() => handleResultsClick(result, "Story", index)}
              className="border-b border-gray-600 py-2 flex items-start justify-between gap-2 cursor-pointer hover:bg-background-lighter transition-colors px-2 rounded-xl"
            >
              <div className="flex-1 flex flex-wrap">
                {getColoredWords(result.content, result?.metadata?.transcript)}
              </div>
              <div className="text-sm text-gray-400">›</div>
            </div>
          ))
        ) : (
          <div className="text-gray-400">No story results available</div>
        )}
      </div>

      {/* Comprehension Questions */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-4 text-primary-3">Comprehension Questions</h2>
        {results?.literacy_results?.multiple_choice_questions?.length > 0 ? (
          results.literacy_results.multiple_choice_questions.map((question, index) => (
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
          ))
        ) : (
          <div className="text-gray-400">No comprehension questions available</div>
        )}
      </div>
    </div>
  );
}