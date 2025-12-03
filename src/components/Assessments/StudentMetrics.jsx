"use client"

import { Users, CheckCircle, Clock } from "lucide-react"

export default function StudentMetrics({ students, loading = false }) {
  // Calculate metrics
  const totalStudents = students?.length || 0

  // Calculate counts based on simplified logic
  let completedCount = 0
  let notStartedCount = 0

  if (students) {
    students.forEach(student => {
      const hasDone = student.has_done === true
      const baselineExists = student.baseline && 
                           student.baseline !== "" && 
                           student.baseline !== null &&
                           student.baseline !== undefined
      
      // Rule 1: Completed - has_done is true AND baseline has content
      if (hasDone && baselineExists) {
        completedCount++
      }
      // Rule 2: Not Started - Everything else
      // This includes:
      // 1. has_done is false AND baseline is empty/null/undefined (truly not started)
      // 2. has_done is true but baseline is empty (marked done but no content)
      // 3. has_done is false but baseline has content (progress but not marked done)
      else {
        notStartedCount++
      }
    })
  }

  // Verify counts (for debugging)
  const calculatedTotal = completedCount + notStartedCount
  if (students && calculatedTotal !== totalStudents) {
    console.warn(`Count mismatch: Total=${totalStudents}, Calculated=${calculatedTotal}`)
  }

  if (loading) {
    return <StudentMetricsSkeleton />
  }

  return (
    <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-6 mb-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Student Progress Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Students */}
        <div className="bg-primary-2/20 border border-primary-2/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-2">Total Students</p>
              <p className="text-2xl font-bold text-primary-2">{totalStudents}</p>
            </div>
            <div className="bg-primary-2/20 p-2 rounded-full">
              <Users className="w-6 h-6 text-primary-2" />
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-secondary-2/20 border border-secondary-2/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-2">Completed</p>
              <p className="text-2xl font-bold text-secondary-2">{completedCount}</p>
              <p className="text-xs text-secondary-2 mt-1">
                {totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0}%
              </p>
            </div>
            <div className="bg-secondary-2/20 p-2 rounded-full">
              <CheckCircle className="w-6 h-6 text-secondary-2" />
            </div>
          </div>
        </div>

        {/* Not Started (includes all non-completed) */}
        <div className="bg-gray-600/20 border border-gray-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Not Started</p>
              <p className="text-2xl font-bold text-gray-300">{notStartedCount}</p>
              <p className="text-xs text-gray-400 mt-1">
                {totalStudents > 0 ? Math.round((notStartedCount / totalStudents) * 100) : 0}%
              </p>
            </div>
            <div className="bg-gray-600/20 p-2 rounded-full">
              <Clock className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {totalStudents > 0 && (
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>Overall Progress</span>
            <span>{Math.round((completedCount / totalStudents) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div 
              className="bg-secondary-2 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / totalStudents) * 100}%` }}
            />
          </div>
          {/* <p className="text-xs text-gray-400 mt-2">
            * "Not Started" includes all students who haven't completed the assessment (0% progress)
          </p> */}
        </div>
      )}
    </div>
  )
}

// Skeleton component for loading state (updated for 3 columns)
function StudentMetricsSkeleton() {
  return (
    <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-6 mb-6 animate-pulse">
      <div className="h-6 bg-background-lighter rounded w-48 mb-4"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="border border-gray-600 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-background-lighter rounded w-20"></div>
                <div className="h-8 bg-background-lighter rounded w-12"></div>
                <div className="h-3 bg-background-lighter rounded w-8"></div>
              </div>
              <div className="bg-background-lighter p-2 rounded-full">
                <div className="w-6 h-6"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex justify-between">
          <div className="h-4 bg-background-lighter rounded w-24"></div>
          <div className="h-4 bg-background-lighter rounded w-8"></div>
        </div>
        <div className="w-full bg-background-lighter rounded-full h-2"></div>
      </div>
    </div>
  )
}