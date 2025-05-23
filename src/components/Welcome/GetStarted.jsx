"use client"

import { useState } from "react"
import Modal from "@/components/ui/Modal"
import { useProjects } from "@/hooks/UseProjects"

export default function GetStarted({ organizationId, onProjectCreated }) {
  const [showModal, setShowModal] = useState(false)
  const { createProject } = useProjects(organizationId)

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
      label: "Location",
      type: "text",
      required: true,
      placeholder: "e.g., Kenya, Uganda",
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

  return (
    <section className="p-6 rounded-lg text-center">
      <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800">Get Started With Your First Project</h2>
      <p className="text-sm md:text-base mb-4 text-gray-600">
        Create a new learning project to organize your schools, instructors, camps, and students. Track progress and
        gain insights into learning outcomes with our AI- powered analytics.
      </p>
      <button
        onClick={() => setShowModal(true)}
        className="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600 transition"
      >
        + Create New Project
      </button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Project"
        fields={fields}
        onSubmit={handleSubmit}
      />
    </section>
  )
}
