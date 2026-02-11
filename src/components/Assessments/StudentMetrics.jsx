"use client"

import { useState } from "react"
import { Users, CheckCircle, Clock, Plus } from "lucide-react"
import AddStudentModal from "./AddStudentModal"

export default function StudentMetrics({
  students,
  loading = false,
  assessmentId,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const totalStudents = students?.length || 0

  let doneCount = 0
  let notStartedCount = 0

  if (students) {
    students.forEach(student => {
      // Check if baseline has a meaningful value
      const hasBaseline =
        student.baseline != null &&
        student.baseline !== "" &&
        String(student.baseline).trim() !== ""

      if (hasBaseline) {
        doneCount++
      } else {
        notStartedCount++
      }
    })
  }

  if (loading) {
    return <StudentMetricsSkeleton />
  }

  return (
    <>
      <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-6 mb-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Student Progress Overview
          </h3>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-primary-3 hover:bg-primary-3/90 text-primary-1 font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Assign Students
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            label="Total Students"
            value={totalStudents}
            icon={<Users className="w-6 h-6 text-primary-2" />}
            color="primary"
          />

          <MetricCard
            label="Done"                      // Changed from "Completed"
            value={doneCount}
            percentage={
              totalStudents > 0
                ? Math.round((doneCount / totalStudents) * 100)
                : 0
            }
            icon={<CheckCircle className="w-6 h-6 text-secondary-2" />}
            color="secondary"
          />

          <MetricCard
            label="Not Started"
            value={notStartedCount}
            percentage={
              totalStudents > 0
                ? Math.round((notStartedCount / totalStudents) * 100)
                : 0
            }
            icon={<Clock className="w-6 h-6 text-gray-400" />}
            color="gray"
          />
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <AddStudentModal
          assessmentId={assessmentId}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}

function MetricCard({ label, value, percentage, icon, color }) {
  const colorMap = {
    primary: "primary-2",
    secondary: "secondary-2",
    gray: "gray-400",
  }

  return (
    <div
      className={`bg-${colorMap[color]}/20 border border-${colorMap[color]}/30 rounded-xl p-4`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium text-${colorMap[color]}`}>
            {label}
          </p>
          <p className={`text-2xl font-bold text-${colorMap[color]}`}>
            {value}
          </p>
          {percentage !== undefined && (
            <p className={`text-xs text-${colorMap[color]} mt-1`}>
              {percentage}%
            </p>
          )}
        </div>
        <div className={`bg-${colorMap[color]}/20 p-2 rounded-full`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function StudentMetricsSkeleton() {
  return (
    <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-6 mb-6 animate-pulse">
      <div className="h-6 bg-background-lighter rounded w-48 mb-4"></div>
    </div>
  )
}