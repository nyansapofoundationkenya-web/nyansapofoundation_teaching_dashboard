"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  FiAlertTriangle, FiCheckCircle, FiRotateCw, FiX,
  FiZap, FiChevronDown, FiChevronUp,
  FiDatabase, FiFile, FiInfo, FiTrash2,
} from "react-icons/fi";
import { ref, list, getMetadata, getDownloadURL } from "firebase/storage";
import { storage } from "@/firebase/config";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { batchCheckResults } from "./audioLibrary.service";
import { BUCKET_FOLDERS, dayKey, parseFileName } from "./audioLibrary.constants";

// ── Constants ─────────────────────────────────────────────────
const ORPHANS_COLLECTION = "orphans";
const BATCH_SIZE         = 500; // files per Cloud Function call — safe under 540s timeout
const SCAN_PAGE_SIZE     = 1000;

const RETRIGGER_URL = (process.env.NEXT_PUBLIC_RETRIGGER_FUNCTION_URL || "").trim();

// ── Helpers ───────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Strip leading slashes so FOLDER_PREFIX check on the server never fails silently */
function sanitizePath(p) {
  return (p || "").replace(/^\/+/, "").trim();
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

// ── API calls ─────────────────────────────────────────────────

/**
 * Send one batch (≤ BATCH_SIZE files) to the Cloud Function bulk endpoint.
 * Returns { queued, failed, errors: [{file, error}] }
 */
async function retriggerBatch(files) {
  if (!RETRIGGER_URL) throw new Error("RETRIGGER_URL not configured");

  const payload = files.map((f) => ({
    name:       sanitizePath(f.fullPath),
    bucket:     f.bucket,
    generation: f.generation ?? "",
  }));

  const res = await fetch(RETRIGGER_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ files: payload }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `HTTP ${res.status}: ${res.statusText}`);
  }
  return data;
}

// ── Firestore helpers ─────────────────────────────────────────

async function saveOrphanToFirestore(file) {
  const orphanRef = doc(db, ORPHANS_COLLECTION, file.id);
  await setDoc(orphanRef, {
    id:           file.id,
    fullPath:     sanitizePath(file.fullPath), // sanitized at save time
    bucket:       file.bucket,
    generation:   file.generation,
    downloadURL:  file.downloadURL || null,
    assessmentId: file.assessmentId,
    studentId:    file.studentId,
    type:         file.type,
    content:      file.content,
    uploadedAt:   file.uploadedAt,
    createdAt:    serverTimestamp(),
  });
}

async function removeOrphanFromFirestore(fileId) {
  await deleteDoc(doc(db, ORPHANS_COLLECTION, fileId));
}

async function updateOrphanStatus(fileId, status, taskName = null, error = null) {
  await setDoc(
    doc(db, ORPHANS_COLLECTION, fileId),
    {
      requeueStatus:    status,
      requeueTask:      taskName || null,
      requeueError:     error || null,
      requeueUpdatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// ── Storage scan ──────────────────────────────────────────────

async function scanPage(folderPath, pageToken) {
  const folderRef = ref(storage, folderPath);
  const result    = await list(folderRef, {
    maxResults: SCAN_PAGE_SIZE,
    ...(pageToken ? { pageToken } : {}),
  });

  const settled = await Promise.allSettled(
    result.items.map(async (itemRef) => {
      const [meta, downloadURL] = await Promise.all([
        getMetadata(itemRef),
        getDownloadURL(itemRef),
      ]);
      const parsed = parseFileName(itemRef.name);
      if (!parsed) return null;
      return {
        id:         itemRef.name,
        ...parsed,
        downloadURL,
        uploadedAt: meta.timeCreated,
        size:       meta.size,
        fullPath:   sanitizePath(itemRef.fullPath), // sanitized at scan time
        generation: meta.generation,
        bucket:     meta.bucket,
      };
    })
  );

  return {
    files:         settled.map((r) => (r.status === "fulfilled" ? r.value : null)).filter(Boolean),
    nextPageToken: result.nextPageToken ?? null,
    hasMore:       !!result.nextPageToken,
    totalItems:    result.items.length,
  };
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

const OrphanRow = ({ file, triggerState, onRemove }) => {
  const icon = {
    idle:     <span className="w-2 h-2 rounded-full bg-white/15 flex-shrink-0" />,
    running:  <span className="w-3 h-3 rounded-full border-2 border-[#f7cc1c]/30 border-t-[#f7cc1c] animate-spin flex-shrink-0" />,
    enqueued: <FiCheckCircle size={12} className="text-[#4caf50] flex-shrink-0" />,
    done:     <FiCheckCircle size={12} className="text-[#4caf50] flex-shrink-0" />,
    error:    <FiAlertTriangle size={12} className="text-red-400 flex-shrink-0" />,
  };

  const statusLabel = {
    idle:     "idle",
    running:  "sending",
    enqueued: "enqueued",
    done:     "done",
    error:    "error",
  }[triggerState] || "idle";

  return (
    <div className={`flex flex-col gap-2 rounded-xl border p-3 transition-all text-xs ${
      triggerState === "done"     ? "bg-[#4caf50]/6 border-[#4caf50]/15"  :
      triggerState === "error"    ? "bg-red-500/6 border-red-500/15"      :
      triggerState === "running"  ? "bg-[#f7cc1c]/6 border-[#f7cc1c]/15" :
      triggerState === "enqueued" ? "bg-[#4caf50]/10 border-[#4caf50]/20" :
      "bg-white/3 border-white/5"
    }`}>
      <div className="flex items-center gap-3">
        <FiFile size={11} className="text-white/20 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-white/60 font-mono truncate" title={file.id}>
            {file.studentId} · {file.type} · {file.content?.slice(0, 28)}{(file.content?.length ?? 0) > 28 ? "…" : ""}
          </div>
          <div className="text-white/30 text-[10px] truncate">
            {file.assessmentId} · {dayKey(file.uploadedAt)}
          </div>
          {triggerState === "error" && file.requeueError && (
            <div className="text-red-400/70 text-[10px] truncate mt-0.5" title={file.requeueError}>
              {file.requeueError}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40 uppercase tracking-[0.08em]">{statusLabel}</span>
          <button
            onClick={() => onRemove(file.id)}
            className="p-1 text-white/20 hover:text-red-400 transition-colors"
            title="Remove from orphans"
          >
            <FiTrash2 size={11} />
          </button>
          {icon[triggerState] ?? icon.idle}
        </div>
      </div>
    </div>
  );
};

// ── Main panel ────────────────────────────────────────────────

const ReconciliationPanel = ({ onClose }) => {
  const today = new Date().toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState("2026-05-26");
  const [endDate,   setEndDate]   = useState(today);
  const [phase,     setPhase]     = useState("idle");

  const [scanProgress,    setScanProgress]    = useState({ pages: 0, totalSeen: 0, matched: 0 });
  const [checkProgress,   setCheckProgress]   = useState({ done: 0, total: 0 });
  const [triggerProgress, setTriggerProgress] = useState({ queued: 0, failed: 0, total: 0, batch: 0, batches: 0 });

  const [orphans,       setOrphans]       = useState([]);
  const [triggerStates, setTriggerStates] = useState({});
  const [error,         setError]         = useState(null);
  const [showOrphans,   setShowOrphans]   = useState(true);
  const [loadingStored, setLoadingStored] = useState(true);

  const abortRef = useRef(false);

  const isRunning   = ["scanning", "checking", "retriggering"].includes(phase);
  const queuedCount = triggerProgress.queued;
  const failedCount = triggerProgress.failed;

  // ── Load stored orphans from Firestore on mount ────────────
  useEffect(() => {
    let unsub;
    setLoadingStored(true);

    try {
      const q = query(collection(db, ORPHANS_COLLECTION));
      unsub = onSnapshot(q, (snapshot) => {
        const stored = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setOrphans(stored);
        setTriggerStates(Object.fromEntries(stored.map((f) => [f.id, "idle"])));
        setTriggerProgress({ queued: 0, failed: 0, total: stored.length, batch: 0, batches: 0 });
        setLoadingStored(false);
      }, (err) => {
        console.error("[Reconciliation] Firestore listener error:", err);
        setError("Failed to load stored orphans");
        setLoadingStored(false);
      });
    } catch (err) {
      console.error("[Reconciliation] load error:", err);
      setLoadingStored(false);
    }

    return () => { if (unsub) unsub(); };
  }, []);

  // ── STEP 1: Scan storage ───────────────────────────────────
  const runScan = useCallback(async () => {
    abortRef.current = false;
    setPhase("scanning");
    setError(null);
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

      await runCheck(collected);
    } catch (err) {
      console.error("[Reconciliation] scan error", err);
      setError(`Scan failed: ${err.message}`);
      setPhase("idle");
    }
  }, [startDate, endDate]);

  // ── STEP 2: Check Firestore & save orphans ─────────────────
  const runCheck = async (files) => {
    setPhase("checking");
    setCheckProgress({ done: 0, total: files.length });

    const CHUNK       = 50;
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

    for (const orphan of found) {
      try {
        await saveOrphanToFirestore(orphan);
      } catch (err) {
        console.error("[Reconciliation] Failed to save orphan:", orphan.id, err);
      }
    }

    setPhase("done");
  };

  // ── STEP 3: Batched bulk retrigger ─────────────────────────
  // Splits orphans into chunks of BATCH_SIZE (500) and sends each
  // chunk as one HTTP call to the Cloud Function. This keeps every
  // request well under the 540s timeout even at 5000 files.
  const runRetrigger = useCallback(async () => {
    if (!orphans.length) return;
    abortRef.current = false;
    setPhase("retriggering");
    setError(null);

    // Split into batches
    const batches = [];
    for (let i = 0; i < orphans.length; i += BATCH_SIZE) {
      batches.push(orphans.slice(i, i + BATCH_SIZE));
    }

    // Mark all files as "running" upfront
    setTriggerStates(Object.fromEntries(orphans.map((f) => [f.id, "running"])));
    setTriggerProgress({ queued: 0, failed: 0, total: orphans.length, batch: 0, batches: batches.length });

    let totalQueued = 0;
    let totalFailed = 0;
    const allErrors = []; // [{ file: sanitizedPath, error: string }]

    for (let b = 0; b < batches.length; b++) {
      if (abortRef.current) break;

      try {
        const result = await retriggerBatch(batches[b]);
        totalQueued += result.queued  ?? 0;
        totalFailed += result.failed  ?? 0;
        allErrors.push(...(result.errors ?? []));
      } catch (err) {
        // Entire batch HTTP call failed — mark all files in it as failed
        totalFailed += batches[b].length;
        batches[b].forEach((f) =>
          allErrors.push({ file: sanitizePath(f.fullPath), error: err.message })
        );
      }

      setTriggerProgress({
        queued:  totalQueued,
        failed:  totalFailed,
        total:   orphans.length,
        batch:   b + 1,
        batches: batches.length,
      });
    }

    // Build error lookup keyed by sanitized path
    const errorMap = Object.fromEntries(
      allErrors.map((e) => [sanitizePath(e.file), e.error])
    );

    // Resolve per-file UI state
    const newStates = {};
    for (const orphan of orphans) {
      const path = sanitizePath(orphan.fullPath);
      newStates[orphan.id] = errorMap[path] ? "error" : "enqueued";
    }
    setTriggerStates(newStates);

    // Persist final status back to Firestore
    await Promise.allSettled(
      orphans.map((orphan) => {
        const errMsg = errorMap[sanitizePath(orphan.fullPath)] ?? null;
        return updateOrphanStatus(orphan.id, errMsg ? "error" : "enqueued", null, errMsg);
      })
    );

    if (totalFailed > 0) {
      setError(`${totalFailed} file${totalFailed !== 1 ? "s" : ""} failed — see list for details.`);
    }

    setPhase("done");
  }, [orphans]);

  // ── Remove single orphan ───────────────────────────────────
  const handleRemoveOrphan = useCallback(async (fileId) => {
    try {
      await removeOrphanFromFirestore(fileId);
      setTriggerStates((prev) => {
        const next = { ...prev };
        delete next[fileId];
        return next;
      });
    } catch (err) {
      console.error("[Reconciliation] Failed to remove orphan:", fileId, err);
      setError(`Failed to remove orphan: ${err.message}`);
    }
  }, []);

  // ── Clear all orphans ──────────────────────────────────────
  const handleClearAll = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, ORPHANS_COLLECTION));
      await Promise.all(snapshot.docs.map((d) => deleteDoc(doc(db, ORPHANS_COLLECTION, d.id))));
    } catch (err) {
      console.error("[Reconciliation] Failed to clear orphans:", err);
      setError(`Failed to clear orphans: ${err.message}`);
    }
  }, []);

  // ── Render ─────────────────────────────────────────────────
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

        {/* Info banner */}
        <div className="flex items-start gap-2.5 rounded-xl p-3 bg-[#5aa2ce]/8 border border-[#5aa2ce]/20 text-[11px] text-[#5aa2ce]/80 leading-relaxed">
          <FiInfo size={13} className="flex-shrink-0 mt-0.5" />
          <span>
            Storage orders by <strong className="text-[#5aa2ce]">filename</strong>, not date —
            full scan required. Orphans are saved to Firestore <strong className="text-[#5aa2ce]">orphans</strong> collection.
            Retrigger sends files in <strong className="text-[#5aa2ce]">batches of {BATCH_SIZE}</strong> — safe for large sets.
            Close the tab only after all batches are sent.
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

        {/* Stored orphans banner (idle only) */}
        {orphans.length > 0 && phase === "idle" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl p-3 bg-[#4caf50]/8 border border-[#4caf50]/20 text-[11px]">
            <div className="flex items-center gap-2 text-[#4caf50]/80">
              <FiDatabase size={12} className="flex-shrink-0" />
              <span>
                <strong className="text-[#4caf50]">{orphans.length}</strong> orphan{orphans.length !== 1 ? "s" : ""} stored
                · {Math.ceil(orphans.length / BATCH_SIZE)} batch{Math.ceil(orphans.length / BATCH_SIZE) !== 1 ? "es" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={runRetrigger}
                className="px-3 py-2 rounded-xl bg-[#f7cc1c] text-[#142848] text-xs font-semibold hover:bg-[#f7cc1c]/90 transition-all"
              >
                Retrigger stored orphans
              </button>
              <button
                onClick={handleClearAll}
                className="p-1 text-white/25 hover:text-red-400 transition-colors"
                title="Clear all stored orphans"
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

        {/* Retrigger progress — batched */}
        {phase === "retriggering" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-[#f7cc1c]/30 border-t-[#f7cc1c] animate-spin" />
                Batch {triggerProgress.batch} of {triggerProgress.batches}…
              </span>
              <span className="text-white/30 font-mono text-[11px]">
                {triggerProgress.queued} queued · {triggerProgress.failed} failed
              </span>
            </div>
            <ProgressBar value={triggerProgress.batch} max={triggerProgress.batches} color="#f7cc1c" />
            <div className="text-[10px] text-white/20 text-right">
              {triggerProgress.total} files · {BATCH_SIZE} per batch · keep tab open until done
            </div>
          </div>
        )}

        {/* Stats (after done) */}
        {phase === "done" && (
          <div className="flex gap-2 flex-wrap">
            <StatBox label="Pages scanned" value={scanProgress.pages}     color="blue"  />
            <StatBox label="Total seen"    value={scanProgress.totalSeen}               />
            <StatBox label="In range"      value={scanProgress.matched}                 />
            <StatBox label="Orphans"       value={orphans.length}         color={orphans.length > 0 ? "red" : "green"} />
            {queuedCount > 0 && <StatBox label="Enqueued" value={queuedCount} color="green"  />}
            {failedCount > 0 && <StatBox label="Failed"   value={failedCount} color="orange" />}
          </div>
        )}

        {/* Orphan list */}
        {orphans.length > 0 && (
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
                  <OrphanRow
                    key={f.id}
                    file={f}
                    triggerState={triggerStates[f.id] ?? "idle"}
                    onRemove={handleRemoveOrphan}
                  />
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

        {/* No stored orphans */}
        {phase === "idle" && orphans.length === 0 && !loadingStored && (
          <div className="rounded-xl p-4 bg-white/4 border border-white/8 flex items-center gap-3 text-white/40 text-sm">
            <FiDatabase size={16} className="flex-shrink-0" />
            No stored orphans. Run a scan to find missing files.
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

          {(phase === "done" || phase === "idle") && orphans.length > 0 && queuedCount === 0 && (
            <button
              onClick={runRetrigger}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f7cc1c] text-[#142848] hover:bg-[#f7cc1c]/90 active:scale-95 transition-all text-xs font-bold shadow-md shadow-[#f7cc1c]/20"
            >
              <FiZap size={13} />
              {phase === "idle"
                ? `Retrigger ${orphans.length} orphans`
                : `Enqueue all ${orphans.length} orphans`}
            </button>
          )}

          {/* Abort only available during scan/check — not during retrigger batches */}
          {isRunning && phase !== "retriggering" && (
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

        {phase === "idle" && (
          <p className="text-[11px] text-white/20 leading-relaxed">
            Scans every Storage page, filters by date, checks Firestore, saves orphans to the{" "}
            <strong className="text-white/30">orphans</strong> collection. Retrigger splits files
            into batches of <strong className="text-white/30">{BATCH_SIZE}</strong> — each batch is
            one server call, keeping well under the 540s Cloud Function timeout even at 5 000+ files.
            Keep the tab open until all batches finish sending.
          </p>
        )}

      </div>
    </div>
  );
};

export default ReconciliationPanel;