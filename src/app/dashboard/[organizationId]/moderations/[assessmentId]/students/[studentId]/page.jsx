"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import StudentChart from "@/components/Students/StudentChart";
import StudentAssessmentResults from "@/components/Moderations/StudentAssessmentResults";
import DashboardLayout from "@/app/dashboard/[organizationId]/DashboardLayout";
import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";

// Define competence levels for both types
const COMPETENCE_LEVELS = {
  literacy: {
    "beginner": 0,
    "letter": 1,
    "word": 2,
    "paragraph": 3,
    "story": 4,
    "above": 5
  },
  numeracy: {
    "beginner": 0,
    "number_recognition": 1,
    "addition": 2,
    "subtraction": 3,
    "multiplication": 4,
    "division": 5,
    "above": 6
  }
};

export default function StudentDetailsPage() {
  const { organizationId, assessmentId, studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch assessment to get assigned_students array
        const assessmentRef = doc(db, "assessments", assessmentId);
        const assessmentSnap = await getDoc(assessmentRef);

        if (!assessmentSnap.exists()) throw new Error("Assessment not found");
        const assessmentData = assessmentSnap.data();
        setAssessment(assessmentData);

        // 2. Find the specific student in the assigned_students array
        const assignedStudents = assessmentData.assigned_students || [];
        const foundStudent = assignedStudents.find(student => student.id === studentId);

        if (!foundStudent) throw new Error("Student not found in assessment");

        setStudent({
          id: foundStudent.id,
          first_name: foundStudent.first_name,
          last_name: foundStudent.last_name,
          grade: foundStudent.grade,
          sex: foundStudent.sex,
          baseline: foundStudent.baseline,
          has_done: foundStudent.has_done,
          group: foundStudent.group,
          // Add any other fields you need from the assigned_students array
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (organizationId && assessmentId && studentId) {
      fetchData();
    }
  }, [organizationId, assessmentId, studentId]);

  console.log(student);

  /* ------------------------------------------------------------------ */
  /*  Loading State                                                     */
  /* ------------------------------------------------------------------ */
  if (loading) {
    return (
      <DashboardLayout title="Student Details" organizationId={organizationId}>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-foreground">Loading student data...</div>
        </div>
      </DashboardLayout>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Error State                                                       */
  /* ------------------------------------------------------------------ */
  if (error) {
    return (
      <DashboardLayout title="Student Details" organizationId={organizationId}>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-red-400">Error: {error}</div>
        </div>
      </DashboardLayout>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Not Found State                                                   */
  /* ------------------------------------------------------------------ */
  if (!student || !assessment) {
    return (
      <DashboardLayout title="Student Details" organizationId={organizationId}>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-foreground">Data not found</div>
        </div>
      </DashboardLayout>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Main Content                                                      */
  /* ------------------------------------------------------------------ */
  const pageTitle = `${student.first_name} ${student.last_name}`;
  const assessmentType = assessment.type?.toLowerCase() || 'literacy';
  const baseline = student?.baseline || "";

  return (
    <DashboardLayout title={pageTitle} organizationId={organizationId}>
      {/* Scrollable content area */}
      <div className="h-full overflow-auto">
        <div className="p-6 space-y-6">
          {/* Student Header */}
          <div className="bg-background-light rounded-2xl shadow-lg p-6 border border-gray-600">
            <h1 className="text-2xl font-bold text-foreground">
              {student.first_name} {student.last_name}
            </h1>
            <h2 className="text-lg text-gray-300 mt-1">{baseline}</h2>
            <div className="mt-2">
              <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                {assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)} Assessment
              </span>
              {/* <span className="inline-block ml-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Grade {student.grade}
              </span>
              <span className="inline-block ml-2 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                {student.sex}
              </span> */}
            </div>
          </div>

          {/* Baseline Chart */}
          <div className="bg-background-light rounded-2xl shadow-lg p-6 border border-gray-600">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Assessment Results - {assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)}
            </h2>
            <StudentChart 
              baseline={baseline} 
              assessmentType={assessmentType}
            />
          </div>

          {/* Assessment Results Table */}
          <div className="bg-background-light rounded-2xl shadow-lg p-6 border border-gray-600">
            <StudentAssessmentResults
              assessmentId={assessmentId}
              studentId={studentId}
              organizationId={organizationId}
              assessmentType={assessmentType}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}