"use client";

import { Building2, FlaskConical } from "lucide-react";
import OrgCard from "./OrgCard";

export default function OrgGrid({
  isLoading,
  error,
  organizations,
  activeTab,
  searchQuery,
  formatDate,
  onOrgClick,
  onDeleteRequest,
  canDeleteOrganization,
  isSuperAdmin,
  isSandboxOrg,
  featureFirst = false,
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-44 bg-background-light rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4 px-4 py-3 rounded-xl text-sm bg-red-500/10 border border-red-500/30 text-red-400">
        Error: {error}
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-background-light flex items-center justify-center mb-4">
          {activeTab === "sandboxes"
            ? <FlaskConical size={24} className="text-blue-500/50" />
            : <Building2 size={24} className="text-gray-600" />}
        </div>
        <p className="text-sm text-gray-400">
          {searchQuery
            ? `No ${activeTab} match "${searchQuery}"`
            : activeTab === "sandboxes"
              ? "No sandbox environments available."
              : "No organizations available for your account."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-24">
      {organizations.map((org, index) => (
        <OrgCard
          key={org.id}
          org={org}
          isSandbox={isSandboxOrg(org)}
          formatDate={formatDate}
          onClick={() => onOrgClick(org)}
          onDelete={isSuperAdmin && canDeleteOrganization(org) ? () => onDeleteRequest(org) : null}
          canDelete={canDeleteOrganization(org)}
          isSuperAdmin={isSuperAdmin}
          featured={featureFirst && index === 0 && !searchQuery}
        />
      ))}
    </div>
  );
}