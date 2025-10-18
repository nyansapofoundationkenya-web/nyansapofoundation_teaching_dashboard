"use client"

import { Users, CheckCircle, PlayCircle, Clock } from "lucide-react"

export default function StudentMetrics({ students, loading = false }) {
  // Calculate metrics
  const totalStudents = students?.length || 0
  
  const completedCount = students?.filter(student => 
    student.completed_assessment === true
  ).length || 0

  const startedNotCompletedCount = students?.filter(student => 
    student.assessment_status === "started_not_completed" && 
    student.completed_assessment !== true
  ).length || 0

  const notStartedCount = totalStudents - completedCount - startedNotCompletedCount

  if (loading) {
    return <StudentMetricsSkeleton />
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Progress Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Total Students</p>
              <p className="text-2xl font-bold text-blue-900">{totalStudents}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Completed</p>
              <p className="text-2xl font-bold text-green-900">{completedCount}</p>
              <p className="text-xs text-green-600 mt-1">
                {totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0}%
              </p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Started & Not Completed */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">In Progress</p>
              <p className="text-2xl font-bold text-yellow-900">{startedNotCompletedCount}</p>
              <p className="text-xs text-yellow-600 mt-1">
                {totalStudents > 0 ? Math.round((startedNotCompletedCount / totalStudents) * 100) : 0}%
              </p>
            </div>
            <div className="bg-yellow-100 p-2 rounded-full">
              <PlayCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Not Started */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Not Started</p>
              <p className="text-2xl font-bold text-gray-900">{notStartedCount}</p>
              <p className="text-xs text-gray-600 mt-1">
                {totalStudents > 0 ? Math.round((notStartedCount / totalStudents) * 100) : 0}%
              </p>
            </div>
            <div className="bg-gray-100 p-2 rounded-full">
              <Clock className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {totalStudents > 0 && (
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{Math.round((completedCount / totalStudents) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-12"></div>
                <div className="h-3 bg-gray-200 rounded w-8"></div>
              </div>
              <div className="bg-gray-200 p-2 rounded-full">
                <div className="w-6 h-6"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-8"></div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2"></div>
      </div>
    </div>
  )
}