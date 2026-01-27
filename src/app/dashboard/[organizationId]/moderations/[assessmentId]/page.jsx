"use client";

import { useState, useEffect ,useMemo} from "react";
import { useParams,useRouter } from "next/navigation";
import Search from "@/components/Assessments/Search";
import GradeFilter from "@/components/Assessments/GradeFIlter";
import StudentsList from "@/components/Assessments/StudentsList";
import StudentMetrics from "@/components/Assessments/StudentMetrics";
import DashboardLayout from "@/app/dashboard/[organizationId]/DashboardLayout";
import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";

export default function AssessmentDetailsPage() {
  const { organizationId, assessmentId } = useParams();
  const router = useRouter();

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All Grades");
  const backUrl = `/dashboard/${organizationId}/moderations`;

  /* ------------------------------------------------------------------ */
  /*  Fetch the assessment from Firestore                               */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const assessmentRef = doc(db, "assessments", assessmentId);
        const snap = await getDoc(assessmentRef);
undefined
        if (!snap.exists()) throw new Error("Assessment not found");

        setAssessment({ id: snap.id, ...snap.data() });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [assessmentId]);

  const handleSearchChange = (q) => setSearchQuery(q);
  const handleGradeFilterChange = (g) => setGradeFilter(g);
  const assessmentType = assessment?.type || "literacy";

  /* ------------------------------------------------------------------ */
  /*  Filter students (search + grade)                                   */
  /* ------------------------------------------------------------------ */
 // Pre-filter: Get only linked students first
const eligibleStudents = useMemo(() => {
  return assessment?.assigned_students?.filter((s) => {
    const isEligible = s.linked === true || s.has_done === true;
    console.log(`Pre-filter check - Student ${s.first_name} ${s.last_name}: linked=${s.linked}, has_done=${s.has_done}, eligible=${isEligible}`); // Debug each
    return isEligible;
  }) ?? [];
}, [assessment?.assigned_students]); // Depend only on raw data

console.log('Eligible students (linked OR has_done):', eligibleStudents); // Should show only those passing OR

// Now apply search + grade on the eligible list
const filteredStudents = useMemo(() => {
  return eligibleStudents.filter((s) => {
    const matchesSearch = `${s.first_name} ${s.last_name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesGrade =
      gradeFilter === "All Grades" || String(s.grade) === gradeFilter;
    const isEligible = s.linked === true || s.has_done === true; // Re-check for logging, but it's already filtered
    console.log(`Full filter - Student ${s.first_name} ${s.last_name}: search=${matchesSearch}, grade=${matchesGrade}, eligible=${isEligible}`); // Debug the rest
    return matchesSearch && matchesGrade && isEligible; // The && isEligible is redundant here but explicit
  });
}, [eligibleStudents, searchQuery, gradeFilter]); // Depend on pre-filtered + vars
  /* ------------------------------------------------------------------ */
  /*  Loading state (inside DashboardLayout)                             */
  /* ------------------------------------------------------------------ */
  if (loading) {
    return (
      <DashboardLayout title="Assessment Details" organizationId={organizationId}>
        <div className="p-6 space-y-6">
          <StudentMetrics loading={true} />
          <div className="bg-background-light rounded-2xl shadow-lg p-6 border border-gray-600">
            <div className="animate-pulse">
              <div className="h-6 bg-background-lighter rounded w-48 mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-background-lighter rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Error state                                                       */
  /* ------------------------------------------------------------------ */
  if (error) {
    return (
      <DashboardLayout title="Assessment Details" organizationId={organizationId}>
        <div className="p-6 flex items-center justify-center min-h-[300px]">
          <div className="text-red-400">Error: {error}</div>
        </div>
      </DashboardLayout>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Not-found state                                                   */
  /* ------------------------------------------------------------------ */
  if (!assessment) {
    return (
      <DashboardLayout title="Assessment Details" organizationId={organizationId}>
        <div className="p-6 flex items-center justify-center min-h-[300px]">
          <div className="text-foreground">Assessment not found</div>
        </div>
      </DashboardLayout>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Main page content                                                 */
  /* ------------------------------------------------------------------ */
  return (
    <DashboardLayout title={assessment.name} organizationId={organizationId}>
      <div className="p-6 space-y-6">
        {/* Header row – title, grade filter & search */}
        <div className="bg-background-light border-b border-gray-600 px-6 py-4 rounded-2xl shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Left Section (Back + Title stacked vertically) */}
            <div className="flex flex-col">
              <div
                onClick={() => router.push(backUrl)}
                className="flex items-center text-gray-300 hover:text-white cursor-pointer w-fit mb-2"
              >
                <ArrowLeft size={18} className="mr-1" />
                <span className="text-sm font-medium">Back</span>
              </div>

              <h1 className="text-xl font-semibold text-foreground">{assessment.name}</h1>
            </div>

            {/* Right Section (Filters + Search) */}
            <div className="flex items-center gap-4">
              <GradeFilter
                selectedGrade={gradeFilter}
                onGradeChange={handleGradeFilterChange}
                students={assessment.assigned_students}
              />
              <Search
                onSearchChange={handleSearchChange}
                placeholder="Search for a student"
              />
            </div>
          </div>
        </div>

        {/* Student metrics */}
        <StudentMetrics students={filteredStudents} loading={loading} assessmentId={assessmentId} />

        {/* Students list */}
        <div className="bg-background-light rounded-2xl shadow-lg p-6 border border-gray-600">
          <h2 className="text-lg font-semibold mb-4 text-foreground">
            Assigned Students ({filteredStudents.length})
          </h2>

          {filteredStudents.length > 0 ? (
            <StudentsList
              students={filteredStudents}
              organizationId={organizationId}
              assessmentId={assessmentId}
            />
          ) : (
            <div className="text-center py-8 text-gray-400">
              No students match your search criteria
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}