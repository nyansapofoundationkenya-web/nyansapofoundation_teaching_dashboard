"use client";

import { useEffect } from "react";
import AddOrganizationButton from "@/components/Button/AddOrganizationButton";
import DemoOrganizationButton from "@/components/Button/DemoOrganizationButton";
import OrganizationButton from "@/components/Button/OrganizationButton";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizations } from "@/hooks/useOrganization";

export default function OrganizationPage({
  onOrganizationSelect = () => {},
  onAddOrganization = () => {},
  onLogout = () => {},
}) {
  const router = useRouter();
  const { handleLogout } = useAuth();
  const { organizations, loading, error, handleFetchOrganizations } =
    useOrganizations();

  useEffect(() => {
    const fetchData = async () => {
      try {
        await handleFetchOrganizations();
      } catch (err) {
        console.error("Fetch Organizations Error:", err);
      }
    };

    fetchData();
  }, [router]);

  // Updated to include organization ID in the route
  const handleOrganizationClick = (organization) => {
    router.push(`/dashboard/${organization.id}/welcome`);
  };

  //Updated demo click to route properly
  const handleDemoClick = () => {
    router.push("/dashboard/demo/welcome");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white p-6">
      <header className="p-4 flex justify-end">
        <button onClick={handleLogout} className="hover:underline">
          Log out
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-6">
          My Organizations, Choose One
        </h1>

        {loading && (
          <p className="text-gray-400 mb-6">Loading organizations...</p>
        )}
        {error && <p className="text-red-500 mb-6">Error: {error}</p>}
        {!loading && organizations.length === 0 && (
          <p className="text-gray-400 mb-6">
            No organizations available. Add a new one below.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4 w-full max-w-5xl">
          <div className="flex justify-center">
            <DemoOrganizationButton onClick={handleDemoClick} />
          </div>

          {organizations.map((org) => (
            <div key={org.id} className="flex justify-center">
              <OrganizationButton
                name={org.name}
                onClick={() => handleOrganizationClick(org)}
              />
            </div>
          ))}

          <div className="flex justify-center">
            <AddOrganizationButton onClick={onAddOrganization} />
          </div>
        </div>
      </main>
    </div>
  );
}
