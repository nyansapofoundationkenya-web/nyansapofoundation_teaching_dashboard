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
  onClassificationChange,
  onFeatureChange,          // --- NEW ---
  featureFirst = false,
  playStoreUrl,             // --- NEW ---
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
    const isEmptyFromSearch = Boolean(searchQuery);
    const emptyLabel = isEmptyFromSearch
      ? `No ${activeTab} match "${searchQuery}"`
      : activeTab === "sandboxes"
        ? "No sandbox environments available."
        : activeTab === "testing"
          ? "No testing organizations available."
          : "No partner organizations available.";

    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-background-light flex items-center justify-center mb-4">
          {activeTab === "sandboxes"
            ? <FlaskConical size={24} className="text-blue-500/50" />
            : <Building2 size={24} className="text-gray-600" />}
        </div>
        <p className="text-sm text-gray-400">{emptyLabel}</p>

        {/* Only show the app link when there are truly no orgs (not just no matches) */}
        {!isEmptyFromSearch && playStoreUrl && (
          <a
            href={playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-background-lighter border border-gray-600 text-sm font-semibold text-foreground hover:border-primary-3 hover:text-primary-3 transition-all"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M3.6 2.3c-.3.3-.5.7-.5 1.3v16.8c0 .6.2 1 .5 1.3l.1.1 9.4-9.4v-.2L3.7 2.2l-.1.1zm12.6 6.5L6.4 3.1l7.6 7.6 2.2-1.9zm0 6.4l-2.2-1.9-7.6 7.6 9.8-5.7zm3.9-2.9l-2.7-1.5-2.4 2.1 2.4 2.1 2.7-1.5c.8-.4.8-1.4 0-1.8l-.0.6z" />
            </svg>
            Download our Android app on Google Play
          </a>
        )}
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
          onClassificationChange={onClassificationChange}
          onFeatureChange={onFeatureChange}     // --- NEW ---
          featured={featureFirst && index === 0 && !searchQuery}
        />
      ))}
    </div>
  );
}