"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/firebase/config"
import { Users, UserCheck, Eye } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AssessmentList({ organizationId, filters, searchQuery }) {
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter();

  useEffect(() => {
    fetchAssessments()
  }, [organizationId, filters.projectId, filters.schoolId]) // Remove filters.date from dependency to avoid refetching

  const fetchAssessments = async () => {
    try {
      setLoading(true)
      setError(null)

      let assessmentsQuery = query(collection(db, "assessments"), where("organization_id", "==", organizationId))

      // Add project filter if selected
      if (filters.projectId) {
        assessmentsQuery = query(assessmentsQuery, where("project_id", "==", filters.projectId))
      }

      // Add school filter if selected
      if (filters.schoolId) {
        assessmentsQuery = query(assessmentsQuery, where("school_id", "==", filters.schoolId))
      }

      const assessmentsSnapshot = await getDocs(assessmentsQuery)
      const assessmentsData = assessmentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setAssessments(assessmentsData)
    } catch (error) {
      console.error("Error fetching assessments:", error)
      setError("Failed to load assessments")
    } finally {
      setLoading(false)
    }
  }

  // Helper function to safely get count from data
  const getCount = (data) => {
    if (typeof data === "number") {
      return data
    }
    if (Array.isArray(data)) {
      return data.length
    }
    if (typeof data === "object" && data !== null) {
      // If it's an object, try to get the length of its keys or values
      return Object.keys(data).length
    }
    return 0
  }

  // Helper function to safely render text
  const safeRenderText = (value) => {
    if (typeof value === "string" || typeof value === "number") {
      return value
    }
    if (Array.isArray(value)) {
      return value.join(", ")
    }
    if (typeof value === "object" && value !== null) {
      // For objects, you might want to display a specific property or a summary
      return `${Object.keys(value).length} items`
    }
    return ""
  }

  // Helper function to check if assessment matches date filter
  const matchesDateFilter = (assessment) => {
    if (!filters.date) return true
    
    try {
      const assessmentDate = new Date(assessment.created_at).toISOString().split('T')[0]
      return assessmentDate === filters.date
    } catch (error) {
      console.error("Error parsing assessment date:", error)
      return true // If there's an error parsing date, include the assessment
    }
  }

  // Filter assessments based on search query and date
  const filteredAssessments = assessments.filter((assessment) => {
    // Apply date filter first
    if (!matchesDateFilter(assessment)) {
      return false
    }

    // Then apply search filter
    if (!searchQuery) return true

    const searchLower = searchQuery.toLowerCase()
    return (
      safeRenderText(assessment.name)?.toString().toLowerCase().includes(searchLower) ||
      safeRenderText(assessment.type)?.toString().toLowerCase().includes(searchLower) ||
      safeRenderText(assessment.category)?.toString().toLowerCase().includes(searchLower) ||
      safeRenderText(assessment.description)?.toString().toLowerCase().includes(searchLower)
    )
  })

  const handleViewDetails = (assessmentId) => {
    router.push(`/dashboard/${organizationId}/moderations/${assessmentId}`)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-white/20 rounded mb-4"></div>
                <div className="flex gap-2 mb-6">
                  <div className="h-6 w-16 bg-white/20 rounded"></div>
                  <div className="h-6 w-20 bg-white/20 rounded"></div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="h-4 bg-white/20 rounded"></div>
                  <div className="h-4 bg-white/20 rounded"></div>
                </div>
                <div className="h-10 bg-white/20 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-2">{error}</div>
        <button onClick={fetchAssessments} className="text-blue-600 hover:text-blue-700 text-sm">
          Try again
        </button>
      </div>
    )
  }

  if (filteredAssessments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-2">No assessments found</div>
        <div className="text-sm text-gray-500">
          {searchQuery || filters.projectId || filters.schoolId || filters.date
            ? "Try adjusting your filters or search query"
            : "No assessments available for this organization"}
        </div>
        {filters.date && (
          <div className="text-xs text-gray-400 mt-2">
            Showing assessments from: {new Date(filters.date).toLocaleDateString()}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredAssessments.map((assessment) => (
        <div
          key={assessment.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-semibold">{safeRenderText(assessment.name) || "Untitled Assessment"}</h3>
            </div>

            <div className="flex gap-2 mb-6">
              {assessment.type && (
                <span className="px-2 py-1 bg-white/20 text-white border border-white/30 rounded text-sm">
                  {safeRenderText(assessment.type)}
                </span>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="text-sm">{getCount(assessment.assigned_students)} Assigned students</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                <span className="text-sm">6 Instructors</span>
              </div>
              {assessment.created_at && (
                <div className="flex items-center gap-2 text-xs text-white/80">
                  <span>Created: {new Date(assessment.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => handleViewDetails(assessment.id)}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}