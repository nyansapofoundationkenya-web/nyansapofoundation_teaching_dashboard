"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import Modal from "@/components/ui/Modal"
import { useProjects } from "@/hooks/UseProjects"

export default function GetStarted({ organizationId, onProjectCreated }) {
  const [showModal, setShowModal] = useState(false)
  const { createProject } = useProjects(organizationId)
  
  // Get user data directly from Redux store
  const { user: currentUser } = useSelector((state) => state.auth);
  const isAdminOrSuperAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const fields = [
    {
      name: "name",
      label: "Project Name",
      type: "text",
      required: true,
      placeholder: "e.g., Read, count and shine",
    },
    {
      name: "location",
      label: "County",
      type: "text",
      required: true,
      placeholder: "e.g., Nairobi",
    },
  ]

  const handleSubmit = async (data) => {
    try {
      await createProject(data)
      setShowModal(false)

      // Notify parent component to refresh the projects list
      if (onProjectCreated) {
        onProjectCreated()
      }
    } catch (err) {
      console.error("Error creating project:", err)
    }
  }

  // Only render if user is admin or super_admin
  if (!isAdminOrSuperAdmin) {
    return null;
  }

  return (
    <>
      <section className="p-2 rounded-2xl text-center">
        <h2 className="text-xl font-semibold mb-3 text-foreground">Get Started With Your First Project</h2>
        <p className="text-sm mb-4 text-gray-300">
          Create a new learning project to organize your schools, instructors, camps, and students. Track progress and
          gain insights into learning outcomes with our AI-powered analytics.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-3 text-primary-1 px-4 py-2 rounded-xl hover:bg-yellow-400 transition-all font-medium shadow-md"
        >
          + Create New Project
        </button>
      </section>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Project"
        fields={fields}
        onSubmit={handleSubmit}
      />
    </>
  )
}