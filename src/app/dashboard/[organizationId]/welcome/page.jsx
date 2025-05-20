"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useOrganizations } from "@/hooks/useOrganization";
import Header from "@/components/Welcome/Header";
import DashboardLayout from "../DashboardLayout";
import GetStarted from "@/components/Welcome/GetStarted";
import HowItWorks from "@/components/Welcome/HowItWorks";
import RecentProjects from "@/components/Welcome/RecentProjects";

export default function WelcomePage() {
  const { organizationId } = useParams(); // extract org ID from the URL
  const { handleFetchOrganizationById } = useOrganizations();
  const [organization, setOrganization] = useState(null);

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const org = await handleFetchOrganizationById(organizationId);
        setOrganization(org);
      } catch (err) {
        console.error("Error fetching organization:", err);
      }
    };

    if (organizationId) {
      fetchOrg();
    }
  }, [organizationId]);

  return (
    <DashboardLayout organizationId={organizationId}>
      <div className="min-h-screen text-gray-800 flex flex-col items-center p-4 md:p-6">
        <Header organizationName={organization?.name || "Loading..."} />
        <main className="w-full max-w-6xl flex flex-col gap-8">
          <div className="bg-blue-50">
            <GetStarted organizationId={organizationId} />
            <hr className="border-t-2 border-gray-400 my-6 mx-6" />
            <HowItWorks />
          </div>
          <RecentProjects organizationId={organizationId}/>
        </main>
      </div>
    </DashboardLayout>
  );
}
