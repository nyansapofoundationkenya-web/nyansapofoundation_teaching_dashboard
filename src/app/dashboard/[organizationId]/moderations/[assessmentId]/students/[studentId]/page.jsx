"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Header from "@/components/Dashboard/Header"
import Sidebar from "@/components/Dashboard/SideBar"
import StudentChart from "@/components/Students/StudentChart"
import { db } from "@/firebase/config"
import { doc, getDoc } from "firebase/firestore"

export default function StudentDetailsPage() {
  const { organizationId, assessmentId, studentId } = useParams()
  const [student, setStudent] = useState(null)
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // 1. Fetch assessment data to get school_id and project_id
        const assessmentRef = doc(db, "assessments", assessmentId)
        const assessmentSnap = await getDoc(assessmentRef)
        
        if (!assessmentSnap.exists()) {
          throw new Error("Assessment not found")
        }
        setAssessment(assessmentSnap.data())

        // 2. Fetch student data
        const studentRef = doc(
          db,
          "organization",
          organizationId,
          "projects",
          assessmentSnap.data().project_id,
          "schools",
          assessmentSnap.data().school_id,
          "students",
          studentId
        )
        
        const studentSnap = await getDoc(studentRef)
        if (!studentSnap.exists()) {
          throw new Error("Student not found")
        }
        
        setStudent({
          id: studentSnap.id,
          ...studentSnap.data()
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [organizationId, assessmentId, studentId])

  if (loading) return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar organizationId={organizationId} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 flex items-center justify-center">
          <div>Loading student data...</div>
        </main>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar organizationId={organizationId} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 flex items-center justify-center">
          <div className="text-red-500">Error: {error}</div>
        </main>
      </div>
    </div>
  )

  if (!student || !assessment) return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar organizationId={organizationId} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 flex items-center justify-center">
          <div>Data not found</div>
        </main>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar organizationId={organizationId} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* Student Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {student.first_name} {student.last_name}
            </h1>
            <h2 className="text-lg text-gray-600 mt-1">
              {student.baseline}
            </h2>
          </div>

          {/* Baseline Visualization */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Assessment Results
            </h2>
            <StudentChart baseline={student.baseline} />
          </div>
        </main>
      </div>
    </div>
  )
}