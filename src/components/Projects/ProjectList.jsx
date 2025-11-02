"use client"

import { useEffect } from "react"
import { useProjects } from "@/hooks/UseProjects"
import { useSelector } from "react-redux"
import ProjectCard from "./ProjectCard"

export default function ProjectList({ organizationId }) {
  const { projects, fetchAllProjects, loading, error } = useProjects(organizationId)
  const { user: currentUser, loading: userLoading } = useSelector((state) => state.auth)
  const userRole = currentUser?.role

  useEffect(() => {
    if (organizationId) {
      fetchAllProjects()
    }
  }, [organizationId])

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-3 mx-auto mb-2"></div>
          <p className="text-gray-300 text-sm">Loading projects...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-center">
        <p className="text-red-400 font-medium text-sm">Error loading projects</p>
        <p className="text-red-400/80 text-xs mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No projects found</h3>
            <p className="text-gray-300 text-sm">
              Create your first project to get started with managing your educational programs.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              organizationId={organizationId}
              userRole={userRole}
            />
          ))}
        </div>
      )}
    </div>
  )
}