// app/dashboard/[organizationId]/household/page.jsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Settings2 } from "lucide-react";

import DashboardLayout from "../DashboardLayout";
import HouseholdMetrics from "@/components/Household/HouseholdMetrics";
import HouseholdFilters from "@/components/Household/HouseholdFilters";
import HouseholdList from "@/components/Household/HouseholdList";
import { useOrganizationHouseholds } from "@/hooks/useOrganizationHouseholds";
import { useProgressiveMetrics } from "@/hooks/household/useHouseholdMetrics";
import { useHouseholdExport } from "@/hooks/household/useHouseholdExport";

// Roles that can open the survey builder
const BUILDER_ROLES = ["super_admin", "admin", "project_manager"];

export default function HouseholdsPage() {
  const { organizationId } = useParams();
  const router = useRouter();
  const { user: currentUser } = useSelector((s) => s.auth);

  const canOpenBuilder = BUILDER_ROLES.includes(currentUser?.role);

  const [filters, setFilters] = useState({ county: "", searchQuery: "" });

  const { metrics } = useProgressiveMetrics(organizationId);

  const {
    households: rawHouseholds,
    loading: householdsLoading,
    error,
    hasMore,
    loadMore,
    resetAndReload,
    totalLoaded,
  } = useOrganizationHouseholds(organizationId, 20);

  const {
    exportToCSV,
    exportToExcel,
    isExporting,
    exportError,
    exportProgress,
  } = useHouseholdExport(organizationId);

  const filteredHouseholds = rawHouseholds.filter((household) => {
    const matchesCounty = !filters.county || household.county === filters.county;
    const matchesSearch =
      !filters.searchQuery ||
      household.householdHeadName?.toLowerCase().includes(filters.searchQuery.toLowerCase());
    return matchesCounty && matchesSearch;
  });

  const displayHouseholds = filteredHouseholds.map((hh) => ({
    id: hh.id,
    projectId: hh.projectId,
    schoolId: hh.schoolId,
    householdHead: hh.householdHeadName,
    county: hh.county,
    subCounty: hh.subCounty,
    children: hh.children?.length || 0,
    village: hh.village,
    members: hh.householdMembersCount || 0,
    organizationId: organizationId,
    interviewDate: hh.interviewDate
      ? new Date(hh.interviewDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "N/A",
  }));

  const handleFilterChange = useCallback(
    (newFilters) => {
      setFilters(newFilters);
      resetAndReload();
    },
    [resetAndReload]
  );

  const handleOpenSurveyBuilder = () => {
    router.push(`/dashboard/${organizationId}/surveys`);
  };

  if (error) {
    return (
      <div className="flex h-screen bg-background justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Data</h2>
          <p className="text-gray-300">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-2 rounded-lg hover:bg-primary-2/80 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Household"
      organizationId={organizationId}
      currentSection={"survey"}
    >
      <div className="space-y-6 max-w-7xl mx-auto w-full pb-8">
        {/* ── Header row with Survey Builder button (admins only) ── */}
        {canOpenBuilder && (
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">Household Surveys</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                Configure the questions respondents will see.
              </p>
            </div>
            <button
              onClick={handleOpenSurveyBuilder}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-3 text-primary-1 hover:bg-yellow-400 hover:shadow-md transition-all font-semibold text-sm whitespace-nowrap"
            >
              <Settings2 size={16} />
              Survey Builder
            </button>
          </div>
        )}

        {/* Metrics */}
        <HouseholdMetrics metrics={metrics} />

        {/* Export error */}
        {exportError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
            Export error: {exportError}
          </div>
        )}

        {/* Filters */}
        <HouseholdFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          organizationId={organizationId}
          exportToCSV={exportToCSV}
          exportToExcel={exportToExcel}
          isExporting={isExporting}
          exportProgress={exportProgress}
        />

        {/* Household list */}
        <InfiniteScrollList
          households={displayHouseholds}
          loading={householdsLoading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          organizationId={organizationId}
          totalLoaded={totalLoaded}
        />
      </div>
    </DashboardLayout>
  );
}

// Infinite Scroll Component (unchanged)
function InfiniteScrollList({ households, loading, hasMore, onLoadMore, organizationId, totalLoaded }) {
  const loaderRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    const currentLoaderRef = loaderRef.current;
    if (currentLoaderRef) observer.observe(currentLoaderRef);

    return () => {
      if (currentLoaderRef) observer.unobserve(currentLoaderRef);
    };
  }, [hasMore, loading, onLoadMore]);

  return (
    <div className="space-y-4">
      <HouseholdList
        households={households}
        loading={loading && households.length === 0}
        organizationId={organizationId}
      />

      {loading && households.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary-2 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-300">Loading more households...</span>
          </div>
        </div>
      )}

      {hasMore && !loading && households.length > 0 && (
        <div ref={loaderRef} className="flex justify-center py-4">
          <div className="text-gray-400 text-sm animate-pulse">
            Scroll down to load more
          </div>
        </div>
      )}

      {!hasMore && households.length > 0 && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-background-light rounded-full border border-gray-600">
            <span className="text-gray-400 text-sm">
              ✓ Loaded all {totalLoaded} households
            </span>
          </div>
        </div>
      )}

      {!loading && households.length === 0 && (
        <div className="text-center py-12 bg-background-light rounded-2xl border border-gray-600">
          <p className="text-gray-400">No households found matching your filters</p>
        </div>
      )}
    </div>
  );
}