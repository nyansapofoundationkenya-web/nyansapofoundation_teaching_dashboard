import { Edit, Trash2, UserMinus } from "lucide-react";

export default function ActionMenu({ 
  instructor, 
  onEdit, 
  onDelete, 
  onUnassign,
  userRole,
  currentOrganizationId,
  onRoleUpdateClick 
}) {
  // Permission checks
  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin';
  const canUpdateRoles = isSuperAdmin;
  const canDeleteInstructor = isSuperAdmin;
  const canUnassign = isAdmin || isSuperAdmin;
  const canUpdateAssignment = isAdmin || isSuperAdmin;

  return (
    <div className="absolute right-0 mt-1 w-48 bg-background-light rounded-xl shadow-lg z-50 border border-primary-3/30">
      {/* Update Assignment - Admin & Super Admin */}
      {canUpdateAssignment && (
        <button
          onClick={() => onEdit(instructor)}
          className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-primary-3/20 hover:text-primary-3 transition-colors border-b border-gray-600"
        >
          <Edit className="w-4 h-4 mr-2" />
          Update Assignment
        </button>
      )}

      {/* Unassign/Remove from Organization - Admin & Super Admin, only if instructor has orgs */}
      {canUnassign && currentOrganizationId && instructor.orgCount > 0 && (
        <button
          onClick={() => onUnassign(instructor.uid, instructor.name)} //Pass uid and name as separate arguments
          className="flex items-center w-full px-4 py-2 text-sm text-amber-500 hover:bg-amber-500/20 hover:text-amber-400 transition-colors border-b border-gray-600"
        >
          <UserMinus className="w-4 h-4 mr-2" />
          Unassign from Org
        </button>
      )}

      {/* Update Role - Super Admin Only */}
      {canUpdateRoles && (
        <button
          onClick={onRoleUpdateClick}
          className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-primary-2/20 hover:text-primary-2 transition-colors border-b border-gray-600"
        >
          <Edit className="w-4 h-4 mr-2" />
          Update Role
        </button>
      )}

      {/* Delete Instructor - Super Admin Only */}
      {canDeleteInstructor && (
        <button
          onClick={() => onDelete(instructor.uid)}
          className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Instructor
        </button>
      )}
    </div>
  );
}