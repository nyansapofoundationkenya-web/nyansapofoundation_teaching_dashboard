"use client"

import { useState, useEffect, useCallback } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/firebase/config"

/**
 * useAttendanceOverview hook
 * Fetches precomputed attendance stats (today, weekly, monthly trends)
 * for an organization, project, or school.
 *
 * @param {Object} params
 * @param {string} params.organizationId - Organization ID (required)
 * @param {string} [params.projectId] - Optional project ID
 * @param {string} [params.schoolId] - Optional school ID
 * @returns {{ data, loading, error, fetchData }}
 */
export function useAttendanceOverview({ organizationId, projectId = null, schoolId = null }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!organizationId) return

    setLoading(true)
    setError(null)

    try {
      let path = null
      const docName = "attendance_overview"

      if (schoolId && projectId) {
        path = `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/stats/${docName}`
      } else if (projectId) {
        path = `organization/${organizationId}/projects/${projectId}/stats/${docName}`
      } else {
        path = `organization/${organizationId}/stats/${docName}`
      }

      const ref = doc(db, path)
      const snap = await getDoc(ref)

      if (snap.exists()) {
        setData(snap.data()?.result || null)
      } else {
        setError("No attendance overview data found.")
      }
    } catch (err) {
      console.error("Error fetching attendance overview:", err)
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
