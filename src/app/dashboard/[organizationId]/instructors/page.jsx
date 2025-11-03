"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import Sidebar from "@/components/Dashboard/SideBar";
import Header from "@/components/Dashboard/Header"; // Add Header import
import { useInstructors } from "@/hooks/useInstructors";
import { useInstructorActions } from "@/hooks/useInstructorActions";
import { Search, MoreVertical, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import InstructorModal from "@/components/Instructors/InstructorsModal";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { FiMenu, FiX } from "react-icons/fi";

export default function InstructorsPage() {
  const { organizationId } = useParams();
  // Get current user from Redux
  const { user: currentUser } = useSelector((state) => state.auth);
  const userRole = currentUser?.role;
  
  // Pass user role to useInstructors hook
  const { instructors, loading, error, refetchInstructors } = useInstructors(organizationId, userRole);
  const { 
    loading: actionLoading, 
    error: actionError, 
    deleteInstructor 
  } = useInstructorActions();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [initialOrganizations, setInitialOrganizations] = useState([]);
  const [initialSchools, setInitialSchools] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [roleUpdateOpen, setRoleUpdateOpen] = useState(null);
  const [newRole, setNewRole] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Check if user can update roles (only super_admin)
  const canUpdateRoles = userRole === 'super_admin';

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_admin':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm';
      case 'admin':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm';
      case 'teacher':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm';
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      setFetchError(null);
      try {
        const orgRef = collection(db, "organization");
        const orgSnapshot = await getDocs(orgRef);
        
        // Filter organizations based on user role
        let orgs = orgSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || `Org ${doc.id.slice(0, 8)}`,
        }));

        // If user is admin, only show their organization
        if (userRole === 'admin' && organizationId) {
          orgs = orgs.filter(org => org.id === organizationId);
        }
        // If user is super_admin, show all organizations

        setInitialOrganizations(orgs);

        if (organizationId) {
          const projectRef = collection(db, `organization/${organizationId}/projects`);
          const projectSnapshot = await getDocs(projectRef);
          const projectIds = projectSnapshot.docs.map((doc) => doc.id);

          let schools = [];
          for (const projectId of projectIds) {
            const schoolRef = collection(db, `organization/${organizationId}/projects/${projectId}/schools`);
            const schoolSnapshot = await getDocs(schoolRef);
            schools = schools.concat(
              schoolSnapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name || `School ${doc.id.slice(0, 8)}`,
                projectId,
              }))
            );
          }
          setInitialSchools(schools);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setFetchError("Failed to load organizations or schools.");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [organizationId, userRole]);

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Handle dynamic viewport height for mobile devices
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVh();
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Filtered instructors with search across name, email, and phone (without displaying email/phone)
  const filteredInstructors = useMemo(() => {
    return instructors.filter((instructor) =>
      instructor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [instructors, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredInstructors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInstructors = filteredInstructors.slice(startIndex, endIndex);

  const handleUpdateInstructor = (instructorId) => {
    console.log("Instructor updated with ID:", instructorId);
    setSelectedInstructor(null);
    setIsModalOpen(false);
    refetchInstructors();
  };

  const handleEditInstructor = (instructor) => {
    setSelectedInstructor(instructor);
    setIsModalOpen(true);
    setActionMenuOpen(null);
  };

  const handleDeleteInstructor = async (instructorId) => {
    if (!confirm('Are you sure you want to delete this instructor? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteInstructor(instructorId);
      setActionMenuOpen(null);
      refetchInstructors();
      alert('Instructor deleted successfully!');
    } catch (err) {
      alert(`Error deleting instructor: ${err.message}`);
    }
  };

  // Handle role update
  const handleUpdateRole = async (instructorId, role) => {
    if (!confirm(`Are you sure you want to update the role to ${role}?`)) {
      return;
    }

    try {
      const userRef = doc(db, "user", instructorId);
      await updateDoc(userRef, { role });
      setRoleUpdateOpen(null);
      setNewRole("");
      refetchInstructors();
      alert('Role updated successfully!');
    } catch (err) {
      console.error("Error updating role:", err);
      alert(`Error updating role: ${err.message}`);
    }
  };

  // Get available roles for dropdown (admin cannot set super_admin)
  const getAvailableRoles = () => {
    if (userRole === 'super_admin') {
      return [
        { value: 'super_admin', label: 'Super Admin' },
        { value: 'admin', label: 'Admin' },
        { value: 'teacher', label: 'Teacher' }
      ];
    } else {
      return [
        { value: 'admin', label: 'Admin' },
        { value: 'teacher', label: 'Teacher' }
      ];
    }
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setActionMenuOpen(null);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
    setActionMenuOpen(null);
  };

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuOpen && !event.target.closest('.action-menu-container')) {
        setActionMenuOpen(null);
      }
      if (roleUpdateOpen && !event.target.closest('.role-update-container')) {
        setRoleUpdateOpen(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [actionMenuOpen, roleUpdateOpen]);

  // Loading state
  if (isLoadingData) {
    return (
      <div className="flex h-screen bg-background" style={{ height: "calc(var(--vh, 1vh) * 100)" }}>
        {/* Mobile/iPad Overlay */}
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-30 z-40" onClick={toggleSidebar} />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {isMobile && sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="absolute top-4 right-4 z-50 p-2 rounded-full shadow-md bg-white"
              aria-label="Close menu"
            >
              <FiX className="w-5 h-5 text-indigo-600" />
            </button>
          )}
          <Sidebar title="Instructors" organizationId={organizationId} />
        </div>

        {/* Main Content */}
        <div
          className={`
            flex-1 transition-all duration-300 ease-in-out flex flex-col
            ${!isMobile && sidebarOpen ? "ml-64" : "ml-0"}
          `}
        >
          {/* Header */}
          <div className="flex-shrink-0 mx-4">
            <div className="flex items-center">
              {isMobile && !sidebarOpen && (
                <button
                  onClick={toggleSidebar}
                  className="p-2 mx-4 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  aria-label="Open menu"
                >
                  <FiMenu className="w-5 h-5" />
                </button>
              )}
              <div className="flex-1">
                <Header title="Instructors" />
              </div>
            </div>
          </div>

          {/* Loading Content */}
          <div className="flex-1 p-4 bg-background">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-3 mx-auto mb-4"></div>
                <p className="text-gray-300">Loading data...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <div className="flex h-screen bg-background" style={{ height: "calc(var(--vh, 1vh) * 100)" }}>
        {/* Mobile/iPad Overlay */}
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-30 z-40" onClick={toggleSidebar} />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {isMobile && sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="absolute top-4 right-4 z-50 p-2 rounded-full shadow-md bg-white"
              aria-label="Close menu"
            >
              <FiX className="w-5 h-5 text-indigo-600" />
            </button>
          )}
          <Sidebar title="Instructors" organizationId={organizationId} />
        </div>

        {/* Main Content */}
        <div
          className={`
            flex-1 transition-all duration-300 ease-in-out flex flex-col
            ${!isMobile && sidebarOpen ? "ml-64" : "ml-0"}
          `}
        >
          {/* Header */}
          <div className="flex-shrink-0 mx-4">
            <div className="flex items-center">
              {isMobile && !sidebarOpen && (
                <button
                  onClick={toggleSidebar}
                  className="p-2 mx-4 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  aria-label="Open menu"
                >
                  <FiMenu className="w-5 h-5" />
                </button>
              )}
              <div className="flex-1">
                <Header title="Instructors" />
              </div>
            </div>
          </div>

          {/* Error Content */}
          <div className="flex-1 p-4 bg-background">
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center">
              <p className="text-red-400 font-medium">{fetchError}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="flex h-screen bg-background" style={{ height: "calc(var(--vh, 1vh) * 100)" }}>
      {/* Mobile/iPad Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-30 z-40" onClick={toggleSidebar} />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {isMobile && sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="absolute top-4 right-4 z-50 p-2 rounded-full shadow-md bg-white"
            aria-label="Close menu"
          >
            <FiX className="w-5 h-5 text-indigo-600" />
          </button>
        )}
        <Sidebar title="Instructors" organizationId={organizationId} />
      </div>

      {/* Main Content */}
      <div
        className={`
          flex-1 transition-all duration-300 ease-in-out flex flex-col
          ${!isMobile && sidebarOpen ? "ml-64" : "ml-0"}
        `}
      >
        {/* Header */}
        <div className="flex-shrink-0 mx-4">
          <div className="flex items-center">
            {isMobile && !sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="p-2 mx-4 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Open menu"
              >
                <FiMenu className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1">
              <Header title="Instructors" />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 space-y-4 bg-background overflow-auto scrollbar-hide">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            {/* Search Input */}
            <div className="relative w-full sm:w-auto sm:max-w-md">
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-500 rounded-xl 
                          focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent
                          bg-background-lighter text-foreground placeholder-gray-400"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-foreground font-medium">Show:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(e.target.value)}
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
          </div>

          {loading && <p className="text-gray-300">Loading instructors...</p>}
          {error && <p className="text-red-400">{error}</p>}
          {actionError && <p className="text-red-400">{actionError}</p>}

          {!loading && !error && (
            <>
              {/* Mobile List View (md:hidden) */}
              <div className="md:hidden space-y-3">
                {currentInstructors.length > 0 ? (
                  currentInstructors.map((instructor) => (
                    <div key={instructor.uid} className="bg-background-light rounded-xl p-3 border border-gray-600">
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
                            <div 
                              className="absolute right-0 mt-1 w-48 bg-background-light rounded-xl shadow-lg z-50 border border-primary-3/30"
                            >
                              <button
                                onClick={() => handleEditInstructor(instructor)}
                                className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-primary-3/20 hover:text-primary-3 transition-colors border-b border-gray-600"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Update Assignment
                              </button>
                              
                              {/* Only show Update Role for super_admin */}
                              {canUpdateRoles && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActionMenuOpen(null);
                                    setRoleUpdateOpen(instructor.uid);
                                    setNewRole(instructor.role || 'teacher');
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-primary-2/20 hover:text-primary-2 transition-colors border-b border-gray-600"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Update Role
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleDeleteInstructor(instructor.uid)}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </button>
                            </div>
                          )}

                          {/* Role Update Dropdown - Only for super_admin */}
                          {canUpdateRoles && roleUpdateOpen === instructor.uid && (
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
                                  onClick={() => handleUpdateRole(instructor.uid, newRole)}
                                  className="flex-1 px-3 py-1 text-sm bg-primary-2 text-white rounded-lg hover:bg-primary-3 transition-colors"
                                >
                                  Update
                                </button>
                                <button
                                  onClick={() => {
                                    setRoleUpdateOpen(null);
                                    setNewRole("");
                                  }}
                                  className="flex-1 px-3 py-1 text-sm bg-gray-500 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-300">
                        <span>Orgs: <span className="font-semibold">{instructor.orgCount || 0}</span></span>
                        <span>Proj: <span className="font-semibold">{instructor.projectCount || 0}</span></span>
                        <span>Sch: <span className="font-semibold">{instructor.schoolCount || 0}</span></span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-sm text-gray-400">
                    No instructors found.
                  </div>
                )}
              </div>

              {/* Desktop Table View (hidden md:block) */}
              <div className="hidden md:block">
                <div className="bg-background-light rounded-xl shadow-lg border border-gray-600">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-background-lighter border-b border-gray-600">
                        <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Role</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Organizations</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Projects</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Schools</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentInstructors.length > 0 ? (
                        currentInstructors.map((instructor) => (
                          <tr key={instructor.uid} className="border-b border-gray-600 hover:bg-background-lighter/50">
                            <td className="px-4 py-3 text-sm font-medium text-foreground">
                              {instructor.name || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getRoleBadgeColor(instructor.role)}`}>
                                {instructor.role || 'teacher'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">
                              <div className="flex justify-center">
                                <span className="font-semibold text-lg">{instructor.orgCount || 0}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">
                              <div className="flex justify-center">
                                <span className="font-semibold text-lg">{instructor.projectCount || 0}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">
                              <div className="flex justify-center">
                                <span className="font-semibold text-lg">{instructor.schoolCount || 0}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
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
                                  <div 
                                    className="absolute right-0 mt-1 w-48 bg-background-light rounded-xl shadow-lg z-50 border border-primary-3/30"
                                  >
                                    <button
                                      onClick={() => handleEditInstructor(instructor)}
                                      className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-primary-3/20 hover:text-primary-3 transition-colors border-b border-gray-600"
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Update Assignment
                                    </button>
                                    
                                    {/* Only show Update Role for super_admin */}
                                    {canUpdateRoles && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActionMenuOpen(null);
                                          setRoleUpdateOpen(instructor.uid);
                                          setNewRole(instructor.role || 'teacher');
                                        }}
                                        className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-primary-2/20 hover:text-primary-2 transition-colors border-b border-gray-600"
                                      >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Update Role
                                      </button>
                                    )}
                                    
                                    <button
                                      onClick={() => handleDeleteInstructor(instructor.uid)}
                                      className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </button>
                                  </div>
                                )}

                                {/* Role Update Dropdown - Only for super_admin */}
                                {canUpdateRoles && roleUpdateOpen === instructor.uid && (
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
                                        onClick={() => handleUpdateRole(instructor.uid, newRole)}
                                        className="flex-1 px-3 py-1 text-sm bg-primary-2 text-white rounded-lg hover:bg-primary-3 transition-colors"
                                      >
                                        Update
                                      </button>
                                      <button
                                        onClick={() => {
                                          setRoleUpdateOpen(null);
                                          setNewRole("");
                                        }}
                                        className="flex-1 px-3 py-1 text-sm bg-gray-500 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                            No instructors found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-600">
                  <div className="text-sm text-gray-300">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredInstructors.length)} of {filteredInstructors.length} instructors
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl border border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-3/20 hover:border-primary-3 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-foreground" />
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
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
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl border border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-3/20 hover:border-primary-3 transition-colors"
                    >
                     <ChevronRight className="w-4 h-4 text-foreground" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <InstructorModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedInstructor(null);
            }}
            onSubmit={handleUpdateInstructor}
            schools={initialSchools}
            organizations={initialOrganizations}
            selectedInstructor={selectedInstructor}
            organizationId={organizationId}
            userRole={userRole}
          />
        </div>
      </div>
    </div>
  );
}