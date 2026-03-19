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
  onFlaggingComplete, // ← passed down from page.jsx
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

        if (!resultsSnap.exists()) throw new Error("Assessment results not found");

        setResults(resultsSnap.data());
      } catch (err) {
        setError(err.message);
        // If results fail to load, unblock the parent so the confirm button
        // doesn't stay disabled forever on a fetch error.
        onFlaggingComplete?.();
      } finally {
        setLoading(false);
      }
    };

    fetchStudentResults();
  }, [assessmentId, studentId]);

  if (loading) return <div className="text-foreground">Loading assessment results...</div>;

  if (error || !results) {
    return <div className="text-foreground">No assessments results available for this student</div>;
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