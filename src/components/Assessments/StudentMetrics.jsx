"use client"

import { Users, CheckCircle, PlayCircle, Clock } from "lucide-react"

export default function StudentMetrics({ students, loading = false }) {
  // Calculate metrics
 const totalStudents = students?.length || 0

    // ✔ Completed: if has_done or linked is true
    const completedCount = students?.filter(student =>
      student.has_done === true || student.linked === true
    ).length || 0

    // ✔ Started but not completed: assessment_status = "started_not_completed"
    //   AND not considered completed
    const startedNotCompletedCount = students?.filter(student =>
      student.assessment_status === "started_not_completed" &&
      !(student.has_done === true || student.linked === true)
    ).length || 0

    // ✔ Not started = everyone else
    const notStartedCount = totalStudents - completedCount - startedNotCompletedCount

  if (loading) {
    return <StudentMetricsSkeleton />
  }

  return (
    <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-6 mb-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Student Progress Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        {/* Started & Not Completed */}
        <div className="bg-primary-3/20 border border-primary-3/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-3">In Progress</p>
              <p className="text-2xl font-bold text-primary-3">{startedNotCompletedCount}</p>
              <p className="text-xs text-primary-3 mt-1">
                {totalStudents > 0 ? Math.round((startedNotCompletedCount / totalStudents) * 100) : 0}%
              </p>
            </div>
            <div className="bg-primary-3/20 p-2 rounded-full">
              <PlayCircle className="w-6 h-6 text-primary-3" />
            </div>
          </div>
        </div>

        {/* Not Started */}
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
        </div>
      )}
    </div>
  )
}

// Skeleton component for loading state
function StudentMetricsSkeleton() {
  return (
    <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-6 mb-6 animate-pulse">
      <div className="h-6 bg-background-lighter rounded w-48 mb-4"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
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