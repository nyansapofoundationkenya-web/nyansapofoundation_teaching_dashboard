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

        if (jsonData.length < 4) {
          continue
        }

        const result = await processSheetData(jsonData, sheetName, projectId, organizationId, existingSchools)
        results.push({ sheetName, ...result })
      }

      setLoading(false)
      return {
        success: true,
        results,
        totalSheets: workbook.SheetNames.length,
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
    const headersRow = data[1]
    const sessionRow = data[2]
    const studentRows = data.slice(3)

    // Extract school name and group from sheet name
    const [schoolNameFromSheet, groupName] = sheetName.split("-")
    const cleanSchoolName = schoolNameFromSheet?.trim()
    const cleanGroupName = groupName?.trim()

    // Find matching school
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

    // Find session columns starting from column 7 (index 6)
    const sessionColumns = []
    for (let i = 6; i < headersRow.length; i++) {
      const dateHeader = headersRow[i]
      const sessionHeader = sessionRow[i]

      // Skip if either date or session is empty
      if (
        !dateHeader ||
        !sessionHeader ||
        dateHeader.toString().trim() === "" ||
        sessionHeader.toString().trim() === ""
      ) {
        continue
      }

      // Handle Excel date formatting
      let formattedDate = dateHeader.toString().trim()

      // If it's a number (Excel serial date), convert it
      if (!isNaN(dateHeader) && typeof dateHeader === "number") {
        // Excel date serial number to JavaScript Date
        const excelDate = new Date((dateHeader - 25569) * 86400 * 1000)
        // Format as "21-May" style
        const day = excelDate.getDate()
        const month = excelDate.toLocaleDateString("en-US", { month: "short" })
        formattedDate = `${day}-${month}`
      }

      sessionColumns.push({
        index: i,
        date: formattedDate, // Now properly formatted like "21-May"
        session: sessionHeader.toString().trim(),
        sessionKey: `${formattedDate}-${sessionHeader.toString().trim()}`,
      })
    }

    if (sessionColumns.length === 0) {
      return {
        studentsCount: 0,
        attendanceCount: 0,
        groupName: cleanGroupName,
      }
    }

    // Process students
    const studentsData = []
    let studentsCount = 0

    for (let rowIndex = 0; rowIndex < studentRows.length; rowIndex++) {
      const row = studentRows[rowIndex]
      if (!row[1]) continue

      const studentName = row[1]?.toString().trim()
      const studentGroup = row[5] || cleanGroupName

      const studentData = {
        name: studentName,
        class: row[2],
        sex: row[3],
        baseline: row[4],
        group: studentGroup,
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
        name: studentName,
        group: studentGroup,
        rowData: row,
      })
    }

    // Group attendance by session
    const attendanceBySession = new Map()

    // Initialize attendance records for each session
    sessionColumns.forEach((sessionCol) => {
      const sessionKey = sessionCol.sessionKey
      attendanceBySession.set(sessionKey, {
        date: sessionCol.date, // Original format like "21-May"
        session: sessionCol.session,
        group: cleanGroupName,
        students: [],
        createdAt: new Date(),
      })
    })

    // Process attendance for each student
    studentsData.forEach((student) => {
      sessionColumns.forEach((sessionCol) => {
        const attendanceValue = student.rowData[sessionCol.index]
        const sessionKey = sessionCol.sessionKey

        if (
          attendanceValue !== undefined &&
          attendanceValue !== null &&
          attendanceValue !== "" &&
          attendanceValue.toString().trim() !== ""
        ) {
          const attended = attendanceValue === 1 || attendanceValue === "1" || attendanceValue === true

          attendanceBySession.get(sessionKey).students.push({
            studentId: student.id,
            name: student.name,
            group: student.group,
            attended: attended,
          })
        }
      })
    })

    // Save attendance records
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

    // Update counters
    if (studentsCount > 0) {
      const schoolRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools/${schoolId}`)
      batch.update(schoolRef, {
        total_students: increment(studentsCount),
        updatedAt: new Date(),
      })

      const projectRef = doc(db, `organization/${organizationId}/projects/${projectId}`)
      batch.update(projectRef, {
        total_students: increment(studentsCount),
        updatedAt: new Date(),
      })

      const orgRef = doc(db, `organization/${organizationId}`)
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
