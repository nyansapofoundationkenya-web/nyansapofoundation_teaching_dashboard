// hooks/useProgressiveMetrics.js
import { useState, useEffect, useCallback, useRef } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/config'

export const useProgressiveMetrics = (orgId) => {
  const [metrics, setMetrics] = useState({
    totalHouseholds: 0,
    totalFemales: 0,
    totalFemaleChildren: 0,
    males: 0,
    malesPercentage: '0%'
  })
  
  const processedRef = useRef(new Set())
  const metricsBuffer = useRef({
    totalHouseholds: 0,
    totalFemales: 0,
    totalFemaleChildren: 0,
    totalMales: 0
  })

  const updateMetrics = useCallback((newMetrics) => {
    metricsBuffer.current = {
      totalHouseholds: metricsBuffer.current.totalHouseholds + newMetrics.totalHouseholds,
      totalFemales: metricsBuffer.current.totalFemales + newMetrics.totalFemales,
      totalFemaleChildren: metricsBuffer.current.totalFemaleChildren + newMetrics.totalFemaleChildren,
      totalMales: metricsBuffer.current.totalMales + newMetrics.totalMales
    }
    
    const totalMembers = metricsBuffer.current.totalFemales + metricsBuffer.current.totalMales
    const malesPercentage = totalMembers > 0 
      ? `${Math.round((metricsBuffer.current.totalMales / totalMembers) * 100)}%` 
      : '0%'
    
    setMetrics({
      totalHouseholds: metricsBuffer.current.totalHouseholds,
      totalFemales: metricsBuffer.current.totalFemales,
      totalFemaleChildren: metricsBuffer.current.totalFemaleChildren,
      males: metricsBuffer.current.totalMales,
      malesPercentage
    })
  }, [])

  const fetchMetrics = useCallback(async () => {
    if (!orgId) return

    try {
      const projectsRef = collection(db, `organization/${orgId}/projects`)
      const projectsSnap = await getDocs(projectsRef)
      
      for (const projectDoc of projectsSnap.docs) {
        const projectId = projectDoc.id
        
        const schoolsRef = collection(db, `organization/${orgId}/projects/${projectId}/schools`)
        const schoolsSnap = await getDocs(schoolsRef)
        
        for (const schoolDoc of schoolsSnap.docs) {
          const schoolId = schoolDoc.id
          const schoolKey = `${projectId}/${schoolId}`
          
          if (processedRef.current.has(schoolKey)) continue
          
          const householdsRef = collection(
            db,
            `organization/${orgId}/projects/${projectId}/schools/${schoolId}/households`
          )
          const householdsSnap = await getDocs(householdsRef)
          
          let schoolMetrics = {
            totalHouseholds: 0,
            totalFemales: 0,
            totalFemaleChildren: 0,
            totalMales: 0
          }
          
          for (const hhDoc of householdsSnap.docs) {
            const data = hhDoc.data()
            
            schoolMetrics.totalHouseholds++
            
            const children = data.children || []
            const femaleChildren = children.filter(c => c.gender === 'Female').length
            const maleChildren = children.filter(c => c.gender === 'Male').length
            
            schoolMetrics.totalFemaleChildren += femaleChildren
            schoolMetrics.totalMales += maleChildren
            schoolMetrics.totalFemales += femaleChildren
            
            const parents = data.parents || []
            const femaleParents = parents.filter(p => p.type === 'Mother' || p.gender === 'Female').length
            const maleParents = parents.filter(p => p.type === 'Father' || p.gender === 'Male').length
            
            schoolMetrics.totalFemales += femaleParents
            schoolMetrics.totalMales += maleParents
          }
          
          updateMetrics(schoolMetrics)
          processedRef.current.add(schoolKey)
          
          // Small delay to see the numbers increase smoothly
          await new Promise(resolve => setTimeout(resolve, 30))
        }
      }
    } catch (err) {
      console.error('Error fetching metrics:', err)
    }
  }, [orgId, updateMetrics])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  return { metrics }
}