"use client"

import { useRouter, useParams } from "next/navigation"

export default function StudentsList({ students, organizationId, assessmentId }) {
  const router = useRouter()

  const handleStudentClick = (studentId) => {
    router.push(`/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}`)
  }

  // Create a sorted copy — students with baseline first, then without
  const sortedStudents = [...students].sort((a, b) => {
    // Treat missing/empty/falsy baseline as "no baseline"
    const aHasBaseline = !!a?.baseline && String(a.baseline).trim() !== '';
    const bHasBaseline = !!b?.baseline && String(b.baseline).trim() !== '';

    // Students with baseline come BEFORE those without
    if (aHasBaseline && !bHasBaseline) return -1;
    if (!aHasBaseline && bHasBaseline) return 1;

    // If both have or both don't → keep original order (or you can add name sorting if preferred)
    return 0;
  });

  return (
    <div className="space-y-2">
      {sortedStudents.map((student) => (
        <div
          key={student.id}
          onClick={() => handleStudentClick(student.id)}
          className="flex justify-between items-center p-4 border border-gray-600 rounded-xl cursor-pointer hover:bg-background-lighter transition-colors bg-background-light shadow-sm hover:shadow-md"
        >
          <div>
            <h3 className="font-medium text-foreground">
              {student.first_name} {student.last_name}
            </h3>
            <p className="text-sm text-gray-300">{student.grade}</p>
          </div>
          <div className="flex gap-4 items-center">
            <span className="text-sm text-gray-300 capitalize">{student.sex}</span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                student.baseline === "Beginner"
                  ? "bg-primary-2/20 text-primary-2 border border-primary-2/30"
                  : student.baseline === "Intermediate"
                  ? "bg-secondary-2/20 text-secondary-2 border border-secondary-2/30"
                  : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
              }`}
            >
              {student.baseline || "—"}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}