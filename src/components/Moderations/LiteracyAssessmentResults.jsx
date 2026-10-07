// components/Moderations/LiteracyAssessmentResults.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Flag, RotateCw, Loader2 } from "lucide-react";
import { getAuth } from "firebase/auth";
import { db } from "@/firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { getColoredWords } from "@/utils/wordComparison";
import { useFlagItem } from "@/hooks/useFlagItem";

// Types that get auto-graded once a transcript comes back: the target
// `content` is looked up as a contiguous token run anywhere in the
// transcript (so "the cat", "cat cat", and "kat cat" all count as a
// correct attempt for "cat"). Paragraph/story are scored by word-diff
// accuracy shown inline in the UI, not a pass/fail boolean, so they're
// excluded — retranscribing them only ever updates metadata.transcript.
const AUTO_GRADED_TYPES = ["letter", "word"];

// Tokenizes a string into lowercase Unicode letter/number runs, so
// punctuation and spacing differences don't matter ("Cat", "cat.",
// " the  cat " all yield clean tokens). Using \p{L}\p{N} rather than
// [a-z0-9] keeps this working on Swahili transcripts with characters
// outside plain ASCII.
const tokenizeForComparison = (str) => {
  if (!str) return [];
  return str.toString().toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
};

// Returns true/false for letter/word items, or undefined for anything else
// (including when there's no target content to compare against) — callers
// should only write `passed` into metadata when this returns a boolean.
//
// Instead of requiring the WHOLE transcript to equal the target (which
// broke on self-corrections and extra words), this checks whether the
// target appears anywhere as a contiguous run of tokens in the transcript.
// That handles:
//   cat  vs "the cat"     → ["the","cat"] contains ["cat"] ✓
//   cat  vs "cat cat"     → contains ["cat"] ✓
//   cat  vs "kat cat"     → self-corrected, contains ["cat"] ✓
//   ship vs "sheep ship"  → self-corrected, contains ["ship"] ✓
//   a    vs "a a"         → contains ["a"] ✓
//   cat  vs "kat" only    → no correct attempt anywhere → fails ✓
const determinePassedFromTranscript = (type, content, transcript) => {
  const normalizedType = (type || "").toLowerCase();
  if (!AUTO_GRADED_TYPES.includes(normalizedType)) return undefined;

  const targetTokens = tokenizeForComparison(content);
  if (targetTokens.length === 0) return undefined;

  const transcriptTokens = tokenizeForComparison(transcript);
  if (transcriptTokens.length === 0) return false;

  // Slide a window the size of the target across the transcript tokens
  // looking for a contiguous match. For single-token targets (the common
  // case for letters/words) this is effectively a membership check.
  const targetLen = targetTokens.length;
  for (let i = 0; i + targetLen <= transcriptTokens.length; i++) {
    let match = true;
    for (let j = 0; j < targetLen; j++) {
      if (transcriptTokens[i + j] !== targetTokens[j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
};

export default function LiteracyAssessmentResults({
  assessmentId,
  studentId,
  organizationId,
  results: initialResults,
  assessmentLanguage = "english", // passed down from assessments/{assessmentId}.language
  onFlaggingComplete, // called when autoFlagAll finishes
}) {
  const [results, setResults]   = useState(null);
  const autoFlaggedRef          = useRef(false);
  const router                  = useRouter();
  const { user: currentUser }   = useSelector((state) => state.auth);
  const userRole                = currentUser?.role;
  const isSuperAdmin            = userRole === "super_admin";

  const { flagLiteracyReadingItem } = useFlagItem(assessmentId, studentId, "literacy");

  // ── Bulk retranscription state ──────────────────────────────────────────
  const [retranscribing, setRetranscribing]             = useState(false);
  const [retranscribeProgress, setRetranscribeProgress] = useState({ done: 0, total: 0 });
  const [retranscribeSummary, setRetranscribeSummary]   = useState(null);
  // retranscribeSummary shape: { success, failed, failures, gradedPassed, gradedFailed }

  useEffect(() => {
    if (!initialResults || autoFlaggedRef.current) return;

    const data = { ...initialResults };
    data.literacy_results = data.literacy_results || {};
    data.literacy_results.reading_results = data.literacy_results.reading_results || [];

    setResults(data);
    autoFlaggedRef.current = true;

    autoFlagAll(data).finally(() => {
      // Notify parent that flagging is done (whether items were flagged or not)
      onFlaggingComplete?.();
    });
  }, [initialResults]);

  const autoFlagAll = async (data) => {
    const readingResults = data?.literacy_results?.reading_results || [];

    for (let i = 0; i < readingResults.length; i++) {
      const item        = readingResults[i];
      const passed      = item?.metadata?.passed;
      const isModerated = item?.metadata?.modeltranscriptionverified === true;

      if (passed !== false || item?.flagged === true || isModerated) continue;

      try {
        await flagLiteracyReadingItem(i);
        setResults(prev => {
          const arr = [...(prev.literacy_results.reading_results || [])];
          arr[i]    = { ...arr[i], flagged: true };
          return { ...prev, literacy_results: { ...prev.literacy_results, reading_results: arr } };
        });
      } catch (err) {
        console.error(`Auto-flag failed for reading_results[${i}]:`, err);
      }
    }
  };

  // ── Bulk retranscribe ──────────────────────────────────────────────────
  // Eligible item = has an audio_url AND metadata.transcript is missing or
  // empty. NOT restricted to unmoderated items — some rounds were moderated
  // (pass/fail decided by ear) before a transcript ever existed, and those
  // need backfilling too.
  //
  // For letter/word items, once a transcript comes back the target `content`
  // is looked up as a contiguous token run anywhere in the transcript (so
  // "the cat", "cat cat", and "kat cat" all count as a correct attempt for
  // "cat"), and metadata.passed is written in the SAME update as the
  // transcript. Paragraph/story items only ever get metadata.transcript
  // touched — they're scored by word-diff accuracy in the UI, not a
  // boolean, so passed is left as-is for those.
  //
  // Items are sent to /api/retranscription ONE AT A TIME — the backend can
  // hit Gradio cold starts / rate limits, and concurrent requests are the
  // most likely way to make that worse. Firestore is updated after EVERY
  // successful item using a local `workingResults` array (not React state,
  // which updates async and could be stale mid-loop), so an interrupted
  // batch or a single failed item never loses earlier progress.
  const readingResultsForActions = results?.literacy_results?.reading_results || [];

  const missingTranscriptItems = readingResultsForActions
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => {
      const hasTranscript = !!(item?.metadata?.transcript && item.metadata.transcript.trim() !== "");
      const hasAudio      = !!item?.metadata?.audio_url;
      return hasAudio && !hasTranscript;
    });

  const handleBulkRetranscribe = async () => {
    if (retranscribing || missingTranscriptItems.length === 0) return;

    setRetranscribing(true);
    setRetranscribeSummary(null);

    const targets = missingTranscriptItems;
    const total   = targets.length;
    let successCount = 0;
    let gradedPassed  = 0;
    let gradedFailed  = 0;
    const failures  = [];

    let workingResults = [...readingResultsForActions];

    try {
      const auth  = getAuth();
      const token = await auth.currentUser.getIdToken();
      const docRef = doc(
        db, "assessments", assessmentId, "assessments-results", `${assessmentId}_${studentId}`
      );

      for (let i = 0; i < targets.length; i++) {
        const { idx, item } = targets[i];
        setRetranscribeProgress({ done: i, total });

        try {
          const res = await fetch("/api/retranscription", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              assessmentId,
              studentId,
              globalIndex: idx,
              language: assessmentLanguage,
            }),
          });

          // Read as text first — a platform-level timeout returns an
          // HTML/plain-text error page, not JSON, and res.json() would
          // throw a SyntaxError instead of the actual error we want.
          const rawText = await res.text();
          let data;
          try {
            data = rawText ? JSON.parse(rawText) : {};
          } catch {
            throw new Error(
              res.status === 504
                ? "Timed out — model may be slow right now"
                : `HTTP ${res.status}`
            );
          }
          if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
          if (!data.transcript) throw new Error("No transcript returned");

          const itemType = (item?.metadata?.type || item?.type || "").toLowerCase();
          const passed = determinePassedFromTranscript(itemType, item?.content, data.transcript);
          if (passed === true) gradedPassed++;
          if (passed === false) gradedFailed++;

          workingResults = [...workingResults];
          workingResults[idx] = {
            ...workingResults[idx],
            metadata: {
              ...workingResults[idx].metadata,
              transcript: data.transcript,
              ...(passed !== undefined ? { passed } : {}),
            },
          };

          await updateDoc(docRef, { "literacy_results.reading_results": workingResults });

          setResults(prev => ({
            ...prev,
            literacy_results: { ...prev.literacy_results, reading_results: workingResults },
          }));

          successCount++;
        } catch (err) {
          console.error(`Retranscription failed for reading_results[${idx}]:`, err);
          failures.push({ idx, label: item?.content, error: err.message });
        }
      }
    } finally {
      setRetranscribeProgress({ done: total, total });
      setRetranscribeSummary({ success: successCount, failed: failures.length, failures, gradedPassed, gradedFailed });
      setRetranscribing(false);
    }
  };

  const handleResultsClick = (result, type, filteredIndex) => {
    const typeMap = { "Letter Recognition": "letter", Word: "word", Paragraph: "paragraph", Story: "story" };
    const section = typeMap[type] || type.toLowerCase();
      router.push(
        `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?section=${section}&index=${filteredIndex}`
      );
  };

  const formatDoneTime = (timeStr) => {
    if (!timeStr) return "—";
    try {
      return new Date(timeStr).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit", hour12: true,
      });
    } catch { return timeStr; }
  };

  const FlagIndicator = ({ flagged }) => {
    if (!flagged) return null;
    return (
      <div className="absolute top-1.5 right-1.5 z-10" title="Flagged for review">
        <Flag size={12} className="text-orange-400" fill="currentColor" />
      </div>
    );
  };

  if (!results) return <div className="text-foreground">Loading...</div>;

  const literacyResults = results.literacy_results || {};
  const readingResults  = literacyResults.reading_results || [];

  const letterResults    = readingResults.filter(r => r?.metadata?.type === "Letter"    || r?.type === "Letter");
  const wordResults      = readingResults.filter(r => r?.metadata?.type === "Word"      || r?.type === "Word");
  const paragraphResults = readingResults.filter(r => r?.metadata?.type === "Paragraph" || r?.type === "Paragraph");
  const storyResults     = readingResults.filter(r => r?.metadata?.type === "Story"     || r?.type === "Story");

  const comprehensionMultipleChoice = literacyResults.comprehension_multiple_choice_questions || [];
  const flatMultipleChoice          = literacyResults.multiple_choice_questions || [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Literacy Assessment</h1>

      {/* ── Bulk Retranscribe (super admin only) ─────────────────────────── */}
      {isSuperAdmin && (
        <div
          className="mb-6 rounded-xl border p-4"
          style={{ background: 'rgba(90,162,206,0.06)', borderColor: 'rgba(90,162,206,0.25)' }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--primary-2)' }}>Missing Transcripts</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {missingTranscriptItems.length > 0
                  ? `${missingTranscriptItems.length} item${missingTranscriptItems.length > 1 ? 's' : ''} have audio but no transcript yet (includes already-moderated items). Letters/words will be auto-graded against the target text.`
                  : "All items with audio already have a transcript."}
              </p>
            </div>
            <button
              onClick={handleBulkRetranscribe}
              disabled={retranscribing || missingTranscriptItems.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'rgba(90,162,206,0.15)', border: '1px solid rgba(90,162,206,0.4)', color: 'var(--primary-2)' }}
              onMouseEnter={e => {
                if (!retranscribing && missingTranscriptItems.length > 0) {
                  e.currentTarget.style.background = 'rgba(90,162,206,0.22)';
                  e.currentTarget.style.borderColor = 'rgba(90,162,206,0.6)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(90,162,206,0.15)';
                e.currentTarget.style.borderColor = 'rgba(90,162,206,0.4)';
              }}
            >
              {retranscribing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Retranscribing {retranscribeProgress.done}/{retranscribeProgress.total}…
                </>
              ) : (
                <>
                  <RotateCw size={14} />
                  Retranscribe Missing ({missingTranscriptItems.length})
                </>
              )}
            </button>
          </div>

          {retranscribeSummary && (
            <div className="mt-3 text-xs space-y-1">
              <div style={{ color: retranscribeSummary.failed > 0 ? 'var(--secondary-1)' : 'var(--secondary-2)' }}>
                Done: {retranscribeSummary.success} succeeded
                {retranscribeSummary.failed > 0 && `, ${retranscribeSummary.failed} failed`}.
              </div>
              {(retranscribeSummary.gradedPassed > 0 || retranscribeSummary.gradedFailed > 0) && (
                <div className="text-gray-400">
                  Auto-graded letters/words: <span style={{ color: 'var(--secondary-2)' }}>{retranscribeSummary.gradedPassed} passed</span>
                  {", "}
                  <span style={{ color: '#ef4444' }}>{retranscribeSummary.gradedFailed} failed</span>
                </div>
              )}
              {retranscribeSummary.failed > 0 && (
                <ul className="mt-1 list-disc list-inside text-gray-400">
                  {retranscribeSummary.failures.map((f, i) => (
                    <li key={i}>Item #{f.idx + 1}: {f.error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Letter Results ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2 text-primary-3">Letter Results</h2>
        {letterResults.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {letterResults.map((result, index) => (
              <div
                key={index}
                onClick={() => handleResultsClick(result, "Letter Recognition", index)}
                className={`relative px-4 py-3 rounded-xl text-lg font-semibold border-2 min-w-[60px] text-center cursor-pointer hover:opacity-80 transition-opacity shadow-md hover:shadow-lg ${
                  result?.metadata?.passed
                    ? "border-secondary-2 text-foreground bg-secondary-2/10"
                    : "border-red-400 text-foreground bg-red-400/10"
                }`}
              >
                <FlagIndicator flagged={result.flagged} />
                <span className="block">{result.content}</span>
                <span className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center shadow ${
                  result?.metadata?.passed ? "bg-secondary-2" : "bg-red-400"
                }`}>
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
          <div className="text-gray-400">No letter results available</div>
        )}
      </div>

      {/* ── Word Results ─────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2 text-primary-3">Word Results</h2>
        {wordResults.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {wordResults.map((result, index) => (
              <div
                key={index}
                onClick={() => handleResultsClick(result, "Word", index)}
                className={`relative px-4 py-3 rounded-xl text-base font-semibold border-2 min-w-[90px] text-center cursor-pointer hover:opacity-80 transition-opacity shadow-md hover:shadow-lg ${
                  result?.metadata?.passed
                    ? "border-secondary-2 text-foreground bg-secondary-2/10"
                    : "border-red-400 text-foreground bg-red-400/10"
                }`}
              >
                <FlagIndicator flagged={result.flagged} />
                <span className="block">{result.content}</span>
                <span className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center shadow ${
                  result?.metadata?.passed ? "bg-secondary-2" : "bg-red-400"
                }`}>
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

      {/* ── Paragraph Results ────────────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-primary-3">Paragraph Results</h2>
        {paragraphResults.length > 0 ? (
          paragraphResults.map((result, index) => {
            const { coloredWords, stats } = getColoredWords(result.content, result?.metadata?.transcript);
            return (
              <div
                key={index}
                onClick={() => handleResultsClick(result, "Paragraph", index)}
                className="relative border-b border-gray-600 py-3 px-3 rounded-xl cursor-pointer hover:bg-background-lighter transition-colors flex flex-col gap-2"
              >
                <FlagIndicator flagged={result.flagged} />
                <div className="flex flex-wrap gap-1 pr-5">{coloredWords}</div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-400">
                    {stats.mistakes}/{stats.totalWords} mistakes • {stats.accuracy}% accuracy
                  </span>
                  {result?.metadata?.done_time && (
                    <span className="text-gray-500">Done: {formatDoneTime(result.metadata.done_time)}</span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-gray-400">No paragraph results available</div>
        )}
      </div>

      {/* ── Story Results ────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-primary-3">Story Results</h2>
        {storyResults.length > 0 ? (
          storyResults.map((result, index) => {
            const { coloredWords, stats } = getColoredWords(result.content, result?.metadata?.transcript);
            return (
              <div
                key={index}
                onClick={() => handleResultsClick(result, "Story", index)}
                className="relative border-b border-gray-600 py-3 px-3 rounded-xl cursor-pointer hover:bg-background-lighter transition-colors flex flex-col gap-2"
              >
                <FlagIndicator flagged={result.flagged} />
                <div className="flex flex-wrap gap-1 pr-5">{coloredWords}</div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-400">
                    {stats.mistakes}/{stats.totalWords} mistakes • {stats.accuracy}% accuracy
                  </span>
                  {result?.metadata?.done_time && (
                    <span className="text-gray-500">Done: {formatDoneTime(result.metadata.done_time)}</span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-gray-400">No story results available</div>
        )}
      </div>

      {/* ── Comprehension Questions (nested groups) ──────────────────────── */}
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
                  <div key={questionIndex} className="relative p-4 bg-background-light rounded-lg border border-gray-700">
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
                  <span className="text-gray-400">Total questions: {contentGroup.questions?.length || 0}</span>
                  <span className="font-medium text-foreground">
                    Score: {contentGroup.questions?.filter(q => q.passed).length || 0}/{contentGroup.questions?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Flat Multiple Choice ─────────────────────────────────────────── */}
      {flatMultipleChoice.length > 0 && comprehensionMultipleChoice.length === 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-primary-3">Comprehension Questions</h2>
          {flatMultipleChoice.map((question, index) => (
            <div key={index} className="relative mb-4 p-4 bg-background-light rounded-xl border border-gray-600">
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