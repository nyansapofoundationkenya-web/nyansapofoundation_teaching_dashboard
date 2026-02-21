// components/Instructors/ActionMenu.jsx
"use client"

import { useEffect, useState } from "react";
import { Edit, Trash2, UserMinus, Shield } from "lucide-react";
import Portal from "@/components/ui/Portal";

export default function ActionMenu({ 
  instructor,
  triggerRef, // ref to the actual trigger button, passed from InstructorTableRow
  onEdit, 
  onDelete, 
  onUnassign,
  userRole,
  currentOrganizationId,
  onRoleUpdateClick,
  onClose
}) {
  const [dropdownStyle, setDropdownStyle] = useState({});

  // Permission checks
  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin';
  const canUpdateRoles = isSuperAdmin;
  const canDeleteInstructor = isSuperAdmin;
  const canUnassign = isAdmin || isSuperAdmin;
  const canUpdateAssignment = isAdmin || isSuperAdmin;

  // Calculate position from the actual trigger button rect
  useEffect(() => {
    if (triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 200;

      if (spaceBelow < menuHeight) {
        setDropdownStyle({
          bottom: window.innerHeight - rect.top + 4,
          right: window.innerWidth - rect.right,
          minWidth: '200px',
          maxWidth: '280px'
        });
      } else {
        setDropdownStyle({
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right,
          minWidth: '200px',
          maxWidth: '280px'
        });
      }
    }
  }, [triggerRef]);

  return (
    <Portal>
      {/* Full-screen backdrop — clicking outside closes the menu */}
      <div 
        className="fixed inset-0 z-[9998]" 
        onClick={onClose}
      />
      {/* Menu */}
      <div 
        className="fixed z-[9999] bg-background-light rounded-xl shadow-lg border border-primary-3/30 overflow-hidden"
        style={dropdownStyle}
      >
        <div className="overflow-y-auto max-h-[min(400px,80vh)]">
          {canUpdateAssignment && (
            <button
              onClick={() => { onEdit(instructor); onClose(); }}
              className="flex items-center w-full px-4 py-3 text-sm text-foreground hover:bg-primary-3/20 hover:text-primary-3 transition-colors border-b border-gray-600"
            >
              <Edit className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Update Assignment</span>
            </button>
          )}
          {canUpdateRoles && (
            <button
              onClick={() => { onRoleUpdateClick(); onClose(); }}
              className="flex items-center w-full px-4 py-3 text-sm text-foreground hover:bg-primary-2/20 hover:text-primary-2 transition-colors border-b border-gray-600"
            >
              <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Update Role</span>
            </button>
          )}
          {canUnassign && currentOrganizationId && instructor.orgCount > 0 && (
            <button
              onClick={() => { onUnassign(instructor.uid, instructor.name); onClose(); }}
              className="flex items-center w-full px-4 py-3 text-sm text-amber-500 hover:bg-amber-500/20 hover:text-amber-400 transition-colors border-b border-gray-600"
            >
              <UserMinus className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Unassign from Org</span>
            </button>
          )}
          {canDeleteInstructor && (
            <button
              onClick={() => { onDelete(instructor.uid); onClose(); }}
              className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Delete Instructor</span>
            </button>
          )}
        </div>
      </div>
    </Portal>
  );
}