"use client"
import { useState, useEffect } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/firebase/config"
import { Users, UserCheck, AlertCircle, Eye } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AssessmentList({ organizationId, filters, searchQuery }) {
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

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
      
      const assessmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // REMOVED the filter that only kept assessments with completed students
      // Now we show ALL assessments regardless of student completion status
      setAssessments(assessmentsData)
    } catch (err) {
      console.error(err)
      setError("Failed to load assessments")
    } finally {
      setLoading(false)
    }
  }

  const countCompleted = (students) => {
    if (!Array.isArray(students)) return 0
    const valid = ["beginner", "letter", "word", "paragraph", "story"]
    return students.filter(s => 
      s.has_done === true && 
      s.baseline && 
      valid.includes(String(s.baseline).toLowerCase().trim())
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filtered.map((assessment) => {
        const total = assessment.assigned_students?.length || 0
        const completed = countCompleted(assessment.assigned_students)
        const remaining = total - completed

        return (
          <div
            key={assessment.id}
            onClick={() => goTo(assessment.id)}
            className="bg-background-light rounded-2xl shadow-lg border border-gray-600 overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="bg-gradient-to-br from-primary-1 to-primary-2 text-white p-6">
              <h3 className="text-xl font-semibold mb-3 line-clamp-2">
                {safe(assessment.name) || "Untitled Assessment"}
              </h3>

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

              <div className="space-y-3 text-sm mb-6">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{total} Assigned</span>
                </div>

                {/* Completed — shown when ≥1 */}
                {completed > 0 && (
                  <div className="flex items-center gap-2 text-green-300 font-medium">
                    <UserCheck className="w-4 h-4" />
                    <span>{completed} Completed</span>
                  </div>
                )}

                {/* Remaining — shown when >0 */}
                {remaining > 0 && (
                  <div className="flex items-center gap-2 text-red-300 font-medium">
                    <AlertCircle className="w-4 h-4" />
                    <span>{remaining} remaining</span>
                  </div>
                )}

                {/* Show message when no students have completed */}
                {completed === 0 && total > 0 && (
                  <div className="flex items-center gap-2 text-yellow-300 font-medium">
                    <AlertCircle className="w-4 h-4" />
                    <span>No students completed yet</span>
                  </div>
                )}

                {/* Show message when no students are assigned */}
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

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goTo(assessment.id)
                }}
                className="w-full bg-primary-3 hover:bg-yellow-400 text-primary-1 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}