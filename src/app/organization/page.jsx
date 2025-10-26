"use client";

import { useEffect, useState, useCallback } from "react";
import AddOrganizationButton from "@/components/Button/AddOrganizationButton";
import DemoOrganizationButton from "@/components/Button/DemoOrganizationButton";
import OrganizationButton from "@/components/Button/OrganizationButton";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizations } from "@/hooks/useOrganization";
import { useSelector } from "react-redux";

export default function OrganizationPage({
  onOrganizationSelect = () => {},
  onAddOrganization = () => {},
  onLogout = () => {},
}) {
  const router = useRouter();
  const { handleLogout } = useAuth();
  const { organizations, loading, error, handleFetchOrganizations, handleAddOrganization } =
    useOrganizations();
  
  // Get user data directly from Redux store
  const { user: currentUser, loading: userLoading } = useSelector((state) => state.auth);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [addingOrg, setAddingOrg] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

  // Fetch organizations when user is available
  useEffect(() => {
    if (currentUser?.uid && !dataFetched) {
      console.log("Fetching organizations for user:", currentUser.uid);
      handleFetchOrganizations().catch(err => {
        console.error("Fetch Organizations Error:", err);
      });
      setDataFetched(true);
    }
  }, [currentUser?.uid, dataFetched, handleFetchOrganizations]);

  // Filter organizations based on user role from Redux
  const getFilteredOrganizations = useCallback(() => {
    if (!currentUser || !organizations.length) return [];

    const userRole = currentUser.role;
    const userOrganizations = currentUser.organizations || [];

    switch (userRole) {
      case "teacher":
        return organizations.filter(org => 
          userOrganizations.some(userOrg => userOrg.id === org.id)
        );
      
      case "admin":
        return organizations.filter(org => 
          userOrganizations.some(userOrg => userOrg.id === org.id)
        );
      
      case "super_admin":
        return organizations;
      
      default:
        return organizations.filter(org => 
          userOrganizations.some(userOrg => userOrg.id === org.id)
        );
    }
  }, [currentUser, organizations]);

  const filteredOrganizations = getFilteredOrganizations();
  const userRole = currentUser?.role;
  const isAdmin = userRole === "super_admin";

  // Handle add organization
  const handleAddOrg = async () => {
    if (!newOrgName.trim()) {
      alert("Please enter an organization name");
      return;
    }

    try {
      setAddingOrg(true);
      await handleAddOrganization(newOrgName.trim());
      setNewOrgName("");
      setShowAddModal(false);
      // Reset data fetched flag to refresh data
      setDataFetched(false);
    } catch (err) {
      console.error("Error adding organization:", err);
      alert("Failed to add organization. Please try again.");
    } finally {
      setAddingOrg(false);
    }
  };

  const handleOrganizationClick = (organization) => {
    router.push(`/dashboard/${organization.id}/welcome`);
  };

  const handleDemoClick = () => {
    router.push("/dashboard/demo/welcome");
  };

  const handleLogoutClick = async () => {
    try {
      await handleLogout();
      onLogout();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Combined loading state - now using Redux loading state
  const isLoading = (loading || userLoading) && !dataFetched;

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white p-6">
      <header className="p-4 flex justify-between items-center">
        <div className="text-sm text-gray-400">
          {currentUser ? `Role: ${currentUser.role || 'No role assigned'}` : 'Loading role...'}
        </div>
        <button onClick={handleLogoutClick} className="hover:underline">
          Log out
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-6">
          {isAdmin ? "All Organizations" : "My Organizations"}
        </h1>

        {isLoading && (
          <p className="text-gray-400 mb-6">Loading organizations...</p>
        )}
        {error && <p className="text-red-500 mb-6">Error: {error}</p>}
        
        {!isLoading && filteredOrganizations.length === 0 && (
          <p className="text-gray-400 mb-6">
            {isAdmin 
              ? "No organizations found. Add a new one below." 
              : "No organizations available for your account."
            }
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4 w-full max-w-5xl">
          <div className="flex justify-center">
            <DemoOrganizationButton onClick={handleDemoClick} />
          </div>

          {filteredOrganizations.map((org) => (
            <div key={org.id} className="flex justify-center">
              <OrganizationButton
                name={org.name}
                onClick={() => handleOrganizationClick(org)}
              />
            </div>
          ))}

          {/* Show Add button only for admin users */}
          {isAdmin && (
            <div className="flex justify-center">
              <AddOrganizationButton onClick={() => setShowAddModal(true)} />
            </div>
          )}
        </div>
      </main>

      {/* Add Organization Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Organization</h2>
            
            <div className="mb-4">
              <label htmlFor="orgName" className="block text-sm font-medium text-gray-300 mb-2">
                Organization Name
              </label>
              <input
                id="orgName"
                type="text"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter organization name"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddOrg();
                  }
                }}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewOrgName("");
                }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                disabled={addingOrg}
              >
                Cancel
              </button>
              <button
                onClick={handleAddOrg}
                disabled={addingOrg || !newOrgName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingOrg ? "Adding..." : "Add Organization"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}