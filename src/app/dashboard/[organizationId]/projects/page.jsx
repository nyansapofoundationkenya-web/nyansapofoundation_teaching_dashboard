"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { useOrganizations } from "@/hooks/useOrganization";
import { useProjects } from "@/hooks/UseProjects";
import DashboardLayout from "../DashboardLayout";
import ProjectList from "@/components/Projects/ProjectList";
import Modal from "@/components/ui/Modal";
import { PlusIcon } from "@heroicons/react/24/outline";

export default function OrganizationDashboardPage() {
  const { organizationId } = useParams();
  const { handleFetchOrganizationById } = useOrganizations();
  const { projects, fetchAllProjects, addProjectManager, createProject } =
    useProjects(organizationId);

  const [organization, setOrganization] = useState(null);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createError, setCreateError] = useState(null); // ← new: surfaces hook errors

  const { user: currentUser } = useSelector((state) => state.auth);
  const isAdminOrSuperAdmin =
    currentUser?.role === "admin" || currentUser?.role === "super_admin";

  useEffect(() => {
    if (organizationId) {
      handleFetchOrganizationById(organizationId).then(setOrganization);
      fetchAllProjects();
    }
  }, [organizationId]);

  // ── Create Project ────────────────────────────────────────────
  const projectFields = [
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
  ];

  const handleCreateProject = async (data) => {
    setCreateError(null); // clear any previous error
    try {
      await createProject(data);
      setIsCreateModalOpen(false);
      fetchAllProjects();
    } catch (err) {
      // Show the error message (duplicate name, validation, etc.) inside the modal
      setCreateError(err.message);
    }
  };

  // Clear the error when the modal is closed
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateError(null);
  };

  // ── Add Project Manager ───────────────────────────────────────
  const handleAddProjectManager = async ({
    name,
    email,
    phone,
    selectedProjects,
  }) => {
    const selectedProjectIds = Array.isArray(selectedProjects)
      ? selectedProjects
      : [selectedProjects];

    await addProjectManager({ name, email, phone, selectedProjectIds });
    setIsManagerModalOpen(false);
  };

  const managerFields = [
    { name: "name", label: "Full Name", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phone", label: "Phone Number", required: true },
    {
      name: "selectedProjects",
      label: "Assign Projects",
      type: "multiselect",
      options: projects.map((p) => ({ value: p.id, label: p.name })),
    },
  ];

  return (
    <DashboardLayout
      title="Projects"
      organizationId={organizationId}
      currentSection={"projects"}
    >
      <div className="min-h-screen text-foreground flex flex-col gap-4 p-4">

        {/* Top bar */}
        <div className="flex justify-end items-center pb-2">
          {isAdminOrSuperAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-3 text-primary-1 rounded-xl hover:bg-yellow-400 transition-colors font-medium shadow-sm"
            >
              <PlusIcon className="h-5 w-5" />
              Create Project
            </button>
          )}
        </div>

        <ProjectList organizationId={organizationId} />

        {/* Create Project Modal */}
        {isAdminOrSuperAdmin && (
          <Modal
            isOpen={isCreateModalOpen}
            onClose={handleCloseCreateModal}
            title="Create New Project"
            fields={projectFields}
            onSubmit={handleCreateProject}
            submitError={createError} // ← passed down to show inside the modal
          />
        )}

        {/* Add Project Manager Modal */}
        <Modal
          isOpen={isManagerModalOpen}
          onClose={() => setIsManagerModalOpen(false)}
          title="Add Project Manager"
          fields={managerFields}
          onSubmit={handleAddProjectManager}
        />
      </div>
    </DashboardLayout>
  );
}