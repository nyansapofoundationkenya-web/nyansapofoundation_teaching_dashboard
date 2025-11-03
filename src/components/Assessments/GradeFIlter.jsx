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
      className="border border-gray-500 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-2 min-w-[120px] text-foreground bg-background-lighter shadow-md"
    >
      {availableGrades.map((grade) => (
        <option key={grade} value={grade} className="text-foreground bg-background-light">
          {grade}
        </option>
      ))}
    </select>
  )
}