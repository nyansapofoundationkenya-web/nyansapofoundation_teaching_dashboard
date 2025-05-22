"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Dashboard/SideBar";
import { useInstructors } from "@/hooks/useInstructors"; // Adjust path as needed
import { Search } from "lucide-react"; // For search icon
import InstructorModal from "@/components/Instructors/InstructorsModal"; // Adjust path as needed
import { useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config"; // Adjust path as needed

export default function InstructorsPage() {
  const { organizationId } = useParams();
  const { instructors, loading, error } = useInstructors(organizationId);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [initialOrganizations, setInitialOrganizations] = useState([]);
  const [initialSchools, setInitialSchools] = useState([]);
  const [fetchCampsByIds] = useState(() => async (projectId, campIds) => {
    const campRef = collection(db, `organization/${organizationId}/projects/${projectId}/camps`);
    const snapshot = await getDocs(campRef);
    return snapshot.docs
      .filter((doc) => campIds.includes(doc.id))
      .map((doc) => ({ id: doc.id, ...doc.data() }));
  });

  useEffect(() => {
    const fetchOrganizations = async () => {
      const orgRef = collection(db, "organization");
      const snapshot = await getDocs(orgRef);
      setInitialOrganizations(
        snapshot.docs.map((doc) => ({ id: doc.id, name: doc.data().name || `Org ${doc.id.slice(0, 8)}` }))
      );
    };
    const fetchSchools = async () => {
      if (organizationId) {
        const schoolRef = collection(db, `organization/${organizationId}/projects/${organizationId}/schools`);
        const snapshot = await getDocs(schoolRef);
        setInitialSchools(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name || `School ${doc.id.slice(0, 8)}`,
            camps: doc.data().camps || [],
          }))
        );
      }
    };
    fetchOrganizations();
    fetchSchools();
  }, [organizationId]);

  // Filter instructors by name based on search term
  const filteredInstructors = instructors.filter((instructor) =>
    instructor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddInstructor = (instructorId) => {
    console.log("Instructor updated with ID:", instructorId);
    setSelectedInstructor(null); // Reset selected instructor after update
    // Optionally refetch instructors here if needed
  };

  const handleEditInstructor = (instructor) => {
    setSelectedInstructor(instructor);
    setIsModalOpen(true);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar title="Instructors" organizationId={organizationId} />

      <div className="p-6 space-y-6 bg-blue-50 flex-1 overflow-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Instructors</h1>
          <button
            // onClick={() => {
            //   setSelectedInstructor(null);
            //   setIsModalOpen(true);
            // }}
            className="text-sm px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded"
          >
            Export CSV
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search instructors by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        {/* Loading / Error */}
        {loading && <p className="text-gray-500">Loading instructors...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {/* Instructors Table */}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Phone</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Projects</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Manager</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstructors.length > 0 ? (
                  filteredInstructors.map((instructor) => {
                    const org = instructor.organizations?.find((org) => org.id === organizationId);
                    const isManager = org?.projects?.some((project) => project.is_manager) || false;

                    return (
                      <tr
                        key={instructor.uid}
                        className="border-t cursor-pointer hover:bg-gray-100"
                        onClick={() => handleEditInstructor(instructor)}
                      >
                        <td className="px-4 py-2 text-sm text-gray-600">{instructor.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{instructor.email}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{instructor.phone}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {org?.projects?.map((project) => project.name).join(", ") || "None"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {isManager ? "Yes" : "No"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-2 text-center text-sm text-gray-500">
                      No instructors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Instructor Modal */}
        <InstructorModal
  isOpen={isModalOpen}
  onClose={() => {
    setIsModalOpen(false);
    setSelectedInstructor(null);
  }}
  onSubmit={handleAddInstructor}
  schools={initialSchools}
  projectId={organizationId}
  fetchCampsByIds={fetchCampsByIds}
  organizations={initialOrganizations}
  selectedInstructor={selectedInstructor}
  organizationId={organizationId} // Add this prop
/>
      </div>
    </div>
  );
}