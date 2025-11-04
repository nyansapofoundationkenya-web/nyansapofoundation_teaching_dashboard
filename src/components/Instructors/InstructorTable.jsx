"use client";

import { MoreVertical, Edit, Trash2, ChevronLeft,ChevronRight } from "lucide-react";

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
  onUpdateRole,
  actionMenuOpen,
  setActionMenuOpen,
  roleUpdateOpen,
  setRoleUpdateOpen,
  newRole,
  setNewRole,
  canUpdateRoles,
  getRoleBadgeColor,
  getAvailableRoles
}) {
  // Pagination calculations
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInstructors = instructors.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      {/* Items per page selector */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-foreground font-medium">Show:</label>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="border border-gray-500 rounded-xl px-3 py-2 text-sm 
                    focus:outline-none focus:ring-1 focus:ring-primary-3 focus:border-transparent
                    bg-background-lighter text-foreground cursor-pointer"
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        <span className="text-sm text-gray-300">per page</span>
      </div>

      {loading && <p className="text-gray-300">Loading instructors...</p>}

      {!loading && (
        <>
          {/* Mobile List View (md:hidden) */}
          <div className="md:hidden space-y-3">
            {currentInstructors.length > 0 ? (
              currentInstructors.map((instructor) => (
                <InstructorCard
                  key={instructor.uid}
                  instructor={instructor}
                  onEdit={onEditInstructor}
                  onDelete={onDeleteInstructor}
                  onUpdateRole={onUpdateRole}
                  actionMenuOpen={actionMenuOpen}
                  setActionMenuOpen={setActionMenuOpen}
                  roleUpdateOpen={roleUpdateOpen}
                  setRoleUpdateOpen={setRoleUpdateOpen}
                  newRole={newRole}
                  setNewRole={setNewRole}
                  canUpdateRoles={canUpdateRoles}
                  getRoleBadgeColor={getRoleBadgeColor}
                  getAvailableRoles={getAvailableRoles}
                />
              ))
            ) : (
              <div className="text-center py-8 text-sm text-gray-400">
                No instructors found.
              </div>
            )}
          </div>

          {/* Desktop Table View (hidden md:block) */}
          <div className="hidden md:block">
            <div className="bg-background-light rounded-xl shadow-lg border border-gray-600 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-background-lighter border-b border-gray-600">
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground whitespace-nowrap">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground whitespace-nowrap">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground whitespace-nowrap">Organizations</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground whitespace-nowrap">Projects</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground whitespace-nowrap">Schools</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentInstructors.length > 0 ? (
                      currentInstructors.map((instructor) => (
                        <InstructorTableRow
                          key={instructor.uid}
                          instructor={instructor}
                          onEdit={onEditInstructor}
                          onDelete={onDeleteInstructor}
                          onUpdateRole={onUpdateRole}
                          actionMenuOpen={actionMenuOpen}
                          setActionMenuOpen={setActionMenuOpen}
                          roleUpdateOpen={roleUpdateOpen}
                          setRoleUpdateOpen={setRoleUpdateOpen}
                          newRole={newRole}
                          setNewRole={setNewRole}
                          canUpdateRoles={canUpdateRoles}
                          getRoleBadgeColor={getRoleBadgeColor}
                          getAvailableRoles={getAvailableRoles}
                        />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                          No instructors found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={instructors.length}
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

// Mobile Card Component
function InstructorCard({ 
  instructor, 
  onEdit, 
  onDelete, 
  onUpdateRole,
  actionMenuOpen,
  setActionMenuOpen,
  roleUpdateOpen,
  setRoleUpdateOpen,
  newRole,
  setNewRole,
  canUpdateRoles,
  getRoleBadgeColor,
  getAvailableRoles
}) {
  return (
    <div className="bg-background-light rounded-xl p-3 border border-gray-600">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm truncate pr-2">
            {instructor.name || 'N/A'}
          </p>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(instructor.role)}`}>
            {instructor.role || 'teacher'}
          </span>
        </div>
        <div className="flex-shrink-0 ml-2 relative action-menu-container">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActionMenuOpen(actionMenuOpen === instructor.uid ? null : instructor.uid);
            }}
            className="p-2 rounded-xl hover:bg-primary-3/20 text-primary-2 hover:text-primary-3 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {actionMenuOpen === instructor.uid && (
            <ActionMenu
              instructor={instructor}
              onEdit={onEdit}
              onDelete={onDelete}
              canUpdateRoles={canUpdateRoles}
              onRoleUpdateClick={() => {
                setActionMenuOpen(null);
                setRoleUpdateOpen(instructor.uid);
                setNewRole(instructor.role || 'teacher');
              }}
            />
          )}

          {canUpdateRoles && roleUpdateOpen === instructor.uid && (
            <RoleUpdateDropdown
              instructor={instructor}
              newRole={newRole}
              setNewRole={setNewRole}
              onUpdateRole={onUpdateRole}
              onCancel={() => {
                setRoleUpdateOpen(null);
                setNewRole("");
              }}
              getAvailableRoles={getAvailableRoles}
            />
          )}
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-300">
        <span>Orgs: <span className="font-semibold">{instructor.orgCount || 0}</span></span>
        <span>Proj: <span className="font-semibold">{instructor.projectCount || 0}</span></span>
        <span>Sch: <span className="font-semibold">{instructor.schoolCount || 0}</span></span>
      </div>
    </div>
  );
}

// Desktop Table Row Component
function InstructorTableRow({ 
  instructor, 
  onEdit, 
  onDelete, 
  onUpdateRole,
  actionMenuOpen,
  setActionMenuOpen,
  roleUpdateOpen,
  setRoleUpdateOpen,
  newRole,
  setNewRole,
  canUpdateRoles,
  getRoleBadgeColor,
  getAvailableRoles
}) {
  return (
    <tr className="border-b border-gray-600 hover:bg-background-lighter/50">
      <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">
        {instructor.name || 'N/A'}
      </td>
      <td className="px-4 py-3 text-sm whitespace-nowrap">
        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getRoleBadgeColor(instructor.role)}`}>
          {instructor.role || 'teacher'}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap text-center">
        <span className="font-semibold text-lg">{instructor.orgCount || 0}</span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap text-center">
        <span className="font-semibold text-lg">{instructor.projectCount || 0}</span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap text-center">
        <span className="font-semibold text-lg">{instructor.schoolCount || 0}</span>
      </td>
      <td className="px-4 py-3 text-sm whitespace-nowrap">
        <div className="relative action-menu-container">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActionMenuOpen(actionMenuOpen === instructor.uid ? null : instructor.uid);
            }}
            className="p-2 rounded-xl hover:bg-primary-3/20 text-primary-2 hover:text-primary-3 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {actionMenuOpen === instructor.uid && (
            <ActionMenu
              instructor={instructor}
              onEdit={onEdit}
              onDelete={onDelete}
              canUpdateRoles={canUpdateRoles}
              onRoleUpdateClick={() => {
                setActionMenuOpen(null);
                setRoleUpdateOpen(instructor.uid);
                setNewRole(instructor.role || 'teacher');
              }}
            />
          )}

          {canUpdateRoles && roleUpdateOpen === instructor.uid && (
            <RoleUpdateDropdown
              instructor={instructor}
              newRole={newRole}
              setNewRole={setNewRole}
              onUpdateRole={onUpdateRole}
              onCancel={() => {
                setRoleUpdateOpen(null);
                setNewRole("");
              }}
              getAvailableRoles={getAvailableRoles}
            />
          )}
        </div>
      </td>
    </tr>
  );
}

// Action Menu Component
function ActionMenu({ instructor, onEdit, onDelete, canUpdateRoles, onRoleUpdateClick }) {
  return (
    <div className="absolute right-0 mt-1 w-48 bg-background-light rounded-xl shadow-lg z-50 border border-primary-3/30">
      <button
        onClick={() => onEdit(instructor)}
        className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-primary-3/20 hover:text-primary-3 transition-colors border-b border-gray-600"
      >
        <Edit className="w-4 h-4 mr-2" />
        Update Assignment
      </button>
      
      {canUpdateRoles && (
        <button
          onClick={onRoleUpdateClick}
          className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-primary-2/20 hover:text-primary-2 transition-colors border-b border-gray-600"
        >
          <Edit className="w-4 h-4 mr-2" />
          Update Role
        </button>
      )}
      
      <button
        onClick={() => onDelete(instructor.uid)}
        className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </button>
    </div>
  );
}

// Role Update Dropdown Component
function RoleUpdateDropdown({ instructor, newRole, setNewRole, onUpdateRole, onCancel, getAvailableRoles }) {
  return (
    <div className="absolute right-0 mt-1 w-48 bg-background-light rounded-xl shadow-lg z-50 border border-primary-2/30 role-update-container">
      <div className="px-4 py-2 border-b border-gray-600">
        <label className="block text-xs font-medium text-foreground mb-1">New Role</label>
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          className="w-full px-2 py-1 border border-gray-500 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-2 bg-background-lighter text-foreground"
        >
          {getAvailableRoles().map(role => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-1 p-2">
        <button
          onClick={() => onUpdateRole(instructor.uid, newRole)}
          className="flex-1 px-3 py-1 text-sm bg-primary-2 text-white rounded-lg hover:bg-primary-3 transition-colors"
        >
          Update
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-1 text-sm bg-gray-500 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Pagination Component
function Pagination({ currentPage, totalPages, totalItems, startIndex, endIndex, onPageChange }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-600">
      <div className="text-sm text-gray-300">
        Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} instructors
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl border border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-3/20 hover:border-primary-3 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 text-sm rounded-xl border ${
                currentPage === page
                  ? 'bg-primary-3 text-primary-1 border-primary-3 font-semibold'
                  : 'border-gray-500 hover:bg-primary-3/20 hover:border-primary-3 text-foreground'
              } transition-colors`}
            >
              {page}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl border border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-3/20 hover:border-primary-3 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-foreground" />
        </button>
      </div>
    </div>
  );
}