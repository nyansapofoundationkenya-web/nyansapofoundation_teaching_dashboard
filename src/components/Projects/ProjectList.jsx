"use client"

import { useEffect } from "react"
import { useProjects } from "@/hooks/UseProjects"
import ProjectCard from "./ProjectCard"

export default function ProjectList({ organizationId }) {
  const { projects, fetchAllProjects, loading, error } = useProjects(organizationId)

  useEffect(() => {
    if (organizationId) {
      fetchAllProjects()
    }
  }, [organizationId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-gray-700 text-sm sm:text-base">Loading projects...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
        <p className="text-red-600 font-medium text-sm sm:text-base">Error loading projects</p>
        <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 text-sm">
              Create your first project to get started with managing your educational programs.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} organizationId={organizationId} />
          ))}
        </div>
      )}
    </div>
  )
}
