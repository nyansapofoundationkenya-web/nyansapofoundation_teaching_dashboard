"use client"

import { useState, useEffect, useCallback } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/firebase/config"

/**
 * useAssessmentHealth hook
 * Fetches precomputed assessment health stats for organization, project, or school.
 * @param {Object} params - context (organizationId required; projectId/schoolId optional)
 * @returns {Object} { data, loading, error, fetchData }
 */
export function useAssessmentHealth({ organizationId, projectId = null, schoolId = null }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!organizationId) return

    setLoading(true)
    setError(null)

    try {
      let path = null

      // Determine Firestore path dynamically
      if (schoolId && projectId) {
        path = `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/stats/assessment_health`
      } else if (projectId) {
        path = `organization/${organizationId}/projects/${projectId}/stats/assessment_health`
      } else {
        path = `organization/${organizationId}/stats/assessment_health`
      }

      const ref = doc(db, path)
      const snap = await getDoc(ref)

      if (snap.exists()) {
        setData(snap.data()?.result || null)
      } else {
        setError("No assessment health data found.")
      }
    } catch (err) {
      console.error("Error fetching assessment health:", err)
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
