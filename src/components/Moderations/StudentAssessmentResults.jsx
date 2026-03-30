// components/Moderations/StudentAssessmentResults.jsx
"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import LiteracyAssessmentResults from "./LiteracyAssessmentResults";
import NumeracyAssessmentResults from "./NumeracyAssessmentResults";

export default function StudentAssessmentResults({ 
  assessmentId, 
  studentId, 
  organizationId, 
  assessmentType = "literacy",
  onFlaggingComplete,
  onHasAnswersChange, 
}) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!assessmentId || !studentId) return;

    const fetchStudentResults = async () => {
      try {
        setLoading(true);
        const resultsRef  = doc(db, "assessments", assessmentId, "assessments-results", `${assessmentId}_${studentId}`);
        const resultsSnap = await getDoc(resultsRef);

        if (!resultsSnap.exists()) {
          setError("Assessment results not found");
          onHasAnswersChange?.(false);
          onFlaggingComplete?.();
          return;
        }

        const data = resultsSnap.data();
        setResults(data);

        // NEW: Determine if there are actual answers and notify parent
        const hasRealAnswers = hasMeaningfulResults(data, assessmentType);
        onHasAnswersChange?.(hasRealAnswers);

      } catch (err) {
        console.error(err);
        setError(err.message);
        onHasAnswersChange?.(false);
        onFlaggingComplete?.();
      } finally {
        setLoading(false);
      }
    };

    fetchStudentResults();
  }, [assessmentId, studentId, assessmentType, onHasAnswersChange, onFlaggingComplete]);

  // Simple but reliable helper - trusts the same logic the UI uses
  const hasMeaningfulResults = (data, type) => {
    if (!data) return false;
    const t = type.toLowerCase();

    if (t === "literacy") {
      const lit = data.literacy_results || {};
      return (
        (lit.reading_results || []).length > 0 ||
        (lit.comprehension_multiple_choice_questions || []).length > 0 ||
        (lit.multiple_choice_questions || []).length > 0
      );
    }

    if (t === "numeracy") {
      const num = data.numeracy_results || {};
      return Object.values(num).some(section => 
        Array.isArray(section) && section.length > 0
      );
    }

    return false;
  };

  if (loading) return <div className="text-foreground">Loading assessment results...</div>;

  if (error || !results) {
    return <div className="text-foreground">No assessment results available for this student</div>;
  }

  if (assessmentType.toLowerCase() === "numeracy") {
    return (
      <NumeracyAssessmentResults
        assessmentId={assessmentId}
        studentId={studentId}
        organizationId={organizationId}
        results={results}
        onFlaggingComplete={onFlaggingComplete}
      />
    );
  }

  return (
    <LiteracyAssessmentResults
      assessmentId={assessmentId}
      studentId={studentId}
      organizationId={organizationId}
      results={results}
      onFlaggingComplete={onFlaggingComplete}
    />
  );
}