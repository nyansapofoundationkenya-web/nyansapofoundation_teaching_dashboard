'use client';

import React, { useEffect } from "react";
import { useProjects } from "@/hooks/UseProjects";
import ProjectCard from "./ProjectCard"; 

export default function ProjectList({ organizationId }) {
  const {
    projects,
    fetchAllProjects,
    loading,
    error,
  } = useProjects(organizationId);

  useEffect(() => {
    if (organizationId) {
      fetchAllProjects();
    }
  }, [organizationId]);

  if (loading) return <p className="text-gray-700">Loading projects...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
      {projects.length === 0 ? (
        <p className="text-gray-600 col-span-full">No projects found.</p>
      ) : (
        projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))
      )}
    </div>
  );
}
