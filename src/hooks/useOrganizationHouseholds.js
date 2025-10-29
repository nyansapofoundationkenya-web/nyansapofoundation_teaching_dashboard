import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/config' 

export const useOrganizationHouseholds = (orgId) => {
  const [households, setHouseholds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchHouseholds = async () => {
      if (!orgId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const allHouseholds = []

        // Fetch all projects under the organization
        const projectsRef = collection(db, `organization/${orgId}/projects`)
        const projectsSnap = await getDocs(projectsRef)

        for (const projectDoc of projectsSnap.docs) {
          const projectId = projectDoc.id

          // Fetch all schools under the project
          const schoolsRef = collection(db, `organization/${orgId}/projects/${projectId}/schools`)
          const schoolsSnap = await getDocs(schoolsRef)

          for (const schoolDoc of schoolsSnap.docs) {
            const schoolId = schoolDoc.id

            // Fetch all households under the school
            const householdsRef = collection(db, `organization/${orgId}/projects/${projectId}/schools/${schoolId}/households`)
            const householdsSnap = await getDocs(householdsRef)

            for (const hhDoc of householdsSnap.docs) {
              allHouseholds.push({
                id: hhDoc.id,
                projectId,          
                schoolId, 
                ...hhDoc.data()
              })
            }
          }
        }

        setHouseholds(allHouseholds)
      } catch (err) {
        setError(err)
        console.error('Error fetching households:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHouseholds()
  }, [orgId])

  // Compute metrics based on household data
  const totalHouseholds = households.length

  const householdsWithBooksCount = households.filter(
    (hh) => hh.childLearningEnvironment?.hasBooksOrMaterials
  ).length
  const householdsWithBooks = totalHouseholds > 0
    ? `${Math.round((householdsWithBooksCount / totalHouseholds) * 100)}%`
    : '0%'

  let totalFemales = 0
  let totalMales = 0
  let totalFemaleChildren = 0

  households.forEach((hh) => {
    // Count female/male parents (assuming 'Mother' = female, 'Father' = male)
    const femaleParents = (hh.parents || []).filter((p) => p.type === 'Mother').length
    const maleParents = (hh.parents || []).filter((p) => p.type === 'Father').length
    totalFemales += femaleParents
    totalMales += maleParents

    // Count children by gender
    const femaleKids = (hh.children || []).filter((c) => c.gender === 'Female').length
    const maleKids = (hh.children || []).filter((c) => c.gender === 'Male').length
    totalFemaleChildren += femaleKids
    totalFemales += femaleKids
    totalMales += maleKids
  })

  const totalMembers = totalFemales + totalMales
  const malesPercentage = totalMembers > 0
    ? `${Math.round((totalMales / totalMembers) * 100)}%`
    : '0%'

  const metrics = {
    totalHouseholds,
    totalFemales, // Maps to totalFematen in mock
    totalFemaleChildren, // Maps to totalFemsChildren in mock
    males: totalMales,
    malesPercentage,
    householdsWithBooks
  }

  return { households, metrics, loading, error }
}