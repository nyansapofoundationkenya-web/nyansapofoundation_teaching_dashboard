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
  assessmentType = 'literacy' 
}) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <div className="text-foreground">Loading assessment results...</div>;
  if (error || !results) {
  return (
    <div className="text-foreground">
      No assessments results available for this student
    </div>
  );
}
  // Render the appropriate component based on assessment type
  if (assessmentType.toLowerCase() === 'numeracy') {
    return (
      <NumeracyAssessmentResults
        assessmentId={assessmentId}
        studentId={studentId}
        organizationId={organizationId}
        results={results}
      />
    );
  }

  // Default to literacy
  return (
    <LiteracyAssessmentResults
      assessmentId={assessmentId}
      studentId={studentId}
      organizationId={organizationId}
      results={results}
    />
  );
}