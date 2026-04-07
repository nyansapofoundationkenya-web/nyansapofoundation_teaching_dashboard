"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/firebase/config"

export default function StudentsList({ students, organizationId, assessmentId }) {
  const router = useRouter()
  const [verifiedMap, setVerifiedMap] = useState({})

  // Fetch verification status for all students
  useEffect(() => {
    const fetchVerificationStatus = async () => {
      const verificationMap = {}
      
      await Promise.all(
        students.map(async (student) => {
          const resultId = `${assessmentId}_${student.id}`
          try {
            const resultDoc = await getDoc(
              doc(db, `assessments/${assessmentId}/assessments-results`, resultId)
            )
            
            if (resultDoc.exists()) {
              const data = resultDoc.data()
              // Only verified if is_verified explicitly equals true
              verificationMap[student.id] = data.is_verified === true
            } else {
              verificationMap[student.id] = false
            }
          } catch (err) {
            console.error(`Error fetching verification for ${resultId}:`, err)
            verificationMap[student.id] = false
          }
        })
      )
      
      setVerifiedMap(verificationMap)
    }

    if (students.length > 0 && assessmentId) {
      fetchVerificationStatus()
    }
  }, [students, assessmentId])

  const handleStudentClick = (studentId) => {
    router.push(`/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}`)
  }

  // Check if student is verified
  const isVerified = (studentId) => verifiedMap[studentId] === true

  // Get badge styling based on verification and baseline
  const getBadgeStyle = (student) => {
    const verified = isVerified(student.id)
    
    if (!verified) {
      return "bg-gray-500/20 text-gray-400 border border-gray-500/30 blur-sm select-none"
    }
    
    if (student.baseline === "Beginner") {
      return "bg-primary-2/20 text-primary-2 border border-primary-2/30"
    }
    
    if (student.baseline === "Intermediate") {
      return "bg-secondary-2/20 text-secondary-2 border border-secondary-2/30"
    }
    
    return "bg-purple-500/20 text-purple-400 border border-purple-500/30"
  }

  // Create a sorted copy — verified students with baseline first, then others
  const sortedStudents = [...students].sort((a, b) => {
    const aIsVerified = isVerified(a.id)
    const bIsVerified = isVerified(b.id)
    const aHasBaseline = aIsVerified && !!a?.baseline && String(a.baseline).trim() !== ''
    const bHasBaseline = bIsVerified && !!b?.baseline && String(b.baseline).trim() !== ''

    if (aHasBaseline && !bHasBaseline) return -1
    if (!aHasBaseline && bHasBaseline) return 1
    return 0
  })

  return (
    <div className="space-y-2">
      {sortedStudents.map((student) => {
        const verified = isVerified(student.id)
        
        return (
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
                className={`text-xs px-2 py-1 rounded-full ${getBadgeStyle(student)}`}
                title={verified ? "" : "Result not yet verified"}
              >
                {student.baseline || "—"}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}