// components/Welcome/DurationStats.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  Download,
  School,
  Building2,
  Globe,
  RefreshCw,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";

const REFRESH_URL =
  "https://us-east1-nyansapoai-v2.cloudfunctions.net/trigger_org_avg_duration_refresh";

// Set NEXT_PUBLIC_REPROCESS_SECRET in .env.local (restart the dev server after changing it).
const REPROCESS_SECRET = process.env.NEXT_PUBLIC_REPROCESS_SECRET;

// Raleway uses old-style figures by default; lining + tabular keeps numbers aligned.
const numStyle = { fontVariantNumeric: "lining-nums tabular-nums" };

const SCOPES = {
  organization: { label: "Organization", Icon: Globe },
  project: { label: "Project", Icon: Building2 },
  school: { label: "School", Icon: School },
};

const TYPES = {
  literacy: {
    label: "Literacy",
    activeBtn: "bg-primary-2 text-primary-1",
    text: "text-primary-2",
    bar: "bg-primary-2",
  },
  numeracy: {
    label: "Numeracy",
    activeBtn: "bg-secondary-2 text-primary-1",
    text: "text-secondary-2",
    bar: "bg-secondary-2",
  },
};

// ─── Formatting helpers ──────────────────────────────────────────────────────

const isNum = (v) => typeof v === "number" && Number.isFinite(v);

function formatDuration(ms) {
  if (!isNum(ms)) return "–";
  const totalSeconds = Math.round(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

function formatInt(n) {
  if (!isNum(n)) return "–";
  return new Intl.NumberFormat().format(Math.round(n));
}

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// ─── Main component ──────────────────────────────────────────────────────────

export default function DurationStats({
  organizationId,
  projectId = null,
  schoolId = null,
  scope = "organization", // "organization" | "project" | "school"
}) {
  const [durationStats, setDurationStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assessmentType, setAssessmentType] = useState("literacy");
  const [showRecalc, setShowRecalc] = useState(false);

  // Only super admins can recalculate. Checked here so every page that
  // renders this component (organization, project, school) is covered.
  const { user: currentUser } = useSelector((state) => state.auth);
  const canRecalculate =
    currentUser?.role === "super_admin" || currentUser?.role === "superadmin";

  const scopeMeta = SCOPES[scope] || SCOPES.organization;
  const typeMeta = TYPES[assessmentType];

  const fetchDurationStats = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);

    try {
      let path;
      if (scope === "school" && schoolId && projectId) {
        path = `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/stats/avg_duration_${assessmentType}`;
      } else if (scope === "project" && projectId) {
        path = `organization/${organizationId}/projects/${projectId}/stats/avg_duration_${assessmentType}`;
      } else {
        path = `organization/${organizationId}/stats/avg_duration_${assessmentType}`;
      }

      const snap = await getDoc(doc(db, path));
      const stats = snap.exists() ? snap.data()?.result?.stats : null;
      setDurationStats(stats || null);
    } catch (err) {
      console.error("Error fetching duration stats:", err);
      setDurationStats(null);
    } finally {
      setLoading(false);
    }
  }, [organizationId, projectId, schoolId, scope, assessmentType]);

  useEffect(() => {
    fetchDurationStats();
  }, [fetchDurationStats]);

  // ─── Derived values ────────────────────────────────────────────────────────

  const s = durationStats;
  const avgMs = s
    ? isNum(s.avg_duration_ms)
      ? s.avg_duration_ms
      : isNum(s.avg_duration_minutes)
      ? s.avg_duration_minutes * 60000
      : null
    : null;
  const minMs = s?.min_duration_ms;
  const maxMs = s?.max_duration_ms;
  const hasRange = isNum(minMs) && isNum(maxMs) && isNum(avgMs);
  const avgPct = hasRange
    ? maxMs === minMs
      ? 50
      : clamp(((avgMs - minMs) / (maxMs - minMs)) * 100, 0, 100)
    : 50;
  const avgMinutes = isNum(s?.avg_duration_minutes)
    ? s.avg_duration_minutes
    : isNum(avgMs)
    ? avgMs / 60000
    : null;

  // ─── Export ────────────────────────────────────────────────────────────────

  const downloadStats = () => {
    if (!s) return;

    const lines = [
      "ASSESSMENT DURATION STATISTICS",
      "================================",
      "",
      `Scope: ${scopeMeta.label} level`,
      `Assessment type: ${typeMeta.label}`,
      `Organization ID: ${organizationId}`,
      scope !== "organization" && projectId ? `Project ID: ${projectId}` : null,
      scope === "school" && schoolId ? `School ID: ${schoolId}` : null,
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "SUMMARY",
      "-------",
      `Total students: ${formatInt(s.total_students)}`,
      `Average duration: ${isNum(avgMinutes) ? avgMinutes.toFixed(2) : "–"} minutes (${formatDuration(avgMs)})`,
      `Average duration (ms): ${formatInt(s.avg_duration_ms)}`,
      "",
      "RANGE",
      "-----",
      `Fastest: ${formatDuration(minMs)}`,
      `Slowest: ${formatDuration(maxMs)}`,
      `Total time (all students): ${formatDuration(s.total_duration_ms)}`,
      "",
      `Time taken by students to complete ${typeMeta.label.toLowerCase()} assessments at the ${scopeMeta.label.toLowerCase()} level.`,
    ].filter((l) => l !== null);

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${assessmentType}_duration_stats_${scope}_${new Date()
      .toISOString()
      .split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <section className="rounded-2xl border border-white/10 bg-background-light p-5 sm:p-7">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Assessment duration
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-secondary-3/70">
            <scopeMeta.Icon size={15} className="text-primary-3" aria-hidden="true" />
            {scopeMeta.label} level
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="Assessment type"
            className="flex rounded-xl bg-background p-1"
          >
            {Object.entries(TYPES).map(([key, t]) => (
              <button
                key={key}
                type="button"
                onClick={() => setAssessmentType(key)}
                aria-pressed={assessmentType === key}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-3 ${
                  assessmentType === key
                    ? t.activeBtn
                    : "text-secondary-3/70 hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {canRecalculate && (
            <button
              type="button"
              onClick={() => setShowRecalc(true)}
              className="flex items-center gap-2 rounded-xl border border-white/15 px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary-3 hover:text-primary-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-3"
            >
              <RefreshCw size={14} aria-hidden="true" />
              Recalculate
            </button>
          )}
        </div>
      </div>

      {/* Average + range */}
      <div className="mt-7 rounded-xl bg-background p-5 sm:p-7">
        <p className="text-sm font-medium text-secondary-3/70">Average time to complete</p>

        <div
          className={`mt-2 flex items-baseline gap-3 ${loading ? "animate-pulse opacity-50" : ""}`}
        >
          <span
            className={`text-6xl font-light leading-none sm:text-7xl ${typeMeta.text}`}
            style={numStyle}
          >
            {isNum(avgMinutes) ? avgMinutes.toFixed(1) : "–"}
          </span>
          <span className="text-lg text-secondary-3/70">minutes</span>
        </div>

        <p className="mt-3 text-sm text-secondary-3/70" style={numStyle}>
          {s
            ? `${formatDuration(avgMs)} on average across ${formatInt(s.total_students)} students`
            : loading
            ? "Loading duration statistics…"
            : `No ${typeMeta.label.toLowerCase()} durations yet. They appear once students complete an assessment.`}
        </p>

        {/* Range track: fastest → slowest, with the average marked on it */}
        {hasRange && (
          <div className="mt-9">
            <div className="relative h-2 rounded-full bg-white/10">
              <div
                className={`absolute inset-y-0 left-0 rounded-full ${typeMeta.bar} opacity-40`}
                style={{ width: `${avgPct}%` }}
              />
              <span
                className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-background bg-primary-3"
                style={{ left: `${avgPct}%` }}
                aria-hidden="true"
              />
              <span
                className="absolute -top-8 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-primary-3"
                style={{ left: `${clamp(avgPct, 12, 88)}%`, ...numStyle }}
              >
                Average {formatDuration(avgMs)}
              </span>
            </div>
            <div className="mt-3 flex justify-between text-xs text-secondary-3/70" style={numStyle}>
              <span>
                Fastest <span className="font-semibold text-foreground">{formatDuration(minMs)}</span>
              </span>
              <span>
                Slowest <span className="font-semibold text-foreground">{formatDuration(maxMs)}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Key figures */}
      <dl className="mt-5 grid grid-cols-2 divide-x divide-white/10 rounded-xl border border-white/10 sm:grid-cols-4">
        <Figure label="Students" value={formatInt(s?.total_students)} />
        <Figure label="Fastest" value={formatDuration(minMs)} />
        <Figure label="Slowest" value={formatDuration(maxMs)} />
        <Figure label="Total time" value={formatDuration(s?.total_duration_ms)} />
      </dl>

      {/* Footer */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <details className="group text-sm text-secondary-3/70">
          <summary className="cursor-pointer select-none hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-3">
            Exact values
          </summary>
          <p className="mt-2 pl-1" style={numStyle}>
            {isNum(s?.avg_duration_seconds) ? s.avg_duration_seconds.toFixed(2) : "–"} seconds ·{" "}
            {formatInt(s?.avg_duration_ms)} ms average
          </p>
        </details>

        <button
          type="button"
          onClick={downloadStats}
          disabled={!s}
          className="flex items-center gap-2 rounded-xl bg-primary-2 px-4 py-2 text-sm font-semibold text-primary-1 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-3 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Download size={15} aria-hidden="true" />
          Download report
        </button>
      </div>

      {canRecalculate && showRecalc && (
        <RecalculateModal
          scope={scope}
          scopeLabel={scopeMeta.label}
          organizationId={organizationId}
          projectId={projectId}
          schoolId={schoolId}
          onClose={() => setShowRecalc(false)}
          onFinished={fetchDurationStats}
        />
      )}
    </section>
  );
}

// ─── Small pieces ────────────────────────────────────────────────────────────

function Figure({ label, value }) {
  return (
    <div className="px-4 py-4 [&:nth-child(n+3)]:border-t [&:nth-child(n+3)]:border-white/10 sm:[&:nth-child(n+3)]:border-t-0 sm:[&:nth-child(n+2)]:border-l-0">
      <dt className="text-xs font-medium text-secondary-3/70">{label}</dt>
      <dd className="mt-1 text-xl font-semibold text-foreground" style={numStyle}>
        {value}
      </dd>
    </div>
  );
}

function RecalculateModal({
  scope,
  scopeLabel,
  organizationId,
  projectId,
  schoolId,
  onClose,
  onFinished,
}) {
  const [status, setStatus] = useState("idle"); // idle | running | success | partial | error
  const [result, setResult] = useState(null);
  const running = status === "running";
  const finished = status === "success" || status === "partial" || status === "error";

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !running) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, onClose]);

  const start = async () => {
    if (running) return;

    if (!REPROCESS_SECRET) {
      setResult({
        httpStatus: -1,
        data: { error: "NEXT_PUBLIC_REPROCESS_SECRET is not set. Add it to .env.local and restart the app." },
      });
      setStatus("error");
      return;
    }

    setStatus("running");
    setResult(null);

    const payload = { organizationId, secret: REPROCESS_SECRET };
    if (scope !== "organization" && projectId) payload.projectId = projectId;
    if (scope === "school" && schoolId) payload.schoolId = schoolId;

    try {
      const res = await fetch(REFRESH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      setResult({ httpStatus: res.status, data });

      if (res.status === 401) {
        setStatus("error");
      } else if (res.ok && data.success !== false) {
        setStatus("success");
        onFinished?.();
      } else if (res.status === 207) {
        setStatus("partial");
        onFinished?.();
      } else {
        setStatus("error");
      }
    } catch (err) {
      setResult({ httpStatus: 0, data: { error: err.message } });
      setStatus("error");
    }
  };

  const errorText = () => {
    if (!result) return "";
    if (result.httpStatus === 401) return "The secret was rejected. Check that it matches the one set on the Cloud Function.";
    if (result.httpStatus === 0)
      return "The browser lost the connection before the function replied. The run may still be going: check the function logs, and see the browser console for a CORS error.";
    return result.data?.error || `Request failed (HTTP ${result.httpStatus}).`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !running) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recalc-title"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-background-light p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="recalc-title" className="text-lg font-semibold text-foreground">
              Recalculate duration stats
            </h3>
            <p className="mt-1 text-sm text-secondary-3/70">
              Rebuilds averages for this {scopeLabel.toLowerCase()} from every student result.
              This can take several minutes, so keep this window open.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={running}
            aria-label="Close"
            className="rounded-lg p-1 text-secondary-3/70 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-3 disabled:opacity-30"
          >
            <X size={18} />
          </button>
        </div>

        {scope !== "organization" && !finished && (
          <p className="mt-4 flex gap-2 rounded-lg bg-secondary-1/15 p-3 text-xs text-secondary-1">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            Project and organization averages may be affected when only part of the data is
            recalculated.
          </p>
        )}

        {running && (
          <p className="mt-4 flex items-center gap-2 text-sm text-primary-2">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Recalculating…
          </p>
        )}

        {status === "success" && (
          <div className="mt-5 flex gap-3 rounded-lg border border-secondary-2/40 bg-secondary-2/10 p-4 text-sm text-secondary-2">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div style={numStyle}>
              Stats rebuilt from {formatInt(result?.data?.totalResultsProcessed ?? 0)} results across{" "}
              {formatInt(result?.data?.assessmentsProcessed ?? 0)} assessments.
            </div>
          </div>
        )}

        {status === "partial" && (
          <div className="mt-5 rounded-lg border border-secondary-1/40 bg-secondary-1/10 p-4 text-sm text-secondary-1">
            <p className="flex gap-3" style={numStyle}>
              <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              {formatInt(result?.data?.totalResultsProcessed ?? 0)} results rebuilt,{" "}
              {formatInt(result?.data?.totalResultsFailed ?? 0)} failed. Totals may be incomplete.
            </p>
            {result?.data?.errors?.length > 0 && (
              <ul className="mt-3 max-h-28 space-y-1 overflow-y-auto pl-7 text-xs opacity-80">
                {result.data.errors.slice(0, 5).map((e, i) => (
                  <li key={i} className="truncate">
                    {e.assessmentId}
                    {e.resultId ? ` / ${e.resultId}` : ""}: {e.error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="mt-5 flex gap-3 rounded-lg border border-red-400/40 bg-red-400/10 p-4 text-sm text-red-300">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div>{errorText()}</div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          {status === "error" && (
            <button
              type="button"
              onClick={() => {
                setStatus("idle");
                setResult(null);
              }}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-primary-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-3"
            >
              Try again
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={running}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-secondary-3/80 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-3 disabled:opacity-30"
          >
            {finished ? "Close" : "Cancel"}
          </button>
          {!finished && (
            <button
              type="button"
              onClick={start}
              disabled={running}
              className="rounded-lg bg-primary-3 px-4 py-2 text-sm font-bold text-primary-1 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              Start recalculation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}