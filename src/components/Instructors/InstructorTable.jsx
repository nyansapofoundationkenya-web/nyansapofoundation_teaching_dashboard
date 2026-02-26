// components/Instructors/InstructorTable.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import TableControls from "./TableControls";
import InstructorCard from "./InstructorCard";
import InstructorTableRow from "./InstructorTableRow";
import Pagination from "./Pagination";
import SearchInstructions from "./SearchInstructions";
import { exportData } from "@/utils/exportUtils";

export default function InstructorTable({ 
  instructors,
  loading, 
  currentPage, 
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  onEditInstructor,
  onDeleteInstructor,
  onUnassignInstructor,
  onUpdateRole,
  actionMenuOpen,
  setActionMenuOpen,
  roleUpdateOpen,
  setRoleUpdateOpen,
  newRole,
  setNewRole,
  canUpdateRoles,
  getRoleBadgeColor,
  getAvailableRoles,
  userRole,
  currentOrganizationId,
  searchQuery
}) {
  const [pins, setPins] = useState({});
  const [loadingPins, setLoadingPins] = useState({});
  const [revealedPins, setRevealedPins] = useState({});

  const canViewPins =
  userRole === "admin" ||
  userRole === "super_admin" ||
  userRole === "project_manager" ||
  userRole === "school_head" ||
  userRole === "teacher";
  const canExport = userRole === 'admin' || userRole === 'super_admin' || userRole === "project_manager" ||
  userRole === "school_head" ;

  const filteredInstructors = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      return instructors.filter(instructor => (instructor.orgCount || 0) > 0);
    } else {
      return instructors;
    }
  }, [instructors, searchQuery]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInstructors = filteredInstructors.slice(startIndex, endIndex);
  const filteredTotalPages = Math.ceil(filteredInstructors.length / itemsPerPage) || 1;

  const fetchPin = async (uid) => {
    if (loadingPins[uid] || pins[uid]) return;
    setLoadingPins(prev => ({ ...prev, [uid]: true }));
    try {
      const response = await fetch(`https://nyansapo-auth.vercel.app/api/auth/pin?uid=${uid}`);
      if (!response.ok) throw new Error('Failed to fetch PIN');
      const data = await response.json();
      setPins(prev => ({ ...prev, [uid]: data?.pin ?? 'N/A' }));
    } catch (error) {
      console.error('Error fetching PIN:', error);
      setPins(prev => ({ ...prev, [uid]: 'Error' }));
    } finally {
      setLoadingPins(prev => ({ ...prev, [uid]: false }));
    }
  };

  const togglePinVisibility = (uid) => {
    setRevealedPins(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  useEffect(() => {
    currentInstructors.forEach(instructor => {
      if (!pins[instructor.uid]) {
        fetchPin(instructor.uid);
      }
    });
  }, [currentInstructors]);

  const handleExport = (format) => {
    if (!canExport) {
      alert('You do not have permission to export data');
      return;
    }
    const exportDataArray = currentInstructors.map(instructor => ({
      Name: instructor.name || 'N/A',
      Role: instructor.role || 'teacher',
      Email: instructor.email || 'N/A',
      Phone: instructor.phone || 'N/A',
      PIN: pins[instructor.uid] || 'Not fetched',
      Organizations: instructor.orgCount || 0,
      Projects: instructor.projectCount || 0,
      Schools: instructor.schoolCount || 0,
    }));
    exportData(exportDataArray, format);
  };

  return (
    <div className="space-y-4">
      {!searchQuery?.trim() && <SearchInstructions />}

      <TableControls
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={onItemsPerPageChange}
        canExport={canExport}
        onExport={handleExport}
        hasData={currentInstructors.length > 0}
      />

      {loading && <p className="text-gray-300">Loading instructors...</p>}

      {!loading && (
        <>
          {/* Mobile View */}
          <div className="md:hidden space-y-3">
            {currentInstructors.length > 0 ? (
              currentInstructors.map((instructor) => (
                <InstructorCard
                  key={instructor.uid}
                  instructor={instructor}
                  pin={pins[instructor.uid]}
                  loadingPin={loadingPins[instructor.uid]}
                  revealed={revealedPins[instructor.uid]}
                  onFetchPin={() => fetchPin(instructor.uid)}
                  onTogglePin={() => togglePinVisibility(instructor.uid)}
                  onEdit={() => onEditInstructor(instructor)}
                  onDelete={() => onDeleteInstructor(instructor.uid)}
                  onUnassign={(uid, name) => onUnassignInstructor(uid, name)}
                  onUpdateRole={(uid, role) => onUpdateRole(uid, role)}
                  actionMenuOpen={actionMenuOpen}
                  setActionMenuOpen={setActionMenuOpen}
                  roleUpdateOpen={roleUpdateOpen}
                  setRoleUpdateOpen={setRoleUpdateOpen}
                  newRole={newRole}
                  setNewRole={setNewRole}
                  userRole={userRole}
                  currentOrganizationId={currentOrganizationId}
                  canUpdateRoles={canUpdateRoles}
                  getRoleBadgeColor={getRoleBadgeColor}
                  getAvailableRoles={getAvailableRoles}
                  canViewPins={canViewPins}
                />
              ))
            ) : (
              <div className="text-center py-8 text-sm text-gray-400">
                {!searchQuery?.trim()
                  ? "No instructors with assigned organizations found. Use search to find all instructors."
                  : "No instructors found matching your search."}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <div className="bg-background-light rounded-xl shadow-lg border border-gray-600 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-background-lighter border-b border-gray-600">
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground whitespace-nowrap">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground whitespace-nowrap">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground whitespace-nowrap">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground whitespace-nowrap">Phone</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground whitespace-nowrap">PIN</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground whitespace-nowrap">Assignments</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentInstructors.length > 0 ? (
                      currentInstructors.map((instructor) => (
                        <InstructorTableRow
                          key={instructor.uid}
                          instructor={instructor}
                          pin={pins[instructor.uid]}
                          loadingPin={loadingPins[instructor.uid]}
                          revealed={revealedPins[instructor.uid]}
                          onFetchPin={() => fetchPin(instructor.uid)}
                          onTogglePin={() => togglePinVisibility(instructor.uid)}
                          onEdit={onEditInstructor}
                          onDelete={onDeleteInstructor}
                          onUnassign={onUnassignInstructor}
                          onUpdateRole={onUpdateRole}
                          actionMenuOpen={actionMenuOpen}
                          setActionMenuOpen={setActionMenuOpen}
                          roleUpdateOpen={roleUpdateOpen}
                          setRoleUpdateOpen={setRoleUpdateOpen}
                          newRole={newRole}
                          setNewRole={setNewRole}
                          userRole={userRole}
                          currentOrganizationId={currentOrganizationId}
                          canUpdateRoles={canUpdateRoles}
                          getRoleBadgeColor={getRoleBadgeColor}
                          getAvailableRoles={getAvailableRoles}
                          canViewPins={canViewPins}
                        />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                          {!searchQuery?.trim()
                            ? "No instructors with assigned organizations found. Use search to find all instructors."
                            : "No instructors found matching your search."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {filteredTotalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={filteredTotalPages}
              totalItems={filteredInstructors.length}
              startIndex={startIndex}
              endIndex={endIndex}
              onPageChange={onPageChange}
            />
          )}
        </>
      )}
    </div>
  );
}