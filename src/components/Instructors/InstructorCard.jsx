import { MoreVertical, Eye, EyeOff } from "lucide-react";
import ActionMenu from "./ActionMenu";
import RoleUpdateDropdown from "./RoleUpdateDropdown";

export default function InstructorCard({ 
  instructor, 
  pin,
  loadingPin,
  revealed,
  onFetchPin,
  onTogglePin,
  onEdit, 
  onDelete, 
  onUpdateRole,
  onUnassign,  // Add this prop
  actionMenuOpen,
  setActionMenuOpen,
  roleUpdateOpen,
  setRoleUpdateOpen,
  newRole,
  setNewRole,
  userRole,  // Add this prop
  currentOrganizationId, // Add this prop
  getRoleBadgeColor,
  getAvailableRoles,
  canViewPins
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
              onUnassign={onUnassign}
              userRole={userRole}
              currentOrganizationId={currentOrganizationId}
              onRoleUpdateClick={() => {
                setActionMenuOpen(null);
                setRoleUpdateOpen(instructor.uid);
                setNewRole(instructor.role || 'teacher');
              }}
            />
          )}

          {/* Only show RoleUpdateDropdown if user is super admin */}
          {userRole === 'super_admin' && roleUpdateOpen === instructor.uid && (
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
      </div>
      
      {/* PIN Section */}
      {canViewPins && (
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300">PIN:</span>
            <div className="flex items-center gap-2">
              {loadingPin ? (
                <span className="text-xs text-gray-400 animate-pulse">Loading...</span>
              ) : pin ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">
                    {revealed ? pin : '********'}
                  </span>
                  <button
                    onClick={onTogglePin}
                    className="p-1 text-primary-2 hover:text-primary-3 transition-colors"
                    title={revealed ? 'Hide PIN' : 'Show PIN'}
                  >
                    {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              ) : (
                <button
                  onClick={onFetchPin}
                  className="text-xs px-2 py-1 bg-primary-2/20 text-primary-2 rounded-lg hover:bg-primary-2/30 transition-colors"
                >
                  Fetch PIN
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between text-xs text-gray-300">
        <span>Orgs: <span className="font-semibold">{instructor.orgCount || 0}</span></span>
        <span>Proj: <span className="font-semibold">{instructor.projectCount || 0}</span></span>
        <span>Sch: <span className="font-semibold">{instructor.schoolCount || 0}</span></span>
      </div>
    </div>
  );
}