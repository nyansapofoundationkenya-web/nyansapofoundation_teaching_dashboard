// components/Instructors/ActionMenu.jsx
"use client"

import { useEffect, useRef, useState } from "react";
import { Edit, Trash2, UserMinus, Shield } from "lucide-react";
import Portal from "@/components/ui/Portal";

export default function ActionMenu({ 
  instructor, 
  onEdit, 
  onDelete, 
  onUnassign,
  userRole,
  currentOrganizationId,
  onRoleUpdateClick 
}) {
  const [dropdownStyle, setDropdownStyle] = useState({});
  const buttonRef = useRef(null);

  // Permission checks
  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin';
  const canUpdateRoles = isSuperAdmin;
  const canDeleteInstructor = isSuperAdmin;
  const canUnassign = isAdmin || isSuperAdmin;
  const canUpdateAssignment = isAdmin || isSuperAdmin;

  // Calculate position when menu opens
  useEffect(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 200; // Approximate menu height
      
      if (spaceBelow < menuHeight) {
        // Position above
        setDropdownStyle({
          bottom: window.innerHeight - rect.top + 8,
          right: window.innerWidth - rect.right,
          minWidth: '200px',
          maxWidth: '280px'
        });
      } else {
        // Position below
        setDropdownStyle({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
          minWidth: '200px',
          maxWidth: '280px'
        });
      }
    }
  }, []);

  return (
    <>
      {/* Invisible button ref for positioning */}
      <div ref={buttonRef} className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0" />
      
      {/* Dropdown Portal */}
      <Portal>
        <div 
          className="fixed inset-0 z-40" 
          onClick={(e) => {
            e.stopPropagation();
            // Close will be handled by parent
          }}
        />
        <div 
          className="fixed z-50 bg-background-light rounded-xl shadow-lg border border-primary-3/30 overflow-hidden"
          style={dropdownStyle}
        >
          <div className="overflow-y-auto max-h-[min(400px, 80vh)]">
            {/* Update Assignment - Admin & Super Admin */}
            {canUpdateAssignment && (
              <button
                onClick={() => onEdit(instructor)}
                className="flex items-center w-full px-4 py-3 text-sm text-foreground hover:bg-primary-3/20 hover:text-primary-3 transition-colors border-b border-gray-600"
              >
                <Edit className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">Update Assignment</span>
              </button>
            )}

            {/* Update Role - Super Admin Only */}
            {canUpdateRoles && (
              <button
                onClick={onRoleUpdateClick}
                className="flex items-center w-full px-4 py-3 text-sm text-foreground hover:bg-primary-2/20 hover:text-primary-2 transition-colors border-b border-gray-600"
              >
                <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">Update Role</span>
              </button>
            )}

            {/* Unassign/Remove from Organization - Admin & Super Admin */}
            {canUnassign && currentOrganizationId && instructor.orgCount > 0 && (
              <button
                onClick={() => onUnassign(instructor.uid, instructor.name)}
                className="flex items-center w-full px-4 py-3 text-sm text-amber-500 hover:bg-amber-500/20 hover:text-amber-400 transition-colors border-b border-gray-600"
              >
                <UserMinus className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">Unassign from Org</span>
              </button>
            )}

            {/* Delete Instructor - Super Admin Only */}
            {canDeleteInstructor && (
              <button
                onClick={() => onDelete(instructor.uid)}
                className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">Delete Instructor</span>
              </button>
            )}
          </div>
        </div>
      </Portal>
    </>
  );
}