"use client";
// ─────────────────────────────────────────────────────────────
// MAIN PAGE — AudioLibraryPage.jsx
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useRouter, useParams } from "next/navigation";
import {
  FiHeadphones, FiMic, FiCalendar, FiUsers, FiLayers,
  FiAlertCircle, FiRefreshCw, FiCheckCircle, FiDatabase,
  FiSearch, FiCalendar as FiCalendarIcon, FiZap,
} from "react-icons/fi";

import DashboardLayout from "../DashboardLayout";
import { StatCard, CardSkeleton, EmptyState } from "./components/AudioLibrary.ui";
import AudioLibraryFilters from "./components/AudioLibraryFilters.jsx";
import AudioDayGroup from "./components/AudioDayGroup.jsx";
import {
  fetchStoragePage,
  fetchDayChunk,
  batchCheckResults,
} from "./components/audioLibrary.service";
import { BUCKET_FOLDERS, dayKey, RETRIGGER_URL } from "./components/audioLibrary.constants";
import AudioCard from "./components/AudioCard";
import ReconciliationPanel from "./components/ReconciliationPanel";

// ── Page-level skeleton ───────────────────────────────────────
const PageSkeleton = () => (
  <div className="p-6 space-y-5">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-[#1e3a63] rounded-2xl h-20 animate-pulse border border-white/5" />
      ))}
    </div>
    <div className="bg-[#1e3a63] rounded-2xl h-14 animate-pulse border border-white/5" />
    {[...Array(5)].map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────
const AudioLibraryPage = () => {
  const { organizationId } = useParams();
  const router = useRouter();
  const { user: currentUser, loading: userLoading } = useSelector((s) => s.auth);

  // ── View mode ─────────────────────────────────────────────
  const [viewMode, setViewMode] = useState("browse"); // "browse" | "day"

  // ── Browse mode state ─────────────────────────────────────
  const [browseFiles, setBrowseFiles] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(true);
  const [browseLoadingMore, setBrowseLoadingMore] = useState(false);
  const [browseNextPageToken, setBrowseNextPageToken] = useState(undefined);
  const [browseHasMore, setBrowseHasMore] = useState(true);

  // ── Day mode state ────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState("");
  const [dayFiles, setDayFiles] = useState([]);
  const [dayLoading, setDayLoading] = useState(false);
  const [dayLoadingMore, setDayLoadingMore] = useState(false);
  const [dayNextPageToken, setDayNextPageToken] = useState(undefined);
  const [dayHasMore, setDayHasMore] = useState(false);
  const [dayPagesScanned, setDayPagesScanned] = useState(0);

  // ── Shared state ──────────────────────────────────────────
  const [error, setError] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [batchStatuses, setBatchStatuses] = useState({});
  const [checkingResults, setCheckingResults] = useState(false);

  // ── Reconciliation panel ──────────────────────────────────
  const [showRecon, setShowRecon] = useState(false);

  // ── Filters (browse mode only) ────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterRound, setFilterRound] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [collapsedDays, setCollapsedDays] = useState({});

  const sentinelRef = useRef(null);

  // ── Auth guard ─────────────────────────────────────────────
  useEffect(() => {
    if (!userLoading && !currentUser) {
      router.replace("/");
      return;
    }
    if (!userLoading && currentUser && !["super_admin", "admin"].includes(currentUser.role)) {
      router.replace(`/dashboard/${organizationId}/welcome`);
    }
  }, [userLoading, currentUser, router, organizationId]);

  // ── Browse: fetch initial page ────────────────────────────
  const fetchBrowsePage = useCallback(async (pageToken, append = false) => {
    append ? setBrowseLoadingMore(true) : setBrowseLoading(true);
    setError(null);
    try {
      const { files, nextPageToken: npt, hasMore: hm } =
        await fetchStoragePage(BUCKET_FOLDERS.literacy, pageToken);
      setBrowseFiles((prev) => (append ? [...prev, ...files] : files));
      setBrowseNextPageToken(npt);
      setBrowseHasMore(hm);
    } catch (err) {
      console.error("[AudioLibrary] Browse fetch error:", err);
      setError("Failed to load audio files. Please try again.");
    } finally {
      append ? setBrowseLoadingMore(false) : setBrowseLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser && ["super_admin", "admin"].includes(currentUser.role)) {
      fetchBrowsePage(undefined, false);
    }
  }, [currentUser, fetchBrowsePage]);

  // ── Browse: infinite scroll ───────────────────────────────
  useEffect(() => {
    if (viewMode !== "browse" || !sentinelRef.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          browseHasMore &&
          !browseLoadingMore &&
          !browseLoading
        ) {
          fetchBrowsePage(browseNextPageToken, true);
        }
      },
      { threshold: 0.1 }
    );
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [viewMode, browseHasMore, browseLoadingMore, browseLoading, browseNextPageToken, fetchBrowsePage]);

  // ── Day mode: load files for selected date ────────────────
  const loadDay = useCallback(
    async (date, append = false) => {
      if (!date) return;
      append ? setDayLoadingMore(true) : setDayLoading(true);
      setError(null);

      try {
        const { files, nextPageToken, hasMore, pagesScanned, dateExhausted } =
          await fetchDayChunk(
            BUCKET_FOLDERS.literacy,
            date,
            append ? dayNextPageToken : undefined,
            10
          );

        setDayFiles((prev) => (append ? [...prev, ...files] : files));
        setDayNextPageToken(nextPageToken);
        setDayHasMore(hasMore);
        setDayPagesScanned((prev) => (append ? prev + pagesScanned : pagesScanned));

        if (dateExhausted) {
          console.log(`[DayMode] Date ${date} exhausted`);
        }
      } catch (err) {
        console.error("[AudioLibrary] Day fetch error:", err);
        setError(`Failed to load ${date}: ${err.message}`);
      } finally {
        append ? setDayLoadingMore(false) : setDayLoading(false);
      }
    },
    [dayNextPageToken]
  );

  // ── Batch check: runs when toggled or files change ────────
  useEffect(() => {
    if (!showResults) {
      setBatchStatuses({});
      return;
    }

    const visibleFiles = viewMode === "day" ? dayFiles : filteredBrowseFiles;
    if (!visibleFiles.length) return;

    const runBatchCheck = async () => {
      setCheckingResults(true);
      try {
        const results = await batchCheckResults(visibleFiles);
        setBatchStatuses(results);
      } catch (err) {
        console.error("[BatchCheck]", err);
        setError("Failed to check results. Please try again.");
      } finally {
        setCheckingResults(false);
      }
    };

    runBatchCheck();
  }, [showResults, viewMode, browseFiles, dayFiles, searchQuery, filterType, filterRound, filterDate]);

  // ── Handlers ──────────────────────────────────────────────
  const handlePlayPause = (id) => setPlayingId((p) => (p === id ? null : id));
  const toggleDay = (d) => setCollapsedDays((p) => ({ ...p, [d]: !p[d] }));

  const handleRefresh = () => {
    setBatchStatuses({});
    if (viewMode === "browse") {
      setBrowseNextPageToken(undefined);
      fetchBrowsePage(undefined, false);
    } else if (viewMode === "day" && selectedDate) {
      setDayNextPageToken(undefined);
      loadDay(selectedDate, false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterType("");
    setFilterRound("");
    setFilterDate("");
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setDayFiles([]);
    setDayNextPageToken(undefined);
    setDayHasMore(false);
    setDayPagesScanned(0);
    setBatchStatuses({});
    if (date) {
      setViewMode("day");
      loadDay(date, false);
    } else {
      setViewMode("browse");
    }
  };

  // ── Derived: browse filters ───────────────────────────────
  const allTypes = [...new Set(browseFiles.map((f) => f.type))].sort();
  const allRounds = [...new Set(browseFiles.map((f) => f.round))].sort((a, b) => +a - +b);

  const filteredBrowseFiles = browseFiles.filter((f) => {
    if (filterType && f.type !== filterType) return false;
    if (filterRound && f.round !== filterRound) return false;
    if (filterDate && dayKey(f.uploadedAt) !== filterDate) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const hay = `${f.assessmentId} ${f.studentId} ${f.content} ${f.type}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const browseByDay = {};
  filteredBrowseFiles.forEach((f) => {
    const d = dayKey(f.uploadedAt);
    if (!browseByDay[d]) browseByDay[d] = [];
    browseByDay[d].push(f);
  });
  const sortedBrowseDays = Object.keys(browseByDay).sort().reverse();

  const isFiltering = !!(searchQuery || filterType || filterRound || filterDate);

  // ── Stats ─────────────────────────────────────────────────
  const currentFiles = viewMode === "day" ? dayFiles : browseFiles;
  const totalLoaded = currentFiles.length;
  const totalDays = new Set(currentFiles.map((f) => dayKey(f.uploadedAt))).size;
  const totalStudents = new Set(currentFiles.map((f) => f.studentId)).size;
  const totalTypes = new Set(currentFiles.map((f) => f.type)).size;

  // ── Guards ─────────────────────────────────────────────────
  if (userLoading || (!currentUser && !userLoading)) return <PageSkeleton />;
  if (!["super_admin", "admin"].includes(currentUser?.role)) return null;

  // ─────────────────────────────────────────────────────────
  return (
    <DashboardLayout
      title="Audio Library"
      organizationId={organizationId}
      currentSection="audio-library"
    >
      <div className="min-h-screen bg-[#142848] text-white">
        <div className="max-w-5xl mx-auto p-6 space-y-5">

          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#f7cc1c]/15 flex items-center justify-center border border-[#f7cc1c]/20">
                <FiHeadphones size={18} className="text-[#f7cc1c]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">
                  Audio Library
                </h1>
                <p className="text-xs text-white/40 mt-0.5">
                  Nyansapo Teaching Literacy Assessment
                </p>
              </div>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* ── Reconcile button ── */}
              <button
                onClick={() => setShowRecon((p) => !p)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  showRecon
                    ? "bg-[#f7cc1c] text-[#142848] border-[#f7cc1c] shadow-md shadow-[#f7cc1c]/20"
                    : "bg-white/6 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                <FiZap size={14} />
                Reconcile
              </button>

              <button
                onClick={() => setShowResults((p) => !p)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  showResults
                    ? "bg-[#f7cc1c] text-[#142848] border-[#f7cc1c] shadow-md shadow-[#f7cc1c]/20"
                    : "bg-white/6 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                <FiCheckCircle size={14} />
                {showResults ? "Hide results" : "Check results"}
              </button>

              <button
                onClick={handleRefresh}
                disabled={browseLoading || dayLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/6 text-white/70 text-xs font-semibold border border-white/10 hover:bg-white/10 hover:text-white transition-all disabled:opacity-40"
              >
                <FiRefreshCw size={13} className={browseLoading || dayLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {/* ── Reconciliation panel ── */}
          {showRecon && (
            <ReconciliationPanel onClose={() => setShowRecon(false)} />
          )}

          {/* ── Date picker ── */}
          <div className="bg-[#1e3a63] rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <FiCalendarIcon size={14} className="text-[#f7cc1c]/60" />
                <span className="text-sm text-white/70">View by date:</span>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateSelect(e.target.value)}
                className="h-9 px-3 rounded-xl bg-white/6 text-white text-sm border border-white/10 focus:outline-none focus:border-[#5aa2ce]/50 transition-all [color-scheme:dark]"
              />
              {selectedDate && (
                <button
                  onClick={() => handleDateSelect("")}
                  className="text-xs text-white/40 hover:text-white/70 underline"
                >
                  Clear (browse all)
                </button>
              )}
              {viewMode === "day" && (
                <span className="ml-auto text-[11px] text-white/30">
                  {dayLoading ? "Loading..." : `${dayFiles.length} recordings`}
                  {dayHasMore && " — more available"}
                </span>
              )}
            </div>
          </div>

          {/* ── Check results banner ── */}
          {showResults && (
            <div className="rounded-2xl p-4 bg-[#1e3a63] border border-[#f7cc1c]/20 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <FiDatabase size={14} className="text-[#f7cc1c]" />
                <p className="text-sm font-semibold text-white">
                  Result checking {checkingResults ? "in progress..." : "enabled"}
                </p>
              </div>
              <p className="text-xs text-white/45 leading-relaxed">
                {checkingResults
                  ? "Checking Firestore for transcription results..."
                  : "Each card shows its transcription status. Files missing from Firestore can be re-triggered."}
                {!RETRIGGER_URL && (
                  <span className="ml-1 text-[#e67e22]">
                    Re-trigger is disabled — set NEXT_PUBLIC_RETRIGGER_FUNCTION_URL in your .env.
                  </span>
                )}
              </p>
            </div>
          )}

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={FiMic}
              label={viewMode === "browse" && browseHasMore ? "Loaded" : "Total recordings"}
              value={totalLoaded}
              loading={browseLoading || dayLoading}
            />
            <StatCard icon={FiCalendar} label="Days recorded" value={totalDays} loading={browseLoading || dayLoading} />
            <StatCard icon={FiUsers} label="Students" value={totalStudents} loading={browseLoading || dayLoading} />
            <StatCard icon={FiLayers} label="Types" value={totalTypes} loading={browseLoading || dayLoading} />
          </div>

          {/* ── Browse mode: Filters ── */}
          {viewMode === "browse" && (
            <AudioLibraryFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterType={filterType}
              setFilterType={setFilterType}
              filterRound={filterRound}
              setFilterRound={setFilterRound}
              filterDate={filterDate}
              setFilterDate={setFilterDate}
              allTypes={allTypes}
              allRounds={allRounds}
              filteredCount={filteredBrowseFiles.length}
              totalLoaded={browseFiles.length}
              hasMore={browseHasMore}
              isFiltering={isFiltering}
              clearFilters={clearFilters}
            />
          )}

          {/* ── Error ── */}
          {error && (
            <div className="rounded-2xl p-4 bg-red-500/10 border border-red-500/25 flex items-center gap-3 text-red-400">
              <FiAlertCircle size={16} className="flex-shrink-0" />
              <p className="text-sm flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-xs font-semibold underline hover:no-underline">
                Dismiss
              </button>
            </div>
          )}

          {/* ── Loading skeleton ── */}
          {(browseLoading || dayLoading) && !dayLoadingMore && !browseLoadingMore && (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              DAY MODE
          ═══════════════════════════════════════════════════════ */}
          {viewMode === "day" && selectedDate && (
            <div className="space-y-4">
              {/* Day header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                {dayHasMore && (
                  <button
                    onClick={() => loadDay(selectedDate, true)}
                    disabled={dayLoadingMore}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/6 text-white/70 text-xs font-semibold border border-white/10 hover:bg-white/10 hover:text-white transition-all disabled:opacity-40"
                  >
                    {dayLoadingMore ? "Loading..." : "Load more"}
                  </button>
                )}
              </div>

              {/* Day files */}
              {dayFiles.length === 0 && !dayLoading && (
                <div className="text-center py-12 text-white/40">
                  No recordings found for this date
                </div>
              )}

              <div className="space-y-2">
                {dayFiles.map((file) => (
                  <AudioCard
                    key={file.id}
                    file={file}
                    isPlaying={playingId === file.id}
                    onPlayPause={handlePlayPause}
                    showResults={showResults}
                    batchStatus={batchStatuses[file.id]}
                    checkingResults={checkingResults}
                  />
                ))}
              </div>

              {/* Load more skeleton */}
              {dayLoadingMore && (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              )}

              {/* End of day */}
              {!dayHasMore && dayFiles.length > 0 && (
                <p className="text-center text-[11px] text-white/25 py-4">
                  All {dayFiles.length} recordings for this date loaded
                  {dayPagesScanned > 0 && ` (scanned ${dayPagesScanned} Storage pages)`}
                </p>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              BROWSE MODE
          ═══════════════════════════════════════════════════════ */}
          {viewMode === "browse" && (
            <>
              {/* Empty state */}
              {!browseLoading && !error && filteredBrowseFiles.length === 0 && (
                <EmptyState filtered={browseFiles.length > 0} />
              )}

              {/* Day groups */}
              {!browseLoading && !error && (
                <div className="space-y-5">
                  {sortedBrowseDays.map((day) => (
                    <AudioDayGroup
                      key={day}
                      day={day}
                      files={browseByDay[day]}
                      collapsed={!!collapsedDays[day]}
                      onToggle={() => toggleDay(day)}
                      playingId={playingId}
                      onPlayPause={handlePlayPause}
                      showResults={showResults}
                      batchStatuses={batchStatuses}
                      checkingResults={checkingResults}
                    />
                  ))}
                </div>
              )}

              {/* Infinite scroll sentinel */}
              {!browseLoading && !error && <div ref={sentinelRef} className="h-4" />}

              {/* Load-more skeleton */}
              {browseLoadingMore && (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              )}

              {/* End of list */}
              {!browseLoading && !browseLoadingMore && !browseHasMore && browseFiles.length > 0 && (
                <p className="text-center text-[11px] text-white/25 py-4">
                  All {browseFiles.length} recordings loaded
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AudioLibraryPage;