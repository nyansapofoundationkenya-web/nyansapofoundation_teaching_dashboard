"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  writeBatch,
  arrayUnion,
} from "firebase/firestore"
import { db } from "@/firebase/config"

// Firestore batched writes cap out at 500 operations per batch.
// We stay well under that to leave headroom for the future.
const BATCH_CHUNK_SIZE = 400

export default function AddStudentModal({ assessmentId, onClose }) {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])          // all unassigned students
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [saveProgress, setSaveProgress] = useState(null) // { done, total } while saving
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

  // Split an array into chunks of a given size
  const chunkArray = (arr, size) => {
    const chunks = []
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size))
    }
    return chunks
  }

  // Build the assessments-results payload for one student
  const buildAssessmentResultData = (studentId, studentData) => ({
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
  })

  const handleAddStudents = async () => {
    if (selectedIds.size === 0) return

    try {
      setSaving(true)
      setSaveProgress({ done: 0, total: selectedIds.size })

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

      console.log(`[AddStudentModal] Adding ${selectedStudents.length} students to assessment ${assessmentId}`)

      // ----- Step 1: create all assessments-results docs using batched writes -----
      // Batched writes are atomic (all succeed or all fail together) and far more
      // reliable at high volume than firing 100+ independent setDoc calls with
      // Promise.all, which can silently drop writes under load.
      const chunks = chunkArray(selectedStudents, BATCH_CHUNK_SIZE)
      let done = 0

      for (const chunk of chunks) {
        const batch = writeBatch(db)

        chunk.forEach(s => {
          const assessmentResultId = `${assessmentId}_${s.id}`
          const assessmentResultRef = doc(
            db,
            "assessments", assessmentId,
            "assessments-results", assessmentResultId
          )
          batch.set(assessmentResultRef, buildAssessmentResultData(s.id, s))
        })

        await batch.commit()
        done += chunk.length
        setSaveProgress({ done, total: selectedStudents.length })
        console.log(`[AddStudentModal] Committed batch: ${done}/${selectedStudents.length} results created`)
      }

      // ----- Step 2: atomically append to assigned_students -----
      // Using arrayUnion instead of a read -> merge -> overwrite avoids the race
      // condition where a stale read of assigned_students clobbers writes that
      // landed in between the read and the update (the likely cause of only a
      // handful of students "sticking" per attempt).
      const assessmentRef = doc(db, "assessments", assessmentId)
      await updateDoc(assessmentRef, {
        assigned_students: arrayUnion(...selectedStudents),
      })

      // Keep student_count accurate by reading the doc fresh after the atomic append
      const finalSnap = await getDoc(assessmentRef)
      const finalCount = (finalSnap.data()?.assigned_students || []).length
      await updateDoc(assessmentRef, { student_count: finalCount })

      console.log(`[AddStudentModal] Done. assigned_students now has ${finalCount} entries.`)

      onClose() // success: close modal
    } catch (err) {
      console.error("Error adding students:", err)
      alert(`Failed to add students: ${err.message || "Please try again."}`)
    } finally {
      setSaving(false)
      setSaveProgress(null)
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
            {saving && saveProgress
              ? `Saving ${saveProgress.done}/${saveProgress.total}...`
              : selectedIds.size > 0
                ? `${selectedIds.size} selected`
                : ""}
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