"use client";
// ─────────────────────────────────────────────────────────────
// MAIN PAGE — AudioLibraryPage.jsx
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useRouter ,useParams} from "next/navigation";


import {
  FiHeadphones, FiMic, FiCalendar, FiUsers, FiLayers,
  FiAlertCircle, FiRefreshCw, FiCheckCircle, FiDatabase,
} from "react-icons/fi";

import DashboardLayout from "../DashboardLayout";
import { StatCard, CardSkeleton, EmptyState } from "./components/AudioLibrary.ui";
import AudioLibraryFilters from "./components/AudioLibraryFilters.jsx";
import AudioDayGroup from "./components/AudioDayGroup.jsx";
import { fetchStoragePage } from "./components/audioLibrary.service";
import { BUCKET_FOLDERS, dayKey, RETRIGGER_URL } from "./components/audioLibrary.constants";

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
  const { user: currentUser, loading: userLoading } = useSelector(
    (s) => s.auth
  );

  // ── State ─────────────────────────────────────────────────
  const [files, setFiles]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState(null);
  const [playingId, setPlayingId]     = useState(null);

  const [nextPageToken, setNextPageToken] = useState(undefined);
  const [hasMore, setHasMore]             = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType]   = useState("");
  const [filterRound, setFilterRound] = useState("");
  const [filterDate, setFilterDate]   = useState("");
  const [showResults, setShowResults] = useState(false);
  const [collapsedDays, setCollapsedDays] = useState({});

  const sentinelRef = useRef(null);

  // ── Auth guard ─────────────────────────────────────────────
  useEffect(() => {
    if (!userLoading && !currentUser) { router.replace("/"); return; }
    if (!userLoading && currentUser && !["super_admin", "admin"].includes(currentUser.role)) {
      router.replace(`/dashboard/${organizationId}/welcome`);
    }
  }, [userLoading, currentUser, router, organizationId]);

  // ── Fetch page ─────────────────────────────────────────────
  const fetchPage = useCallback(async (pageToken, append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError(null);
    try {
      const { files: pageFiles, nextPageToken: npt, hasMore: hm } =
        await fetchStoragePage(BUCKET_FOLDERS.literacy, pageToken);
      setFiles((prev) => (append ? [...prev, ...pageFiles] : pageFiles));
      setNextPageToken(npt);
      setHasMore(hm);
    } catch (err) {
      console.error("[AudioLibrary]", err);
      setError("Failed to load audio files. Please try again.");
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser && ["super_admin", "admin"].includes(currentUser.role)) {
      fetchPage(undefined, false);
    }
  }, [currentUser, fetchPage]);

  // ── Infinite scroll ────────────────────────────────────────
  useEffect(() => {
    if (!sentinelRef.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          fetchPage(nextPageToken, true);
        }
      },
      { threshold: 0.1 }
    );
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [hasMore, loadingMore, loading, nextPageToken, fetchPage]);

  // ── Derived ────────────────────────────────────────────────
  const allTypes  = [...new Set(files.map((f) => f.type))].sort();
  const allRounds = [...new Set(files.map((f) => f.round))].sort((a, b) => +a - +b);

  const filteredFiles = files.filter((f) => {
    if (filterType  && f.type  !== filterType)              return false;
    if (filterRound && f.round !== filterRound)              return false;
    if (filterDate  && dayKey(f.uploadedAt) !== filterDate)  return false;
    if (searchQuery) {
      const q   = searchQuery.toLowerCase();
      const hay = `${f.assessmentId} ${f.studentId} ${f.content} ${f.type}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const byDay = {};
  filteredFiles.forEach((f) => {
    const d = dayKey(f.uploadedAt);
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(f);
  });
  const sortedDays = Object.keys(byDay).sort().reverse();

  const isFiltering = !!(searchQuery || filterType || filterRound || filterDate);
  const totalLoaded  = files.length;
  const totalDays    = new Set(files.map((f) => dayKey(f.uploadedAt))).size;
  const totalStudents= new Set(files.map((f) => f.studentId)).size;
  const totalTypes   = new Set(files.map((f) => f.type)).size;

  // ── Handlers ──────────────────────────────────────────────
  const handlePlayPause = (id) => setPlayingId((p) => (p === id ? null : id));
  const toggleDay       = (d)  => setCollapsedDays((p) => ({ ...p, [d]: !p[d] }));
  const handleRefresh   = ()   => { setNextPageToken(undefined); fetchPage(undefined, false); };
  const clearFilters    = ()   => { setSearchQuery(""); setFilterType(""); setFilterRound(""); setFilterDate(""); };

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
            <div className="flex items-center gap-2">
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
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/6 text-white/70 text-xs font-semibold border border-white/10 hover:bg-white/10 hover:text-white transition-all disabled:opacity-40"
              >
                <FiRefreshCw size={13} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {/* ── Check results banner ── */}
          {showResults && (
            <div className="rounded-2xl p-4 bg-[#1e3a63] border border-[#f7cc1c]/20 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <FiDatabase size={14} className="text-[#f7cc1c]" />
                <p className="text-sm font-semibold text-white">Result checking enabled</p>
              </div>
              <p className="text-xs text-white/45 leading-relaxed">
                Each card queries Firestore for its transcription result.{" "}
                <span className="text-[#f7cc1c]/70 font-medium">
                  Files with a yellow left-border exist in Storage but have no matching Firestore
                  result
                </span>{" "}
                — these can be re-triggered to re-run the transcription pipeline.
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
              label={hasMore ? "Loaded" : "Total recordings"}
              value={hasMore ? `${totalLoaded}+` : totalLoaded}
              loading={loading}
            />
            <StatCard icon={FiCalendar} label="Days recorded"   value={totalDays}     loading={loading} />
            <StatCard icon={FiUsers}    label="Students"         value={totalStudents} loading={loading} />
            <StatCard icon={FiLayers}   label="Types"            value={totalTypes}    loading={loading} />
          </div>

          {/* ── Filters ── */}
          <AudioLibraryFilters
            searchQuery={searchQuery}   setSearchQuery={setSearchQuery}
            filterType={filterType}     setFilterType={setFilterType}
            filterRound={filterRound}   setFilterRound={setFilterRound}
            filterDate={filterDate}     setFilterDate={setFilterDate}
            allTypes={allTypes}
            allRounds={allRounds}
            filteredCount={filteredFiles.length}
            totalLoaded={totalLoaded}
            hasMore={hasMore}
            isFiltering={isFiltering}
            clearFilters={clearFilters}
          />

          {/* ── Error ── */}
          {error && (
            <div className="rounded-2xl p-4 bg-red-500/10 border border-red-500/25 flex items-center gap-3 text-red-400">
              <FiAlertCircle size={16} className="flex-shrink-0" />
              <p className="text-sm flex-1">{error}</p>
              <button
                onClick={handleRefresh}
                className="text-xs font-semibold underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* ── Loading skeleton ── */}
          {loading && (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          )}

          {/* ── Empty state ── */}
          {!loading && !error && filteredFiles.length === 0 && (
            <EmptyState filtered={files.length > 0} />
          )}

          {/* ── Day groups ── */}
          {!loading && !error && (
            <div className="space-y-5">
              {sortedDays.map((day) => (
                <AudioDayGroup
                  key={day}
                  day={day}
                  files={byDay[day]}
                  collapsed={!!collapsedDays[day]}
                  onToggle={() => toggleDay(day)}
                  playingId={playingId}
                  onPlayPause={handlePlayPause}
                  showResults={showResults}
                />
              ))}
            </div>
          )}

          {/* ── Infinite scroll sentinel ── */}
          {!loading && !error && <div ref={sentinelRef} className="h-4" />}

          {/* ── Load-more skeleton ── */}
          {loadingMore && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          )}

          {/* ── End of list ── */}
          {!loading && !loadingMore && !hasMore && files.length > 0 && (
            <p className="text-center text-[11px] text-white/25 py-4">
              All {totalLoaded} recordings loaded
            </p>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
};

export default AudioLibraryPage;