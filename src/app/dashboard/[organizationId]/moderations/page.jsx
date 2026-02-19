"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import Filter from "@/components/Moderations/Filter";
import Search from "@/components/Moderations/Search";
import AssessmentList from "@/components/Moderations/AssessmentList";
import AssessmentModal from "@/components/Moderations/AssessmentModal";
import { Plus } from "lucide-react";
import DashboardLayout from "../DashboardLayout";

export default function ModerationsPage() {
  const { organizationId } = useParams();
  const [filters, setFilters] = useState({
    projectId: null,
    schoolId: null,
    date: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { user: currentUser, loading: userLoading } = useSelector((state) => state.auth);
  const isAdminOrSuperAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleAddAssessment = () => {
    if (!isAdminOrSuperAdmin) return;
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <DashboardLayout title="Assessments" organizationId={organizationId} currentSection={"assessments"}>
      <div className="p-4 space-y-4">
        {/* Search + Add Button Row */}
        <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-1">
            <div className="flex-1 min-w-0 sm:min-w-[280px]">
              <Search onSearchChange={handleSearchChange} placeholder="Search assessment..." />
            </div>

            {/* Add Assessment Button */}
            {!userLoading && isAdminOrSuperAdmin && (
              <button
                onClick={handleAddAssessment}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-primary-3 hover:bg-primary-3/90 text-primary-1 font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Assessment
              </button>
            )}
          </div>
        </div>

        {/* Filter Section */}
        <div className="w-full">
          <Filter organizationId={organizationId} onFilterChange={handleFilterChange} />
        </div>

        {/* Assessment List */}
        <div className="bg-background">
          <AssessmentList
            organizationId={organizationId}
            filters={filters}
            searchQuery={searchQuery}
          />
        </div>
      </div>

      {/* Modal */}
      {!userLoading && isAdminOrSuperAdmin && isModalOpen && (
        <AssessmentModal organizationId={organizationId} onClose={handleModalClose} />
      )}
    </DashboardLayout>
  );
}