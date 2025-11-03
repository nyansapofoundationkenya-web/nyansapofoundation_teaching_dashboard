"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Header from "@/components/Dashboard/Header"
import Sidebar from "@/components/Dashboard/SideBar"
import Search from "@/components/Assessments/Search"
import GradeFilter from "@/components/Assessments/GradeFIlter"
import StudentsList from "@/components/Assessments/StudentsList"
import StudentMetrics from "@/components/Assessments/StudentMetrics"
import { db } from "@/firebase/config"
import { doc, getDoc } from "firebase/firestore" 

export default function AssessmentDetailsPage() {
  const { organizationId, assessmentId } = useParams()
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [gradeFilter, setGradeFilter] = useState("All Grades")

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        // Firestore example - adjust for your database
        const assessmentRef = doc(db,"assessments", assessmentId)
        const assessmentSnap = await getDoc(assessmentRef)
        
        if (!assessmentSnap.exists()) {
          throw new Error("Assessment not found")
        }

        const assessmentData = assessmentSnap.data()
        setAssessment({
          id: assessmentSnap.id,
          ...assessmentData
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAssessment()
  }, [organizationId, assessmentId])

  const handleSearchChange = (query) => {
    setSearchQuery(query)
  }

  const handleGradeFilterChange = (grade) => {
    setGradeFilter(grade)
  }

  // Filter students based on search and grade filter
  const filteredStudents = assessment?.assigned_students?.filter(student => {
    const matchesSearch = `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGrade = gradeFilter === "All Grades" || String(student.grade) === gradeFilter
    return matchesSearch && matchesGrade
  }) || []

  if (loading) return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar organizationId={organizationId} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {/* Show skeleton metrics while loading */}
          <StudentMetrics loading={true} />
          <div className="bg-background-light rounded-2xl shadow-lg p-6 border border-gray-600">
            <div className="animate-pulse">
              <div className="h-6 bg-background-lighter rounded w-48 mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="h-12 bg-background-lighter rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar organizationId={organizationId} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-background flex items-center justify-center">
          <div className="text-red-400">Error: {error}</div>
        </main>
      </div>
    </div>
  )

  if (!assessment) return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar organizationId={organizationId} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-background flex items-center justify-center">
          <div className="text-foreground">Assessment not found</div>
        </main>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Fixed Sidebar */}
      <Sidebar initialTitle="Moderations" organizationId={organizationId} />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <Header />
        
        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {/* Header Section */}
          <div className="bg-background-light border-b border-gray-600 px-6 py-4 mb-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-foreground">{assessment.name}</h1>
              <div className="flex items-center gap-4">
                <GradeFilter 
                  selectedGrade={gradeFilter}
                  onGradeChange={handleGradeFilterChange}
                  students={assessment.assigned_students}
                />
                <Search 
                  onSearchChange={handleSearchChange} 
                  placeholder="Search for a student" 
                />
              </div>
            </div>
          </div>

          {/* Student Metrics Section */}
          <StudentMetrics 
            students={filteredStudents} 
            loading={loading}
          />

          {/* Students List Section */}
          <div className="bg-background-light rounded-2xl shadow-lg p-6 border border-gray-600">
            <h2 className="text-lg font-semibold mb-4 text-foreground">
              Assigned Students ({filteredStudents.length})
            </h2>
            {filteredStudents.length > 0 ? (
              <StudentsList 
                students={filteredStudents} 
                organizationId={organizationId}
                assessmentId={assessmentId}
              />
            ) : (
              <div className="text-center py-8 text-gray-400">
                No students match your search criteria
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}