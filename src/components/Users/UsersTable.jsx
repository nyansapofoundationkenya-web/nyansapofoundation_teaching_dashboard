"use client";

import { useState, useEffect, useRef } from "react";
import { MoreVertical, Eye, EyeOff } from "lucide-react";
import ActionMenu from "@/components/Instructors/ActionMenu";
import RoleUpdateDropdown from "@/components/Instructors/RoleUpdateDropdown";
import AssignmentDropdown from "@/components/Instructors/AssignmentDropdown";
import { exportData } from "@/utils/exportUtils";

const roleLabel = (role) => (role || "user").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
function initials(name = "?") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("");
}

export default function UsersTable({
  users, loading, currentPage, totalPages, itemsPerPage,
  onPageChange, onItemsPerPageChange,
  onEditUser, onDeleteUser, onUnassignUser, onUpdateRole,
  actionMenuOpen, setActionMenuOpen,
  roleUpdateOpen, setRoleUpdateOpen,
  newRole, setNewRole,
  userRole, canUpdateRoles, canExport,
  getRoleBadgeColor, getAvailableRoles, searchQuery,
}) {
  const [pins, setPins] = useState({});
  const [loadingPins, setLoadingPins] = useState({});
  const [revealedPins, setRevealedPins] = useState({});
  const actionTriggerRefs = useRef({});

  const canViewPins = ["admin", "super_admin", "project_manager", "school_head", "teacher"].includes(userRole);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageUsers = users.slice(startIndex, startIndex + itemsPerPage);

  const fetchPin = async (uid) => {
    if (loadingPins[uid] || pins[uid]) return;
    setLoadingPins((p) => ({ ...p, [uid]: true }));
    try {
      const res = await fetch(`https://nyansapo-auth.vercel.app/api/auth/pin?uid=${uid}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPins((p) => ({ ...p, [uid]: data?.pin ?? "N/A" }));
    } catch {
      setPins((p) => ({ ...p, [uid]: "Error" }));
    } finally {
      setLoadingPins((p) => ({ ...p, [uid]: false }));
    }
  };

  useEffect(() => {
    if (!canViewPins) return;
    pageUsers.forEach((u) => { if (!pins[u.uid]) fetchPin(u.uid); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageUsers]);

  const handleExport = (format) => {
    if (!canExport) return alert("You do not have permission to export data");
    exportData(
      pageUsers.map((u) => ({
        Name: u.name || "N/A", Role: u.role || "user", Email: u.email || "N/A",
        Phone: u.phone || "N/A", PIN: pins[u.uid] || "Not fetched",
        Organizations: u.orgCount || 0, Projects: u.projectCount || 0, Schools: u.schoolCount || 0,
      })),
      format
    );
  };

  const PinCell = ({ u }) => {
    if (!canViewPins) return <span className="text-gray-400">—</span>;
    if (loadingPins[u.uid]) return <span className="text-gray-400 text-xs">Loading…</span>;
    return (
      <button onClick={() => setRevealedPins((p) => ({ ...p, [u.uid]: !p[u.uid] }))} className="flex items-center gap-1.5 font-mono text-sm text-gray-300 hover:text-primary-2">
        {revealedPins[u.uid] ? (pins[u.uid] || "••••") : "••••"}
        {revealedPins[u.uid] ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    );
  };

  const RowActions = ({ u }) => (
    <>
      <button
        ref={(el) => (actionTriggerRefs.current[u.uid] = el)}
        onClick={() => setActionMenuOpen(actionMenuOpen === u.uid ? null : u.uid)}
        className="p-1.5 text-gray-400 hover:text-primary-2 rounded-lg hover:bg-background-lighter transition-all"
      >
        <MoreVertical size={18} />
      </button>

      {actionMenuOpen === u.uid && (
        <ActionMenu
          instructor={u}
          triggerRef={{ current: actionTriggerRefs.current[u.uid] }}
          onEdit={onEditUser}
          onDelete={onDeleteUser}
          onUnassign={onUnassignUser}
          userRole={userRole}
          currentOrganizationId={null} // global page — no single org context
          onRoleUpdateClick={() => { setRoleUpdateOpen(u.uid); setNewRole(u.role || ""); }}
          onClose={() => setActionMenuOpen(null)}
        />
      )}

      {roleUpdateOpen === u.uid && (
        <RoleUpdateDropdown
          instructor={u}
          newRole={newRole}
          setNewRole={setNewRole}
          onUpdateRole={onUpdateRole}
          onCancel={() => setRoleUpdateOpen(null)}
          getAvailableRoles={getAvailableRoles}
          userRole={userRole}
          triggerRef={{ current: actionTriggerRefs.current[u.uid] }}
        />
      )}
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <span className="text-sm text-gray-300">{users.length} user{users.length !== 1 ? "s" : ""} {searchQuery?.trim() ? "matching search" : "total"}</span>
        <div className="flex items-center gap-2">
          <select value={itemsPerPage} onChange={(e) => onItemsPerPageChange(e.target.value)} className="bg-background border border-gray-600 rounded-lg text-sm px-2 py-1.5 text-gray-300">
            {[10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
          {canExport && (
            <button onClick={() => handleExport("csv")} className="px-3 py-1.5 bg-background-lighter border border-gray-600 rounded-lg text-xs font-bold text-foreground hover:border-primary-3">
              Export CSV
            </button>
          )}
        </div>
      </div>

      {loading && <p className="text-gray-300">Loading users…</p>}

      {!loading && (
        <>
          <div className="md:hidden space-y-3">
            {pageUsers.map((u) => (
              <div key={u.uid} className="bg-background-light border border-gray-600 rounded-xl p-4 space-y-3 relative">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-2/20 text-primary-2 flex items-center justify-center font-bold text-sm">{initials(u.name)}</div>
                    <div>
                      <p className="font-bold text-foreground">{u.name || "N/A"}</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getRoleBadgeColor(u.role)}`}>{roleLabel(u.role)}</span>
                    </div>
                  </div>
                  <RowActions u={u} />
                </div>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>{u.email || "N/A"}</p>
                  <p>{u.phone || "N/A"}</p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-600">
                  <AssignmentDropdown instructor={u} />
                  <PinCell u={u} />
                </div>
              </div>
            ))}
            {pageUsers.length === 0 && <p className="text-center py-8 text-sm text-gray-400">No users found.</p>}
          </div>

          <div className="hidden md:block bg-background-light rounded-xl shadow-lg border border-gray-600 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-background-lighter border-b border-gray-600">
                    {["Name", "Role", "Email", "Phone", "PIN", "Assigned To", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-sm font-medium text-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageUsers.map((u) => (
                    <tr key={u.uid} className="border-b border-gray-600/50 hover:bg-background-lighter/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-2/20 text-primary-2 flex items-center justify-center font-bold text-xs">{initials(u.name)}</div>
                          <span className="font-medium text-foreground">{u.name || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getRoleBadgeColor(u.role)}`}>{roleLabel(u.role)}</span></td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-300">{u.email || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{u.phone || "N/A"}</td>
                      <td className="px-4 py-3"><PinCell u={u} /></td>
                      <td className="px-4 py-3"><AssignmentDropdown instructor={u} /></td>
                      <td className="px-4 py-3 text-right relative"><RowActions u={u} /></td>
                    </tr>
                  ))}
                  {pageUsers.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center text-sm text-gray-300">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className="px-3 py-1.5 border border-gray-600 rounded-lg disabled:opacity-30">Prev</button>
                <button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} className="px-3 py-1.5 border border-gray-600 rounded-lg disabled:opacity-30">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}