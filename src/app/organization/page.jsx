"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizations } from "@/hooks/useOrganization";
import { useSelector } from "react-redux";
import UserProfileModal from "@/components/Dashboard/UserProfileModal";
import StandardOrganizationsView from "@/components/organization/StandardOrganizationsView";
import SuperAdminOrganizationsView from "@/components/organization/SuperAdminOrganizationsView";
import AddOrganizationModal from "@/components/organization/Addorganizationmodal";
import DeleteOrganizationModal from "@/components/organization/Deleteorganizationmodal";
import {
  isSandboxOrg,
  getOrganizationType,
  validateOrganizationName,
  sanitizeOrgName,
  canDeleteOrganization,
  sumOrgStat,
} from "@/utils/OrgUtils";

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------
// This component owns all data-fetching, mutation, and modal state. It has no
// opinion on layout - it just decides, based on role, which presentational
// view (Standard vs Super Admin) receives that state and callbacks.
// ---------------------------------------------------------------------------

export default function OrganizationPage({
  onOrganizationSelect = () => {},
  onAddOrganization = () => {},
  onLogout = () => {},
}) {
  const router = useRouter();
  const { handleLogout } = useAuth();
  const {
    organizations,
    loading,
    error,
    handleFetchOrganizations,
    handleAddOrganization,
    handleBackfillOrganizationFlags,
    handleUpdateOrganizationClassification,
    handleDeleteOrganization,
  } = useOrganizations();

  const { user: currentUser, loading: userLoading } = useSelector((state) => state.auth);

  // UI state
  const [activeTab, setActiveTab] = useState("partner"); // "partner" | "testing" | "sandboxes"
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [addingOrg, setAddingOrg] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [createSandbox, setCreateSandbox] = useState(false);
  const [organizationType, setOrganizationType] = useState("partner");
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);
  const [deletingOrg, setDeletingOrg] = useState(false);
  const [backfillingFlags, setBackfillingFlags] = useState(false);
  const [nameValidation, setNameValidation] = useState({ valid: true, message: "" });

  // Fetch on mount
  useEffect(() => {
    if (currentUser?.uid && !dataFetched) {
      handleFetchOrganizations().catch((err) => console.error("Fetch Organizations Error:", err));
      setDataFetched(true);
    }
  }, [currentUser?.uid, dataFetched, handleFetchOrganizations]);

  // Filter to orgs this user can see
  const getFilteredOrganizations = useCallback(() => {
    if (!currentUser || !Array.isArray(organizations) || !organizations.length) return [];
    if (currentUser.role === "super_admin") {
      return organizations.filter(Boolean);
    }
    const userOrganizations = currentUser.organizations || [];
    return organizations.filter(
      (org) => org && userOrganizations.some((userOrg) => userOrg?.id === org?.id)
    );
  }, [currentUser, organizations]);

  const baseOrganizations = getFilteredOrganizations();

  // Split into real orgs vs sandboxes
  const realOrgs = useMemo(() => baseOrganizations.filter((o) => !isSandboxOrg(o)), [baseOrganizations]);
  const partnerOrgs = useMemo(
    () => baseOrganizations.filter((o) => getOrganizationType(o) === "partner"),
    [baseOrganizations]
  );
  const testingOrgs = useMemo(
    () => baseOrganizations.filter((o) => getOrganizationType(o) === "testing"),
    [baseOrganizations]
  );
  const sandboxOrgs = useMemo(() => baseOrganizations.filter((o) => isSandboxOrg(o)), [baseOrganizations]);

  // Apply search + sort to whichever tab is active
  const filteredOrganizations = useMemo(() => {
    const source = activeTab === "sandboxes"
      ? sandboxOrgs
      : activeTab === "testing" ? testingOrgs : partnerOrgs;
    let filtered = [...source].filter(Boolean);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((org) => (org?.name ?? "").toLowerCase().includes(q));
    }
    filtered.sort((a, b) => {
      const dateA = a?.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b?.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });
    return filtered;
  }, [activeTab, partnerOrgs, testingOrgs, sandboxOrgs, searchQuery]);

  // Totals should reflect the section currently being viewed.
  const organizationsForStats = useMemo(() => {
    if (activeTab === "sandboxes") return sandboxOrgs;
    if (activeTab === "testing") return testingOrgs;
    return partnerOrgs;
  }, [activeTab, partnerOrgs, testingOrgs, sandboxOrgs]);

  const ecosystemStats = useMemo(() => ({
    teachers: sumOrgStat(organizationsForStats, "total_teachers"),
    schools: sumOrgStat(organizationsForStats, "total_schools"),
    students: sumOrgStat(organizationsForStats, "total_students"),
    projects: sumOrgStat(organizationsForStats, "total_projects"),
  }), [organizationsForStats]);

  const isSuperAdmin = currentUser?.role === "super_admin";

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleOrgNameChange = (e) => {
    const sanitized = sanitizeOrgName(e.target.value);
    setNewOrgName(sanitized);
    setNameValidation(validateOrganizationName(sanitized));
  };

  const handleAddOrg = async () => {
    const validation = validateOrganizationName(newOrgName);
    if (!validation.valid) { alert(validation.message); return; }

    const trimmedName = newOrgName.trim();
    const existingOrg = organizations.find(
      (org) => (org?.name ?? "").toLowerCase() === trimmedName.toLowerCase()
    );
    if (existingOrg) {
      alert(`An organization named "${trimmedName}" already exists. Please use a different name.`);
      return;
    }

    try {
      setAddingOrg(true);
      await handleAddOrganization(trimmedName, organizationType, createSandbox);
      onAddOrganization(trimmedName, organizationType, createSandbox);
      setNewOrgName("");
      setCreateSandbox(false);
      setOrganizationType("partner");
      setShowAddModal(false);
      setDataFetched(false);
      setNameValidation({ valid: true, message: "" });
    } catch (err) {
      console.error("Error adding organization:", err);
      alert(err.message || "Failed to add organization. Please try again.");
    } finally {
      setAddingOrg(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!orgToDelete) return;
    if (!isSuperAdmin) { alert("Only super administrators can delete organizations"); return; }
    if (!canDeleteOrganization(orgToDelete)) {
      alert("Cannot delete organization with existing projects, teachers, schools, or students");
      return;
    }
    try {
      setDeletingOrg(true);
      await handleDeleteOrganization(orgToDelete.id);
      setOrgToDelete(null);
      setDataFetched(false);
      alert("Organization deleted successfully");
    } catch (err) {
      console.error("Error deleting organization:", err);
      alert(err.message || "Failed to delete organization. Please try again.");
    } finally {
      setDeletingOrg(false);
    }
  };

  const handleBackfillFlags = async () => {
    if (!isSuperAdmin) return;
    try {
      setBackfillingFlags(true);
      const count = await handleBackfillOrganizationFlags();
      setDataFetched(false);
      alert(`Organization classification fields updated for ${count} organization${count === 1 ? "" : "s"}.`);
    } catch (err) {
      console.error("Error updating organization classification fields:", err);
      alert(err.message || "Failed to update organization classification fields.");
    } finally {
      setBackfillingFlags(false);
    }
  };

  const handleClassificationChange = async (orgId, organizationType) => {
    try {
      await handleUpdateOrganizationClassification(orgId, organizationType);
      setDataFetched(false);
    } catch (err) {
      console.error("Error updating organization classification:", err);
      alert(err.message || "Failed to update organization classification.");
    }
  };

  const handleOrganizationClick = (organization) => {
    onOrganizationSelect(organization);
    router.push(`/dashboard/${organization.id}/welcome`);
  };

  const handleLogoutClick = async () => {
    try {
      await handleLogout();
      onLogout();
      router.replace("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery("");
  };

  // Placeholder navigation targets for the super admin action grid.
  // Update these routes to match wherever these admin pages actually live.
  const handleNavigateUsers = () => router.push("/dashboard/admin/users");
  const handleNavigateMapAssessments = () => router.push("/dashboard/admin/map_assessments");
  const handleNavigateSystemLogs = () => router.push("/dashboard/admin/audio-library");
  const handleNavigateSettings = () => router.push("/dashboard/admin/settings");
  const handleSupportClick = () => router.push("/dashboard/support");

  const isLoading = (loading || userLoading) && !dataFetched;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const sharedProps = {
    realOrgs,
    sandboxOrgs,
    filteredOrganizations,
    activeTab,
    onTabChange: handleTabChange,
    partnerOrgs,
    testingOrgs,
    searchQuery,
    onSearchChange: setSearchQuery,
    isLoading,
    error,
    onOrganizationClick: handleOrganizationClick,
    onProfileClick: () => setIsProfileModalOpen(true),
    onLogoutClick: handleLogoutClick,
  };

  return (
    <>
      {isSuperAdmin ? (
        <SuperAdminOrganizationsView
          {...sharedProps}
          currentUser={currentUser}
          onAddClick={() => setShowAddModal(true)}
          onBackfillFlags={handleBackfillFlags}
          backfillingFlags={backfillingFlags}
          onDeleteRequest={(org) => setOrgToDelete(org)}
          ecosystemStats={ecosystemStats}
          onNavigateUsers={handleNavigateUsers}
          onNavigateMapAssessments={handleNavigateMapAssessments}
          onNavigateSystemLogs={handleNavigateSystemLogs}
          onNavigateSettings={handleNavigateSettings}
          onClassificationChange={handleClassificationChange}
        />
      ) : (
        <StandardOrganizationsView
          {...sharedProps}
          currentUser={currentUser}
          userLoading={userLoading}
          onSupportClick={handleSupportClick}
        />
      )}

      <UserProfileModal
        user={currentUser}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdate={async (data) => console.log("Updating profile:", data)}
      />

      <AddOrganizationModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setNewOrgName("");
          setCreateSandbox(false);
          setOrganizationType("partner");
          setNameValidation({ valid: true, message: "" });
        }}
        newOrgName={newOrgName}
        onNameChange={handleOrgNameChange}
        nameValidation={nameValidation}
        organizationType={organizationType}
        onOrganizationTypeChange={(e) => {
          setOrganizationType(e.target.value);
          if (e.target.value === "testing") setCreateSandbox(false);
        }}
        createSandbox={createSandbox}
        onToggleSandbox={() => setCreateSandbox((prev) => !prev)}
        addingOrg={addingOrg}
        onSubmit={handleAddOrg}
      />

      <DeleteOrganizationModal
        org={orgToDelete}
        isSandbox={orgToDelete ? isSandboxOrg(orgToDelete) : false}
        onClose={() => setOrgToDelete(null)}
        deletingOrg={deletingOrg}
        onConfirm={handleDeleteOrg}
      />
    </>
  );
}