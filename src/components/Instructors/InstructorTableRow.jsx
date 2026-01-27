import { MoreVertical, Eye, EyeOff } from "lucide-react";
import ActionMenu from "./ActionMenu";
import RoleUpdateDropdown from "./RoleUpdateDropdown";

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
  canUpdateRoles, // ADD THIS
  getRoleBadgeColor,
  getAvailableRoles,
  canViewPins
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
              onUnassign={onUnassign}
              userRole={userRole}
              currentOrganizationId={currentOrganizationId}
              canUpdateRoles={canUpdateRoles} // ADD THIS
              onRoleUpdateClick={() => {
                setActionMenuOpen(null);
                setRoleUpdateOpen(instructor.uid);
                setNewRole(instructor.role || 'teacher');
              }}
            />
          )}

          {/* Only show RoleUpdateDropdown if user is super admin */}
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
              userRole={userRole}
            />
          )}
        </div>
      </td>
    </tr>
  );
}