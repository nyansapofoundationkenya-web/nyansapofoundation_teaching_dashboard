// hooks/useHouseholdExport.js
import { useState, useCallback } from 'react'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'

export const useHouseholdExport = (orgId) => {
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState(null)
  const [exportProgress, setExportProgress] = useState(0)

  // Flatten household data for export
  const flattenHouseholdData = useCallback((household, schoolData, projectData) => {
    const pe = household.parentalEngagement || {}
    const childLearningEnv = household.childLearningEnvironment || {}
    
    const parents = household.parents || []
    const mother = parents.find(p => p.type === 'Mother') || {}
    const father = parents.find(p => p.type === 'Father') || {}
    const guardian = parents.find(p => p.type === 'Guardian') || parents.find(p => !['Mother', 'Father'].includes(p.type)) || {}

    const children = household.children || []

    const baseData = {
      // Project and School Info
      'Project Name': projectData?.name || projectData?.id || 'N/A',
      'Project ID': projectData?.id || 'N/A',
      'School Name': schoolData?.name || 'N/A',
      'School ID': schoolData?.id || 'N/A',
      
      // Interview information
      'Name of interviewer': household.interviewerName || 'N/A',
      'Date of interview': household.interviewDate
        ? new Date(household.interviewDate).toLocaleDateString('en-GB')
        : 'N/A',
      "Interviewer Name": household.interviewerName || 'N/A',
      
      // Location
      'County': schoolData?.location || household.county || 'N/A',
      'Sub-county': schoolData?.subcounty || household.subCounty || 'N/A',
      'Village': schoolData?.name || household.village || 'N/A',
      
      // Consent and respondent information
      'Has the respondent given consent to participate?': household.consentGiven ? 'Yes' : 'No',
      'Name of the respondent': household.respondentName || household.householdHeadName || 'N/A',
      'Is the respondent the household head': household.isRespondentHouseholdHead ? 'Yes' : (household.respondentName === household.householdHeadName ? 'Yes' : 'No') || 'N/A',
      'NAME OF HOUSEHOLD HEAD': household.householdHeadName || 'N/A',
      'How are you related with the household head': household.relationshipToHead || 'N/A',
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

    // Add children data (up to 10 children)
    const maxChildren = 10
    for (let i = 0; i < maxChildren; i++) {
      const child = children[i] || {}
      const childNum = i + 1
      
      baseData[`Child ${childNum} Name`] = `${child.firstName || ''} ${child.lastName || ''}`.trim() || ''
      baseData[`Child ${childNum} Gender`] = child.gender || ''
      baseData[`Child ${childNum} Age`] = child.age || ''
      baseData[`Child ${childNum} Grade`] = child.grade || ''
      baseData[`Child ${childNum} Lives With`] = child.livesWith || ''
      baseData[`Child ${childNum} ID`] = child.linkedLearnerId || ''
      baseData[`Child ${childNum} Was Above Story Level In 2024`] = child.wasAboveStoryLevelIn2024 || ''
      baseData[`Child ${childNum} Was Assessed In 2024`] = child.wasAssessedIn2024 || ''
    }

    return baseData
  }, [])

  // Convert to CSV
  const convertToCSV = useCallback((data) => {
    if (!data || data.length === 0) return ''
    
    // Get all unique headers
    const headers = Array.from(new Set(data.flatMap(row => Object.keys(row))))
    
    // Create CSV header row
    const csvHeaders = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',')
    
    // Create data rows
    const csvRows = data.map(row =>
      headers.map(header => {
        const value = row[header] !== undefined && row[header] !== null ? row[header] : ''
        // Escape quotes and handle special characters
        const stringValue = String(value).replace(/"/g, '""')
        return `"${stringValue}"`
      }).join(',')
    )
    
    return [csvHeaders, ...csvRows].join('\n')
  }, [])

  // Download file
  const downloadFile = useCallback((content, filename, mimeType) => {
    // Add BOM for UTF-8 with special characters
    const blob = new Blob(["\uFEFF" + content], { type: `${mimeType};charset=utf-8;` })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }, [])

  // Fetch all households for export (independent of UI)
  const fetchAllHouseholdsForExport = useCallback(async (projectId = null) => {
    if (!orgId) throw new Error('Organization ID is required')

    const allHouseholds = []
    let totalSchools = 0
    let processedSchools = 0

    // Get all projects
    const projectsRef = collection(db, `organization/${orgId}/projects`)
    const projectsSnap = await getDocs(projectsRef)

    for (const projectDoc of projectsSnap.docs) {
      const currentProjectId = projectDoc.id
      
      // Skip if not the selected project
      if (projectId && currentProjectId !== projectId) continue
      
      const projectData = { id: currentProjectId, ...projectDoc.data() }

      // Get schools in this project
      const schoolsRef = collection(db, `organization/${orgId}/projects/${currentProjectId}/schools`)
      const schoolsSnap = await getDocs(schoolsRef)
      totalSchools += schoolsSnap.size

      for (const schoolDoc of schoolsSnap.docs) {
        const schoolId = schoolDoc.id
        const schoolData = { id: schoolId, ...schoolDoc.data() }

        // Get all households in this school
        const householdsRef = collection(
          db,
          `organization/${orgId}/projects/${currentProjectId}/schools/${schoolId}/households`
        )
        const householdsSnap = await getDocs(householdsRef)

        for (const hhDoc of householdsSnap.docs) {
          allHouseholds.push({
            data: { id: hhDoc.id, ...hhDoc.data() },
            schoolData,
            projectData
          })
        }

        processedSchools++
        setExportProgress(Math.round((processedSchools / totalSchools) * 100))
      }
    }

    return allHouseholds
  }, [orgId])

  // Export to CSV
  const exportToCSV = useCallback(async (projectId = null) => {
    setIsExporting(true)
    setExportError(null)
    setExportProgress(0)

    try {
      const allHouseholds = await fetchAllHouseholdsForExport(projectId)
      
      if (allHouseholds.length === 0) {
        throw new Error('No households found to export')
      }

      // Flatten all household data
      const flattenedData = allHouseholds.map(({ data, schoolData, projectData }) => 
        flattenHouseholdData(data, schoolData, projectData)
      )

      const csv = convertToCSV(flattenedData)
      const timestamp = new Date().toISOString().split('T')[0]
      
      let scope = 'organization'
      let projectName = ''
      
      if (projectId) {
        // Get project name
        const projectRef = doc(db, `organization/${orgId}/projects/${projectId}`)
        const projectSnap = await getDoc(projectRef)
        projectName = projectSnap.exists() ? projectSnap.data().name : projectId
        scope = `project_${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`
      }
      
      const filename = `households_${scope}_${timestamp}.csv`
      downloadFile(csv, filename, 'text/csv')
      
      setIsExporting(false)
      return allHouseholds.length
    } catch (err) {
      console.error('Export error:', err)
      setExportError(err.message || 'Export failed')
      setIsExporting(false)
      throw err
    }
  }, [orgId, fetchAllHouseholdsForExport, flattenHouseholdData, convertToCSV, downloadFile])

  // Export to Excel
  const exportToExcel = useCallback(async (projectId = null) => {
    setIsExporting(true)
    setExportError(null)
    setExportProgress(0)

    try {
      const allHouseholds = await fetchAllHouseholdsForExport(projectId)
      
      if (allHouseholds.length === 0) {
        throw new Error('No households found to export')
      }

      // Flatten all household data
      const flattenedData = allHouseholds.map(({ data, schoolData, projectData }) => 
        flattenHouseholdData(data, schoolData, projectData)
      )

      // Dynamically import xlsx
      const XLSX = await import('xlsx')
      
      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(flattenedData)
      
      // Auto-size columns (optional)
      const maxWidth = 50
      const colWidths = {}
      flattenedData.forEach(row => {
        Object.keys(row).forEach(key => {
          const value = row[key] ? String(row[key]).length : 10
          colWidths[key] = Math.min(maxWidth, Math.max(colWidths[key] || 0, value))
        })
      })
      
      ws['!cols'] = Object.keys(flattenedData[0] || {}).map(key => ({ wch: colWidths[key] || 15 }))
      
      // Create workbook
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Households')

      const timestamp = new Date().toISOString().slice(0, 10)
      
      let scope = 'organization'
      let projectName = ''
      
      if (projectId) {
        const projectRef = doc(db, `organization/${orgId}/projects/${projectId}`)
        const projectSnap = await getDoc(projectRef)
        projectName = projectSnap.exists() ? projectSnap.data().name : projectId
        scope = `project_${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`
      }
      
      const filename = `households_${scope}_${timestamp}.xlsx`
      XLSX.writeFile(wb, filename)
      
      setIsExporting(false)
      return allHouseholds.length
    } catch (err) {
      console.error('Export error:', err)
      setExportError(err.message || 'Export failed')
      setIsExporting(false)
      throw err
    }
  }, [orgId, fetchAllHouseholdsForExport, flattenHouseholdData])

  return {
    exportToCSV,
    exportToExcel,
    isExporting,
    exportError,
    exportProgress
  }
}