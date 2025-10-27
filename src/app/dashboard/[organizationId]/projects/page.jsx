"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useOrganizations } from "@/hooks/useOrganization";
import { useProjects } from "@/hooks/UseProjects";
import DashboardLayout from "../DashboardLayout";
import ProjectList from "@/components/Projects/ProjectList";
import Modal from "@/components/ui/Modal";

export default function OrganizationDashboardPage() {
  const { organizationId } = useParams();
  const { handleFetchOrganizationById } = useOrganizations();
  const { projects, fetchAllProjects, addProjectManager } = useProjects(organizationId);

  const [organization, setOrganization] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (organizationId) {
      handleFetchOrganizationById(organizationId).then(setOrganization);
      fetchAllProjects();
    }
  }, [organizationId]);

  const handleAddProjectManager = async ({ name, email, phone, selectedProjects }) => {
    const selectedProjectIds = Array.isArray(selectedProjects)
      ? selectedProjects
      : [selectedProjects]; // Handle both single and multiple selection

    await addProjectManager({
      name,
      email,
      phone,
      selectedProjectIds,
    });

    setIsModalOpen(false);
  };

  const managerFields = [
    { name: "name", label: "Full Name", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phone", label: "Phone Number", required: true },
    {
      name: "selectedProjects",
      label: "Assign Projects",
      type: "multiselect",
      options: projects.map((p) => ({
        value: p.id,
        label: p.name
      }))
    }
  ];

  return (
    <DashboardLayout organizationId={organizationId}>
      <div className="min-h-screen text-gray-800 flex flex-col gap-6 p-4 md:p-6">
        <div className="w-full flex justify-end">
          {/* <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded font-semibold"
          >
            Add Project Manager
          </button> */}
        </div>

        <ProjectList organizationId={organizationId} />

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add Project Manager"
          fields={managerFields}
          onSubmit={handleAddProjectManager}
        />
      </div>
    </DashboardLayout>
  );
}
