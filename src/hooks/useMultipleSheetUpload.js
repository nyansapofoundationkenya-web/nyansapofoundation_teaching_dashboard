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

        if (jsonData.length < 3) {
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
    const headersRow = data[1] || []
    const sessionRow = data[2] || []
    const studentRows = data.slice(3)

    const [schoolNameFromSheet, groupName] = sheetName.split("-")
    const cleanSchoolName = schoolNameFromSheet?.trim()
    const cleanGroupName = groupName?.trim()

    const normalizedSearchKey = cleanSchoolName?.toLowerCase().trim()
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

    const sessionHasData = sessionRow.some((cell) => cell && cell.toString().trim() !== "")
    const sessionColumns = []

    if (sessionHasData) {
      for (let i = 6; i < headersRow.length; i++) {
        const dateHeader = headersRow[i]
        const sessionHeader = sessionRow[i]

        if (
          !dateHeader ||
          !sessionHeader ||
          dateHeader.toString().trim() === "" ||
          sessionHeader.toString().trim() === ""
        ) {
          continue
        }

        let formattedDate = dateHeader.toString().trim()

        if (!isNaN(dateHeader) && typeof dateHeader === "number") {
          const excelDate = new Date((dateHeader - 25569) * 86400 * 1000)
          const day = excelDate.getDate()
          const month = excelDate.toLocaleDateString("en-US", { month: "short" })
          formattedDate = `${day}-${month}`
        }

        sessionColumns.push({
          index: i,
          date: formattedDate,
          session: sessionHeader.toString().trim(),
          sessionKey: `${formattedDate}-${sessionHeader.toString().trim()}`,
        })
      }
    }

    const studentsData = []
    let studentsCount = 0

    for (let rowIndex = 0; rowIndex < studentRows.length; rowIndex++) {
      const row = studentRows[rowIndex]

      const name = row[1]?.toString().trim()
      const studentClass = row[2]?.toString().trim()
      const sex = row[3]?.toString().trim()

      // Required: name, class, and sex
      if (!name || !studentClass || !sex) continue

      const baseline = row[4]?.toString().trim() || null
      const group = row[5]?.toString().trim() || cleanGroupName || null

      const studentData = {
        name,
        class: studentClass,
        sex,
        baseline,
        group,
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
        name,
        group,
        rowData: row,
      })
    }

    const attendanceBySession = new Map()
    if (sessionColumns.length > 0) {
      sessionColumns.forEach((sessionCol) => {
        const sessionKey = sessionCol.sessionKey
        attendanceBySession.set(sessionKey, {
          date: sessionCol.date,
          session: sessionCol.session,
          group: cleanGroupName,
          students: [],
          createdAt: new Date(),
        })
      })

      studentsData.forEach((student) => {
        sessionColumns.forEach((sessionCol) => {
          const attendanceValue = student.rowData[sessionCol.index]
          const sessionKey = sessionCol.sessionKey

          if (
            attendanceValue !== undefined &&
            attendanceValue !== null &&
            attendanceValue.toString().trim() !== ""
          ) {
            const attended = attendanceValue === 1 || attendanceValue === "1" || attendanceValue === true

            attendanceBySession.get(sessionKey).students.push({
              studentId: student.id,
              name: student.name,
              group: student.group,
              attended,
            })
          }
        })
      })
    }

    let attendanceRecordsCount = 0
    attendanceBySession.forEach((attendanceRecord) => {
      if (attendanceRecord.students.length > 0) {
        const attendanceRef = doc(
          collection(db, `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/attendance`),
        )
        batch.set(attendanceRef, attendanceRecord)
        attendanceRecordsCount++
      }
    })

    // Update counts
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
      attendanceCount: attendanceRecordsCount,
      groupName: cleanGroupName,
    }
  }

  return {
    processMultiSheetFile,
    loading,
    error,
    progress,
  }
}
