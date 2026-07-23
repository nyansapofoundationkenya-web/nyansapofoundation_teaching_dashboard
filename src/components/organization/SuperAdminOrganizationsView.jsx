"use client";

import {
  User, Users, Map as MapIcon, ScrollText, Settings,
  ArrowRight, Plus, Building2, ExternalLink,
} from "lucide-react";
import { FiLogOut } from "react-icons/fi";
import OrgListControls from "./OrgListControls";
import OrgGrid from "./OrgGrid";
import { isSandboxOrg, canDeleteOrganization, formatDate } from "@/utils/OrgUtils";

export default function SuperAdminOrganizationsView({
  currentUser,
  realOrgs,
  sandboxOrgs,
  filteredOrganizations,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  isLoading,
  error,
  onOrganizationClick,
  onAddClick,
  onDeleteRequest,
  onProfileClick,
  onLogoutClick,
  ecosystemStats, // { teachers, schools, students, projects }
  onNavigateUsers,
  onNavigateMapAssessments,
  onNavigateSystemLogs,
  onNavigateSettings,
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background pt-6 pb-3 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Global Administration</p>
              <h1 className="text-xl font-bold text-foreground">
                Welcome back, <span className="text-primary-3">{currentUser?.name || "Admin"}</span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onProfileClick}
                className="w-9 h-9 bg-primary-2 rounded-xl flex items-center justify-center hover:bg-primary-2/80 transition-all"
                title="Profile"
              >
                <User size={16} className="text-white" />
              </button>
              <button
                onClick={onLogoutClick}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-3 text-primary-1 hover:bg-yellow-400 hover:shadow-md transition-all font-semibold text-sm"
              >
                <FiLogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 px-6 py-2 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6 pb-24">

          {/* Admin action grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={onNavigateUsers}
              className="md:col-span-2 md:row-span-2 bg-background-light border border-background-lighter hover:border-primary-3/50 hover:-translate-y-0.5 transition-all rounded-2xl p-5 flex flex-col justify-between text-left group"
            >
              <div>
                <Users size={32} className="text-primary-3 mb-3" />
                <h3 className="text-lg font-bold text-foreground mb-1">User Management</h3>
                <p className="text-sm text-gray-400">
                  Oversee all administrators, teachers, and student accounts across the platform.
                </p>
              </div>
              <div className="flex items-center gap-2 text-primary-2 mt-4 group-hover:gap-3 transition-all">
                <span className="text-xs font-bold uppercase tracking-wide">Go to management</span>
                <ArrowRight size={16} />
              </div>
            </button>

            <button
              onClick={onNavigateMapAssessments}
              className="bg-background-light border border-background-lighter hover:border-primary-3/50 hover:-translate-y-0.5 transition-all rounded-2xl p-5 flex flex-col justify-between text-left"
            >
              <div>
                <div className="w-10 h-10 bg-primary-2/20 rounded-lg flex items-center justify-center mb-3">
                  <MapIcon size={16} className="text-primary-2" />
                </div>
                <h4 className="font-bold text-foreground text-sm">Map Assessments</h4>
                <p className="text-xs text-gray-400 mt-1">Visual tracking of literacy data.</p>
              </div>
              <ExternalLink size={16} className="text-primary-2 self-end mt-3" />
            </button>

            <button
              onClick={onNavigateSystemLogs}
              className="bg-background-light border border-background-lighter hover:border-primary-3/50 hover:-translate-y-0.5 transition-all rounded-2xl p-5 flex flex-col justify-between text-left"
            >
              <div>
                <div className="w-10 h-10 bg-primary-3/20 rounded-lg flex items-center justify-center mb-3">
                  <ScrollText size={16} className="text-primary-3" />
                </div>
                <h4 className="font-bold text-foreground text-sm">System Logs</h4>
                <p className="text-xs text-gray-400 mt-1">Review all critical audit events.</p>
              </div>
              <ExternalLink size={16} className="text-primary-2 self-end mt-3" />
            </button>

            <button
              onClick={onNavigateSettings}
              className="md:col-span-2 bg-background-light border border-background-lighter hover:border-primary-3/50 transition-all rounded-2xl p-5 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-background-lighter rounded-full flex items-center justify-center">
                  <Settings className="text-foreground" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">Global Platform Settings</h4>
                  <p className="text-xs text-gray-400">Configure environment variables and system-wide defaults.</p>
                </div>
              </div>
              <span className="bg-primary-2 text-white px-4 py-2 rounded-lg font-bold text-xs">CONFIGURE</span>
            </button>
          </div>

          {/* Organizations ecosystem banner */}
          <div className="rounded-2xl bg-gradient-to-br from-primary-2/30 to-background-light border border-background-lighter p-6">
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={16} className="text-primary-3" />
              <h2 className="text-lg font-bold text-foreground">
                Manage {realOrgs.length} Active Organization{realOrgs.length !== 1 ? "s" : ""}
              </h2>
            </div>
            <p className="text-sm text-gray-300 max-w-2xl mb-5">
              Monitor student reach and platform activity across every participating organization.
            </p>
            <button
              onClick={onAddClick}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-3 text-primary-1 hover:bg-yellow-400 hover:shadow-lg transition-all font-semibold text-sm"
            >
              <Plus size={16} /> Add Organization
            </button>
          </div>

          {/* Ecosystem stat strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-background-light rounded-xl p-4 border-l-4 border-l-primary-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Teachers</p>
              <p className="text-2xl font-bold text-foreground">{ecosystemStats.teachers}</p>
            </div>
            <div className="bg-background-light rounded-xl p-4 border-l-4 border-l-primary-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Schools</p>
              <p className="text-2xl font-bold text-foreground">{ecosystemStats.schools}</p>
            </div>
            <div className="bg-background-light rounded-xl p-4 border-l-4 border-l-green-500">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Students</p>
              <p className="text-2xl font-bold text-foreground">{ecosystemStats.students}</p>
            </div>
            <div className="bg-background-light rounded-xl p-4 border-l-4 border-l-orange-500">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Projects</p>
              <p className="text-2xl font-bold text-foreground">{ecosystemStats.projects}</p>
            </div>
          </div>

          {/* Tabs, search, grid */}
          <div>
            <OrgListControls
              activeTab={activeTab}
              onTabChange={onTabChange}
              realCount={realOrgs.length}
              sandboxCount={sandboxOrgs.length}
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              resultCount={filteredOrganizations.length}
            />

            <OrgGrid
              isLoading={isLoading && !filteredOrganizations.length}
              error={error}
              organizations={filteredOrganizations}
              activeTab={activeTab}
              searchQuery={searchQuery}
              formatDate={formatDate}
              onOrgClick={onOrganizationClick}
              onDeleteRequest={onDeleteRequest}
              canDeleteOrganization={canDeleteOrganization}
              isSuperAdmin
              isSandboxOrg={isSandboxOrg}
            />
          </div>
        </div>
      </main>
    </div>
  );
}