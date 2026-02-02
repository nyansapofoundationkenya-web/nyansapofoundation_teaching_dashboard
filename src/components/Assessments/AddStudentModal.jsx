"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  setDoc
} from "firebase/firestore"
import { db } from "@/firebase/config"

export default function AddStudentModal({ assessmentId, onClose }) {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [assessmentData, setAssessmentData] = useState(null)

  useEffect(() => {
    fetchAssessmentAndStudents()
  }, [])

  const fetchAssessmentAndStudents = async () => {
    try {
      setLoading(true)

      // 1️⃣ Get assessment data first (to get calculation_type)
      const assessmentRef = doc(db, "assessments", assessmentId)
      const assessmentSnap = await getDoc(assessmentRef)

      if (!assessmentSnap.exists()) return

      const assessmentData = assessmentSnap.data()
      setAssessmentData(assessmentData)

      const {
        organization_id,
        project_id,
        school_id,
        assigned_students = [],
        type, // Assessment type (Literacy/Numeracy)
        assessmentNumber, // To fetch assessment content
        calculation_type: assessmentCalculationType // Check if assessment already has calculation_type
      } = assessmentData

      const assignedIds = new Set(
        assigned_students.map(s => s.id)
      )

      // 2️⃣ Get students for the school
      const studentsRef = collection(
        db,
        "organization",
        organization_id,
        "projects",
        project_id,
        "schools",
        school_id,
        "students"
      )

      const studentsSnap = await getDocs(studentsRef)

      const unassigned = studentsSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Ensure grade is stored as number
          grade: typeof doc.data().grade === 'string' 
            ? parseInt(doc.data().grade, 10) || 0
            : Number(doc.data().grade) || 0
        }))
        .filter(student => !assignedIds.has(student.id))

      setStudents(unassigned)
    } catch (err) {
      console.error("Error fetching students:", err)
    } finally {
      setLoading(false)
    }
  }

  const toggleStudent = id => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const getCalculationType = async () => {
    if (!assessmentData) return ""
    
    // Check if assessment already has calculation_type stored
    if (assessmentData.calculation_type) {
      return assessmentData.calculation_type
    }
    
    // If not, fetch from assessment content
    try {
      const { type, assessmentNumber } = assessmentData
      
      if (!type || !assessmentNumber) return ""
      
      const collectionName = type.toLowerCase()
      const assessmentContentRef = doc(db, collectionName, assessmentNumber.toString())
      const assessmentContentSnap = await getDoc(assessmentContentRef)
      
      if (assessmentContentSnap.exists()) {
        const contentData = assessmentContentSnap.data()
        // Get name field and convert to lowercase
        return contentData?.name ? contentData.name.toLowerCase().trim() : ""
      }
    } catch (error) {
      console.error("Error fetching calculation type from assessment content:", error)
    }
    
    return ""
  }

  const createAssessmentResult = async (assessmentId, studentId, studentData) => {
    try {
      const assessmentResultId = `${assessmentId}_${studentId}`
      const assessmentResultRef = doc(
        db, 
        "assessments", 
        assessmentId, 
        "assessments-results", 
        assessmentResultId
      )

      // Get calculation_type
      const calculationType = await getCalculationType()

      // Create assessment result document with all necessary fields
      const resultData = {
        assessmentId: assessmentId,
        school_id: assessmentData?.school_id,
        student_id: studentId,
        student_first_name: studentData.first_name || "",
        student_last_name: studentData.last_name || "",
        student_name: `${studentData.first_name || ""} ${studentData.last_name || ""}`.trim(),
        student_grade: Number(studentData.grade) || 0,
        competence_level: 0,
        assessment_level: assessmentData?.level || "Baseline",
        to_be_done: assessmentData?.to_be_done || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        status: "pending",
        calculation_type: calculationType, // Add calculation_type here
        // Additional fields that might be needed
        sex: studentData.sex || "",
        group: studentData.group || "",
        baseline: "",
        completed_assessment: false,
        has_done: false,
      }

      await setDoc(assessmentResultRef, resultData)
      
      console.log(`Created assessment result for student ${studentId} with calculation_type: ${calculationType}`)
    } catch (error) {
      console.error(`Error creating assessment result for student ${studentId}:`, error)
      throw error
    }
  }

  const handleAddStudents = async () => {
    if (selectedIds.size === 0) return

    try {
      setSaving(true)

      const selectedStudents = students
        .filter(s => selectedIds.has(s.id))
        .map(s => ({
          id: s.id,
          first_name: s.first_name,
          last_name: s.last_name,
          grade: Number(s.grade) || 0, // Ensure grade is stored as number
          sex: s.sex,
          baseline: "",
          completed_assessment: false,
          assessment_status: "not_started",
          // Add other fields if needed
          group: s.group || "",
          name: `${s.first_name || ""} ${s.last_name || ""}`.trim(),
        }))

      // First, create assessment results for each selected student
      for (const student of selectedStudents) {
        try {
          await createAssessmentResult(assessmentId, student.id, student)
        } catch (error) {
          console.error(`Failed to create assessment result for student ${student.id}:`, error)
          // Continue with other students even if one fails
        }
      }

      // Then add students to the assessment
      const assessmentRef = doc(db, "assessments", assessmentId)
      await updateDoc(assessmentRef, {
        assigned_students: arrayUnion(...selectedStudents),
        // Optionally update the student count
        student_count: (assessmentData?.student_count || 0) + selectedStudents.length
      })

      onClose()
    } catch (err) {
      console.error("Error adding students:", err)
      alert("Failed to add students. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-background-light w-full max-w-lg rounded-2xl shadow-xl border border-gray-600 p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Add Students to Assessment
            {assessmentData && (
              <span className="text-sm font-normal text-gray-400 block">
                {assessmentData.name}
              </span>
            )}
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <p className="text-gray-400">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="text-gray-400">
            All students are already assigned.
          </p>
        ) : (
          <>
            {assessmentData?.calculation_type && (
              <div className="mb-3 p-2 bg-primary-2/10 border border-primary-2/30 rounded-lg">
                <p className="text-xs text-primary-2">
                  Calculation Type: <span className="font-semibold">{assessmentData.calculation_type}</span>
                </p>
              </div>
            )}
            
            <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
              {students.map(student => (
                <label
                  key={student.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(student.id)}
                    onChange={() => toggleStudent(student.id)}
                  />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {student.first_name} {student.last_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      Grade {student.grade} · {student.sex}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-600 text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleAddStudents}
            disabled={saving || selectedIds.size === 0}
            className="px-4 py-2 rounded-lg bg-primary-3 text-primary-1 disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add Selected"}
          </button>
        </div>
      </div>
    </div>
  )
}