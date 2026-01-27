"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import DashboardLayout from "../DashboardLayout";
import { useInstructors } from "@/hooks/useInstructors";
import { useInstructorActions } from "@/hooks/useInstructorActions";
import { Search } from "lucide-react";
import InstructorModal from "@/components/Instructors/InstructorsModal";
import InstructorTable from "@/components/Instructors/InstructorTable";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { unassignInstructorFromOrganization } from "@/utils/instructorUtils"; // Add this import

export default function InstructorsPage() {
  const { organizationId } = useParams();
  const { user: currentUser } = useSelector((state) => state.auth);
  const userRole = currentUser?.role;
  
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
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [roleUpdateOpen, setRoleUpdateOpen] = useState(null);
  const [newRole, setNewRole] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const canUpdateRoles = userRole === 'super_admin';

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
        
        let orgs = orgSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || `Org ${doc.id.slice(0, 8)}`,
        }));

        if (userRole === 'admin' && organizationId) {
          orgs = orgs.filter(org => org.id === organizationId);
        }

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

  const filteredInstructors = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    
    if (query) {
      return instructors.filter((instructor) =>
        instructor.name?.toLowerCase().includes(query) ||
        instructor.email?.toLowerCase().includes(query) ||
        instructor.phone?.toLowerCase().includes(query)
      );
    }
    
    return instructors.filter((instructor) => {
      const hasOrganization = (instructor.orgCount || 0) > 0;
      return hasOrganization;
    });
  }, [instructors, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredInstructors.length / itemsPerPage);

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

  // NEW: Handle unassign instructor from organization
  const handleUnassignInstructor = async (instructorId, instructorName) => {
    if (!organizationId) {
      alert('No organization context available');
      return;
    }

    const confirmMessage = `Are you sure you want to remove ${instructorName} from this organization? This will remove all their projects and schools within this organization.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await unassignInstructorFromOrganization(instructorId, organizationId);
      setActionMenuOpen(null);
      refetchInstructors();
      alert('Instructor removed from organization successfully!');
    } catch (err) {
      console.error('Error unassigning instructor:', err);
      alert(`Error removing instructor: ${err.message}`);
    }
  };

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

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setActionMenuOpen(null);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
    setActionMenuOpen(null);
  };

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

  if (isLoadingData) {
    return (
      <DashboardLayout title="Instructors" organizationId={organizationId}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-3 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (fetchError) {
    return (
      <DashboardLayout title="Instructors" organizationId={organizationId}>
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400 font-medium">{fetchError}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Instructors" organizationId={organizationId}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
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
        </div>

        {error && <p className="text-red-400">{error}</p>}
        {actionError && <p className="text-red-400">{actionError}</p>}

        <InstructorTable
          instructors={filteredInstructors}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          onEditInstructor={handleEditInstructor}
          onDeleteInstructor={handleDeleteInstructor}
          onUnassignInstructor={handleUnassignInstructor} // Add this
          onUpdateRole={handleUpdateRole}
          actionMenuOpen={actionMenuOpen}
          setActionMenuOpen={setActionMenuOpen}
          roleUpdateOpen={roleUpdateOpen}
          setRoleUpdateOpen={setRoleUpdateOpen}
          newRole={newRole}
          userRole={userRole}
          setNewRole={setNewRole}
          canUpdateRoles={canUpdateRoles}
          getRoleBadgeColor={getRoleBadgeColor}
          getAvailableRoles={getAvailableRoles}
          currentOrganizationId={organizationId} // Add this
          searchQuery={searchTerm}
        />

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
    </DashboardLayout>
  );
}