"use client"

import { useState } from "react"
import { collection, writeBatch, doc, getDocs, increment } from "firebase/firestore"
import { db } from "@/firebase/config"
import * as XLSX from "xlsx"

export function useMultiSheetUpload(organizationId) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState({ current: 0, total: 0, sheet: "" })

  const processMultiSheetFile = async (file, projectId) => {
    setLoading(true)
    setError(null)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })

      const results = []
      const totalSheets = workbook.SheetNames.length
      setProgress({ current: 0, total: totalSheets, sheet: "" })

      const existingSchools = await fetchExistingSchools(organizationId, projectId)

      for (let i = 0; i < workbook.SheetNames.length; i++) {
        const sheetName = workbook.SheetNames[i]
        setProgress({ current: i + 1, total: totalSheets, sheet: sheetName })

        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (jsonData.length < 1) {
          continue
        }

        const result = await processSheetData(jsonData, sheetName, projectId, organizationId, existingSchools)
        results.push({ sheetName, ...result })
      }

      setLoading(false)
      return {
        success: true,
        results,
        totalSheets,
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process file")
      setLoading(false)
      throw err
    }
  }

  const fetchExistingSchools = async (organizationId, projectId) => {
    try {
      const schoolsRef = collection(db, `organization/${organizationId}/projects/${projectId}/schools`)
      const schoolsSnapshot = await getDocs(schoolsRef)

      const schools = {}
      schoolsSnapshot.forEach((doc) => {
        const schoolData = doc.data()
        const schoolName = schoolData.name?.trim()

        if (schoolName) {
          const normalizedKey = schoolName.toLowerCase().trim()
          schools[normalizedKey] = {
            id: doc.id,
            name: schoolName,
            ...schoolData,
          }
        }
      })

      return schools
    } catch (error) {
      console.error("Error fetching existing schools:", error)
      throw new Error("Failed to fetch existing schools")
    }
  }

  const processSheetData = async (data, sheetName, projectId, organizationId, existingSchools) => {
    const headersRow = data[0] || []
    const studentRows = data.slice(1)

    const cleanSchoolName = sheetName.trim()

    const normalizedSearchKey = cleanSchoolName.toLowerCase().trim()
    const matchedSchool = existingSchools[normalizedSearchKey]

    if (!matchedSchool) {
      const availableSchools = Object.values(existingSchools)
        .map((school) => school.name)
        .join(", ")
      throw new Error(
        `School "${cleanSchoolName}" not found in existing schools. Available schools: ${availableSchools}`,
      )
    }

    const schoolId = matchedSchool.id
    const batch = writeBatch(db)

    const studentsData = []
    let studentsCount = 0

    for (let rowIndex = 0; rowIndex < studentRows.length; rowIndex++) {
      const row = studentRows[rowIndex]

      const no = row[0]?.toString().trim()
      const fullName = row[1]?.toString().trim()
      const gradeStr = row[2]?.toString().trim()
      const ageStr = row[3]?.toString().trim() || null
      const sex = row[4]?.toString().trim()

      if (!fullName || !gradeStr || !sex) continue

      const nameParts = fullName.split(" ")
      const first_name = nameParts[0]
      const last_name = nameParts.slice(1).join(" ") || ""

      const grade = Number(gradeStr)
      if (isNaN(grade)) continue

      const age = ageStr ? Number(ageStr) : null
      if (age && isNaN(age)) continue

      const studentData = {
        no,
        first_name,
        last_name,
        grade,
        age,
        sex,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const studentRef = doc(
        collection(db, `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students`),
      )
      batch.set(studentRef, studentData)
      studentsCount++

      studentsData.push({
        id: studentRef.id,
        first_name,
        last_name,
        rowData: row,
      })
    }

    if (studentsCount > 0) {
      const schoolRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools/${schoolId}`)
      const projectRef = doc(db, `organization/${organizationId}/projects/${projectId}`)
      const orgRef = doc(db, `organization/${organizationId}`)

      batch.update(schoolRef, {
        total_students: increment(studentsCount),
        updatedAt: new Date(),
      })
      batch.update(projectRef, {
        total_students: increment(studentsCount),
        updatedAt: new Date(),
      })
      batch.update(orgRef, {
        total_students: increment(studentsCount),
        updatedAt: new Date(),
      })
    }

    await batch.commit()

    return {
      studentsCount,
    }
  }

  return {
    processMultiSheetFile,
    loading,
    error,
    progress,
  }
}