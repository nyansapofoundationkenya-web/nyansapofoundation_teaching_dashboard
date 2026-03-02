// app/dashboard/[organizationId]/assessments/[assessmentId]/students/[studentId]/results/page.jsx
"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { getColoredWords } from "@/utils/wordComparison";

export default function StudentAssessmentResults({ assessmentId, studentId, organizationId }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const { user: currentUser, loading: userLoading } = useSelector((state) => state.auth);
  const userRole = currentUser?.role;

  const handleResultsClick = (result, type, filteredIndex) => {
    const typeMap = {
      "Letter Recognition": "letter",
      Word: "word",
      Paragraph: "paragraph",
      Story: "story",
    };

    const section = typeMap[type] || type.toLowerCase();

    if (userRole === "admin" || userRole === "super_admin") {
      router.push(
        `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?section=${section}&index=${filteredIndex}`
      );
    } else {
      alert("You do not have permission to access audio moderation.");
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

  // Format timestamp (e.g. "Feb 10, 2026 11:20 AM")
  const formatDoneTime = (timeStr) => {
    if (!timeStr) return "—";
    try {
      const date = new Date(timeStr);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return timeStr; // fallback to raw if parsing fails
    }
  };

  if (loading) return <div className="text-foreground">Loading...</div>;
  if (error) return <div className="text-red-400">Error: {error}</div>;
  if (!results) return <div className="text-foreground">No data available</div>;

  const letterResults =
    results?.literacy_results?.reading_results?.filter(
      (r) => r?.metadata?.type === "Letter" || r?.type === "Letter"
    ) || [];
  const wordResults =
    results?.literacy_results?.reading_results?.filter(
      (r) => r?.metadata?.type === "Word" || r?.type === "Word"
    ) || [];
  const paragraphResults = Array.isArray(results?.literacy_results?.reading_results)
    ? results.literacy_results.reading_results.filter(
        (r) => r?.metadata?.type === "Paragraph" || r?.type === "Paragraph"
      )
    : [];
  const storyResults = Array.isArray(results?.literacy_results?.reading_results)
    ? results.literacy_results.reading_results.filter(
        (r) => r?.metadata?.type === "Story" || r?.type === "Story"
      )
    : [];

  const comprehensionMultipleChoice = results?.literacy_results?.comprehension_multiple_choice_questions || [];
  const flatMultipleChoice = results?.literacy_results?.multiple_choice_questions || [];

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
                className={`relative px-4 py-3 rounded-xl text-lg font-semibold border-2 min-w-[60px] text-center cursor-pointer hover:opacity-80 transition-opacity shadow-md hover:shadow-lg
                  ${result?.metadata?.passed
                    ? "border-secondary-2 text-foreground bg-secondary-2/10"
                    : "border-red-400 text-foreground bg-red-400/10"}`}
              >
                <span className="block">{result.content}</span>

                {/* Status badge */}
                <span
                  className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center shadow
                    ${result?.metadata?.passed ? "bg-secondary-2" : "bg-red-400"}`}
                >
                  {result?.metadata?.passed ? "✓" : "✕"}
                </span>

                {/* Done time */}
                {result?.metadata?.done_time && (
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDoneTime(result.metadata.done_time)}
                  </div>
                )}
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
                className={`relative px-4 py-3 rounded-xl text-base font-semibold border-2 min-w-[90px] text-center cursor-pointer hover:opacity-80 transition-opacity shadow-md hover:shadow-lg
                  ${result?.metadata?.passed
                    ? "border-secondary-2 text-foreground bg-secondary-2/10"
                    : "border-red-400 text-foreground bg-red-400/10"}`}
              >
                <span className="block">{result.content}</span>

                <span
                  className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center shadow
                    ${result?.metadata?.passed ? "bg-secondary-2" : "bg-red-400"}`}
                >
                  {result?.metadata?.passed ? "✓" : "✕"}
                </span>

                {result?.metadata?.done_time && (
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDoneTime(result.metadata.done_time)}
                  </div>
                )}
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
                className="border-b border-gray-600 py-3 px-3 rounded-xl cursor-pointer hover:bg-background-lighter transition-colors flex flex-col gap-2"
              >
                <div className="flex flex-wrap gap-1">{coloredWords}</div>

                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-400">
                    {stats.mistakes}/{stats.totalWords} mistakes • {stats.accuracy}% accuracy
                  </span>
                  {result?.metadata?.done_time && (
                    <span className="text-gray-500">
                      Done: {formatDoneTime(result.metadata.done_time)}
                    </span>
                  )}
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
                className="border-b border-gray-600 py-3 px-3 rounded-xl cursor-pointer hover:bg-background-lighter transition-colors flex flex-col gap-2"
              >
                <div className="flex flex-wrap gap-1">{coloredWords}</div>

                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-400">
                    {stats.mistakes}/{stats.totalWords} mistakes • {stats.accuracy}% accuracy
                  </span>
                  {result?.metadata?.done_time && (
                    <span className="text-gray-500">
                      Done: {formatDoneTime(result.metadata.done_time)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-gray-400">No story results available</div>
        )}
      </div>

      {/* Comprehension Questions */}
      {comprehensionMultipleChoice.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-primary-3">Comprehension Questions</h2>
          {comprehensionMultipleChoice.map((contentGroup, contentIndex) => (
            <div key={contentIndex} className="mb-6 p-4 bg-background-lighter rounded-xl border border-gray-600">
              <div className="mb-4">
                <h3 className="font-medium text-sm text-gray-400 mb-2">Reading Passage:</h3>
                <div className="p-3 bg-background-light rounded-lg border border-gray-700">
                  <p className="text-foreground leading-relaxed">{contentGroup.content}</p>
                </div>
              </div>

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
                    <div className={`mt-2 text-sm font-medium ${question.passed ? "text-secondary-2" : "text-red-400"}`}>
                      {question.passed ? "Correct" : "Incorrect"}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-700">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">
                    Total questions: {contentGroup.questions?.length || 0}
                  </span>
                  <span className="font-medium text-foreground">
                    Score: {contentGroup.questions?.filter((q) => q.passed).length || 0}/{contentGroup.questions?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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

      {comprehensionMultipleChoice.length === 0 && flatMultipleChoice.length === 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-primary-3">Comprehension Questions</h2>
          <div className="text-gray-400">No comprehension questions available</div>
        </div>
      )}
    </div>
  );
}