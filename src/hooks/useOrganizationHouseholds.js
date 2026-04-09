// hooks/useOrganizationHouseholds.js (Simplified - No Metrics)
import { useState, useEffect, useCallback, useRef } from 'react'
import { collection, getDocs, query, limit, startAfter } from 'firebase/firestore'
import { db } from '@/firebase/config'

export const useOrganizationHouseholds = (orgId, pageSize = 20) => {
  const [households, setHouseholds] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  
  // Track pagination state
  const paginationState = useRef({
    lastDocRef: null,
    currentPath: null,
    currentProjectId: null,
    currentSchoolId: null,
    loadedPaths: new Set(),
    allProjects: [],
    allSchools: new Map()
  })

  // Fetch households from a specific path with pagination
  const fetchHouseholdsFromPath = useCallback(async (path, lastDoc = null, limit_count = pageSize) => {
    const householdsRef = collection(db, path)
    let q = query(householdsRef, limit(limit_count))
    
    if (lastDoc) {
      q = query(householdsRef, startAfter(lastDoc), limit(limit_count))
    }
    
    const snapshot = await getDocs(q)
    return {
      households: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: snapshot.docs.length === limit_count
    }
  }, [pageSize])

  // Initialize project and school structure
  const initializeStructure = useCallback(async () => {
    if (!orgId) return null
    
    const projects = []
    const schoolsMap = new Map()
    
    const projectsRef = collection(db, `organization/${orgId}/projects`)
    const projectsSnap = await getDocs(projectsRef)
    
    for (const projectDoc of projectsSnap.docs) {
      const projectId = projectDoc.id
      const projectData = projectDoc.data()
      
      const schoolsRef = collection(db, `organization/${orgId}/projects/${projectId}/schools`)
      const schoolsSnap = await getDocs(schoolsRef)
      
      const schools = []
      for (const schoolDoc of schoolsSnap.docs) {
        const schoolId = schoolDoc.id
        const schoolData = schoolDoc.data()
        schools.push({
          id: schoolId,
          data: schoolData,
          path: `organization/${orgId}/projects/${projectId}/schools/${schoolId}/households`
        })
      }
      
      projects.push({
        id: projectId,
        data: projectData,
        schools
      })
      
      schoolsMap.set(projectId, schools)
    }
    
    return { projects, schoolsMap }
  }, [orgId])

  // Load initial data (first chunk)
  const loadInitialData = useCallback(async () => {
    if (!orgId) {
      setInitialLoading(false)
      return
    }

    try {
      setInitialLoading(true)
      setError(null)
      
      // Initialize structure
      const structure = await initializeStructure()
      if (!structure) {
        setInitialLoading(false)
        return
      }
      
      paginationState.current.allProjects = structure.projects
      paginationState.current.allSchools = structure.schoolsMap
      
      const allHouseholds = []
      let lastDocInfo = null
      
      // Iterate through projects and schools
      for (const project of structure.projects) {
        if (allHouseholds.length >= pageSize) break
        
        for (const school of project.schools) {
          if (allHouseholds.length >= pageSize) break
          
          const path = school.path
          
          // Skip if already fully loaded
          if (paginationState.current.loadedPaths.has(path)) continue
          
          // Fetch households from this school
          const result = await fetchHouseholdsFromPath(
            path, 
            null, 
            pageSize - allHouseholds.length
          )
          
          // Transform and add households
          const transformedHouseholds = result.households.map(hhDoc => ({
            id: hhDoc.id,
            projectId: project.id,
            projectName: project.data?.name || project.id,
            schoolId: school.id,
            schoolName: school.data?.name || school.id,
            village: school.data?.name || 'N/A',
            county: school.data?.location || 'N/A',
            subCounty: school.data?.subcounty || 'N/A',
            ...hhDoc,
            county: school.data?.location || hhDoc.county || 'N/A',
            subCounty: school.data?.subcounty || hhDoc.subCounty || 'N/A',
            village: school.data?.name || hhDoc.village || 'N/A'
          }))
          
          allHouseholds.push(...transformedHouseholds)
          
          // Store last document for pagination
          if (result.lastDoc && transformedHouseholds.length > 0) {
            lastDocInfo = {
              path,
              docRef: result.lastDoc,
              projectId: project.id,
              schoolId: school.id,
              project,
              school
            }
          }
          
          // If we got less than requested, this school is exhausted
          if (result.households.length < (pageSize - (allHouseholds.length - transformedHouseholds.length))) {
            paginationState.current.loadedPaths.add(path)
          }
        }
      }
      
      setHouseholds(allHouseholds)
      paginationState.current.lastDocRef = lastDocInfo
      setHasMore(allHouseholds.length === pageSize)
      
    } catch (err) {
      console.error('Error loading households:', err)
      setError(err)
    } finally {
      setInitialLoading(false)
    }
  }, [orgId, pageSize, fetchHouseholdsFromPath, initializeStructure])

  // Load more data (next chunk)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || initialLoading) return
    
    setLoading(true)
    
    try {
      const newHouseholds = []
      let currentLastDoc = paginationState.current.lastDocRef
      
      // If we have a lastDoc, continue from there
      if (currentLastDoc) {
        const result = await fetchHouseholdsFromPath(
          currentLastDoc.path,
          currentLastDoc.docRef,
          pageSize
        )
        
        const transformedHouseholds = result.households.map(hhDoc => ({
          id: hhDoc.id,
          projectId: currentLastDoc.projectId,
          projectName: currentLastDoc.project.data?.name || currentLastDoc.projectId,
          schoolId: currentLastDoc.schoolId,
          schoolName: currentLastDoc.school.data?.name || currentLastDoc.schoolId,
          village: currentLastDoc.school.data?.name || 'N/A',
          county: currentLastDoc.school.data?.location || 'N/A',
          subCounty: currentLastDoc.school.data?.subcounty || 'N/A',
          ...hhDoc,
          county: currentLastDoc.school.data?.location || hhDoc.county || 'N/A',
          subCounty: currentLastDoc.school.data?.subcounty || hhDoc.subCounty || 'N/A',
          village: currentLastDoc.school.data?.name || hhDoc.village || 'N/A'
        }))
        
        newHouseholds.push(...transformedHouseholds)
        
        if (result.hasMore) {
          paginationState.current.lastDocRef = {
            ...currentLastDoc,
            docRef: result.lastDoc
          }
        } else {
          paginationState.current.loadedPaths.add(currentLastDoc.path)
          paginationState.current.lastDocRef = null
        }
      }
      
      // If we still need more items and have no lastDoc, find next unloaded school
      if (newHouseholds.length < pageSize && !paginationState.current.lastDocRef) {
        for (const project of paginationState.current.allProjects) {
          for (const school of project.schools) {
            if (!paginationState.current.loadedPaths.has(school.path)) {
              const result = await fetchHouseholdsFromPath(school.path, null, pageSize - newHouseholds.length)
              
              const transformed = result.households.map(hhDoc => ({
                id: hhDoc.id,
                projectId: project.id,
                projectName: project.data?.name || project.id,
                schoolId: school.id,
                schoolName: school.data?.name || school.id,
                village: school.data?.name || 'N/A',
                county: school.data?.location || 'N/A',
                subCounty: school.data?.subcounty || 'N/A',
                ...hhDoc,
                county: school.data?.location || hhDoc.county || 'N/A',
                subCounty: school.data?.subcounty || hhDoc.subCounty || 'N/A',
                village: school.data?.name || hhDoc.village || 'N/A'
              }))
              
              newHouseholds.push(...transformed)
              
              if (result.hasMore) {
                paginationState.current.lastDocRef = {
                  path: school.path,
                  docRef: result.lastDoc,
                  projectId: project.id,
                  schoolId: school.id,
                  project,
                  school
                }
              } else {
                paginationState.current.loadedPaths.add(school.path)
              }
              
              break
            }
          }
          if (newHouseholds.length >= pageSize) break
        }
      }
      
      const updatedHouseholds = [...households, ...newHouseholds]
      setHouseholds(updatedHouseholds)
      setHasMore(newHouseholds.length === pageSize)
      
    } catch (err) {
      console.error('Error loading more:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [hasMore, loading, initialLoading, pageSize, fetchHouseholdsFromPath, households])

  // Reset and reload (for filter changes)
  const resetAndReload = useCallback(async () => {
    paginationState.current = {
      lastDocRef: null,
      currentPath: null,
      currentProjectId: null,
      currentSchoolId: null,
      loadedPaths: new Set(),
      allProjects: [],
      allSchools: new Map()
    }
    setHouseholds([])
    setHasMore(true)
    await loadInitialData()
  }, [loadInitialData])

  // Load initial data on mount
  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  return {
    households,
    loading: initialLoading || loading,
    error,
    hasMore,
    loadMore,
    resetAndReload,
    totalLoaded: households.length
  }
}