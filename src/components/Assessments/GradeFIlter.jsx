"use client"

import { useState, useEffect } from "react"

export default function GradeFilter({ selectedGrade, onGradeChange, students = [] }) {
  // Extract unique grades as strings from students
  const getUniqueGrades = () => {
    const gradeSet = new Set(
      students
        .map(student => String(student.grade)) // convert all to string
        .filter(Boolean) // remove null/undefined/empty
    )
    return Array.from(gradeSet).sort()
  }

  const [availableGrades, setAvailableGrades] = useState(["All Grades"])
  
  // Update available grades when students data changes
  useEffect(() => {
    const uniqueGrades = getUniqueGrades()
    setAvailableGrades(["All Grades", ...uniqueGrades])
  }, [students])

  const handleChange = (e) => {
    onGradeChange(e.target.value)
  }

  return (
    <select
      value={selectedGrade}
      onChange={handleChange}
      className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px] text-gray-700"
    >
      {availableGrades.map((grade) => (
        <option key={grade} value={grade}>
          {grade}
        </option>
      ))}
    </select>
  )
}
