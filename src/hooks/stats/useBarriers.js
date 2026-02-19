"use client"

import { useState, useEffect, useCallback } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/firebase/config"

/**
 * useBarriers hook
 * Fetches precomputed literacy/numeracy barrier stats from Firestore.
 *
 * @param {Object} params
 * @param {string} params.organizationId - The organization ID (required)
 * @param {"literacy"|"numeracy"} params.type - The type of barrier data to fetch
 * @param {string} [params.projectId] - Optional project ID
 * @param {string} [params.schoolId] - Optional school ID
 * @returns {{ data, loading, error, fetchData }}
 */
export function useBarriers({ organizationId, type = "literacy", projectId = null, schoolId = null }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!organizationId) return

    setLoading(true)
    setError(null)

    try {
      let path = null
      const docName = type === "numeracy" ? "missed_numbers" : "missed_letters"

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
        setError(`No ${type} barrier data found.`)
      }
    } catch (err) {
      console.error(`Error fetching ${type} barrier data:`, err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [organizationId, projectId, schoolId, type])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, fetchData }
}
