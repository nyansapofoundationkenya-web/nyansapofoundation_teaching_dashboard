"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useProjects } from "@/hooks/UseProjects"
import { FaSchool } from "react-icons/fa"
import { GiCampingTent } from "react-icons/gi"

export default function RecentProjects({ organizationId, refreshTrigger, onProjectsLoaded }) {
  const { fetchRecentProjects } = useProjects(organizationId)
  const [projects, setProjects] = useState([])
  const router = useRouter()

  useEffect(() => {
    const loadProjects = async () => {
      if (!organizationId) return
      const recent = await fetchRecentProjects()
      setProjects(recent)
      
      // Call the callback when projects are loaded
      if (onProjectsLoaded) {
        onProjectsLoaded(recent)
      }
    }

    loadProjects()
  }, [organizationId, refreshTrigger])

  const handleViewDetails = (projectId) => {
    router.push(`/dashboard/${organizationId}/projectDetails/${projectId}`)
  }

  return (
    <section className="p-4 bg-background-lighter rounded-3xl shadow-lg">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Recent Projects</h2>

      {projects.length === 0 ? (
        <p className="text-gray-300 text-center py-6 text-sm">No projects yet. Create your first project to get started!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-background-light p-4 rounded-2xl shadow-md flex flex-col justify-between border border-gray-600">
              <div>
                <h3 className="font-semibold text-foreground text-base mb-3">{project.name}</h3>

                <div className="flex gap-2 mb-3 flex-wrap">
                  {Array.isArray(project.location) &&
                    project.location.map((country, idx) => (
                      <span key={idx} className="bg-background text-gray-300 text-xs px-2 py-1 rounded-full border border-gray-500">
                        {country.trim()}
                      </span>
                    ))}
                </div>

                <div className="flex items-center text-sm text-gray-300 mb-2">
                  <FaSchool className="mr-2 text-gray-300" />
                  {project.total_schools || 0} School
                  {(project.total_schools || 0) !== 1 ? "s" : ""}
                </div>

                <div className="flex items-center text-sm text-gray-300">
                  <GiCampingTent className="mr-2 text-gray-300" />
                  {project.total_camps || 0} Camp
                  {(project.total_camps || 0) !== 1 ? "s" : ""}
                </div>
              </div>

              <button
                onClick={() => handleViewDetails(project.id)}
                className="mt-4 self-start bg-primary-3 text-primary-1 px-3 py-1.5 rounded-xl hover:bg-yellow-400 transition-all text-sm font-medium shadow-sm"
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