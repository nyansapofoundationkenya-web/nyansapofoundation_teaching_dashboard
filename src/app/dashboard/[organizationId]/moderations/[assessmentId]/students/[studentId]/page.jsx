"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import StudentChart from "@/components/Students/StudentChart";
import MediaUploadProgress from "@/components/Moderations/MediaUploadProgress";
import StudentAssessmentResults from "@/components/Moderations/StudentAssessmentResults";
import DashboardLayout from "@/app/dashboard/[organizationId]/DashboardLayout";
import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft, User } from "lucide-react";

export default function StudentDetailsPage() {
  const { organizationId, assessmentId, studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [instructorName, setInstructorName] = useState(null);
  const [showAssessedBy, setShowAssessedBy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch assessment document
        const assessmentRef = doc(db, "assessments", assessmentId);
        const assessmentSnap = await getDoc(assessmentRef);

        if (!assessmentSnap.exists()) throw new Error("Assessment not found");
        const assessmentData = assessmentSnap.data();
        setAssessment(assessmentData);

        // Fetch assessment result to get instructorId
        const resultId = `${assessmentId}_${studentId}`;
        const resultRef = doc(db, "assessments", assessmentId, "assessments-results", resultId);
        const resultSnap = await getDoc(resultRef);
        
        if (resultSnap.exists()) {
          const resultData = resultSnap.data();
          const instructorId = resultData.instructor_id;
          
          // Only show assessed by if instructorId exists
          if (instructorId) {
            try {
              const userRef = doc(db, "user", instructorId);
              const userSnap = await getDoc(userRef);
              
              if (userSnap.exists()) {
                const userData = userSnap.data();
                setInstructorName(userData.name || userData.email || 'Unknown Instructor');
                setShowAssessedBy(true);
              }
            } catch (instructorErr) {
              console.error("Error fetching instructor:", instructorErr);
            }
          }
        }
        
        // Get student info from assessment's assigned_students
        const assignedStudents = assessmentData.assigned_students || [];
        const foundStudent = assignedStudents.find((s) => s.id === studentId);

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

  if (loading) {
    return (
      <DashboardLayout title="Student Details" organizationId={organizationId} currentSection={"assessments"}>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-foreground">Loading student data...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Student Details" organizationId={organizationId} currentSection={"assessments"}>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-red-400">Error: {error}</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!student || !assessment) {
    return (
      <DashboardLayout title="Student Details" organizationId={organizationId} currentSection={"assessments"}>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-foreground">Data not found</div>
        </div>
      </DashboardLayout>
    );
  }

  const pageTitle = `${student.first_name} ${student.last_name}`;
  const assessmentType = assessment.type?.toLowerCase() || "literacy";
  const baseline = student?.baseline || "";
  const backUrl = `/dashboard/${organizationId}/moderations/${assessmentId}`;

  return (
    <DashboardLayout title={pageTitle} organizationId={organizationId} currentSection={"assessments"}>
      <div className="h-full overflow-auto">
        <div className="p-6 space-y-6">
          {/* Student Header */}
          <div className="bg-background-light rounded-2xl shadow-lg p-6 border border-gray-600">
            <div
              onClick={() => router.push(backUrl)}
              className="flex items-center text-gray-300 hover:text-white cursor-pointer w-fit mb-4"
            >
              <ArrowLeft size={18} className="mr-1" />
              <span className="text-sm font-medium">Back</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {student.first_name} {student.last_name}
            </h1>
            <h2 className="text-lg text-gray-300 mt-1 font-medium">
              Baseline: {baseline || "Not assessed"}
            </h2>
            
            {/* Assessed By Section - Only show if we have instructor info */}
            {showAssessedBy && instructorName && (
              <div className="mt-3 flex items-center gap-2 text-gray-300">
                <User size={16} className="text-gray-400" />
                <span className="text-sm">
                  <span className="font-medium">Assessed by:</span> {instructorName}
                </span>
              </div>
            )}
            
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                {assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)} Assessment
              </span>
              {student.grade && (
                <span className="inline-block bg-green-600/80 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Grade {student.grade}
                </span>
              )}
              {student.sex && (
                <span className="inline-block bg-purple-600/80 text-white px-3 py-1 rounded-full text-sm font-medium capitalize">
                  {student.sex}
                </span>
              )}
            </div>
          </div>

          {/* Side-by-side: Chart + Media Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left - Baseline Chart */}
            <div className="bg-background-light rounded-2xl shadow-lg p-6 border border-gray-600">
              <h2 className="text-xl font-semibold mb-4 text-foreground">
                Baseline Progress - {assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)}
              </h2>
              <StudentChart
                baseline={baseline}
                assessmentType={assessmentType}
                calculationType={assessment?.calculation_type || ""}
              />
            </div>

            {/* Right - Media Upload & Completion */}
            <MediaUploadProgress
              assessmentId={assessmentId}
              studentId={studentId}
            />
          </div>

          {/* Bottom - Assessment Results Table */}
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