"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Dashboard/SideBar";
import { useInstructors } from "@/hooks/useInstructors";
import { useInstructorActions } from "@/hooks/useInstructorActions";
import { Search, MoreVertical, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import InstructorModal from "@/components/Instructors/InstructorsModal";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { FiMenu, FiX } from "react-icons/fi";

export default function InstructorsPage() {
  const { organizationId } = useParams();
  const { instructors, loading, error, refetchInstructors } = useInstructors(organizationId);
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      setFetchError(null);
      try {
        const orgRef = collection(db, "organization");
        const orgSnapshot = await getDocs(orgRef);
        const orgs = orgSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || `Org ${doc.id.slice(0, 8)}`,
        }));
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
  }, [organizationId]);

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

  const filteredInstructors = instructors.filter((instructor) =>
    instructor.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      // Check if click is outside the action menu
      if (actionMenuOpen && !event.target.closest('.action-menu-container')) {
        setActionMenuOpen(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [actionMenuOpen]);

  if (isLoadingData) {
    return (
      <div className="flex h-screen bg-blue-50" style={{ height: "calc(var(--vh, 1vh) * 100)" }}>
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
            flex-1 transition-all duration-300 ease-in-out
            ${!isMobile && sidebarOpen ? "ml-64" : "ml-0"}
          `}
        >
          <div className="h-full p-4 sm:p-6 bg-blue-50">
            <div className="flex items-center gap-3 mb-6">
              {isMobile && !sidebarOpen && (
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-md shadow-sm bg-white"
                  aria-label="Open menu"
                >
                  <FiMenu className="w-5 h-5 text-indigo-600" />
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-800">Instructors</h1>
            </div>

            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading data...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex h-screen bg-blue-50" style={{ height: "calc(var(--vh, 1vh) * 100)" }}>
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
            flex-1 transition-all duration-300 ease-in-out
            ${!isMobile && sidebarOpen ? "ml-64" : "ml-0"}
          `}
        >
          <div className="h-full p-4 sm:p-6 bg-blue-50">
            <div className="flex items-center gap-3 mb-6">
              {isMobile && !sidebarOpen && (
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-md shadow-sm bg-white"
                  aria-label="Open menu"
                >
                  <FiMenu className="w-5 h-5 text-indigo-600" />
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-800">Instructors</h1>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 font-medium">{fetchError}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-blue-50" style={{ height: "calc(var(--vh, 1vh) * 100)" }}>
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
          flex-1 transition-all duration-300 ease-in-out
          ${!isMobile && sidebarOpen ? "ml-64" : "ml-0"}
        `}
      >
        <div className="h-full p-6 space-y-6 bg-blue-50 flex-1 overflow-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {isMobile && !sidebarOpen && (
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-md shadow-sm bg-white"
                  aria-label="Open menu"
                >
                  <FiMenu className="w-5 h-5 text-indigo-600" />
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-800">Instructors Management</h1>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            {/* Search Input - Improved Visibility */}
            <div className="relative w-full sm:w-auto sm:max-w-md">
              <input
                type="text"
                placeholder="Search instructors by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
                          focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400
                          bg-white text-gray-900 placeholder-gray-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>

            {/* Items per page selector - Improved Visibility */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 font-medium">Show:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm 
                          focus:outline-none focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400
                          bg-white text-gray-900 cursor-pointer"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="text-sm text-gray-700">per page</span>
            </div>
          </div>

          {loading && <p className="text-gray-500">Loading instructors...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {actionError && <p className="text-red-500">{actionError}</p>}

          {!loading && !error && (
            <>
              <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Organizations</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Projects</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Schools</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentInstructors.length > 0 ? (
                      currentInstructors.map((instructor) => (
                        <tr key={instructor.uid} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {instructor.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              instructor.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {instructor.role || 'teacher'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div className="flex justify-center">
                              <span className="font-semibold text-lg">{instructor.orgCount || 0}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div className="flex justify-center">
                              <span className="font-semibold text-lg">{instructor.projectCount || 0}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
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
                                className="p-2 rounded hover:bg-yellow-100 text-yellow-600 hover:text-yellow-700 transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              
                              {actionMenuOpen === instructor.uid && (
                                <div 
                                  className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-50 border border-yellow-200"
                                >
                                  <button
                                    onClick={() => handleEditInstructor(instructor)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors border-b border-gray-100"
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Update Assignment
                                  </button>
                                  <button
                                    onClick={() => handleDeleteInstructor(instructor.uid)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                          No instructors found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredInstructors.length)} of {filteredInstructors.length} instructors
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-50 hover:border-yellow-300 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 text-sm rounded border ${
                            currentPage === page
                              ? 'bg-yellow-500 text-white border-yellow-500 font-semibold'
                              : 'border-gray-300 hover:bg-yellow-50 hover:border-yellow-300 text-gray-700'
                          } transition-colors`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-50 hover:border-yellow-300 transition-colors"
                    >
                     <ChevronRight className="w-4 h-4 text-gray-800" />
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
          />
        </div>
      </div>
    </div>
  );
}