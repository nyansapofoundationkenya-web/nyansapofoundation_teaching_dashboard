"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Dashboard/SideBar";
import { useInstructors } from "@/hooks/useInstructors";
import { Search } from "lucide-react";
import InstructorModal from "@/components/Instructors/InstructorsModal";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { FiMenu, FiX } from "react-icons/fi";

export default function InstructorsPage() {
  const { organizationId } = useParams();
  const { instructors, loading, error } = useInstructors(organizationId);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [initialOrganizations, setInitialOrganizations] = useState([]);
  const [initialSchools, setInitialSchools] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const fetchCampsByIds = async (projectId, campIds) => {
    try {
      const campRef = collection(db, `organization/${organizationId}/projects/${projectId}/camps`);
      const snapshot = await getDocs(campRef);
      return snapshot.docs
        .filter((doc) => campIds.includes(doc.id))
        .map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("Error fetching camps:", err);
      return [];
    }
  };

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
                camps: doc.data().camps || [],
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
    instructor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddInstructor = (instructorId) => {
    console.log("Instructor updated with ID:", instructorId);
    setSelectedInstructor(null);
    setIsModalOpen(false);
  };

  const handleEditInstructor = (instructor) => {
    setSelectedInstructor(instructor);
    setIsModalOpen(true);
  };

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
              <h1 className="text-2xl font-bold text-gray-800">Instructors</h1>
            </div>
            <button
              onClick={() => {
                setSelectedInstructor(null);
                setIsModalOpen(true);
              }}
              className="text-sm px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded"
            >
              Add Instructor
            </button>
          </div>

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

          {loading && <p className="text-gray-500">Loading instructors...</p>}
          {error && <p className="text-red-500">{error}</p>}

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
            organizationId={organizationId}
          />
        </div>
      </div>
    </div>
  );
}