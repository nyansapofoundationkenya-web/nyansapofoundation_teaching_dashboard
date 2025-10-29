// hooks/useHouseholdDetails.js
import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase/config' 

export const useHouseholdDetails = (orgId, householdId, projectId, schoolId) => {
  const [household, setHousehold] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchHousehold = async () => {
      if (!orgId || !householdId || !projectId || !schoolId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const householdRef = doc(db, `organization/${orgId}/projects/${projectId}/schools/${schoolId}/households/${householdId}`)
        const docSnap = await getDoc(householdRef)

        if (docSnap.exists()) {
          setHousehold({
            id: docSnap.id,
            ...docSnap.data()
          })
        } else {
          setError(new Error('Household not found'))
        }
      } catch (err) {
        setError(err)
        console.error('Error fetching household details:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHousehold()
  }, [orgId, householdId, projectId, schoolId])

  return { household, loading, error }
}