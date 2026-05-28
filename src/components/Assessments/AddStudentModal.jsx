"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
} from "firebase/firestore"
import { db } from "@/firebase/config"

export default function AddStudentModal({ assessmentId, onClose }) {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])          // all unassigned students
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [assessmentData, setAssessmentData] = useState(null)
  const [gradeFilter, setGradeFilter] = useState("all") // new state for grade filter

  // Fetch assessment and unassigned students on mount
  useEffect(() => {
    fetchAssessmentAndStudents()
  }, [])

  const fetchAssessmentAndStudents = async () => {
    try {
      setLoading(true)

      const assessmentRef = doc(db, "assessments", assessmentId)
      const assessmentSnap = await getDoc(assessmentRef)

      if (!assessmentSnap.exists()) return

      const data = assessmentSnap.data()
      setAssessmentData(data)

      const {
        organization_id,
        project_id,
        school_id,
        assigned_students = [],
      } = data

      const assignedIds = new Set(assigned_students.map(s => s.id))

      const studentsRef = collection(
        db,
        "organization", organization_id,
        "projects", project_id,
        "schools", school_id,
        "students"
      )

      const studentsSnap = await getDocs(studentsRef)

      const unassigned = studentsSnap.docs
        .map(d => ({
          id: d.id,
          ...d.data(),
          grade: typeof d.data().grade === "string"
            ? parseInt(d.data().grade, 10) || 0
            : Number(d.data().grade) || 0,
        }))
        .filter(s => !assignedIds.has(s.id))

      setStudents(unassigned)
    } catch (err) {
      console.error("Error fetching students:", err)
    } finally {
      setLoading(false)
    }
  }

  // Filter students by selected grade
  const filteredStudents = gradeFilter === "all"
    ? students
    : students.filter(s => s.grade === parseInt(gradeFilter, 10))

  const allSelected = filteredStudents.length > 0 &&
    filteredStudents.every(s => selectedIds.has(s.id))

  const toggleSelectAll = () => {
    if (allSelected) {
      // Remove all currently filtered students from selection
      setSelectedIds(prev => {
        const next = new Set(prev)
        filteredStudents.forEach(s => next.delete(s.id))
        return next
      })
    } else {
      // Add all filtered students to selection
      setSelectedIds(prev => {
        const next = new Set(prev)
        filteredStudents.forEach(s => next.add(s.id))
        return next
      })
    }
  }

  const toggleStudent = id => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Create a single assessment‑result sub‑document
  const createAssessmentResult = async (studentId, studentData) => {
    const assessmentResultId = `${assessmentId}_${studentId}`
    const assessmentResultRef = doc(
      db,
      "assessments", assessmentId,
      "assessments-results", assessmentResultId
    )

    const resultData = {
      assessmentId,
      school_id: assessmentData?.school_id,
      student_id: studentId,
      student_first_name: studentData.first_name || "",
      student_last_name: studentData.last_name || "",
      student_name: `${studentData.first_name || ""} ${studentData.last_name || ""}`.trim(),
      student_grade: Number(studentData.grade) || 0,
      competence_level: 0,
      assessment_level: assessmentData?.level || "Baseline",
      to_be_done: assessmentData?.to_be_done || new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString(),
      status: "pending",
      sex: studentData.sex || "",
      group: studentData.group || "",
      baseline: "",
      completed_assessment: false,
      has_done: false,
    }

    await setDoc(assessmentResultRef, resultData)
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
          grade: Number(s.grade) || 0,
          sex: s.sex || "",
          baseline: "",
          completed_assessment: false,
          assessment_status: "not_started",
          group: s.group || "",
          name: `${s.first_name || ""} ${s.last_name || ""}`.trim(),
        }))

      // ----- CRITICAL FIX -----
      // Create ALL assessment results first. If any fails, we abort the entire operation.
      await Promise.all(
        selectedStudents.map(s => createAssessmentResult(s.id, s))
      )
      // -------------------------

      // Now that all sub‑documents exist, update the assessment's assigned_students list
      const assessmentRef = doc(db, "assessments", assessmentId)
      const freshSnap = await getDoc(assessmentRef)
      const existing = freshSnap.data()?.assigned_students || []
      const existingIds = new Set(existing.map(s => s.id))

      const merged = [
        ...existing,
        ...selectedStudents.filter(s => !existingIds.has(s.id)),
      ]

      await updateDoc(assessmentRef, {
        assigned_students: merged,
        student_count: merged.length,
      })

      onClose() // success: close modal
    } catch (err) {
      console.error("Error adding students:", err)
      alert("Failed to add students. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  // Helper to get unique grades from the (unfiltered) student list for the dropdown
  const availableGrades = [...new Set(students.map(s => s.grade))].sort((a,b) => a-b)

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
          <p className="text-gray-400">All students are already assigned.</p>
        ) : (
          <>
            {/* Grade Filter */}
            <div className="mb-4 flex items-center gap-3">
              <label className="text-sm text-gray-300">Filter by grade:</label>
              <select
                value={gradeFilter}
                onChange={(e) => {
                  setGradeFilter(e.target.value)
                  // optional: clear selection when filter changes? (keeps UX clean)
                  // setSelectedIds(new Set())
                }}
                className="px-2 py-1 rounded bg-gray-700 text-white border border-gray-600"
              >
                <option value="all">All grades</option>
                {availableGrades.map(grade => (
                  <option key={grade} value={grade}>
                    Grade {grade}
                  </option>
                ))}
              </select>
            </div>

            {/* Select All (only for currently filtered students) */}
            {filteredStudents.length > 0 && (
              <label className="flex items-center gap-3 px-2 py-2 mb-2 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
                <span className="text-sm font-medium text-white">
                  Select all ({filteredStudents.length})
                </span>
              </label>
            )}

            {/* Student list (filtered) */}
            <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
              {filteredStudents.map(student => (
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
              {filteredStudents.length === 0 && gradeFilter !== "all" && (
                <p className="text-sm text-gray-400 px-2">
                  No students in grade {gradeFilter}
                </p>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : ""}
          </span>
          <div className="flex gap-3">
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
              {saving ? "Adding..." : `Add ${selectedIds.size || ""} Student${selectedIds.size !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}