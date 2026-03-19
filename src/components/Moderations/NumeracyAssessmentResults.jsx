// components/Moderations/NumeracyAssessmentResults.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { useFlagItem } from "@/hooks/useFlagItem";

export default function NumeracyAssessmentResults({
  assessmentId,
  studentId,
  organizationId,
  results,
  onFlaggingComplete, 
}) {
  const [localResults, setLocalResults] = useState(null);
  const autoFlaggedRef                  = useRef(false);
  const router                          = useRouter();
  const { flagNumeracyItem }            = useFlagItem(assessmentId, studentId, "numeracy");

  useEffect(() => {
    if (!results || autoFlaggedRef.current) return;
    setLocalResults(results);
    autoFlaggedRef.current = true;

    autoFlagAll(results).finally(() => {
      // Notify parent that flagging is done (whether items were flagged or not)
      onFlaggingComplete?.();
    });
  }, [results]);

  const autoFlagAll = async (data) => {
    const numeracy = data?.numeracy_results || {};

    for (const section of Object.keys(numeracy)) {
      const arr = numeracy[section];
      if (!Array.isArray(arr)) continue;

      for (let i = 0; i < arr.length; i++) {
        const item        = arr[i];
        const passed      = item?.metadata?.passed ?? item?.passed;
        const isModerated = item?.metadata?.modeltranscriptionverified === true;

        if (passed !== false || item?.flagged === true || isModerated) continue;

        try {
          await flagNumeracyItem(section, i);
          setLocalResults(prev => {
            const sectionArr = [...(prev.numeracy_results[section] || [])];
            sectionArr[i]    = { ...sectionArr[i], flagged: true };
            return {
              ...prev,
              numeracy_results: { ...prev.numeracy_results, [section]: sectionArr },
            };
          });
        } catch (err) {
          console.error(`Auto-flag failed for ${section}[${i}]:`, err);
        }
      }
    }
  };

  const handleResultsClick = (result, type, section, index) => {
    router.push(
      `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/numeracymoderation?section=${section}&index=${index}`
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

  const getOperationSymbol = (type) => {
    switch (type?.toLowerCase()) {
      case "addition":       return "+";
      case "subtraction":    return "−";
      case "multiplication": return "×";
      case "division":       return "÷";
      default:               return "";
    }
  };

  const FlagIndicator = ({ flagged }) => {
    if (!flagged) return null;
    return (
      <div className="absolute top-1.5 right-1.5 z-10" title="Flagged for review">
        <Flag size={12} className="text-orange-400" fill="currentColor" />
      </div>
    );
  };

  if (!localResults) return <div className="text-foreground">Loading...</div>;

  const numeracyResults   = localResults.numeracy_results || {};
  const additionOps       = getOperationsByType(numeracyResults.number_operations, "addition");
  const subtractionOps    = getOperationsByType(numeracyResults.number_operations, "subtraction");
  const multiplicationOps = getOperationsByType(numeracyResults.number_operations, "multiplication");
  const divisionOps       = getOperationsByType(numeracyResults.number_operations, "division");

  const OperationCard = ({ operation, opType, globalIndex }) => {
    const section = "number_operations";
    const passed  = operation.metadata?.passed;
    return (
      <div
        onClick={() => handleResultsClick(operation, opType, section, globalIndex)}
        className="relative rounded-lg p-4 cursor-pointer transition-all hover:scale-105 min-w-[80px] border border-gray-600 flex flex-col justify-between"
      >
        <FlagIndicator flagged={operation.flagged} />
        <div className="text-center space-y-1">
          <div className="text-xl font-semibold text-gray-300">{operation.operations_number1}</div>
          <div className="text-xl font-semibold text-gray-300">
            <span className="mr-2">{getOperationSymbol(opType)}</span>
            {operation.operations_number2}
          </div>
          <div className="border-t-2 border-gray-500 my-1" />
          <div className={`text-xl font-bold ${passed ? "text-green-400" : "text-red-400"}`}>
            {operation.expected_answer}
          </div>
        </div>
        {operation.metadata?.done_time && (
          <div className="text-xs text-gray-500 mt-2 text-center">
            {formatDoneTime(operation.metadata.done_time)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Numeracy Assessment</h1>

      {/* ── Count and Match ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-primary-3">Count and match</h2>
        {numeracyResults.count_and_match?.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {numeracyResults.count_and_match.map((item, index) => (
              <div key={index} className="relative">
                <FlagIndicator flagged={item.flagged} />
                <div
                  onClick={() => handleResultsClick(item, "Count and Match", "count_and_match", index)}
                  className={`w-16 h-16 flex items-center justify-center rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                    item.passed ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"
                  }`}
                >
                  <div className={`text-2xl font-bold ${item.passed ? "text-green-400" : "text-red-400"}`}>
                    {item.expected_number}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400">No count and match results available</div>
        )}
      </div>

      {/* ── Highest Value ───────────────────────────────────────────────── */}
      {numeracyResults.highest_value?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-primary-3">Highest Value</h2>
          <div className="flex flex-wrap gap-4">
            {numeracyResults.highest_value.map((item, index) => (
              <div
                key={index}
                onClick={() => handleResultsClick(item, "Highest Value", "highest_value", index)}
                className={`relative rounded-lg p-4 cursor-pointer transition-all hover:scale-105 min-w-[120px] border-2 ${
                  item.passed ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"
                }`}
              >
                <FlagIndicator flagged={item.flagged} />
                <div className="text-center space-y-2">
                  <div className="text-sm font-medium text-gray-400 mb-1">{item.type || "Highest Value"}</div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-500">Expected:</span>
                    <div className={`text-xl font-bold ${item.passed ? "text-green-400" : "text-red-400"}`}>
                      {item.expected_number}
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-500">Student:</span>
                    <div className="text-lg font-semibold text-foreground">{item.student_number}</div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-600">
                    <div className="text-xs text-gray-400 mb-1">Values:</div>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {item.values?.map((value, idx) => (
                        <span key={idx} className={`px-2 py-1 rounded text-sm ${
                          value === item.expected_number && item.passed  ? "bg-green-400/20 text-green-300" :
                          value === item.student_number  && !item.passed ? "bg-red-400/20 text-red-300"
                                                                         : "bg-gray-700 text-gray-300"
                        }`}>
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={`mt-2 text-sm font-medium px-2 py-1 rounded ${
                    item.passed ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  }`}>
                    {item.passed ? "✓ Correct" : "✗ Incorrect"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Number Recognition ──────────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-primary-3">Number recognition</h2>
        {numeracyResults.number_recognition?.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {numeracyResults.number_recognition.map((item, index) => (
              <div key={index} className="relative">
                <FlagIndicator flagged={item.flagged} />
                <div
                  onClick={() => handleResultsClick(item, "Number Recognition", "number_recognition", index)}
                  className={`w-16 h-20 flex flex-col items-center justify-center rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                    item.metadata?.passed ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"
                  }`}
                >
                  <div className={`text-2xl font-bold ${item.metadata?.passed ? "text-green-400" : "text-red-400"}`}>
                    {item.content}
                  </div>
                  {item.metadata?.done_time && (
                    <div className="text-[10px] text-gray-500 mt-1">
                      {formatDoneTime(item.metadata.done_time)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400">No number recognition results available</div>
        )}
      </div>

      {/* ── Operations ──────────────────────────────────────────────────── */}
      {[
        { label: "Addition",       ops: additionOps },
        { label: "Subtraction",    ops: subtractionOps },
        { label: "Multiplication", ops: multiplicationOps },
        { label: "Division",       ops: divisionOps },
      ].map(({ label, ops }) =>
        ops.length > 0 ? (
          <div key={label} className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-primary-3">{label}</h2>
            <div className="flex flex-wrap gap-4">
              {ops.map((op) => (
                <OperationCard
                  key={numeracyResults.number_operations.indexOf(op)}
                  operation={op}
                  opType={label.toLowerCase()}
                  globalIndex={numeracyResults.number_operations.indexOf(op)}
                />
              ))}
            </div>
          </div>
        ) : null
      )}

      {/* ── Word Problems ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-primary-3">Word Problems</h2>
        {numeracyResults.word_problem?.length > 0 ? (
          numeracyResults.word_problem.map((problem, index) => (
            <div
              key={index}
              className="relative mb-4 p-4 bg-background-light rounded-xl border border-gray-600 cursor-pointer hover:border-primary-3 transition-colors"
              onClick={() => handleResultsClick(problem, "Word Problem", "word_problem", index)}
            >
              <FlagIndicator flagged={problem.flagged} />
              <div className="flex items-start justify-between mb-3 pr-6">
                <p className="font-medium text-foreground flex-1">{problem.question}</p>
                <span className={`ml-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  problem.metadata?.passed ? "bg-secondary-2/20 text-secondary-2" : "bg-red-400/20 text-red-400"
                }`}>
                  {problem.metadata?.passed ? "✓ Correct" : "✗ Incorrect"}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-background-lighter">
                  <span className="text-gray-400">Expected Answer:</span>
                  <span className="text-foreground font-medium">{problem.expected_number}</span>
                </div>
                <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                  problem.metadata?.passed
                    ? "bg-secondary-2/20 text-secondary-2 border border-secondary-2/30"
                    : "bg-red-400/20 text-red-400 border border-red-400/30"
                }`}>
                  <span>Student Answer:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">
                      {problem.metadata?.transcript || problem.student_answer || "No answer provided"}
                    </span>
                    <span className={`font-bold ${problem.metadata?.passed ? "text-secondary-2" : "text-red-400"}`}>
                      {problem.metadata?.passed ? "✓" : "✗"}
                    </span>
                  </div>
                </div>
              </div>
              {problem.metadata?.done_time && (
                <div className="mt-3 pt-2 text-right text-sm text-gray-500 border-t border-gray-700">
                  Done: {formatDoneTime(problem.metadata.done_time)}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-gray-400">No word problem results available</div>
        )}
      </div>
    </div>
  );
}

function getOperationsByType(operations, type) {
  if (!operations || !Array.isArray(operations)) return [];
  return operations.filter(op => op.type?.toLowerCase() === type.toLowerCase());
}