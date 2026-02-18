"use client"

import { useState, useEffect, useCallback } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/firebase/config"

/**
 * useStudentImprovement hook
 * Fetches precomputed student improvement stats from Firestore.
 *
 * @param {Object} params
 * @param {string} params.organizationId - The organization ID (required)
 * @param {string} [params.projectId] - Optional project ID
 * @param {string} [params.schoolId] - Optional school ID
 * @returns {{ data, loading, error, fetchData }}
 */
export function useStudentImprovement({ organizationId, projectId = null, schoolId = null }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!organizationId) return

    setLoading(true)
    setError(null)

    try {
      let path = `organization/${organizationId}/stats/student_improvement`
      if (projectId && schoolId) {
        path = `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/stats/student_improvement`
      } else if (projectId) {
        path = `organization/${organizationId}/projects/${projectId}/stats/student_improvement`
      }

      const ref = doc(db, path)
      const snap = await getDoc(ref)

      if (snap.exists()) {
        setData(snap.data()?.result || null)
      } else {
        setError("No student improvement data found.")
      }
    } catch (err) {
      console.error("Error fetching student improvement data:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [organizationId, projectId, schoolId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, fetchData }
}
