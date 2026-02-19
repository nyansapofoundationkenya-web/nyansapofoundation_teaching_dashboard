"use client"

import { useRouter, useParams } from "next/navigation"
import { GraduationCap, Target, Tent, Users, BarChart3 } from "lucide-react"

export default function SchoolDetailStats({ school }) {
  const router = useRouter()
  const { organizationId, projectId } = useParams()

  const handleStudentsClick = () => {
    // router.push(`/dashboard/${organizationId}/projects/${projectId}/schools/${school.id}/attendance`)
  }

  const stats = [
    {
      label: "Total Students",
      value: school?.total_students || 0,
      icon: <GraduationCap className="w-5 h-5" />,
      iconColor: "text-secondary-2",
      valueColor: "text-secondary-2",
      clickable: true,
      onClick: handleStudentsClick,
    },
    // {
    //   label: "Sessions Completion Rate",
    //   value: `${school?.completionRate || 0}%`,
    //   icon: <Target className="w-5 h-5" />,
    //   iconColor: "text-gray-400",
    //   valueColor: "text-gray-300",
    // },
    // {
    //   label: "Learning Camps",
    //   value: school?.total_camps || 0,
    //   icon: <Tent className="w-5 h-5" />,
    //   iconColor: "text-primary-3",
    //   valueColor: "text-primary-3",
    // },
    {
      label: "Instructors",
      value: school?.total_teachers || 0,
      icon: <Users className="w-5 h-5" />,
      iconColor: "text-primary-3",
      valueColor: "text-primary-3",
    },
    {
      label: "Instructor/Student Ratio",
      value: school?.instructorStudentRatio || 0,
      icon: <BarChart3 className="w-5 h-5" />,
      iconColor: "text-secondary-2",
      valueColor: "text-secondary-2",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`bg-background-light rounded-2xl p-4 shadow-lg border border-gray-600 ${
            stat.clickable ? "cursor-pointer hover:shadow-xl transition-all hover:bg-background-lighter" : ""
          }`}
          onClick={stat.onClick}
        >
          {/* Label at the top */}
          <div className="text-sm text-gray-300 mb-3 font-medium">{stat.label}</div>

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