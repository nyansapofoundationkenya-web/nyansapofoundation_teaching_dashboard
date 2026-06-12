"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  FiAlertTriangle, FiCheckCircle, FiRotateCw, FiX,
  FiZap, FiChevronDown, FiChevronUp,
  FiDatabase, FiFile, FiInfo, FiTrash2,
} from "react-icons/fi";
import { ref, list, getMetadata } from "firebase/storage";
import { storage } from "@/firebase/config";
import { batchCheckResults } from "./audioLibrary.service";
import { BUCKET_FOLDERS, dayKey, parseFileName } from "./audioLibrary.constants";

// ── Orphan cache ──────────────────────────────────────────────
const CACHE_VERSION = "v1";

function cacheKey(start, end) {
  return `recon_orphans_${CACHE_VERSION}_${start}_${end}`;
}
function loadOrphanCache(start, end) {
  try {
    const raw = localStorage.getItem(cacheKey(start, end));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
function saveOrphanCache(start, end, orphans, scanProgress) {
  try {
    localStorage.setItem(
      cacheKey(start, end),
      JSON.stringify({ orphans, scanProgress, savedAt: Date.now() })
    );
  } catch { /* storage full */ }
}
function clearOrphanCache(start, end) {
  try { localStorage.removeItem(cacheKey(start, end)); } catch { /* ignore */ }
}

// ── Bulk retrigger — single backend call ──────────────────────
const RETRIGGER_URL = process.env.NEXT_PUBLIC_RETRIGGER_URL || "";

async function bulkRetrigger(orphans) {
  if (!RETRIGGER_URL) throw new Error("RETRIGGER_URL not configured");
  const res = await fetch(RETRIGGER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      files: orphans.map((f) => ({
        name:       f.fullPath,
        bucket:     f.bucket,
        generation: f.generation,
      })),
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json(); // { queued, failed, errors }
}

// ── Storage scan ──────────────────────────────────────────────
const SCAN_PAGE_SIZE = 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function scanPage(folderPath, pageToken) {
  const folderRef = ref(storage, folderPath);
  const result = await list(folderRef, {
    maxResults: SCAN_PAGE_SIZE,
    ...(pageToken ? { pageToken } : {}),
  });
  const settled = await Promise.allSettled(
    result.items.map(async (itemRef) => {
      const meta   = await getMetadata(itemRef);
      const parsed = parseFileName(itemRef.name);
      if (!parsed) return null;
      return {
        id: itemRef.name,
        ...parsed,
        uploadedAt: meta.timeCreated,
        size:       meta.size,
        fullPath:   itemRef.fullPath,
        generation: meta.generation,
        bucket:     meta.bucket,
        downloadURL: null,
      };
    })
  );
  return {
    files:         settled.map((r) => r.status === "fulfilled" ? r.value : null).filter(Boolean),
    nextPageToken: result.nextPageToken ?? null,
    hasMore:       !!result.nextPageToken,
    totalItems:    result.items.length,
  };
}

function dateRange(start, end) {
  const days = [];
  const cur  = new Date(start + "T00:00:00Z");
  const last = new Date(end   + "T00:00:00Z");
  while (cur <= last) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

// ── Sub-components ────────────────────────────────────────────
const StatBox = ({ label, value, color = "white" }) => (
  <div className="flex flex-col gap-1 bg-white/4 rounded-xl p-3 border border-white/5 min-w-[80px]">
    <span className={`text-xl font-bold tabular-nums ${
      color === "red"    ? "text-red-400"    :
      color === "green"  ? "text-[#4caf50]"  :
      color === "orange" ? "text-orange-400" :
      color === "blue"   ? "text-[#5aa2ce]"  : "text-white"
    }`}>{value ?? 0}</span>
    <span className="text-[10px] text-white/35 uppercase tracking-wider leading-tight">{label}</span>
  </div>
);

const ProgressBar = ({ value, max, color = "#f7cc1c" }) => (
  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
    <div
      className="h-full rounded-full transition-all duration-300"
      style={{ width: `${max ? Math.min(100, Math.round((value / max) * 100)) : 0}%`, background: color }}
    />
  </div>
);

const OrphanRow = ({ file, triggerState }) => {
  const icon = {
    idle:    <span className="w-2 h-2 rounded-full bg-white/15 flex-shrink-0" />,
    running: <span className="w-3 h-3 rounded-full border-2 border-[#f7cc1c]/30 border-t-[#f7cc1c] animate-spin flex-shrink-0" />,
    done:    <FiCheckCircle size={12} className="text-[#4caf50] flex-shrink-0" />,
    error:   <FiAlertTriangle size={12} className="text-red-400 flex-shrink-0" />,
  };
  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-xl border transition-all text-xs ${
      triggerState === "done"    ? "bg-[#4caf50]/6 border-[#4caf50]/15"  :
      triggerState === "error"   ? "bg-red-500/6 border-red-500/15"      :
      triggerState === "running" ? "bg-[#f7cc1c]/6 border-[#f7cc1c]/15" :
      "bg-white/3 border-white/5"
    }`}>
      <FiFile size={11} className="text-white/20 flex-shrink-0" />
      <span className="text-white/60 font-mono truncate flex-1 text-[11px]" title={file.id}>
        {file.studentId} · {file.type} · {file.content?.slice(0, 28)}{(file.content?.length ?? 0) > 28 ? "…" : ""}
      </span>
      <span className="text-white/25 flex-shrink-0 text-[10px]">{dayKey(file.uploadedAt)}</span>
      {icon[triggerState] ?? icon.idle}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
const ReconciliationPanel = ({ onClose }) => {
  const today = new Date().toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState("2026-05-26");
  const [endDate,   setEndDate]   = useState(today);
  const [phase,     setPhase]     = useState("idle");

  const [scanProgress,     setScanProgress]     = useState({ pages: 0, totalSeen: 0, matched: 0 });
  const [checkProgress,    setCheckProgress]    = useState({ done: 0, total: 0 });
  const [triggerProgress,  setTriggerProgress]  = useState({ queued: 0, failed: 0, total: 0 });

  const [orphans,       setOrphans]       = useState([]);
  const [triggerStates, setTriggerStates] = useState({});
  const [cacheInfo,     setCacheInfo]     = useState(null);
  const [error,         setError]         = useState(null);
  const [showOrphans,   setShowOrphans]   = useState(true);

  const abortRef = useRef(false);

  const isRunning     = ["scanning", "checking", "retriggering"].includes(phase);
  const queuedCount   = triggerProgress.queued;
  const failedCount   = triggerProgress.failed;

  // ── Load cache info on mount / date change ─────────────────
  useEffect(() => {
    const cached = loadOrphanCache(startDate, endDate);
    setCacheInfo(cached ? {
      savedAt: new Date(cached.savedAt).toLocaleString(),
      count:   cached.orphans.length,
    } : null);
  }, [startDate, endDate]);

  const loadFromCache = useCallback(() => {
    const cached = loadOrphanCache(startDate, endDate);
    if (!cached) return;
    setOrphans(cached.orphans);
    setScanProgress(cached.scanProgress);
    setTriggerStates(Object.fromEntries(cached.orphans.map((f) => [f.id, "idle"])));
    setTriggerProgress({ queued: 0, failed: 0, total: cached.orphans.length });
    setPhase("done");
  }, [startDate, endDate]);

  // ── STEP 1: Scan ───────────────────────────────────────────
  const runScan = useCallback(async () => {
    abortRef.current = false;
    setPhase("scanning");
    setError(null);
    setOrphans([]);
    setTriggerStates({});
    setTriggerProgress({ queued: 0, failed: 0, total: 0 });
    setScanProgress({ pages: 0, totalSeen: 0, matched: 0 });

    const days      = new Set(dateRange(startDate, endDate));
    const collected = [];
    let pageToken   = undefined;
    let pages       = 0;
    let totalSeen   = 0;

    try {
      while (!abortRef.current) {
        const { files, nextPageToken, hasMore, totalItems } =
          await scanPage(BUCKET_FOLDERS.literacy, pageToken);

        pages++;
        totalSeen += totalItems;
        for (const f of files) {
          if (days.has(dayKey(f.uploadedAt))) collected.push(f);
        }
        setScanProgress({ pages, totalSeen, matched: collected.length });
        if (!hasMore) break;
        pageToken = nextPageToken;
        await sleep(30);
      }

      if (abortRef.current) { setPhase("idle"); return; }
      if (!collected.length) { setPhase("done"); return; }

      await runCheck(collected, { pages, totalSeen, matched: collected.length });
    } catch (err) {
      console.error("[Reconciliation] scan error", err);
      setError(`Scan failed: ${err.message}`);
      setPhase("idle");
    }
  }, [startDate, endDate]);

  // ── STEP 2: Check ──────────────────────────────────────────
  const runCheck = async (files, finalScanProgress) => {
    setPhase("checking");
    setCheckProgress({ done: 0, total: files.length });

    const CHUNK      = 50;
    const allStatuses = {};

    for (let i = 0; i < files.length; i += CHUNK) {
      if (abortRef.current) break;
      const chunk = files.slice(i, i + CHUNK);
      setCheckProgress({ done: i, total: files.length });
      try {
        Object.assign(allStatuses, await batchCheckResults(chunk));
      } catch {
        chunk.forEach((f) => { allStatuses[f.id] = { status: "missing" }; });
      }
      await sleep(80);
    }

    setCheckProgress({ done: files.length, total: files.length });

    const found = files.filter((f) => {
      const s = allStatuses[f.id]?.status;
      return s === "missing" || s === "failed" || s === "unknown";
    });

    saveOrphanCache(startDate, endDate, found, finalScanProgress);
    setCacheInfo({ savedAt: new Date().toLocaleString(), count: found.length });

    setOrphans(found);
    setTriggerStates(Object.fromEntries(found.map((f) => [f.id, "idle"])));
    setTriggerProgress({ queued: 0, failed: 0, total: found.length });
    setPhase("done");
  };

  // ── STEP 3: Bulk retrigger — ONE backend call ──────────────
  const runRetrigger = useCallback(async () => {
    if (!orphans.length) return;
    abortRef.current = false;
    setPhase("retriggering");

    // Mark all running
    setTriggerStates(Object.fromEntries(orphans.map((f) => [f.id, "running"])));
    setTriggerProgress({ queued: 0, failed: 0, total: orphans.length });

    try {
      const { queued, failed, errors } = await bulkRetrigger(orphans);

      // Build error set from returned file paths
      const errorFiles = new Set(
        (errors || []).map((e) => e.file?.split("/").pop()?.replace(".wav", "") ?? "")
      );

      setTriggerStates(
        Object.fromEntries(
          orphans.map((f) => [f.id, errorFiles.has(f.id) ? "error" : "done"])
        )
      );
      setTriggerProgress({ queued, failed, total: orphans.length });

      if (failed === 0) {
        clearOrphanCache(startDate, endDate);
        setCacheInfo(null);
      }
    } catch (err) {
      console.error("[Reconciliation] bulk retrigger failed:", err);
      setError(`Bulk retrigger failed: ${err.message}`);
      setTriggerStates(Object.fromEntries(orphans.map((f) => [f.id, "error"])));
      setTriggerProgress((p) => ({ ...p, failed: orphans.length, queued: 0 }));
    }

    setPhase("done");
  }, [orphans, startDate, endDate]);

  // ─────────────────────────────────────────────────────────
  return (
    <div className="bg-[#142848] rounded-2xl border border-[#f7cc1c]/20 shadow-2xl shadow-black/40 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/6 bg-[#f7cc1c]/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#f7cc1c]/15 flex items-center justify-center border border-[#f7cc1c]/25">
            <FiZap size={15} className="text-[#f7cc1c]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Reconciliation</h2>
            <p className="text-[11px] text-white/35">Find & re-trigger orphaned audio files</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-colors p-1">
            <FiX size={16} />
          </button>
        )}
      </div>

      <div className="p-5 space-y-5">

        {/* Info */}
        <div className="flex items-start gap-2.5 rounded-xl p-3 bg-[#5aa2ce]/8 border border-[#5aa2ce]/20 text-[11px] text-[#5aa2ce]/80 leading-relaxed">
          <FiInfo size={13} className="flex-shrink-0 mt-0.5" />
          <span>
            Storage orders by <strong className="text-[#5aa2ce]">filename</strong>, not date —
            full scan required. Orphan results are cached locally.
            Retrigger sends all files in <strong className="text-[#5aa2ce]">one backend call</strong>.
          </span>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-3 flex-wrap">
          {[["From", startDate, setStartDate], ["To", endDate, setEndDate]].map(([label, val, set]) => (
            <div key={label} className="flex flex-col gap-1">
              <label className="text-[10px] text-white/35 uppercase tracking-wider">{label}</label>
              <input
                type="date" value={val}
                onChange={(e) => set(e.target.value)}
                disabled={isRunning}
                className="h-9 px-3 rounded-xl bg-white/6 text-white text-sm border border-white/10 focus:outline-none focus:border-[#f7cc1c]/50 disabled:opacity-40 transition-all [color-scheme:dark]"
              />
            </div>
          ))}
          {startDate && endDate && startDate <= endDate && (
            <span className="text-[11px] text-white/30 self-end pb-1">
              {dateRange(startDate, endDate).length} day(s)
            </span>
          )}
        </div>

        {/* Cache banner */}
        {cacheInfo && phase === "idle" && (
          <div className="flex items-center justify-between rounded-xl p-3 bg-[#4caf50]/8 border border-[#4caf50]/20 text-[11px]">
            <div className="flex items-center gap-2 text-[#4caf50]/80">
              <FiDatabase size={12} className="flex-shrink-0" />
              <span>
                Cached <strong className="text-[#4caf50]">{cacheInfo.savedAt}</strong> —{" "}
                <strong className="text-[#4caf50]">{cacheInfo.count}</strong> orphan{cacheInfo.count !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadFromCache}
                className="px-3 py-1 rounded-lg bg-[#4caf50]/20 text-[#4caf50] hover:bg-[#4caf50]/30 transition-all font-semibold text-[11px]"
              >
                Load cached
              </button>
              <button
                onClick={() => { clearOrphanCache(startDate, endDate); setCacheInfo(null); }}
                className="p-1 text-white/25 hover:text-red-400 transition-colors"
                title="Clear cache"
              >
                <FiTrash2 size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/25 flex items-center gap-2 text-red-400 text-xs">
            <FiAlertTriangle size={13} className="flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)}><FiX size={12} /></button>
          </div>
        )}

        {/* Scan progress */}
        {phase === "scanning" && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-[#f7cc1c]/30 border-t-[#f7cc1c] animate-spin" />
                Scanning Storage…
              </span>
              <span className="text-white/30 font-mono text-[11px]">
                {scanProgress.matched} matched · {scanProgress.totalSeen} seen · page {scanProgress.pages}
              </span>
            </div>
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div className="h-full bg-[#f7cc1c] rounded-full w-full animate-pulse" />
            </div>
          </div>
        )}

        {/* Check progress */}
        {phase === "checking" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-[#5aa2ce]/30 border-t-[#5aa2ce] animate-spin" />
                Checking Firestore…
              </span>
              <span className="text-white/30 font-mono">{checkProgress.done} / {checkProgress.total}</span>
            </div>
            <ProgressBar value={checkProgress.done} max={checkProgress.total} color="#5aa2ce" />
          </div>
        )}

        {/* Retrigger progress */}
        {phase === "retriggering" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-[#f7cc1c]/30 border-t-[#f7cc1c] animate-spin" />
                Sending to queue…
              </span>
              <span className="text-white/30 font-mono">{triggerProgress.total} files</span>
            </div>
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div className="h-full bg-[#f7cc1c] rounded-full w-full animate-pulse" />
            </div>
          </div>
        )}

        {/* Stats */}
        {phase === "done" && (
          <div className="flex gap-2 flex-wrap">
            <StatBox label="Pages scanned" value={scanProgress.pages}     color="blue" />
            <StatBox label="Total seen"    value={scanProgress.totalSeen} />
            <StatBox label="In range"      value={scanProgress.matched} />
            <StatBox label="Orphans"       value={orphans.length}         color={orphans.length > 0 ? "red" : "green"} />
            {queuedCount > 0 && <StatBox label="Enqueued" value={queuedCount} color="green" />}
            {failedCount > 0 && <StatBox label="Failed"   value={failedCount} color="orange" />}
          </div>
        )}

        {/* Orphan list */}
        {phase === "done" && orphans.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowOrphans((p) => !p)}
              className="w-full flex items-center justify-between text-xs text-white/50 hover:text-white/80 transition-colors py-1"
            >
              <span className="flex items-center gap-2">
                <FiDatabase size={12} className="text-red-400" />
                <span className="font-semibold text-red-400">
                  {orphans.length} orphaned file{orphans.length !== 1 ? "s" : ""}
                </span>
                <span className="text-white/25">missing from Firestore</span>
              </span>
              {showOrphans ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
            </button>
            {showOrphans && (
              <div className="space-y-1 max-h-64 overflow-y-auto rounded-xl border border-white/5 p-2 bg-white/2">
                {orphans.map((f) => (
                  <OrphanRow key={f.id} file={f} triggerState={triggerStates[f.id] ?? "idle"} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* All clean */}
        {phase === "done" && orphans.length === 0 && scanProgress.matched > 0 && (
          <div className="rounded-xl p-4 bg-[#4caf50]/8 border border-[#4caf50]/20 flex items-center gap-3 text-[#4caf50] text-sm">
            <FiCheckCircle size={16} className="flex-shrink-0" />
            All files in range have Firestore records — nothing to retrigger!
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {(phase === "idle" || phase === "done") && (
            <button
              onClick={runScan}
              disabled={!startDate || !endDate || startDate > endDate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5aa2ce]/20 text-[#5aa2ce] border border-[#5aa2ce]/30 hover:bg-[#5aa2ce]/30 active:scale-95 transition-all text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiRotateCw size={13} />
              {phase === "done" ? "Fresh scan" : "Start scan"}
            </button>
          )}

          {phase === "done" && orphans.length > 0 && queuedCount === 0 && (
            <button
              onClick={runRetrigger}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f7cc1c] text-[#142848] hover:bg-[#f7cc1c]/90 active:scale-95 transition-all text-xs font-bold shadow-md shadow-[#f7cc1c]/20"
            >
              <FiZap size={13} />
              Enqueue all {orphans.length} orphans
            </button>
          )}

          {isRunning && (
            <button
              onClick={() => { abortRef.current = true; }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/6 text-white/50 border border-white/10 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30 active:scale-95 transition-all text-xs font-semibold"
            >
              <FiX size={13} />
              Abort
            </button>
          )}

          {phase === "done" && queuedCount > 0 && failedCount === 0 && (
            <span className="flex items-center gap-2 text-xs text-[#4caf50] font-semibold">
              <FiCheckCircle size={13} />
              {queuedCount} files enqueued — Cloud Tasks is processing them
            </span>
          )}

          {phase === "done" && failedCount > 0 && (
            <button
              onClick={runRetrigger}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 active:scale-95 transition-all text-xs font-semibold"
            >
              <FiRotateCw size={13} />
              Retry {failedCount} failed
            </button>
          )}
        </div>

        {phase === "idle" && !cacheInfo && (
          <p className="text-[11px] text-white/20 leading-relaxed">
            Scans every Storage page, filters by date, checks Firestore.
            Orphans cached locally — use <strong className="text-white/30">Load cached</strong> to skip rescanning.
            All orphans enqueued in one call — no browser timeout risk.
          </p>
        )}

      </div>
    </div>
  );
};

export default ReconciliationPanel;