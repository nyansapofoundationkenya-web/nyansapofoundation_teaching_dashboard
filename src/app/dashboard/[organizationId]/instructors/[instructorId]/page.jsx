"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import DashboardLayout from "../../DashboardLayout";
import {
  ArrowLeft,
  Smartphone,
  Clock,
  Monitor,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  HardDrive,
  Layers,
  Activity,
  AlertCircle,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "N/A";
  const gb = bytes / 1024 ** 3;
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / 1024 ** 2).toFixed(0)} MB`;
}

function formatDuration(ms) {
  if (!ms && ms !== 0) return "0s";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function formatTime(iso) {
  if (!iso) return "N/A";
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function shortScreenName(full) {
  const parts = full?.split(".") ?? [];
  return parts[parts.length - 1]?.replace(/Page$/, "") || full;
}

function sessionDurationMs(start, end) {
  try { return new Date(end) - new Date(start); } catch { return 0; }
}

function toDateString(date) {
  return date.toISOString().split("T")[0];
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

// RAM / Storage bar — blue at low usage, yellow at high
function UsageBar({ label, freeBytes, totalBytes }) {
  const usedBytes = totalBytes - freeBytes;
  const pct = totalBytes ? Math.round((usedBytes / totalBytes) * 100) : 0;
  const barColor = pct > 80 ? "#f7cc1c" : pct > 60 ? "#5aa2ce" : "#5aa2ce";
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs text-foreground font-medium">
          {formatBytes(usedBytes)} <span className="text-gray-500">/ {formatBytes(totalBytes)}</span>
        </span>
      </div>
      <div className="h-1.5 bg-background rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      <p className="text-right text-[10px] text-gray-500 mt-0.5">{pct}% used</p>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, accent = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col gap-3 ${
        accent
          ? "bg-primary-2/10 border-primary-2/30"
          : "bg-background-light border-background-lighter"
      }`}
    >
      <div className="w-8 h-8 rounded-xl bg-background-lighter flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary-2" />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{label}</p>
      </div>
    </div>
  );
}

// ─── Session Card ─────────────────────────────────────────────────────────────

function SessionCard({ session, index }) {
  const [open, setOpen] = useState(false);

  const durationMs = sessionDurationMs(session.startTime, session.endTime);
  const totalScreenTime =
    session.screens_visited?.reduce((acc, s) => acc + (s.duration || 0), 0) ?? 0;

  // Group duplicate screen names
  const groupedScreens = (session.screens_visited ?? []).reduce((acc, s) => {
    const name = shortScreenName(s.screenName);
    if (acc[name]) {
      acc[name].duration += s.duration || 0;
      acc[name].visits += 1;
    } else {
      acc[name] = { duration: s.duration || 0, visits: 1, fullName: s.screenName };
    }
    return acc;
  }, {});
  const screenEntries = Object.entries(groupedScreens).sort((a, b) => b[1].duration - a[1].duration);

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-colors duration-150 ${
        open
          ? "border-primary-2/35 bg-background-light"
          : "border-background-lighter bg-background-light hover:border-primary-2/20"
      }`}
    >
      {/* Header row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
      >
        {/* Index badge */}
        <div className="shrink-0 w-9 h-9 rounded-xl bg-background-lighter border border-background-lighter flex flex-col items-center justify-center">
          <span className="text-[9px] text-gray-500 leading-none">S</span>
          <span className="text-sm font-bold text-primary-2 leading-none">{index + 1}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-foreground">
              {formatTime(session.startTime)}
            </span>
            <span className="text-gray-600 text-xs">→</span>
            <span className="text-sm font-semibold text-foreground">
              {formatTime(session.endTime)}
            </span>
            {/* Duration pill — yellow accent */}
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary-3/15 text-primary-3 border border-primary-3/25">
              {formatDuration(durationMs)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {screenEntries.length} unique screen{screenEntries.length !== 1 ? "s" : ""} &bull;{" "}
            {session.screens_visited?.length ?? 0} visits
          </p>
        </div>

        <div
          className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
            open ? "bg-primary-2/20 text-primary-2" : "bg-background-lighter text-gray-500"
          }`}
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Expanded body */}
      {open && (
        <div className="border-t border-background-lighter divide-y divide-background-lighter">
          {/* Device */}
          {session.deviceInfo && (
            <div className="px-5 py-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Device
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Model", value: session.deviceInfo.model },
                  { label: "OS", value: `${session.deviceInfo.osName} ${session.deviceInfo.osVersion}` },
                  { label: "App", value: session.deviceInfo.appVersion },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-background rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
                    <p className="text-xs font-semibold text-foreground truncate">{value ?? "N/A"}</p>
                  </div>
                ))}
              </div>
              <div className="bg-background rounded-xl px-4 py-3 space-y-3">
                <UsageBar
                  label="RAM"
                  freeBytes={session.deviceInfo.freeRAMinBytes}
                  totalBytes={session.deviceInfo.totalRAMinBytes}
                />
                <UsageBar
                  label="Storage"
                  freeBytes={session.deviceInfo.freeStorageInBytes}
                  totalBytes={session.deviceInfo.totalStorageInBytes}
                />
              </div>
            </div>
          )}

          {/* Screens */}
          {screenEntries.length > 0 && (
            <div className="px-5 py-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Screens Visited
              </p>
              <div className="space-y-2.5">
                {screenEntries.map(([name, data], i) => {
                  const pct = totalScreenTime > 0 ? (data.duration / totalScreenTime) * 100 : 0;
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-600 w-4 text-right shrink-0 font-mono">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="text-xs text-foreground/90 truncate"
                              title={data.fullName}
                            >
                              {name}
                            </span>
                            {data.visits > 1 && (
                              <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-primary-2/15 text-primary-2">
                                ×{data.visits}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-primary-2 shrink-0 ml-2 font-medium">
                            {formatDuration(data.duration)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-background rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: pct > 50 ? "#5aa2ce" : "#5aa2ce88",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Role helpers ─────────────────────────────────────────────────────────────

const ROLE_GRADIENTS = {
  super_admin: "from-red-500 to-red-600",
  admin: "from-purple-500 to-purple-600",
  project_manager: "from-orange-500 to-orange-600",
  school_head: "from-teal-500 to-teal-600",
  teacher: "from-blue-500 to-blue-600",
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function InstructorDetailsPage() {
  const { organizationId, instructorId } = useParams();
  const router = useRouter();

  const today = toDateString(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [instructor, setInstructor] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loadingInstructor, setLoadingInstructor] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    if (!instructorId) return;
    setLoadingInstructor(true);
    getDoc(doc(db, "user", instructorId))
      .then((snap) => {
        if (snap.exists()) setInstructor({ uid: snap.id, ...snap.data() });
        else setProfileError("Instructor not found.");
      })
      .catch(() => setProfileError("Failed to load instructor."))
      .finally(() => setLoadingInstructor(false));
  }, [instructorId]);

  useEffect(() => {
    if (!instructorId || !selectedDate) return;
    setLoadingAnalytics(true);
    setAnalyticsError(null);
    getDoc(doc(db, "user", instructorId, "user-analytics", selectedDate))
      .then((snap) => setSessions(snap.exists() ? snap.data().stats ?? [] : []))
      .catch(() => {
        setAnalyticsError("Failed to load analytics.");
        setSessions([]);
      })
      .finally(() => setLoadingAnalytics(false));
  }, [instructorId, selectedDate]);

  const dayStats = sessions.reduce(
    (acc, s) => {
      acc.totalScreens += s.screens_visited?.length ?? 0;
      acc.totalDuration += s.screens_visited?.reduce((a, sc) => a + (sc.duration || 0), 0) ?? 0;
      acc.sessions += 1;
      return acc;
    },
    { sessions: 0, totalScreens: 0, totalDuration: 0 }
  );

  const latestDevice = sessions.length > 0 ? sessions[sessions.length - 1].deviceInfo : null;
  const roleGradient = ROLE_GRADIENTS[instructor?.role] ?? "from-blue-500 to-blue-600";

  return (
    <DashboardLayout
      title="Instructor Details"
      organizationId={organizationId}
      currentSection="instructors"
    >
      <div className="max-w-3xl mx-auto space-y-5 pb-12">

        {/* ── Back ── */}
        <button
          onClick={() => router.back()}
          className="group inline-flex items-center gap-2 text-sm text-gray-400 hover:text-foreground transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-background-light border border-background-lighter flex items-center justify-center group-hover:border-primary-2/40 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          Back to Instructors
        </button>

        {/* ── Instructor hero ── */}
        {loadingInstructor ? (
          <div className="h-24 rounded-2xl bg-background-light border border-background-lighter animate-pulse" />
        ) : profileError ? (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
            <AlertCircle className="w-4 h-4 shrink-0" /> {profileError}
          </div>
        ) : instructor ? (
          <div className="relative overflow-hidden rounded-2xl border border-background-lighter bg-background-light">
            {/* Thin coloured top strip matching role */}
            <div className={`h-1 bg-gradient-to-r ${roleGradient}`} />
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4">
              {/* Avatar */}
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${roleGradient} flex items-center justify-center text-white text-xl font-bold shrink-0 shadow`}
              >
                {instructor.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold text-foreground uppercase tracking-wide">
                  {instructor.name || "Unnamed"}
                </h1>
                <p className="text-sm text-gray-400">{instructor.email || "No email"}</p>
                {instructor.phone && (
                  <p className="text-xs text-gray-500 mt-0.5">{instructor.phone}</p>
                )}
              </div>
              {/* Role badge */}
              <span
                className={`self-start sm:self-center shrink-0 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${roleGradient} text-white capitalize`}
              >
                {instructor.role || "teacher"}
              </span>
            </div>
          </div>
        ) : null}

        {/* ── Date picker ── */}
        <div className="flex items-center gap-3 bg-background-light border border-background-lighter rounded-2xl px-4 py-3">
          <Calendar className="w-4 h-4 text-primary-2 shrink-0" />
          <span className="text-sm text-gray-400">Analytics Date</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setSelectedDate((d) => addDays(d, -1))}
              className="w-8 h-8 rounded-xl bg-background-lighter hover:bg-primary-2/15 text-gray-400 hover:text-primary-2 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-background-lighter bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-2/40 transition-all"
            />
            <button
              onClick={() => setSelectedDate((d) => addDays(d, 1))}
              disabled={selectedDate >= today}
              className="w-8 h-8 rounded-xl bg-background-lighter hover:bg-primary-2/15 text-gray-400 hover:text-primary-2 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Day summary ── */}
        {!loadingAnalytics && sessions.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <StatCard icon={Activity} label="Sessions" value={dayStats.sessions} />
              <StatCard icon={Monitor} label="Screen Visits" value={dayStats.totalScreens} />
              <StatCard icon={Clock} label="Active Time" value={formatDuration(dayStats.totalDuration)} accent />
            </div>

            {/* Device overview */}
            {latestDevice && (
              <div className="bg-background-light border border-background-lighter rounded-2xl px-5 py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-primary-2" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Device
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {latestDevice.model} &bull; {latestDevice.osName} {latestDevice.osVersion} &bull; v{latestDevice.appVersion}
                  </span>
                </div>
                <UsageBar
                  label="RAM"
                  freeBytes={latestDevice.freeRAMinBytes}
                  totalBytes={latestDevice.totalRAMinBytes}
                />
                <UsageBar
                  label="Storage"
                  freeBytes={latestDevice.freeStorageInBytes}
                  totalBytes={latestDevice.totalStorageInBytes}
                />
              </div>
            )}
          </>
        )}

        {/* ── Sessions ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-primary-2" />
            <h2 className="text-sm font-semibold text-gray-300">
              Sessions on {selectedDate}
            </h2>
            {!loadingAnalytics && sessions.length > 0 && (
              <span className="ml-auto text-xs text-gray-500 bg-background-lighter px-2.5 py-1 rounded-full">
                {sessions.length} session{sessions.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {analyticsError && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-3">
              <AlertCircle className="w-4 h-4 shrink-0" /> {analyticsError}
            </div>
          )}

          {loadingAnalytics ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-background-light rounded-2xl border border-background-lighter animate-pulse"
                  style={{ opacity: 1 - i * 0.25 }}
                />
              ))}
            </div>
          ) : sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session, i) => (
                <SessionCard key={i} session={session} index={i} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 bg-background-light border border-background-lighter rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-background-lighter flex items-center justify-center mb-3">
                <Activity className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-400">
                No data for {selectedDate}
              </p>
              <p className="text-xs text-gray-500 mt-1">Try a different date</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}