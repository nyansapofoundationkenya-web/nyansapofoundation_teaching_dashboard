"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase/config";
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

  // ✅ Assessments state lives here — single source of truth
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user: currentUser, loading: userLoading } = useSelector((state) => state.auth);
  const isAdminOrSuperAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";
  const userRole = currentUser?.role;

  // ✅ Fetch lives in the page — role-aware, waits for auth
  const fetchAssessments = useCallback(async () => {
    if (!organizationId || !currentUser) return;

    setLoading(true);
    setError(null);
    try {
      if (userRole === "super_admin" || userRole === "admin") {
        let q = query(
          collection(db, "assessments"),
          where("organization_id", "==", organizationId)
        );
        if (filters.projectId) q = query(q, where("project_id", "==", filters.projectId));
        if (filters.schoolId) q = query(q, where("school_id", "==", filters.schoolId));

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setAssessments(data);
        return;
      }

      if (userRole === "project_manager") {
        const userOrg = (currentUser?.organizations || []).find((o) => o.id === organizationId);
        const assignedProjectIds = (userOrg?.projects || []).map((p) => p.id ?? p);
        if (!assignedProjectIds.length) { setAssessments([]); return; }

        let q = query(
          collection(db, "assessments"),
          where("organization_id", "==", organizationId)
        );
        if (filters.schoolId) q = query(q, where("school_id", "==", filters.schoolId));

        const snapshot = await getDocs(q);
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((a) => assignedProjectIds.includes(a.project_id));
        data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setAssessments(data);
        return;
      }

      // school_head & teacher
      const userOrg = (currentUser?.organizations || []).find((o) => o.id === organizationId);
      const assignedSchoolIds = (userOrg?.projects || []).flatMap((p) =>
        (p.schools || []).map((s) => s.id ?? s)
      );
      if (!assignedSchoolIds.length) { setAssessments([]); return; }

      const q = query(
        collection(db, "assessments"),
        where("organization_id", "==", organizationId)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((a) => assignedSchoolIds.includes(a.school_id));
      data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setAssessments(data);

    } catch (err) {
      console.error(err);
      setError("Failed to load assessments");
    } finally {
      setLoading(false);
    }
  }, [organizationId, currentUser, userRole, filters.projectId, filters.schoolId]);

  // ✅ Wait for auth before fetching; re-fetch when filters change
  useEffect(() => {
    if (!userLoading && currentUser) {
      fetchAssessments();
    }
  }, [fetchAssessments, userLoading, currentUser]);

  const handleFilterChange = (newFilters) => setFilters(newFilters);
  const handleSearchChange = (query) => setSearchQuery(query);

  const handleModalClose = () => {
    setIsModalOpen(false);
    // ✅ Refetch after modal closes so new assessment appears immediately
    fetchAssessments();
  };

  return (
    <DashboardLayout title="Assessments" organizationId={organizationId} currentSection={"assessments"}>
      <div className="p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-1">
            <div className="flex-1 min-w-0 sm:min-w-[280px]">
              <Search onSearchChange={handleSearchChange} placeholder="Search assessment..." />
            </div>
            {!userLoading && isAdminOrSuperAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-primary-3 hover:bg-primary-3/90 text-primary-1 font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Assessment
              </button>
            )}
          </div>
        </div>

        <div className="w-full">
          <Filter organizationId={organizationId} onFilterChange={handleFilterChange} />
        </div>

        {/* ✅ Pass all data as props — AssessmentList just renders */}
        <div className="bg-background">
          <AssessmentList
            organizationId={organizationId}
            filters={filters}
            searchQuery={searchQuery}
            assessments={assessments}
            loading={loading || userLoading}
            error={error}
            onRefresh={fetchAssessments}
          />
        </div>
      </div>

      {!userLoading && isAdminOrSuperAdmin && isModalOpen && (
        <AssessmentModal
          organizationId={organizationId}
          onClose={handleModalClose}  // ✅ triggers refetch on close
        />
      )}
    </DashboardLayout>
  );
}