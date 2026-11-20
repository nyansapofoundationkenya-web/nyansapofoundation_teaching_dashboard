"use client";

import { useState } from "react";
import {
  Users, School, FolderKanban, GraduationCap,
  Calendar, ChevronRight, Building2, Trash2, FlaskConical,
  ClipboardList, UserCheck,
} from "lucide-react";
import { getOrganizationType } from "@/utils/OrgUtils";

// Classification → visual treatment map. Keep this in one place so the chip,
// the popover, and any future badge all agree on colors.
const TYPE_STYLES = {
  partner: {
    label: "Partner",
    idle: "bg-primary-3/15 text-primary-3 border-primary-3/30 hover:bg-primary-3/25",
  },
  testing: {
    label: "Testing",
    idle: "bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25",
  },
  sandbox: {
    label: "Sandbox",
    idle: "bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25",
  },
};

export default function OrgCard({
  org,
  isSandbox,
  formatDate,
  onClick,
  onDelete,
  canDelete,
  isSuperAdmin,
  onClassificationChange,
  onFeatureChange,
  featured = false,
}) {
  const [hovered, setHovered] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // "type" | null
  const [saving, setSaving] = useState(false);

  const stats = [
    { icon: Users, label: "Teachers", value: org.total_teachers || 0, color: "#f7cc1c" },
    { icon: School, label: "Schools", value: org.total_schools || 0, color: "#5aa2ce" },
    { icon: GraduationCap, label: "Students", value: org.total_students || 0, color: "#4caf50" },
    { icon: FolderKanban, label: "Projects", value: org.total_projects || 0, color: "#e67e22" },
  ];

  const currentType = getOrganizationType(org);           // "partner" | "testing" | "sandbox"
  const typeStyle = TYPE_STYLES[currentType] ?? TYPE_STYLES.partner;
  const takesSurveys = Boolean(org.takesSurveys);
  const takesAttendance = Boolean(org.takesAttendance);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete();
  };

  const handleTypeSelect = async (e, nextType) => {
    e.stopPropagation();
    if (nextType === currentType) { setOpenMenu(null); return; }
    setSaving(true);
    try {
      await onClassificationChange(org.id, nextType);
      setOpenMenu(null);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeature = async (e, key) => {
    e.stopPropagation();
    if (!onFeatureChange) return;
    setSaving(true);
    try {
      await onFeatureChange(org.id, { [key]: !org[key] });
    } finally {
      setSaving(false);
    }
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

      {/* Icon + delete/arrow */}
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

      {/* Name */}
      <h3 className={`font-bold text-foreground mb-2 truncate pr-16 ${featured ? "text-lg" : "text-base"}`}>
        {org.name}
      </h3>

      {/* ── Chip row: classification + feature toggles ──────────────────── */}
      {isSuperAdmin ? (
        <div
          className="flex flex-wrap items-center gap-1.5 mb-3"
          onClick={(e) => e.stopPropagation()}   // don't trigger card nav when clicking chips
        >
          {/* Classification chip + popover */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === "type" ? null : "type"); }}
              disabled={saving}
              className={`inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-semibold border transition-colors ${typeStyle.idle} ${saving ? "opacity-60" : ""}`}
              title="Change classification"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
              {typeStyle.label}
              <ChevronRight size={10} className="rotate-90 opacity-70" />
            </button>

            {openMenu === "type" && (
              <div className="absolute left-0 top-full mt-1 z-30 w-32 rounded-lg border border-background-lighter bg-background-light shadow-xl p-1">
                {Object.entries(TYPE_STYLES).map(([value, s]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={(e) => handleTypeSelect(e, value)}
                    disabled={saving}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                      value === currentType
                        ? "bg-background-lighter text-foreground"
                        : "text-gray-300 hover:bg-background-lighter hover:text-foreground"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${s.idle.split(" ")[1]}`} />
                    {s.label}
                    {value === currentType && <span className="ml-auto text-[10px] text-gray-500">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Survey toggle chip */}
          <FeatureChip
            icon={ClipboardList}
            label="Surveys"
            active={takesSurveys}
            activeClass="bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25"
            onClick={(e) => handleToggleFeature(e, "takesSurveys")}
            disabled={saving}
            title={takesSurveys ? "Takes surveys — click to disable" : "Does not take surveys — click to enable"}
          />

          {/* Attendance toggle chip */}
          <FeatureChip
            icon={UserCheck}
            label="Attendance"
            active={takesAttendance}
            activeClass="bg-sky-500/15 text-sky-300 border-sky-500/40 hover:bg-sky-500/25"
            onClick={(e) => handleToggleFeature(e, "takesAttendance")}
            disabled={saving}
            title={takesAttendance ? "Takes attendance — click to disable" : "Does not take attendance — click to enable"}
          />
        </div>
      ) : (
        // Non-super-admin: read-only badges, only shown when on
        (takesSurveys || takesAttendance) && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {takesSurveys && (
              <span className="inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <ClipboardList size={10} />
                Surveys
              </span>
            )}
            {takesAttendance && (
              <span className="inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                <UserCheck size={10} />
                Attendance
              </span>
            )}
          </div>
        )
      )}

      {/* Date */}
      <div className="flex items-center gap-1.5 mb-4">
        <Calendar size={11} className="text-gray-500" />
        <span className="text-xs text-gray-400">{formatDate(org.createdAt)}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-1 pt-3 mt-auto border-t border-background-lighter">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex flex-col items-center text-center gap-0.5">
            <Icon size={13} style={{ color }} />
            <span className="text-sm font-bold text-foreground">{value}</span>
            <span className="text-gray-400" style={{ fontSize: "10px" }}>{label}</span>
          </div>
        ))}
      </div>

      {featured && (
        <div className="mt-4 flex justify-end">
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

// ── Small reusable feature toggle chip ─────────────────────────────
function FeatureChip({ icon: Icon, label, active, activeClass, onClick, disabled, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-semibold border transition-colors ${
        active
          ? activeClass
          : "bg-background-lighter text-gray-400 border-gray-600 hover:text-foreground hover:border-gray-500"
      } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <Icon size={10} className={active ? "" : "opacity-60"} />
      {label}
    </button>
  );
}