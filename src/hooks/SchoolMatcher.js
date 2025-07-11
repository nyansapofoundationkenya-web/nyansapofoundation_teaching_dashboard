"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/firebase/config"
import { AlertCircle, CheckCircle, School } from "lucide-react"

/**
 * Component to preview and validate school matching before upload
 */
export default function SchoolMatcher({ organizationId, projectId, sheetNames, onValidationComplete }) {
  const [existingSchools, setExistingSchools] = useState([])
  const [matchingResults, setMatchingResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSchoolsAndValidate()
  }, [organizationId, projectId, sheetNames])

  const fetchSchoolsAndValidate = async () => {
    try {
      setLoading(true)
      const schoolsRef = collection(db, `organization/${organizationId}/projects/${projectId}/schools`)
      const schoolsSnapshot = await getDocs(schoolsRef)

      const schools = []
      schoolsSnapshot.forEach((doc) => {
        const schoolData = doc.data()
        schools.push({
          id: doc.id,
          name: schoolData.name,
          ...schoolData,
        })
      })

      setExistingSchools(schools)

      const results = sheetNames.map((sheetName) => {
        const schoolNameFromSheet = sheetName.split("-")[0]?.trim()

        const matchedSchool = schools.find((school) => {
          const dbSchoolName = school.name?.toLowerCase().trim()
          const extractedName = schoolNameFromSheet?.toLowerCase()
          return dbSchoolName === extractedName
        })

        return {
          sheetName,
          schoolNameFromSheet,
          matched: !!matchedSchool,
          matchedSchool: matchedSchool || null,
        }
      })

      setMatchingResults(results)

      const allMatched = results.every((result) => result.matched)
      onValidationComplete(allMatched, results)
    } catch (error) {
      console.error("Error validating schools:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="text-sm text-blue-700">Validating schools...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
          <School className="w-4 h-4" />
          School Matching Validation
        </h4>

        <div className="space-y-2">
          {matchingResults.map((result, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex-1">
                <div className="text-sm">
                  <span className="font-medium text-gray-800">{result.sheetName}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Extracted: &quot;{result.schoolNameFromSheet}&quot;
                  {result.matched && result.matchedSchool && (
                    <span className="ml-2 text-green-600">
                      &rarr; Matches &quot;{result.matchedSchool.name}&quot;
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {result.matched ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600">Matched</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-red-600">No match</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {matchingResults.some((result) => !result.matched) && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> Some sheets don&apos;t match existing schools. The school name before the dash must
              exactly match an existing school name.
            </p>
            <div className="mt-2">
              <p className="text-xs text-red-700">Unmatched sheets:</p>
              <ul className="text-xs text-red-600 ml-4">
                {matchingResults
                  .filter((result) => !result.matched)
                  .map((result, index) => (
                    <li key={index}>
                      &quot;{result.schoolNameFromSheet}&quot; (from sheet: {result.sheetName})
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 p-3 rounded">
        <h5 className="text-sm font-medium text-blue-800 mb-2">Existing Schools in Project:</h5>
        <div className="flex flex-wrap gap-1">
          {existingSchools.map((school, index) => (
            <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {school.name}
            </span>
          ))}
        </div>
        {existingSchools.length === 0 && <p className="text-xs text-gray-500">No schools found in this project.</p>}
      </div>
    </div>
  )
}
