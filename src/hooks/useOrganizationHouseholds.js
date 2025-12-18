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
  const childLearningEnv = household.childLearningEnvironment || {}
  
  // Get parents data
  const parents = household.parents || []
  const mother = parents.find(p => p.type === 'Mother') || {}
  const father = parents.find(p => p.type === 'Father') || {}
  const guardian = parents.find(p => p.type === 'Guardian') || parents.find(p => !['Mother', 'Father'].includes(p.type)) || {}

  // Get children data
  const children = household.children || []

  // Base data with first child
  const baseData = {
    // Interview information
    'Name of interviewer': household.interviewerName || 'N/A',
    'Date of interview': household.interviewDate
      ? new Date(household.interviewDate).toLocaleDateString('en-GB')
      : 'N/A',
    "Interviewer Name": household.interviewerName,
    'County': household.county || 'N/A',
    'Sub-county': household.subCounty || 'N/A',
    'Village': household.village || 'N/A',
    
    // Consent and respondent information
    'Has the respondent given consent to participate?': household.consentGiven ? 'Yes' : 'No',
    'Name of the respondent': household.respondentName || household.householdHeadName || 'N/A',
    'Is the respondent the household head': household.isRespondentHouseholdHead ? 'Yes' : (household.respondentName === household.householdHeadName ? 'Yes' : 'No') || 'N/A',
    'NAME OF HOUSEHOLD HEAD': household.householdHeadName || 'N/A',
    'How are you related with the household head': household.relationshipToHead|| 'N/A',
    'Telephone/Mobile number of the household head': household.householdHeadPhone || 'N/A',
    'Respondent age': household.respondentAge || household.householdHeadAge || 'N/A',
    
    // Language
    'Which is the main language often spoken at home in this household?': household.mainLanguage || 'N/A',
    
    // Parent information
    'Mother`s name': mother.name || 'N/A',
    'Mother`s age': mother.age || 'N/A',
    'Has the mother ever attended school?': mother.everAttendedSchool ? 'Yes' : (mother.highestEducationLevel ? 'Yes' : 'No') || 'N/A',
    'Highest Education level of the mother': mother.highestEducationLevel || 'N/A',
    
    'Father`s name': father.name || 'N/A',
    'Father`s age': father.age || 'N/A',
    'Has the Father ever attended school?': father.everAttendedSchool ? 'Yes' : (father.highestEducationLevel ? 'Yes' : 'No') || 'N/A',
    'Highest Education level of the Father': father.highestEducationLevel || 'N/A',
    
    'Guardian`s name': guardian.name || 'N/A',
    'What is the gender of the guardian?': guardian.gender || 'N/A',
    'Guardian`s age': guardian.age || 'N/A',
    'Has the Guardian ever attended school?': guardian.everAttendedSchool ? 'Yes' : (guardian.highestEducationLevel ? 'Yes' : 'No') || 'N/A',
    'Highest Education level of the Guardian': guardian.highestEducationLevel || 'N/A',
    
    // Household information
    'What is the marital status of the household head?': household.maritalStatus || 'N/A',
    'Number of members regularly living in the household including yourself': household.householdMembersCount || 'N/A',
    'Main source of income for the household head:': household.incomeSource || 'N/A',
    'Does the household have electricity?': household.hasElectricity ? 'Yes' : 'No',
    'Household assets': Array.isArray(household.householdAssets) ? household.householdAssets.join(', ') : (household.householdAssets || 'N/A'),
    
    // Parental engagement
    'Who helps the child with homework?': pe.homeworkHelper || 'N/A',
    'How often do you discuss your child\'s learning with teachers?': pe.teacherDiscussionFrequency || 'N/A',
    'Do you attend school meetings or parent–teacher forums?': pe.attendsSchoolMeetings ? 'Yes' : 'No',
    'Do you monitor your child\'s school attendance?': pe.monitorsAttendance ? 'Yes' : 'No',
    
    // Learning environment
    'Does the child have a quiet place to study?': childLearningEnv.hasQuietPlaceToStudy ? 'Yes' : 'No',
    'Does the household have books or learning materials?': childLearningEnv.hasBooksOrMaterials ? 'Yes' : 'No',
  }

  // Add children data (up to 5 children - adjust as needed)
  const maxChildren = 5
  for (let i = 0; i < maxChildren; i++) {
    const child = children[i] || {}
    const childNum = i + 1
    
    baseData[`Child ${childNum} Name`] = `${child.firstName || ''} ${child.lastName || ''}`.trim() || ''
    baseData[`Child ${childNum} Gender`] = child.gender || ''
    baseData[`Child ${childNum} Age`] = child.age || ''
    baseData[`Child ${childNum} Grade`] = child.grade || ''
    baseData[`Child ${childNum} Lives With`] = child.livesWith || ''
    baseData[`child ${childNum} id`] = child.linkedLearnerId || ''
  }

  return baseData
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