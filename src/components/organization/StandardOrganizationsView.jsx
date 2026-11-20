"use client";

import { User, LifeBuoy } from "lucide-react";
import { FiLogOut } from "react-icons/fi";
import OrgListControls from "./OrgListControls";
import OrgGrid from "./OrgGrid";
import { isSandboxOrg, canDeleteOrganization, formatDate } from "@/utils/OrgUtils";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.nyansapoai.naoassessment&pcampaignid=web_share";

export default function StandardOrganizationsView({
  currentUser,
  userLoading,
  realOrgs,
  partnerOrgs,
  testingOrgs,
  sandboxOrgs,
  filteredOrganizations,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  isLoading,
  error,
  onOrganizationClick,
  onProfileClick,
  onLogoutClick,
  onSupportClick,
}) {
  const hasOrganizations = realOrgs.length + sandboxOrgs.length > 0;

  const userName = userLoading ? "User" : currentUser?.name || "User";
  const greeting = hasOrganizations
    ? `Welcome back, ${userName}.`
    : `Welcome to Nyansapo, ${userName}.`;
  const subtext = hasOrganizations
    ? "Access your managed organizations and initiate new assessments below."
    : "It looks like this is your first time with Nao Assessments. Get started by exploring the platform or reaching out to support.";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="sticky top-0 z-20 bg-background pt-6 pb-3 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {userLoading ? (
                  <span className="inline-block w-32 h-5 bg-background-light rounded animate-pulse" />
                ) : (
                  currentUser?.name || "User"
                )}
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

          <div className="relative overflow-hidden rounded-2xl bg-background-light/80 backdrop-blur-sm border border-background-lighter p-5 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">{greeting}</h2>
              <p className="text-sm text-gray-300 max-w-2xl mt-1">{subtext}</p>

              {!hasOrganizations && (
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-background-lighter border border-gray-600 text-sm font-semibold text-foreground hover:border-primary-3 hover:text-primary-3 transition-all"
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
            <button
              onClick={onSupportClick}
              className="flex items-center gap-2 px-4 py-2 bg-primary-3 text-primary-1 font-bold rounded-xl hover:scale-105 transition-all shadow-lg shadow-secondary/10 whitespace-nowrap"
            >
              <LifeBuoy size={18} />
              <span>Support</span>
            </button>
          </div>

          <OrgListControls
            activeTab={activeTab}
            onTabChange={onTabChange}
            partnerCount={partnerOrgs.length}
            testingCount={testingOrgs.length}
            sandboxCount={sandboxOrgs.length}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            resultCount={filteredOrganizations.length}
          />
        </div>
      </div>

      <main className="flex-1 px-6 py-4 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <OrgGrid
            isLoading={isLoading && !filteredOrganizations.length}
            error={error}
            organizations={filteredOrganizations}
            activeTab={activeTab}
            searchQuery={searchQuery}
            formatDate={formatDate}
            onOrgClick={onOrganizationClick}
            onDeleteRequest={() => {}}
            canDeleteOrganization={canDeleteOrganization}
            isSuperAdmin={false}
            isSandboxOrg={isSandboxOrg}
            featureFirst
            playStoreUrl={PLAY_STORE_URL} // ← new prop
          />
        </div>
      </main>
    </div>
  );
}