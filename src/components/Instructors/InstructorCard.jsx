// components/Instructors/InstructorCard.jsx
import { MoreVertical, Eye, EyeOff } from "lucide-react";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import ActionMenu from "./ActionMenu";
import RoleUpdateDropdown from "./RoleUpdateDropdown";
import AssignmentDropdown from "./AssignmentDropdown";

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
  onUnassign,
  actionMenuOpen,
  setActionMenuOpen,
  roleUpdateOpen,
  setRoleUpdateOpen,
  newRole,
  setNewRole,
  userRole,
  currentOrganizationId,
  getRoleBadgeColor,
  getAvailableRoles,
  canViewPins
}) {
  const triggerButtonRef = useRef(null);
  const router = useRouter();

  const handleCardClick = () => {
    // Don't navigate if an action menu or role dropdown is open
    if (actionMenuOpen === instructor.uid || roleUpdateOpen === instructor.uid) return;
    router.push(`/dashboard/${currentOrganizationId}/instructors/${instructor.uid}`);
  };

  return (
    <div
      className="bg-background-light rounded-xl p-3 border border-gray-600 cursor-pointer hover:border-primary-2/50 hover:bg-background-lighter/40 transition-colors"
      onClick={handleCardClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm truncate pr-2">
            {instructor.name || 'N/A'}
          </p>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(instructor.role)}`}>
            {instructor.role || 'teacher'}
          </span>
        </div>
        <div className="flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
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
              triggerRef={triggerButtonRef}
            />
          )}
        </div>
      </div>

      {/* Email & Phone */}
      <div className="mb-2 space-y-1">
        {instructor.email && (
          <p className="text-xs text-gray-400 truncate">
            <span className="text-gray-500">Email: </span>{instructor.email}
          </p>
        )}
        {instructor.phone && (
          <p className="text-xs text-gray-400 truncate">
            <span className="text-gray-500">Phone: </span>{instructor.phone}
          </p>
        )}
      </div>

      {/* PIN Section */}
      {canViewPins && (
        <div className="mb-3" onClick={(e) => e.stopPropagation()}>
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

      {/* Assignment Dropdown */}
      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
        <AssignmentDropdown instructor={instructor} />
      </div>
    </div>
  );
}