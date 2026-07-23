"use client";

import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Search, Users as UsersIcon, BarChart3 } from "lucide-react";
import { useAllUsers } from "@/hooks/users/useAllUsers";
import { useInstructorActions } from "@/hooks/useInstructorActions";
import InstructorModal from "@/components/Instructors/InstructorsModal";
import InstructorTable from "@/components/Instructors/InstructorTable";
import PlatformStats from "@/components/Users/PlatformStats";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { unassignInstructorFromOrganization } from "@/utils/instructorUtils";

export default function UsersManagementPage() {
  const { user: currentUser } = useSelector((state) => state.auth);
  const userRole = currentUser?.role;

  const { users, loading, error, refetchUsers } = useAllUsers();
  const { updateInstructorRole, deleteInstructor, error: actionError } = useInstructorActions();

  const [activeTab, setActiveTab] = useState("users"); // "users" | "stats"
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [roleUpdateOpen, setRoleUpdateOpen] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const canUpdateRoles = userRole === "super_admin";
  const canExport = ["admin", "super_admin", "project_manager", "school_head"].includes(userRole);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "super_admin": return "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm";
      case "admin": return "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm";
      case "project_manager": return "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm";
      case "school_head": return "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-sm";
      case "teacher": return "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm";
      default: return "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm";
    }
  };

  const getAvailableRoles = () =>
    userRole === "super_admin"
      ? [
          { value: "super_admin", label: "Super Admin" },
          { value: "admin", label: "Admin" },
          { value: "project_manager", label: "Project Manager" },
          { value: "school_head", label: "School Head" },
          { value: "teacher", label: "Teacher" },
        ]
      : [
          { value: "admin", label: "Admin" },
          { value: "project_manager", label: "Project Manager" },
          { value: "school_head", label: "School Head" },
          { value: "teacher", label: "Teacher" },
        ];

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
    );
  }, [users, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

  const handleEditUser = (u) => { setSelectedUser(u); setIsModalOpen(true); setActionMenuOpen(null); };

  const handleDeleteUser = async (uid) => {
    if (!confirm("Delete this user? This action cannot be undone.")) return;
    try {
      await deleteInstructor(uid);
      setActionMenuOpen(null);
      refetchUsers();
    } catch (err) {
      alert(`Error deleting user: ${err.message}`);
    }
  };

  // ActionMenu only shows "Unassign" when currentOrganizationId is set, which
  // we pass as null below — so this won't actually be reachable yet. Keeping
  // it wired for when AssignmentDropdown grows an unassign action.
  const handleUnassignUser = async (uid, orgId, userName) => {
    if (!confirm(`Remove ${userName} from this organization?`)) return;
    try {
      await unassignInstructorFromOrganization(uid, orgId);
      setActionMenuOpen(null);
      refetchUsers();
    } catch (err) {
      alert(`Error unassigning user: ${err.message}`);
    }
  };

  const handleUpdateRole = async (uid, role) => {
    if (!confirm(`Update role to ${role}?`)) return;
    try {
      if (["teacher", "admin"].includes(role)) {
        await updateInstructorRole(uid, role);
      } else {
        // updateInstructorRole only accepts teacher/admin today — direct
        // write for project_manager/school_head/super_admin until it's widened
        await updateDoc(doc(db, "user", uid), { role, updatedAt: new Date().toISOString() });
      }
      setRoleUpdateOpen(null);
      setNewRole("");
      refetchUsers();
    } catch (err) {
      alert(`Error updating role: ${err.message}`);
    }
  };

  useMemo(() => setCurrentPage(1), [searchTerm]);

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-gray-400">Directory and usage across the whole platform.</p>
        </div>

        <div className="flex items-center gap-1 bg-background-light p-1 rounded-xl border border-background-lighter w-fit">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "users" ? "bg-primary-3 text-primary-1" : "text-gray-400 hover:text-foreground"
            }`}
          >
            <UsersIcon size={15} /> Users
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "stats" ? "bg-primary-3 text-primary-1" : "text-gray-400 hover:text-foreground"
            }`}
          >
            <BarChart3 size={15} /> Platform Stats
          </button>
        </div>
      </div>

      {activeTab === "users" ? (
        <>
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent bg-background-lighter text-foreground placeholder-gray-400"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>

          {error && <p className="text-red-400">{error}</p>}
          {actionError && <p className="text-red-400">{actionError}</p>}

          <InstructorTable
            instructors={filteredUsers}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}
            onEditInstructor={handleEditUser}
            onDeleteInstructor={handleDeleteUser}
            onUnassignInstructor={handleUnassignUser}
            onUpdateRole={handleUpdateRole}
            actionMenuOpen={actionMenuOpen}
            setActionMenuOpen={setActionMenuOpen}
            roleUpdateOpen={roleUpdateOpen}
            setRoleUpdateOpen={setRoleUpdateOpen}
            newRole={newRole}
            setNewRole={setNewRole}
            userRole={userRole}
            canUpdateRoles={canUpdateRoles}
            getRoleBadgeColor={getRoleBadgeColor}
            getAvailableRoles={getAvailableRoles}
            currentOrganizationId={null}
            searchQuery={searchTerm}
            requireAssignment={false}
          />

          <InstructorModal
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setSelectedUser(null); }}
            onSubmit={() => { setIsModalOpen(false); setSelectedUser(null); refetchUsers(); }}
            selectedInstructor={selectedUser}
            userRole={userRole}
          />
        </>
      ) : (
        <PlatformStats />
      )}
    </div>
  );
}