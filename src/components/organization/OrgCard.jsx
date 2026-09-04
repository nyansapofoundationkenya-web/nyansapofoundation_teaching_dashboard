"use client";

import { useState } from "react";
import {
  Users, School, FolderKanban, GraduationCap,
  Calendar, ChevronRight, Building2, Trash2, FlaskConical,
} from "lucide-react";

/**
 * Single organization card.
 * Used by both StandardOrganizationsView and SuperAdminOrganizationsView so
 * the visual language of "an org" stays identical no matter who's looking.
 *
 * @param {boolean} featured - renders a wider "hero" variant (used for the
 *   first card in the standard view, mirroring the bento-style mockup).
 */
export default function OrgCard({
  org,
  isSandbox,
  formatDate,
  onClick,
  onDelete,
  canDelete,
  isSuperAdmin,
  featured = false,
}) {
  const [hovered, setHovered] = useState(false);

  const stats = [
    { icon: Users, label: "Teachers", value: org.total_teachers || 0, color: "#f7cc1c" },
    { icon: School, label: "Schools", value: org.total_schools || 0, color: "#5aa2ce" },
    { icon: GraduationCap, label: "Students", value: org.total_students || 0, color: "#4caf50" },
    { icon: FolderKanban, label: "Projects", value: org.total_projects || 0, color: "#e67e22" },
  ];

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete();
  };

  const cardBorder = isSandbox
    ? "border-blue-500/30 hover:border-blue-400/60"
    : "border-background-lighter hover:border-primary-3/50";

  const iconBg = isSandbox
    ? hovered ? "bg-blue-500/20" : "bg-blue-500/10"
    : hovered ? "bg-primary-3/20" : "bg-primary-3/10";

  const IconComponent = isSandbox ? FlaskConical : Building2;
  const iconColor = isSandbox ? "text-blue-400" : "text-primary-3";

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`rounded-2xl p-5 cursor-pointer transition-all duration-200 flex flex-col bg-background-light border ${cardBorder} hover:bg-background-lighter hover:-translate-y-0.5 hover:shadow-lg relative ${
        featured ? "sm:col-span-2 lg:col-span-2" : ""
      }`}
    >
      {isSandbox && (
        <span className="absolute top-3 right-10 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25 uppercase tracking-wide">
          Sandbox
        </span>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${iconBg} ${featured ? "w-12 h-12" : ""}`}>
          <IconComponent size={featured ? 20 : 18} className={iconColor} />
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <button
              onClick={handleDeleteClick}
              disabled={!canDelete}
              className={`p-1.5 rounded-lg transition-all ${
                canDelete
                  ? "text-red-500 hover:bg-red-500/10 hover:text-red-400"
                  : "text-gray-600 cursor-not-allowed"
              }`}
              title={canDelete ? "Delete" : "Cannot delete: Organization has existing data"}
            >
              <Trash2 size={16} />
            </button>
          )}
          <ChevronRight
            size={15}
            className={`${isSandbox ? "text-blue-400" : "text-primary-3"} transition-all duration-200 ${
              hovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
            }`}
          />
        </div>
      </div>

      <h3 className={`font-bold text-foreground mb-1 truncate pr-16 ${featured ? "text-lg" : "text-base"}`}>
        {org.name}
      </h3>

      <div className="flex items-center gap-1.5 mb-4">
        <Calendar size={11} className="text-gray-500" />
        <span className="text-xs text-gray-400">{formatDate(org.createdAt)}</span>
      </div>

      <div className={`grid grid-cols-4 gap-1 pt-3 mt-auto border-t border-background-lighter`}>
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex flex-col items-center text-center gap-0.5">
            <Icon size={13} style={{ color }} />
            <span className="text-sm font-bold text-foreground">{value}</span>
            <span className="text-gray-400" style={{ fontSize: "10px" }}>{label}</span>
          </div>
        ))}
      </div>

      {featured && (
        <div className={`mt-4 flex justify-end`}>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
            hovered ? "bg-primary-3 text-primary-1" : "bg-primary-3/10 text-primary-3"
          }`}>
            {isSandbox ? "Enter Sandbox" : "Enter Workspace"}
          </span>
        </div>
      )}
    </div>
  );
}