"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "../DashboardLayout";
import OverviewCards from "@/components/Overview/OverviewCards";
import PerformanceAnalytics from "@/components/Overview/PerformanceAnalytics";
import FiltersDataManagement from "@/components/Overview/FiltersDataManagement";
import SchoolPerformance from "@/components/Overview/SchoolPerformance";
import DataQualityCompleteness from "@/components/Overview/DataQualityCompleteness";

export default function OverviewPage() {
  const { organizationId } = useParams();
  const [filters, setFilters] = useState({
    school: "",
    grade: "",
    gender: "",
    assessmentPeriod: "",
    startDate: "",
    endDate: ""
  });

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <DashboardLayout organizationId={organizationId}>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Performance Overview</h1>
            <p className="text-gray-300 mt-2">
              Comprehensive analytics and insights for your educational programs
            </p>
          </div>

          {/* Overview Cards */}
          <OverviewCards />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Average Scores per Grade */}
            <div className="h-full">
              <PerformanceAnalytics />
            </div>

            {/* Right Column - FILTERS & DATA MANAGEMENT */}
            <div className="h-full">
              <FiltersDataManagement 
                filters={filters} 
                onFilterChange={handleFilterChange} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Average Scores per School */}
            <div className="h-full">
              <SchoolPerformance />
            </div>

            {/* Right Column - DATA QUALITY & COMPLETENESS */}
            <div className="h-full">
              <DataQualityCompleteness />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
