// components/Instructors/RoleUpdateDropdown.jsx
"use client"

import { useEffect, useRef, useState } from "react";
import { X, Check } from "lucide-react";
import Portal from "@/components/ui/Portal";

export default function RoleUpdateDropdown({ 
  instructor, 
  newRole, 
  setNewRole, 
  onUpdateRole, 
  onCancel, 
  getAvailableRoles,
  userRole 
}) {
  const [dropdownStyle, setDropdownStyle] = useState({});
  const buttonRef = useRef(null);

  // Calculate position when dropdown opens
  useEffect(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 220;
      
      if (spaceBelow < dropdownHeight) {
        // Position above
        setDropdownStyle({
          bottom: window.innerHeight - rect.top + 8,
          right: window.innerWidth - rect.right,
          minWidth: '250px',
          maxWidth: '300px'
        });
      } else {
        // Position below
        setDropdownStyle({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
          minWidth: '250px',
          maxWidth: '300px'
        });
      }
    }
  }, []);

  // Only show if user is super admin
  if (userRole !== 'super_admin') {
    return null;
  }

  return (
    <>
      {/* Invisible button ref for positioning */}
      <div ref={buttonRef} className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0" />
      
      <Portal>
        <div 
          className="fixed inset-0 z-40" 
          onClick={onCancel}
        />
        <div 
          className="fixed z-50 bg-background-light rounded-xl shadow-lg border border-primary-2/30 overflow-hidden"
          style={dropdownStyle}
        >
          <div className="p-4">
            <p className="text-sm font-medium text-foreground mb-3 truncate">
              Update Role for {instructor.name}
            </p>
            
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Select New Role
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2 mb-4 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-2 bg-background-lighter text-foreground"
            >
              {getAvailableRoles().map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => onUpdateRole(instructor.uid, newRole)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary-2 hover:bg-primary-3 text-white rounded-lg text-sm transition-colors"
              >
                <Check className="w-4 h-4" />
                Update
              </button>
              <button
                onClick={onCancel}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Portal>
    </>
  );
}