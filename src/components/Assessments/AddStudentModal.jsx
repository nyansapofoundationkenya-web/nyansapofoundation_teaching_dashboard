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
} from "firebase/firestore"
import { db } from "@/firebase/config"

export default function AddStudentModal({ assessmentId, onClose }) {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUnassignedStudents()
  }, [])

  const fetchUnassignedStudents = async () => {
    try {
      setLoading(true)

      // 1️⃣ Get assessment
      const assessmentRef = doc(db, "assessments", assessmentId)
      const assessmentSnap = await getDoc(assessmentRef)

      if (!assessmentSnap.exists()) return

      const {
        organization_id,
        project_id,
        school_id,
        assigned_students = [],
      } = assessmentSnap.data()

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
          grade: s.grade,
          sex: s.sex,
          baseline: "",
          completed_assessment: false,
          assessment_status: "not_started",
          name: "",
          group: "",
        }))

      const assessmentRef = doc(db, "assessments", assessmentId)

      await updateDoc(assessmentRef, {
        assigned_students: arrayUnion(...selectedStudents),
      })

      onClose()
    } catch (err) {
      console.error("Error adding students:", err)
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
