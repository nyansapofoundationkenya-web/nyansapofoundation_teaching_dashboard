"use client"

import { useRouter, useParams } from "next/navigation"

export default function StudentsList({ students, organizationId, assessmentId }) {
  const router = useRouter()

  const handleStudentClick = (studentId) => {
    router.push(`/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}`)
  }

  return (
    <div className="space-y-2 ">
      {students.map((student) => (
        <div
          key={student.id}
          onClick={() => handleStudentClick(student.id)}
          className="flex justify-between items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div>
            <h3 className="font-medium text-gray-700">{student.first_name} {student.last_name}</h3>
            <p className="text-sm text-gray-600">{student.grade}</p>
          </div>
          <div className="flex gap-4 items-center">
            <span className="text-sm text-gray-600 capitalize">{student.sex}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              student.baseline === "Beginner" ? "bg-blue-100 text-blue-800" :
              student.baseline === "Intermediate" ? "bg-green-100 text-green-800" :
              "bg-purple-100 text-purple-800"
            }`}>
              {student.baseline}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}