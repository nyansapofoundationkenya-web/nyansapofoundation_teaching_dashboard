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

        // Fetch all projects under the organization
        const projectsRef = collection(db, `organization/${orgId}/projects`)
        const projectsSnap = await getDocs(projectsRef)

        for (const projectDoc of projectsSnap.docs) {
          const projectId = projectDoc.id
          const projectData = projectDoc.data()

          // Fetch all schools under the project
          const schoolsRef = collection(db, `organization/${orgId}/projects/${projectId}/schools`)
          const schoolsSnap = await getDocs(schoolsRef)

          for (const schoolDoc of schoolsSnap.docs) {
            const schoolId = schoolDoc.id
            const schoolData = schoolDoc.data()

            // Fetch all households under the school
            const householdsRef = collection(db, `organization/${orgId}/projects/${projectId}/schools/${schoolId}/households`)
            const householdsSnap = await getDocs(householdsRef)

            for (const hhDoc of householdsSnap.docs) {
              allHouseholds.push({
                id: hhDoc.id,
                projectId,
                projectName: projectData?.name || projectId,
                schoolId,
                schoolName: schoolData?.name || schoolId,
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

  // Fetch households for a specific project
  const fetchProjectHouseholds = async (projectId) => {
    if (!orgId || !projectId) {
      throw new Error('Organization ID and Project ID are required')
    }

    try {
      const projectHouseholds = []
      const projectRef = collection(db, `organization/${orgId}/projects`)
      const projectDoc = await getDocs(projectRef)
      
      let projectData = null
      projectDoc.forEach(doc => {
        if (doc.id === projectId) {
          projectData = doc.data()
        }
      })

      // Fetch all schools under the project
      const schoolsRef = collection(db, `organization/${orgId}/projects/${projectId}/schools`)
      const schoolsSnap = await getDocs(schoolsRef)

      for (const schoolDoc of schoolsSnap.docs) {
        const schoolId = schoolDoc.id
        const schoolData = schoolDoc.data()

        // Fetch all households under the school
        const householdsRef = collection(db, `organization/${orgId}/projects/${projectId}/schools/${schoolId}/households`)
        const householdsSnap = await getDocs(householdsRef)

        for (const hhDoc of householdsSnap.docs) {
          projectHouseholds.push({
            id: hhDoc.id,
            projectId,
            projectName: projectData?.name || projectId,
            schoolId,
            schoolName: schoolData?.name || schoolId,
            ...hhDoc.data()
          })
        }
      }

      return projectHouseholds
    } catch (err) {
      console.error('Error fetching project households:', err)
      throw err
    }
  }

  // Flatten household data for export
  const flattenHouseholdData = (household) => {
    const flattened = {
      // Basic Info
      'Project Name': household.projectName,
      'School Name': household.schoolName,
      'Household Head Name': household.householdHeadName,
      'Household Head Phone': household.householdHeadPhone,
      'Is Household Head': household.householdHead ? 'Yes' : 'No',
      'Respondent Name': household.respondentName,
      'Respondent Age': household.respondentAge,
      'Household Members Count': household.householdMembersCount,
      
      // Location
      'County': household.county,
      'Sub-County': household.subCounty,
      'Ward': household.ward,
      'Village': household.village,
      
      // Demographics
      'Main Language': household.mainLanguage,
      'Marital Status': household.maritalStatus || 'N/A',
      'Relationship to Head': household.relationshipToHead,
      
      // Economic
      'Income Source': household.incomeSource,
      'Has Electricity': household.hasElectricity ? 'Yes' : 'No',
      'Household Assets': household.householdAssets?.join(', ') || 'None',
      
      // Interview Info
      'Interview Date': household.interviewDate ? new Date(household.interviewDate).toLocaleDateString() : 'N/A',
      'Interviewer Name': household.interviewerName,
      'Consent Given': household.consentGiven ? 'Yes' : 'No',
    }

    // Children Information
    if (household.children && household.children.length > 0) {
      flattened['Number of Children'] = household.children.length
      
      household.children.forEach((child, index) => {
        const childNum = index + 1
        const fullName = `${child.firstName || ''} ${child.lastName || ''}`.trim()
        flattened[`Child ${childNum} - Name`] = fullName || 'N/A'
        flattened[`Child ${childNum} - Age`] = child.age
        flattened[`Child ${childNum} - Gender`] = child.gender
        flattened[`Child ${childNum} - Lives With`] = child.livesWith
      })
    } else {
      flattened['Number of Children'] = 0
    }

    // Learning Environment
    if (household.childLearningEnvironment) {
      flattened['Has Books/Materials'] = household.childLearningEnvironment.hasBooksOrMaterials ? 'Yes' : 'No'
      flattened['Has Quiet Study Place'] = household.childLearningEnvironment.hasQuietPlaceToStudy ? 'Yes' : 'No'
      flattened['Missed School Last Month'] = household.childLearningEnvironment.missedSchoolLastMonth ? 'Yes' : 'No'
      flattened['Reason for Missing School'] = household.childLearningEnvironment.reasonForMissingSchool || 'N/A'
    }

    // Parental Engagement
    if (household.parentalEngagement) {
      flattened['Has School Age Child'] = household.parentalEngagement.hasSchoolAgeChild ? 'Yes' : 'No'
      flattened['Attends School Meetings'] = household.parentalEngagement.attendsSchoolMeetings ? 'Yes' : 'No'
      flattened['Monitors Attendance'] = household.parentalEngagement.monitorsAttendance ? 'Yes' : 'No'
      flattened['Homework Helper'] = household.parentalEngagement.homeworkHelper || 'N/A'
      flattened['Teacher Discussion Frequency'] = household.parentalEngagement.teacherDiscussionFrequency || 'N/A'
    }

    return flattened
  }

  // Convert to CSV
  const convertToCSV = (data) => {
    if (!data || data.length === 0) return ''

    const headers = Array.from(
      new Set(data.flatMap(row => Object.keys(row)))
    )

    const csvHeaders = headers.map(h => `"${h}"`).join(',')

    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header] !== undefined ? row[header] : ''
        return `"${String(value).replace(/"/g, '""')}"`
      }).join(',')
    )

    return [csvHeaders, ...csvRows].join('\n')
  }

  // Download file
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

  // Export to CSV - supports both organization and project level
  const exportToCSV = async (projectId = null) => {
    setIsExporting(true)
    setExportError(null)

    try {
      let householdsToExport = []
      let scope = ''

      if (projectId) {
        // Export specific project
        householdsToExport = await fetchProjectHouseholds(projectId)
        scope = `project_${projectId}`
      } else {
        // Export entire organization
        householdsToExport = households
        scope = 'organization'
      }

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

  // Export to Excel - supports both organization and project level
  const exportToExcel = async (projectId = null) => {
    setIsExporting(true)
    setExportError(null)

    try {
      let householdsToExport = []
      let scope = ''

      if (projectId) {
        // Export specific project
        householdsToExport = await fetchProjectHouseholds(projectId)
        scope = `project_${projectId}`
      } else {
        // Export entire organization
        householdsToExport = households
        scope = 'organization'
      }

      if (householdsToExport.length === 0) {
        setExportError('No households found to export')
        setIsExporting(false)
        return 0
      }

      const flattenedData = householdsToExport.map(flattenHouseholdData)
      
      const headers = Array.from(
        new Set(flattenedData.flatMap(row => Object.keys(row)))
      )

      let html = '<html><head><meta charset="utf-8"></head><body><table border="1">'
      
      html += '<tr>'
      headers.forEach(header => {
        html += `<th>${header}</th>`
      })
      html += '</tr>'
      
      flattenedData.forEach(row => {
        html += '<tr>'
        headers.forEach(header => {
          const value = row[header] !== undefined ? row[header] : ''
          html += `<td>${value}</td>`
        })
        html += '</tr>'
      })
      
      html += '</table></body></html>'
      
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `households_${scope}_${timestamp}.xls`
      
      downloadFile(html, filename, 'application/vnd.ms-excel')
      
      setIsExporting(false)
      return householdsToExport.length
    } catch (err) {
      console.error('Export error:', err)
      setExportError(err.message)
      setIsExporting(false)
      throw err
    }
  }

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
    const femaleParents = (hh.parents || []).filter((p) => p.type === 'Mother').length
    const maleParents = (hh.parents || []).filter((p) => p.type === 'Father').length
    totalFemales += femaleParents
    totalMales += maleParents

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