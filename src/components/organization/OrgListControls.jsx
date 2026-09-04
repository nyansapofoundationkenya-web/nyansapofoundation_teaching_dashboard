"use client";

import { Search, Building2, FlaskConical } from "lucide-react";

export default function OrgListControls({
  activeTab,
  onTabChange,
  realCount,
  sandboxCount,
  searchQuery,
  onSearchChange,
  resultCount,
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => onTabChange("organizations")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "organizations"
              ? "bg-primary-3 text-primary-1 shadow"
              : "bg-background-light text-gray-400 hover:text-foreground"
          }`}
        >
          <Building2 size={14} />
          Organizations
          <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
            activeTab === "organizations" ? "bg-primary-1/20 text-primary-1" : "bg-background-lighter text-gray-400"
          }`}>
            {realCount}
          </span>
        </button>

        <button
          onClick={() => onTabChange("sandboxes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "sandboxes"
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow"
              : "bg-background-light text-gray-400 hover:text-foreground"
          }`}
        >
          <FlaskConical size={14} />
          Sandboxes
          <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
            activeTab === "sandboxes" ? "bg-blue-500/20 text-blue-300" : "bg-background-lighter text-gray-400"
          }`}>
            {sandboxCount}
          </span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background-light border border-gray-600 rounded-xl text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 transition-all"
          />
        </div>
        <div className={`px-3 py-2 rounded-xl shrink-0 border ${
          activeTab === "sandboxes"
            ? "bg-blue-500/10 border-blue-500/30"
            : "bg-primary-3/10 border-primary-3/30"
        }`}>
          <span className={`text-xs font-semibold ${activeTab === "sandboxes" ? "text-blue-400" : "text-primary-3"}`}>
            {resultCount} {resultCount === 1
              ? (activeTab === "sandboxes" ? "Sandbox" : "Org")
              : (activeTab === "sandboxes" ? "Sandboxes" : "Orgs")}
          </span>
        </div>
      </div>

      {searchQuery && (
        <p className="text-xs text-gray-400 mt-1.5 px-1">
          {resultCount === 0
            ? `No results for "${searchQuery}"`
            : `${resultCount} result${resultCount !== 1 ? "s" : ""} for "${searchQuery}"`}
        </p>
      )}
    </div>
  );
}