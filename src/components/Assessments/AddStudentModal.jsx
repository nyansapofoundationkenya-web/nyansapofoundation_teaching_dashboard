"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  runTransaction,
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
      setSaveProgress({ phase: "assigning", done: 0, total: selectedIds.size })

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

      // ----- Step 1: atomically merge into assigned_students, deduped by id -----
      // IMPORTANT — ORDER MATTERS HERE: a Cloud Function is set up to trigger on
      // *any* change to the assessments-results subcollection, and it writes
      // back to this same parent assessments doc. If we create the 203
      // assessments-results docs first, that fires the function up to 203
      // times in a burst, and each of those writes to the assessment doc
      // collides with our transaction trying to read+write it — causing
      // "stored version does not match required base version" errors once
      // Firestore's retry budget is exhausted.
      //
      // Doing the assigned_students merge FIRST, before any subcollection
      // writes happen, means the Cloud Function hasn't fired yet and there's
      // nothing to contend with. We still keep a retry loop below as a safety
      // net for ordinary contention (e.g. another admin editing the same
      // assessment at the same time), but this ordering avoids the
      // self-inflicted contention entirely.
      const assessmentRef = doc(db, "assessments", assessmentId)
      let finalCount = 0

      const MAX_TRANSACTION_ATTEMPTS = 8
      let lastErr = null

      for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt++) {
        try {
          await runTransaction(db, async (transaction) => {
            const freshSnap = await transaction.get(assessmentRef)
            const existing = freshSnap.data()?.assigned_students || []
            const existingIds = new Set(existing.map(s => s.id))

            const newOnes = selectedStudents.filter(s => !existingIds.has(s.id))
            const merged = [...existing, ...newOnes]
            finalCount = merged.length

            transaction.update(assessmentRef, {
              assigned_students: merged,
              student_count: merged.length,
            })
          })
          lastErr = null
          break // success
        } catch (err) {
          lastErr = err
          const isVersionConflict =
            err?.code === "aborted" ||
            /version/i.test(err?.message || "") ||
            /aborted/i.test(err?.message || "")

          if (!isVersionConflict || attempt === MAX_TRANSACTION_ATTEMPTS) {
            throw err
          }

          const backoffMs = Math.min(300 * 2 ** (attempt - 1), 5000)
          console.warn(
            `[AddStudentModal] Transaction conflict on attempt ${attempt}/${MAX_TRANSACTION_ATTEMPTS}, retrying in ${backoffMs}ms...`,
            err.message
          )
          await new Promise(res => setTimeout(res, backoffMs))
        }
      }

      if (lastErr) throw lastErr

      console.log(`[AddStudentModal] assigned_students now has ${finalCount} entries.`)
      setSaveProgress({ phase: "creating", done: 0, total: selectedStudents.length })

      // ----- Step 2: create all assessments-results docs using batched writes -----
      // Now that assigned_students is safely committed, it's fine for this to
      // trigger the Cloud Function repeatedly — we're not writing to the
      // assessment doc anymore, so there's nothing left for it to collide with.
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
        setSaveProgress({ phase: "creating", done, total: selectedStudents.length })
        console.log(`[AddStudentModal] Committed batch: ${done}/${selectedStudents.length} results created`)
      }

      console.log(`[AddStudentModal] Done.`)

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
              ? saveProgress.phase === "assigning"
                ? "Assigning students..."
                : `Creating records ${saveProgress.done}/${saveProgress.total}...`
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