"use client"

import { GraduationCap, Target, Tent, Users, BarChart3 } from "lucide-react"

export default function SchoolDetailStats({ school }) {
  const stats = [
    {
      label: "Total Students",
      value: school?.studentCount || 17,
      icon: <GraduationCap className="w-5 h-5" />,
      iconColor: "text-green-500",
      valueColor: "text-green-500",
    },
    {
      label: "Sessions Completion Rate",
      value: `${school?.completionRate || 62}%`,
      icon: <Target className="w-5 h-5" />,
      iconColor: "text-gray-700",
      valueColor: "text-gray-700",
    },
    {
      label: "Learning Camps",
      value: school?.campCount || 2,
      icon: <Tent className="w-5 h-5" />,
      iconColor: "text-yellow-500",
      valueColor: "text-yellow-500",
    },
    {
      label: "Instructors",
      value: school?.instructorCount || 3,
      icon: <Users className="w-5 h-5" />,
      iconColor: "text-yellow-600",
      valueColor: "text-yellow-600",
    },
    {
      label: "Instructor/Student Ratio",
      value: school?.instructorStudentRatio || 5,
      icon: <BarChart3 className="w-5 h-5" />,
      iconColor: "text-green-600",
      valueColor: "text-green-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg p-4 shadow-sm border">
          {/* Label at the top */}
          <div className="text-sm text-gray-600 mb-3 font-medium">{stat.label}</div>

          {/* Icon and Value */}
          <div className="flex items-center gap-2">
            <div className={stat.iconColor}>{stat.icon}</div>
            <div className={`text-2xl font-bold ${stat.valueColor}`}>{stat.value}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
