"use client"
import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { collection, getDocs, query, where, doc, deleteDoc } from "firebase/firestore"
import { db, storage } from "@/firebase/config"
import { ref, deleteObject } from "firebase/storage"
import { Users, UserCheck, AlertCircle, Eye } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AssessmentList({ organizationId, filters, searchQuery }) {
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()
  // Get user role from Redux
  const { user: currentUser } = useSelector((state) => state.auth)
  const userRole = currentUser?.role

  useEffect(() => {
    fetchAssessments()
  }, [organizationId, filters.projectId, filters.schoolId, filters.type, filters.level])

  const fetchAssessments = async () => {
    try {
      setLoading(true)
      setError(null)

      let q = query(
        collection(db, "assessments"),
        where("organization_id", "==", organizationId)
      )

      if (filters.projectId) q = query(q, where("project_id", "==", filters.projectId))
      if (filters.schoolId) q = query(q, where("school_id", "==", filters.schoolId))

      const snapshot = await getDocs(q)
      
      let assessmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Sort by created_at descending (most recent first)
      assessmentsData.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
        return dateB - dateA; // newest first
      })

      setAssessments(assessmentsData)
    } catch (err) {
      console.error(err)
      setError("Failed to load assessments")
    } finally {
      setLoading(false)
    }
  }

  // Count students who have a valid baseline (no has_done check)
  const countDone = (students) => {
    if (!Array.isArray(students)) return 0
    
    const validBaselines = [
      "beginner", "letter", "word", "paragraph", "story", "above",
      "non-reader", "reading-comprehension",
      "number_recognition","division","subtraction","addition","multiplication"
    ]

    return students.filter(s => 
      s.baseline && 
      validBaselines.includes(String(s.baseline).toLowerCase().trim())
    ).length
  }

  const safe = (val) => val ? String(val) : ""

  const matchesDate = (a) => {
    if (!filters.date) return true
    try {
      return new Date(a.created_at).toISOString().split("T")[0] === filters.date
    } catch { return true }
  }

  const filtered = assessments
    .filter(matchesDate)
    .filter(a => {
      if (filters.type && filters.type !== "all" && a.type !== filters.type) return false
      if (filters.level && filters.level !== "all" && a.level !== filters.level) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const text = `${a.name} ${a.type} ${a.level} ${a.description || ""}`.toLowerCase()
        if (!text.includes(q)) return false
      }
      return true
    })

  const goTo = (id) => router.push(`/dashboard/${organizationId}/moderations/${id}`)

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-background-light rounded-2xl shadow-lg border border-gray-600 overflow-hidden animate-pulse">
            <div className="bg-gradient-to-br from-primary-1 to-primary-2 p-6">
              <div className="h-8 bg-white/20 rounded mb-4 w-3/4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-white/20 rounded"></div>
                <div className="h-4 bg-white/20 rounded w-4/5"></div>
              </div>
              <div className="h-10 bg-white/20 rounded-xl mt-6"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error || filtered.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-400 text-lg mb-3">
          {error ? "Failed to load assessments" : "No assessments found"}
        </div>
        <div className="text-sm text-gray-500 max-w-md mx-auto">
          {error
            ? "Please try again."
            : "No assessments match the current filters."}
        </div>
        {error && (
          <button onClick={fetchAssessments} className="mt-4 text-primary-2 hover:underline text-sm">
            Try again
          </button>
        )}
      </div>
    )
  }

  // Delete assessment and related data
  const handleDelete = async (e, assessmentId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this assessment and all its data?")) return;
    try {
      // 1. Delete all assessment-results subcollection
      const resultsCol = collection(db, `assessments/${assessmentId}/assessments-results`);
      const resultsSnap = await getDocs(resultsCol);
      const deletePromises = [];
      for (const docSnap of resultsSnap.docs) {
        const resultData = docSnap.data();
        // Delete audio and screenshot files if present (both literacy and numeracy)
        const literacyResults = resultData.literacy_results?.reading_results || [];
        for (const res of literacyResults) {
          const audioUrl = res?.metadata?.audio_url;
          const screenshotUrl = res?.metadata?.screenshot_url;
          if (audioUrl && audioUrl.includes('firebasestorage.googleapis.com')) {
            const filePath = extractFilePathFromUrl(audioUrl);
            if (filePath) deletePromises.push(deleteObject(ref(storage, filePath)));
          }
          if (screenshotUrl && screenshotUrl.includes('firebasestorage.googleapis.com')) {
            const filePath = extractFilePathFromUrl(screenshotUrl);
            if (filePath) deletePromises.push(deleteObject(ref(storage, filePath)));
          }
        }
        const numeracyResults = resultData.numeracy_results || {};
        Object.values(numeracyResults).forEach(sectionArr => {
          (sectionArr || []).forEach(res => {
            const audioUrl = res?.metadata?.audio_url;
            const screenshotUrl = res?.metadata?.screenshot_url;
            if (audioUrl && audioUrl.includes('firebasestorage.googleapis.com')) {
              const filePath = extractFilePathFromUrl(audioUrl);
              if (filePath) deletePromises.push(deleteObject(ref(storage, filePath)));
            }
            if (screenshotUrl && screenshotUrl.includes('firebasestorage.googleapis.com')) {
              const filePath = extractFilePathFromUrl(screenshotUrl);
              if (filePath) deletePromises.push(deleteObject(ref(storage, filePath)));
            }
          });
        });
        // Delete the result document
        deletePromises.push(deleteDoc(docSnap.ref));
      }
      // 2. Delete the assessment document itself
      deletePromises.push(deleteDoc(doc(db, "assessments", assessmentId)));
      // 3. Wait for all deletions
      await Promise.allSettled(deletePromises);
      // 4. Refresh list
      setAssessments(prev => prev.filter(a => a.id !== assessmentId));
    } catch (err) {
      alert("Failed to delete assessment: " + err.message);
    }
  };

  // Helper to extract Firebase Storage file path from URL
  function extractFilePathFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const path = decodeURIComponent(urlObj.pathname);
      const match = path.match(/\/v0\/b\/[^/]+\/o\/(.+)/);
      if (match && match[1]) {
        return match[1];
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filtered.map((assessment) => {
        const total = assessment.assigned_students?.length || 0;
        const done = countDone(assessment.assigned_students);
        const remaining = total - done;
        const status = assessment.status || "not_started";
        const statusConfig = {
          not_started: { color: "bg-gray-500/20 text-gray-300 border-gray-500/30", label: "Not Started" },
          ongoing: { color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", label: "Ongoing" },
          completed: { color: "bg-green-500/20 text-green-300 border-green-500/30", label: "Completed" }
        };
        const currentStatus = statusConfig[status] || statusConfig.not_started;

        return (
          <div
            key={assessment.id}
            onClick={() => goTo(assessment.id)}
            className="bg-background-light rounded-2xl shadow-lg border border-gray-600 overflow-hidden hover:shadow-xl transition-all cursor-pointer group relative"
          >
            <div className="bg-gradient-to-br from-primary-1 to-primary-2 text-white p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold line-clamp-2 flex-1">
                  {safe(assessment.name) || "Untitled Assessment"}
                </h3>
                {/* Status Badge */}
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border whitespace-nowrap ml-2 ${currentStatus.color}`}>
                  {currentStatus.label}
                </span>
                {/* Delete Button - only for super_admin */}
                {userRole === 'super_admin' && (
                  <button
                    onClick={(e) => handleDelete(e, assessment.id)}
                    className="ml-2 px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-xs text-white font-bold shadow"
                    title="Delete Assessment"
                  >
                    Delete
                  </button>
                )}
              </div>
              {/* ...existing code... */}
              <div className="flex flex-wrap gap-2 mb-5">
                {assessment.type && (
                  <span className="px-3 py-1 bg-white/20 rounded-lg text-sm border border-white/30">
                    {assessment.type}
                  </span>
                )}
                {assessment.level && (
                  <span className="px-3 py-1 bg-white/20 rounded-lg text-sm border border-white/30">
                    {assessment.level}
                  </span>
                )}
              </div>
              {/* ...existing code... */}
              <div className="space-y-3 text-sm mb-6">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{total} Assigned</span>
                </div>
                {/* ...existing code... */}
                {done > 0 && (
                  <div className="flex items-center gap-2 text-green-300 font-medium">
                    <UserCheck className="w-4 h-4" />
                    <span>{done} Done</span>
                  </div>
                )}
                {remaining > 0 && (
                  <div className="flex items-center gap-2 text-red-300 font-medium">
                    <AlertCircle className="w-4 h-4" />
                    <span>{remaining} remaining</span>
                  </div>
                )}
                {done === 0 && total > 0 && (
                  <div className="flex items-center gap-2 text-yellow-300 font-medium">
                    <AlertCircle className="w-4 h-4" />
                    <span>No students have done this assessment yet</span>
                  </div>
                )}
                {total === 0 && (
                  <div className="flex items-center gap-2 text-gray-300 font-medium">
                    <AlertCircle className="w-4 h-4" />
                    <span>No students assigned</span>
                  </div>
                )}
                {assessment.created_at && (
                  <div className="text-xs opacity-80">
                    {new Date(assessment.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
              {/* ...existing code... */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(assessment.id);
                }}
                className="w-full bg-primary-3 hover:bg-yellow-400 text-primary-1 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}