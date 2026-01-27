import { useState, useEffect } from "react";

export default function RoleUpdateDropdown({ 
  instructor, 
  newRole, 
  setNewRole, 
  onUpdateRole, 
  onCancel, 
  getAvailableRoles,
  userRole 
}) {
  // Only show if user is super admin
  if (userRole !== 'super_admin') {
    return null;
  }

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