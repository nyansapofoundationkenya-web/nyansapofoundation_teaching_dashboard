"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import SchoolDetailContent from "@/components/Schools/SchoolDetailContent";
import { useSchools } from "@/hooks/useSchools";
import DashboardLayout from "@/app/dashboard/[organizationId]/DashboardLayout";

export default function SchoolDetailPage() {
  const { organizationId, projectId, schoolId } = useParams();
  const { getSchoolById, loading, error } = useSchools(organizationId);
  const [school, setSchool] = useState(null);

  useEffect(() => {
    const fetchSchool = async () => {
      if (organizationId && projectId && schoolId) {
        try {
          const schoolData = await getSchoolById(projectId, schoolId);
          setSchool(schoolData);
        } catch (err) {
          console.error("Error fetching school:", err);
        }
      }
    };

    fetchSchool();
  }, [organizationId, projectId, schoolId]);

  const handleSchoolUpdated = (updatedSchool) => {
    setSchool(updatedSchool);
  };

  // Loading State
  if (loading) {
    return (
      <DashboardLayout title="School Details" organizationId={organizationId}>
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-2 mx-auto mb-4"></div>
              <p className="text-gray-300">Loading school details...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error State
  if (error) {
    return (
      <DashboardLayout title="School Details" organizationId={organizationId}>
        <div className="p-4 sm:p-6">
          <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6 text-center">
            <p className="text-red-400 font-medium">Error loading school details</p>
            <p className="text-red-400/80 text-sm mt-2">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Main Content
  return (
    <DashboardLayout title="School Details" organizationId={organizationId}>
      <div className="p-4 sm:p-6">
        <SchoolDetailContent
          school={school}
          organizationId={organizationId}
          onSchoolUpdated={handleSchoolUpdated}
        />
      </div>
    </DashboardLayout>
  );
}