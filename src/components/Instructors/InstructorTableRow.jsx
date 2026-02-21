// components/Instructors/InstructorTableRow.jsx
"use client"

import { MoreVertical, Eye, EyeOff } from "lucide-react";
import ActionMenu from "./ActionMenu";
import RoleUpdateDropdown from "./RoleUpdateDropdown";
import AssignmentDropdown from "./AssignmentDropdown";
import { useRef } from "react";

export default function InstructorTableRow({ 
  instructor, 
  pin,
  loadingPin,
  revealed,
  onFetchPin,
  onTogglePin,
  onEdit, 
  onDelete, 
  onUpdateRole,
  onUnassign,
  actionMenuOpen,
  setActionMenuOpen,
  roleUpdateOpen,
  setRoleUpdateOpen,
  newRole,
  setNewRole,
  userRole,
  currentOrganizationId,
  canUpdateRoles,
  getRoleBadgeColor,
  getAvailableRoles,
  canViewPins
}) {
  const triggerButtonRef = useRef(null);

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
      <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
        {instructor.email || <span className="text-gray-500 italic">N/A</span>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
        {instructor.phone || <span className="text-gray-500 italic">N/A</span>}
      </td>
      <td className="px-4 py-3 text-sm whitespace-nowrap">
        <div className="flex items-center gap-2">
          {!canViewPins ? (
            <span className="text-xs text-gray-400">Restricted</span>
          ) : loadingPin ? (
            <span className="text-xs text-gray-400 animate-pulse">Loading...</span>
          ) : pin ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {revealed ? pin : '********'}
              </span>
              <button
                onClick={onTogglePin}
                className="p-1 text-primary-2 hover:text-primary-3 transition-colors"
                title={revealed ? 'Hide PIN' : 'Show PIN'}
              >
                {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          ) : (
            <button
              onClick={onFetchPin}
              className="px-3 py-1 text-xs bg-primary-2/20 text-primary-2 rounded-lg hover:bg-primary-2/30 transition-colors"
            >
              Fetch PIN
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
        <AssignmentDropdown instructor={instructor} />
      </td>
      <td className="px-4 py-3 text-sm whitespace-nowrap">
        <div className="flex justify-center">
          <button
            ref={triggerButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              setActionMenuOpen(actionMenuOpen === instructor.uid ? null : instructor.uid);
              setRoleUpdateOpen(null);
            }}
            className="p-2 rounded-xl hover:bg-primary-3/20 text-primary-2 hover:text-primary-3 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {actionMenuOpen === instructor.uid && (
            <ActionMenu
              instructor={instructor}
              triggerRef={triggerButtonRef}
              onEdit={(inst) => {
                onEdit(inst);
                setActionMenuOpen(null);
              }}
              onDelete={async (uid) => {
                await onDelete(uid);
                setActionMenuOpen(null);
              }}
              onUnassign={async (uid, name) => {
                await onUnassign(uid, name);
                setActionMenuOpen(null);
              }}
              userRole={userRole}
              currentOrganizationId={currentOrganizationId}
              onRoleUpdateClick={() => {
                setRoleUpdateOpen(instructor.uid);
                setNewRole(instructor.role || 'teacher');
              }}
              onClose={() => setActionMenuOpen(null)}
            />
          )}

          {canUpdateRoles && roleUpdateOpen === instructor.uid && (
            <RoleUpdateDropdown
              instructor={instructor}
              newRole={newRole}
              setNewRole={setNewRole}
              onUpdateRole={() => onUpdateRole(instructor.uid, newRole)}
              onCancel={() => {
                setRoleUpdateOpen(null);
                setNewRole("");
              }}
              getAvailableRoles={getAvailableRoles}
              userRole={userRole}
              triggerRef={triggerButtonRef}
            />
          )}
        </div>
      </td>
    </tr>
  );
}