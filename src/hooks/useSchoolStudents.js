"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore"
import { db } from "@/firebase/config"

export function useSchoolStudents(organizationId, projectId, schoolId) {
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [schoolInfo, setSchoolInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchSchoolInfo = async () => {
    if (!organizationId || !projectId || !schoolId) return

    try {
      const schoolRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools/${schoolId}`)
      const schoolDoc = await getDoc(schoolRef)

      if (schoolDoc.exists()) {
        setSchoolInfo({ id: schoolDoc.id, ...schoolDoc.data() })
      }
    } catch (err) {
      console.error("Error fetching school info:", err)
    }
  }

  const fetchStudents = async () => {
    if (!organizationId || !projectId || !schoolId) return

    setLoading(true)
    setError(null)

    try {
      // Fetch students
      const studentsRef = collection(
        db,
        `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students`,
      )
      const studentsQuery = query(studentsRef, orderBy("name"))
      const studentsSnapshot = await getDocs(studentsQuery)

      const studentsData = []
      studentsSnapshot.forEach((doc) => {
        studentsData.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      setStudents(studentsData)
    } catch (err) {
      setError(err.message)
      console.error("Error fetching students:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendance = async () => {
    if (!organizationId || !projectId || !schoolId) return

    try {
      // Fetch attendance records
      const attendanceRef = collection(
        db,
        `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/attendance`,
      )
      const attendanceQuery = query(attendanceRef, orderBy("date"))
      const attendanceSnapshot = await getDocs(attendanceQuery)

      const attendanceData = []
      attendanceSnapshot.forEach((doc) => {
        attendanceData.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      setAttendance(attendanceData)
    } catch (err) {
      setError(err.message)
      console.error("Error fetching attendance:", err)
    }
  }

  const getStudentAttendance = (studentId) => {
    const studentAttendance = []

    attendance.forEach((session) => {
      const studentRecord = session.students?.find((s) => s.studentId === studentId)
      if (studentRecord) {
        studentAttendance.push({
          date: session.date,
          session: session.session,
          attended: studentRecord.attended,
          sessionId: session.id,
        })
      }
    })

    return studentAttendance.sort((a, b) => a.date.localeCompare(b.date))
  }

  const getAttendanceStats = (studentId) => {
    const studentAttendance = getStudentAttendance(studentId)
    const totalSessions = studentAttendance.length
    const attendedSessions = studentAttendance.filter((a) => a.attended).length
    const attendanceRate = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0

    return {
      totalSessions,
      attendedSessions,
      missedSessions: totalSessions - attendedSessions,
      attendanceRate,
    }
  }

  const getAllSessions = () => {
    return attendance
      .map((session) => ({
        id: session.id,
        date: session.date,
        session: session.session,
        group: session.group, // Add group information
        totalStudents: session.students?.length || 0,
        presentStudents: session.students?.filter((s) => s.attended).length || 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  useEffect(() => {
    fetchSchoolInfo()
    fetchStudents()
    fetchAttendance()
  }, [organizationId, projectId, schoolId])

  return {
    students,
    attendance,
    schoolInfo,
    loading,
    error,
    fetchStudents,
    fetchAttendance,
    getStudentAttendance,
    getAttendanceStats,
    getAllSessions,
  }
}
