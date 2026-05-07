"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizations } from "@/hooks/useOrganization";
import { useSelector } from "react-redux";
import UserProfileModal from "@/components/Dashboard/UserProfileModal";
import {
  Search, Users, School, FolderKanban,
  GraduationCap, Calendar, Plus,
  ChevronRight, Building2, User, Trash2, FlaskConical,
} from "lucide-react";
import { FiLogOut } from "react-icons/fi";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isSandboxOrg = (org) => /[-\s]sandbox$/i.test(org.name?.trim());

const validateOrganizationName = (name) => {
  const trimmedName = name.trim();
  if (!trimmedName) return { valid: false, message: "Organization name is required" };
  if (trimmedName.length < 3) return { valid: false, message: "Organization name must be at least 3 characters" };
  if (trimmedName.length > 50) return { valid: false, message: "Organization name must be less than 50 characters" };
  const validNameRegex = /^[a-zA-Z0-9\s\-'.,&]+$/;
  if (!validNameRegex.test(trimmedName)) {
    return {
      valid: false,
      message: "Organization name can only contain letters, numbers, spaces, hyphens (-), apostrophes ('), periods (.), commas (,), and ampersands (&)",
    };
  }
  if (/^\d+$/.test(trimmedName)) return { valid: false, message: "Organization name cannot be only numbers" };
  if (/(.)\1{4,}/.test(trimmedName)) return { valid: false, message: "Organization name cannot have too many repeated characters" };
  return { valid: true, message: "" };
};

const sanitizeOrgName = (value) => value.replace(/[^a-zA-Z0-9\s\-'.,&]/g, "");

// ---------------------------------------------------------------------------
// Main Page
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
    handleDeleteOrganization,
  } = useOrganizations();

  const { user: currentUser, loading: userLoading } = useSelector((state) => state.auth);

  // UI state
  const [activeTab, setActiveTab] = useState("organizations"); // "organizations" | "sandboxes"
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [addingOrg, setAddingOrg] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [createSandbox, setCreateSandbox] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);
  const [deletingOrg, setDeletingOrg] = useState(false);
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
    if (!currentUser || !organizations.length) return [];
    if (currentUser.role === "super_admin") return organizations;
    const userOrganizations = currentUser.organizations || [];
    return organizations.filter((org) =>
      userOrganizations.some((userOrg) => userOrg.id === org.id)
    );
  }, [currentUser, organizations]);

  const baseOrganizations = getFilteredOrganizations();

  // Split into real orgs vs sandboxes
  const realOrgs = useMemo(() => baseOrganizations.filter((o) => !isSandboxOrg(o)), [baseOrganizations]);
  const sandboxOrgs = useMemo(() => baseOrganizations.filter((o) => isSandboxOrg(o)), [baseOrganizations]);

  // Apply search + sort to whichever tab is active
  const filteredOrganizations = useMemo(() => {
    const source = activeTab === "sandboxes" ? sandboxOrgs : realOrgs;
    let filtered = [...source];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((org) => org.name.toLowerCase().includes(q));
    }
    filtered.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });
    return filtered;
  }, [activeTab, realOrgs, sandboxOrgs, searchQuery]);

  const isSuperAdmin = currentUser?.role === "super_admin";

  const canDeleteOrganization = (org) =>
    (!org.total_projects || org.total_projects === 0) &&
    (!org.total_teachers || org.total_teachers === 0) &&
    (!org.total_schools || org.total_schools === 0) &&
    (!org.total_students || org.total_students === 0);

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
      (org) => org.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existingOrg) {
      alert(`An organization named "${trimmedName}" already exists. Please use a different name.`);
      return;
    }

    try {
      setAddingOrg(true);
      await handleAddOrganization(trimmedName, createSandbox);
      setNewOrgName("");
      setCreateSandbox(false);
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

  const handleOrganizationClick = (organization) => {
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

  const formatDate = (dateString) => {
    if (!dateString) return "Recent";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Recent";
      const now = new Date();
      const diffDays = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "Recent";
    }
  };

  const isLoading = (loading || userLoading) && !dataFetched;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background pt-6 pb-3 px-6">
        <div className="max-w-5xl mx-auto">

          {/* Greeting row */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Welcome back</p>
              <h1 className="text-xl font-bold text-foreground">
                {userLoading ? (
                  <span className="inline-block w-32 h-5 bg-background-light rounded animate-pulse" />
                ) : (
                  currentUser?.name || "User"
                )}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="w-9 h-9 bg-primary-2 rounded-xl flex items-center justify-center hover:bg-primary-2/80 transition-all"
                title="Profile"
              >
                <User size={16} className="text-white" />
              </button>
              <button
                onClick={handleLogoutClick}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-3 text-primary-1 hover:bg-yellow-400 hover:shadow-md transition-all font-semibold text-sm"
              >
                <FiLogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Tab toggle */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => { setActiveTab("organizations"); setSearchQuery(""); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "organizations"
                  ? "bg-primary-3 text-primary-1 shadow"
                  : "bg-background-light text-gray-400 hover:text-foreground"
              }`}
            >
              <Building2 size={14} />
              Organizations
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
                activeTab === "organizations" ? "bg-primary-1/20 text-primary-1" : "bg-background-lighter text-gray-400"
              }`}>
                {realOrgs.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("sandboxes"); setSearchQuery(""); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "sandboxes"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow"
                  : "bg-background-light text-gray-400 hover:text-foreground"
              }`}
            >
              <FlaskConical size={14} />
              Sandboxes
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
                activeTab === "sandboxes" ? "bg-blue-500/20 text-blue-300" : "bg-background-lighter text-gray-400"
              }`}>
                {sandboxOrgs.length}
              </span>
            </button>
          </div>

          {/* Search row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background-light border border-gray-600 rounded-xl text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 transition-all"
              />
            </div>
            <div className={`px-3 py-2 rounded-xl shrink-0 border ${
              activeTab === "sandboxes"
                ? "bg-blue-500/10 border-blue-500/30"
                : "bg-primary-3/10 border-primary-3/30"
            }`}>
              <span className={`text-xs font-semibold ${activeTab === "sandboxes" ? "text-blue-400" : "text-primary-3"}`}>
                {filteredOrganizations.length} {filteredOrganizations.length === 1
                  ? (activeTab === "sandboxes" ? "Sandbox" : "Org")
                  : (activeTab === "sandboxes" ? "Sandboxes" : "Orgs")}
              </span>
            </div>
          </div>

          {searchQuery && (
            <p className="text-xs text-gray-400 mt-1.5 px-1">
              {filteredOrganizations.length === 0
                ? `No results for "${searchQuery}"`
                : `${filteredOrganizations.length} result${filteredOrganizations.length !== 1 ? "s" : ""} for "${searchQuery}"`}
            </p>
          )}
        </div>
      </div>

      {/* ── Scrollable cards ──────────────────────────────────────────────── */}
      <main className="flex-1 px-6 py-4 overflow-y-auto">
        <div className="max-w-5xl mx-auto">

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-44 bg-background-light rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm bg-red-500/10 border border-red-500/30 text-red-400">
              Error: {error}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && filteredOrganizations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-background-light flex items-center justify-center mb-4">
                {activeTab === "sandboxes"
                  ? <FlaskConical size={24} className="text-blue-500/50" />
                  : <Building2 size={24} className="text-gray-600" />}
              </div>
              <p className="text-sm text-gray-400">
                {searchQuery
                  ? `No ${activeTab} match "${searchQuery}"`
                  : activeTab === "sandboxes"
                    ? "No sandbox environments available."
                    : "No organizations available for your account."}
              </p>
            </div>
          )}

          {/* Cards */}
          {!isLoading && filteredOrganizations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-24">
              {filteredOrganizations.map((org) => (
                <OrgCard
                  key={org.id}
                  org={org}
                  isSandbox={isSandboxOrg(org)}
                  formatDate={formatDate}
                  onClick={() => handleOrganizationClick(org)}
                  onDelete={isSuperAdmin && canDeleteOrganization(org) ? () => setOrgToDelete(org) : null}
                  canDelete={canDeleteOrganization(org)}
                  isSuperAdmin={isSuperAdmin}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Sticky footer: Add button (super admin only) ───────────────────── */}
      {isSuperAdmin && activeTab === "organizations" && (
        <div className="sticky bottom-0 z-20 px-6 py-3 bg-background/95 backdrop-blur-sm border-t border-white/5">
          <div className="max-w-5xl mx-auto flex justify-center">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-7 py-2.5 rounded-2xl bg-primary-3 text-primary-1 hover:bg-yellow-400 hover:shadow-lg transition-all duration-200 font-semibold text-sm"
            >
              <Plus size={16} />
              Add Organization
            </button>
          </div>
        </div>
      )}

      {/* ── User Profile Modal ─────────────────────────────────────────────── */}
      <UserProfileModal
        user={currentUser}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdate={async (data) => console.log("Updating profile:", data)}
      />

      {/* ── Add Organization Modal ─────────────────────────────────────────── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
        >
          <div className="w-full max-w-md bg-background-light rounded-3xl p-6 shadow-2xl border border-background-lighter">
            <h2 className="text-base font-bold text-foreground mb-5">Add New Organization</h2>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Organization Name (3–50 characters)
              </label>
              <input
                type="text"
                value={newOrgName}
                onChange={handleOrgNameChange}
                className={`w-full px-4 py-3 bg-background-lighter border rounded-xl text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent text-sm ${
                  nameValidation.valid ? "border-gray-500" : "border-red-500"
                }`}
                placeholder="e.g. Victor's Academy or St. Mary School"
                onKeyPress={(e) => e.key === "Enter" && handleAddOrg()}
                minLength={3}
                maxLength={50}
              />

              {newOrgName && (
                <div className="mt-2">
                  {!nameValidation.valid && (
                    <p className="text-xs text-red-400">{nameValidation.message}</p>
                  )}
                  {nameValidation.valid && (
                    <p className="text-xs text-green-400">✓ Valid organization name</p>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">{newOrgName.length}/50 characters</p>
              <p className="text-xs text-gray-500 mt-2">
                Allowed: letters, numbers, spaces, hyphens (-), apostrophes ('), periods (.), commas (,), and ampersands (&)
              </p>
            </div>

            {/* Sandbox toggle */}
            <div
              onClick={() => setCreateSandbox((prev) => !prev)}
              className={`mb-6 p-4 rounded-xl cursor-pointer transition-all border ${
                createSandbox ? "bg-primary-3/10 border-primary-3/40" : "bg-background-lighter border-gray-600"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="shrink-0 mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: createSandbox ? "#f7cc1c" : "transparent",
                    border: createSandbox ? "2px solid #f7cc1c" : "2px solid rgba(255,255,255,0.25)",
                  }}
                >
                  {createSandbox && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="#142848" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Create Sandbox Environment</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Also creates a test environment "{newOrgName.trim() || "your-org"}-sandbox" so you can
                    practice assessments before real evaluations.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewOrgName("");
                  setCreateSandbox(false);
                  setNameValidation({ valid: true, message: "" });
                }}
                disabled={addingOrg}
                className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-foreground hover:bg-background-lighter transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOrg}
                disabled={addingOrg || !newOrgName.trim() || !nameValidation.valid}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary-3 text-primary-1 hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {addingOrg ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
      {orgToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
        >
          <div className="w-full max-w-md bg-background-light rounded-3xl p-6 shadow-2xl border border-background-lighter">
            <h2 className="text-base font-bold text-foreground mb-3">
              Delete {isSandboxOrg(orgToDelete) ? "Sandbox" : "Organization"}
            </h2>
            <p className="text-sm text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-primary-3">{orgToDelete.name}</span>?{" "}
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOrgToDelete(null)}
                disabled={deletingOrg}
                className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-foreground hover:bg-background-lighter transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOrg}
                disabled={deletingOrg}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deletingOrg ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Org Card
// ---------------------------------------------------------------------------

function OrgCard({ org, isSandbox, formatDate, onClick, onDelete, canDelete, isSuperAdmin }) {
  const [hovered, setHovered] = useState(false);

  const stats = [
    { icon: Users,         label: "Teachers", value: org.total_teachers || 0, color: "#f7cc1c" },
    { icon: School,        label: "Schools",  value: org.total_schools  || 0, color: "#5aa2ce" },
    { icon: GraduationCap, label: "Students", value: org.total_students || 0, color: "#4caf50" },
    { icon: FolderKanban,  label: "Projects", value: org.total_projects || 0, color: "#e67e22" },
  ];

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete();
  };

  // Sandbox cards get a subtle blue tint to distinguish them
  const cardBorder = isSandbox
    ? "border-blue-500/30 hover:border-blue-400/60"
    : "border-background-lighter hover:border-primary-3/50";

  const iconBg = isSandbox
    ? hovered ? "bg-blue-500/20" : "bg-blue-500/10"
    : hovered ? "bg-primary-3/20" : "bg-primary-3/10";

  const IconComponent = isSandbox ? FlaskConical : Building2;
  const iconColor = isSandbox ? "text-blue-400" : "text-primary-3";

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`rounded-2xl p-5 cursor-pointer transition-all duration-200 flex flex-col bg-background-light border ${cardBorder} hover:bg-background-lighter hover:-translate-y-0.5 hover:shadow-lg relative`}
    >
      {/* Sandbox label pill */}
      {isSandbox && (
        <span className="absolute top-3 right-10 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25 uppercase tracking-wide">
          Sandbox
        </span>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${iconBg}`}>
          <IconComponent size={18} className={iconColor} />
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <button
              onClick={handleDeleteClick}
              disabled={!canDelete}
              className={`p-1.5 rounded-lg transition-all ${
                canDelete
                  ? "text-red-500 hover:bg-red-500/10 hover:text-red-400"
                  : "text-gray-600 cursor-not-allowed"
              }`}
              title={canDelete ? "Delete" : "Cannot delete: Organization has existing data"}
            >
              <Trash2 size={16} />
            </button>
          )}
          <ChevronRight
            size={15}
            className={`${isSandbox ? "text-blue-400" : "text-primary-3"} transition-all duration-200 ${
              hovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
            }`}
          />
        </div>
      </div>

      <h3 className="font-bold text-foreground text-base mb-1 truncate pr-16">{org.name}</h3>

      <div className="flex items-center gap-1.5 mb-4">
        <Calendar size={11} className="text-gray-500" />
        <span className="text-xs text-gray-400">{formatDate(org.createdAt)}</span>
      </div>

      <div className="grid grid-cols-4 gap-1 pt-3 mt-auto border-t border-background-lighter">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex flex-col items-center text-center gap-0.5">
            <Icon size={13} style={{ color }} />
            <span className="text-sm font-bold text-foreground">{value}</span>
            <span className="text-gray-400" style={{ fontSize: "10px" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}