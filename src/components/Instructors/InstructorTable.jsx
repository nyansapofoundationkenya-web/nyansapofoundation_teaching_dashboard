"use client";

import { MoreVertical, Edit, Trash2, ChevronLeft, ChevronRight, Download, Eye, EyeOff } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

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
  getAvailableRoles,
  userRole, // Add userRole prop to check if admin/super_admin
  currentOrganizationId // Add current organization ID for reference
}) {
  // State for PINs and export functionality
  const [pins, setPins] = useState({});
  const [loadingPins, setLoadingPins] = useState({});
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [revealedPins, setRevealedPins] = useState({});

  // Check if user has permission to view PINs
  const canViewPins = userRole === 'admin' || userRole === 'super_admin';
  
  // Check if user has permission to export
  const canExport = userRole === 'admin' || userRole === 'super_admin';

  // Calculate currentInstructors FIRST using useMemo
  const currentInstructors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return instructors.slice(startIndex, endIndex);
  }, [instructors, currentPage, itemsPerPage]);

  // Function to fetch PIN for a specific instructor
  const fetchPin = async (uid) => {
    if (loadingPins[uid] || pins[uid]) return; // Don't fetch if already loading or fetched

    setLoadingPins(prev => ({ ...prev, [uid]: true }));

    try {
      const response = await fetch(`https://nyansapo-auth.vercel.app/api/auth/pin?uid=${uid}`);
      if (!response.ok) throw new Error('Failed to fetch PIN');

      const data = await response.json();
      setPins(prev => ({ ...prev, [uid]: data?.pin ?? 'N/A' }));
    } catch (error) {
      console.error('Error fetching PIN:', error);
      setPins(prev => ({ ...prev, [uid]: 'Error' }));
    } finally {
      setLoadingPins(prev => ({ ...prev, [uid]: false }));
    }
  };

  // Function to fetch all PINS for current page
  const fetchAllPins = () => {
    currentInstructors.forEach(instructor => {
      if (!pins[instructor.uid]) {
        fetchPin(instructor.uid);
      }
    });
  };

  // Toggle PIN visibility
  const togglePinVisibility = (uid) => {
    setRevealedPins(prev => ({
      ...prev,
      [uid]: !prev[uid]
    }));
  };

  // Function to export data - export all current instructors (already filtered by hook)
  const exportData = (format = 'csv') => {
    if (!canExport) {
      alert('You do not have permission to export data');
      return;
    }

    if (currentInstructors.length === 0) {
      alert('No instructors to export');
      return;
    }

    const exportData = currentInstructors.map(instructor => ({
      Name: instructor.name || 'N/A',
      Role: instructor.role || 'teacher',
      Email: instructor.email || 'N/A', // Only email, no phone
      PIN: pins[instructor.uid] || 'Not fetched',
      Organizations: instructor.orgCount || 0,
      Projects: instructor.projectCount || 0,
      Schools: instructor.schoolCount || 0,
    }));

    if (format === 'csv') {
      exportToCSV(exportData);
    } else if (format === 'excel') {
      exportToExcel(exportData);
    } else if (format === 'json') {
      exportToJSON(exportData);
    }
    
    setShowExportMenu(false);
  };

  // Helper functions for different export formats
  const exportToCSV = (data) => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(value => 
      `"${String(value).replace(/"/g, '""')}"` // Escape quotes
    ).join(','));
    const csvContent = [headers, ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `instructors_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = (data) => {
    // For Excel, we'll create a CSV with .xls extension
    // In a real app, you might want to use a library like xlsx
    exportToCSV(data); // Using CSV as a fallback
  };

  const exportToJSON = (data) => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }
    
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `instructors_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch all pins when currentInstructors changes
  useEffect(() => {
    fetchAllPins();
  }, [currentInstructors]);

  // Pagination calculations
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  return (
    <div className="space-y-4">
      {/* Export and Items per page controls */}
      <div className="flex flex-wrap justify-between items-center gap-4">
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

        {/* Export Button with Dropdown - Only show if user can export */}
        {canExport && (
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-2 text-white rounded-xl hover:bg-primary-3 transition-colors"
              disabled={currentInstructors.length === 0}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-background-light rounded-xl shadow-lg z-50 border border-primary-3/30">
                <button
                  onClick={() => exportData('csv')}
                  className="w-full px-4 py-2 text-sm text-foreground hover:bg-primary-3/20 hover:text-primary-3 transition-colors border-b border-gray-600 text-left"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => exportData('excel')}
                  className="w-full px-4 py-2 text-sm text-foreground hover:bg-primary-3/20 hover:text-primary-3 transition-colors border-b border-gray-600 text-left"
                >
                  Export as Excel
                </button>
                <button
                  onClick={() => exportData('json')}
                  className="w-full px-4 py-2 text-sm text-foreground hover:bg-primary-3/20 hover:text-primary-3 transition-colors text-left"
                >
                  Export as JSON
                </button>
              </div>
            )}
          </div>
        )}
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
                  pin={pins[instructor.uid]}
                  loadingPin={loadingPins[instructor.uid]}
                  revealed={revealedPins[instructor.uid]}
                  onFetchPin={() => fetchPin(instructor.uid)}
                  onTogglePin={() => togglePinVisibility(instructor.uid)}
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
                  canViewPins={canViewPins}
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
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground whitespace-nowrap">PIN</th>
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
                          pin={pins[instructor.uid]}
                          loadingPin={loadingPins[instructor.uid]}
                          revealed={revealedPins[instructor.uid]}
                          onFetchPin={() => fetchPin(instructor.uid)}
                          onTogglePin={() => togglePinVisibility(instructor.uid)}
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
                          canViewPins={canViewPins}
                        />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
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

// Updated Mobile Card Component with PIN
function InstructorCard({ 
  instructor, 
  pin,
  loadingPin,
  revealed,
  onFetchPin,
  onTogglePin,
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
      
      {/* PIN Section in Mobile Card - Only show if user can view PINs */}
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

// Updated Desktop Table Row Component with PIN
function InstructorTableRow({ 
  instructor, 
  pin,
  loadingPin,
  revealed,
  onFetchPin,
  onTogglePin,
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