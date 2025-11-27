// hooks/useOrganizationHouseholds.js
import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/config'

export const useOrganizationHouseholds = (orgId) => {
  const [households, setHouseholds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState(null)

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

        const projectsRef = collection(db, `organization/${orgId}/projects`)
        const projectsSnap = await getDocs(projectsRef)

        for (const projectDoc of projectsSnap.docs) {
          const projectId = projectDoc.id
          const projectData = projectDoc.data()

          const schoolsRef = collection(db, `organization/${orgId}/projects/${projectId}/schools`)
          const schoolsSnap = await getDocs(schoolsRef)

          for (const schoolDoc of schoolsSnap.docs) {
            const schoolId = schoolDoc.id
            const schoolData = schoolDoc.data()

            const householdsRef = collection(
              db,
              `organization/${orgId}/projects/${projectId}/schools/${schoolId}/households`
            )
            const householdsSnap = await getDocs(householdsRef)

            for (const hhDoc of householdsSnap.docs) {
              allHouseholds.push({
                id: hhDoc.id,
                projectId,
                projectName: projectData?.name || projectId,
                schoolId,
                schoolName: schoolData?.name || schoolId,
                village: schoolData?.name || 'N/A',
                county: schoolData?.location || 'N/A',
                subcounty: schoolData?.subcounty || 'N/A',
                ...hhDoc.data(),
                county: schoolData?.location || hhDoc.data().county || 'N/A',
                subCounty: schoolData?.subcounty || hhDoc.data().subCounty || 'N/A',
                village: schoolData?.name || hhDoc.data().village || 'N/A'
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

  // Fetch households for a specific project
  const fetchProjectHouseholds = async (projectId) => {
    if (!orgId || !projectId) {
      throw new Error('Organization ID and Project ID are required')
    }

    try {
      const projectHouseholds = []
      let projectData = null
      const projectRef = collection(db, `organization/${orgId}/projects`)
      const projectSnap = await getDocs(projectRef)
      projectSnap.forEach(doc => {
        if (doc.id === projectId) projectData = doc.data()
      })

      const schoolsRef = collection(db, `organization/${orgId}/projects/${projectId}/schools`)
      const schoolsSnap = await getDocs(schoolsRef)

      for (const schoolDoc of schoolsSnap.docs) {
        const schoolId = schoolDoc.id
        const schoolData = schoolDoc.data()

        const householdsRef = collection(
          db,
          `organization/${orgId}/projects/${projectId}/schools/${schoolId}/households`
        )
        const householdsSnap = await getDocs(householdsRef)

        for (const hhDoc of householdsSnap.docs) {
          projectHouseholds.push({
            id: hhDoc.id,
            projectId,
            projectName: projectData?.name || projectId,
            schoolId,
            schoolName: schoolData?.name || schoolId,
            village: schoolData?.name || 'N/A',
            county: schoolData?.location || 'N/A',
            subcounty: schoolData?.subcounty || 'N/A',
            ...hhDoc.data(),
            county: schoolData?.location || hhDoc.data().county || 'N/A',
            subCounty: schoolData?.subcounty || hhDoc.data().subCounty || 'N/A',
            village: schoolData?.name || hhDoc.data().village || 'N/A'
          })
        }
      }

      return projectHouseholds
    } catch (err) {
      console.error('Error fetching project households:', err)
      throw err
    }
  }

  // Updated flatten function — matches your Python script exactly
  const flattenHouseholdData = (household) => {
    const pe = household.parentalEngagement || {}

    const parents = (household.parents || [])
      .map(p => {
        const name = p.name || ''
        const type = p.type || ''
        const age = p.age || ''
        const edu = p.highestEducationLevel || ''
        return name ? `${name} (${type}, ${age} yrs, ${edu})` : ''
      })
      .filter(Boolean)
      .join('; ') || 'None'

    const children = (household.children || [])
      .map(c => {
        const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim()
        const gender = c.gender || ''
        const age = c.age || ''
        const grade = c.grade || ''
        const assessed = c.wasAssessedIn2024 ? 'Yes' : 'No'
        const aboveStory = c.wasAboveStoryLevelIn2024 ? 'Yes' : 'No'
        const id = c.linkedLearnerId || ''
        return fullName
          ? `${fullName} (${gender}, ${age} yrs, G${grade}, Assessed=${assessed}, AboveStory=${aboveStory}, ID=${id})`
          : ''
      })
      .filter(Boolean)
      .join('; ') || 'None'

    return {
      'Interview Date': household.interviewDate
        ? new Date(household.interviewDate).toLocaleDateString('en-GB')
        : 'N/A',
      'County': household.county,
      'Sub-County': household.subCounty,
      'Village': household.village,
      'Interviewer Name':household.interviewerName || 'N/A',
      'Household Head': household.householdHeadName || 'N/A',
      'Household Head Phone': household.householdHeadPhone || 'N/A',
      'Household Members Count': household.householdMembersCount || '',
      'Income Source': household.incomeSource || 'N/A',
      'Main Language': household.mainLanguage || 'N/A',
      'Marital Status': household.maritalStatus || 'N/A',
      'Has Books/Materials': household.childLearningEnvironment?.hasBooksOrMaterials ? 'Yes' : 'No',
      'Has Quiet Place to Study': household.childLearningEnvironment?.hasQuietPlaceToStudy ? 'Yes' : 'No',
      'Consent Given': household.consentGiven ? 'Yes' : 'No',
      'Attends School Meetings': pe.attendsSchoolMeetings ? 'Yes' : 'No',
      'Monitors Attendance': pe.monitorsAttendance ? 'Yes' : 'No',
      'Who Helps with Homework': pe.homeworkHelper || 'N/A',
      'Teacher Discussion Frequency': pe.teacherDiscussionFrequency || 'N/A',
      'Parents': parents,
      'Children': children,
    }
  }

  // CSV export — unchanged
  const convertToCSV = (data) => {
    if (!data || data.length === 0) return ''
    const headers = Array.from(new Set(data.flatMap(row => Object.keys(row))))
    const csvHeaders = headers.map(h => `"${h}"`).join(',')
    const csvRows = data.map(row =>
      headers.map(header => {
        const value = row[header] !== undefined ? row[header] : ''
        return `"${String(value).replace(/"/g, '""')}"`
      }).join(',')
    )
    return [csvHeaders, ...csvRows].join('\n')
  }

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const exportToCSV = async (projectId = null) => {
    setIsExporting(true)
    setExportError(null)

    try {
      let householdsToExport = projectId ? await fetchProjectHouseholds(projectId) : households
      let scope = projectId ? `project_${projectId}` : 'organization'

      if (householdsToExport.length === 0) {
        setExportError('No households found to export')
        setIsExporting(false)
        return 0
      }

      const flattenedData = householdsToExport.map(flattenHouseholdData)
      const csv = convertToCSV(flattenedData)
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `households_${scope}_${timestamp}.csv`
      downloadFile(csv, filename, 'text/csv;charset=utf-8;')
      setIsExporting(false)
      return householdsToExport.length
    } catch (err) {
      console.error('Export error:', err)
      setExportError(err.message)
      setIsExporting(false)
      throw err
    }
  }

  // Excel export — now real .xlsx using xlsx library
  const exportToExcel = async (projectId = null) => {
    setIsExporting(true)
    setExportError(null)

    try {
      let householdsToExport = projectId ? await fetchProjectHouseholds(projectId) : households
      let scope = projectId ? `project_${projectId}` : 'organization'

      if (householdsToExport.length === 0) {
        setExportError('No households found to export')
        setIsExporting(false)
        return 0
      }

      const flattenedData = householdsToExport.map(flattenHouseholdData)

      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(flattenedData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Households')

      const timestamp = new Date().toISOString().slice(0, 10)
      const filename = `households_${scope}_${timestamp}.xlsx`

      XLSX.writeFile(wb, filename)

      setIsExporting(false)
      return householdsToExport.length
    } catch (err) {
      console.error('Export error:', err)
      setExportError(err.message)
      setIsExporting(false)
      throw err
    }
  }

  // Metrics — unchanged
  const totalHouseholds = households.length
  const householdsWithBooksCount = households.filter(hh => hh.childLearningEnvironment?.hasBooksOrMaterials).length
  const householdsWithBooks = totalHouseholds > 0 ? `${Math.round((householdsWithBooksCount / totalHouseholds) * 100)}%` : '0%'

  let totalFemales = 0, totalMales = 0, totalFemaleChildren = 0
  households.forEach(hh => {
    totalFemales += (hh.parents || []).filter(p => p.type === 'Mother').length
    totalMales += (hh.parents || []).filter(p => p.type === 'Father').length
    totalFemaleChildren += (hh.children || []).filter(c => c.gender === 'Female').length
    totalFemales += totalFemaleChildren
    totalMales += (hh.children || []).filter(c => c.gender === 'Male').length
  })

  const totalMembers = totalFemales + totalMales
  const malesPercentage = totalMembers > 0 ? `${Math.round((totalMales / totalMembers) * 100)}%` : '0%'

  const metrics = {
    totalHouseholds,
    totalFemales,
    totalFemaleChildren,
    males: totalMales,
    malesPercentage,
    householdsWithBooks
  }

  return { 
    households, 
    metrics, 
    loading, 
    error,
    exportToCSV,
    exportToExcel,
    isExporting,
    exportError,
    fetchProjectHouseholds
  }
}