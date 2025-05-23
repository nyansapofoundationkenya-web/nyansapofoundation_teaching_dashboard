"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useProjects } from "@/hooks/UseProjects"
import { FaSchool } from "react-icons/fa"
import { GiCampingTent } from "react-icons/gi"

export default function RecentProjects({ organizationId, refreshTrigger }) {
  const { fetchRecentProjects } = useProjects(organizationId)
  const [projects, setProjects] = useState([])
  const router = useRouter()

  useEffect(() => {
    const loadProjects = async () => {
      if (!organizationId) return
      const recent = await fetchRecentProjects()
      setProjects(recent)
    }

    loadProjects()
  }, [organizationId, refreshTrigger]) // Add refreshTrigger to dependencies

  const handleViewDetails = (projectId) => {
    router.push(`/dashboard/${organizationId}/projectDetails/${projectId}`)
  }

  return (
    <section className="p-6">
      <h2 className="text-xl md:text-2xl font-semibold mb-6 text-gray-800">Recent Projects</h2>

      {projects.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No projects yet. Create your first project to get started!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-blue-50 p-4 rounded-md shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-gray-800 text-lg mb-2">{project.name}</h3>

                <div className="flex gap-2 mb-4 flex-wrap">
                  {Array.isArray(project.location) &&
                    project.location.map((country, idx) => (
                      <span key={idx} className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                        {country.trim()}
                      </span>
                    ))}
                </div>

                <div className="flex items-center text-sm text-gray-700 mb-1">
                  <FaSchool className="mr-2 text-gray-700" />
                  {project.total_schools || 0} School
                  {(project.total_schools || 0) !== 1 ? "s" : ""}
                </div>

                <div className="flex items-center text-sm text-gray-700">
                  <GiCampingTent className="mr-2 text-gray-700" />
                  {project.total_camps || 0} Camp
                  {(project.total_camps || 0) !== 1 ? "s" : ""}
                </div>
              </div>

              <button
                onClick={() => handleViewDetails(project.id)}
                className="mt-4 self-start bg-yellow-400 text-black px-4 py-1.5 rounded hover:bg-yellow-500 transition text-sm font-semibold"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
