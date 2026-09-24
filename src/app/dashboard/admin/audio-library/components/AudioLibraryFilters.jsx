"use client";
// ─────────────────────────────────────────────────────────────
// FILTER BAR — AudioLibraryFilters.jsx
// ─────────────────────────────────────────────────────────────
import { FiSearch, FiX } from "react-icons/fi";

const selectCls =
  "h-9 px-3 rounded-xl bg-white/6 text-white/80 text-xs border border-white/10 " +
  "focus:outline-none focus:border-[#5aa2ce]/60 cursor-pointer transition-all hover:bg-white/10";

const AudioLibraryFilters = ({
  searchQuery, setSearchQuery,
  filterType,  setFilterType,
  filterRound, setFilterRound,
  filterDate,  setFilterDate,
  allTypes, allRounds,
  filteredCount, totalLoaded, hasMore,
  isFiltering, clearFilters,
}) => (
  <div className="bg-[#1e3a63] rounded-2xl p-4 space-y-3 border border-white/5">
    {/* Search */}
    <div className="relative">
      <FiSearch
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
      />
      <input
        type="text"
        placeholder="Search by student ID, content, assessment…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full h-10 pl-9 pr-9 rounded-xl bg-white/6 text-white text-sm border border-white/10 focus:outline-none focus:border-[#5aa2ce]/50 transition-all placeholder:text-white/25"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
        >
          <FiX size={14} />
        </button>
      )}
    </div>

    {/* Filter selects + count */}
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value)}
        className={selectCls}
      >
        <option value="">All types</option>
        {allTypes.map((t) => (
          <option key={t} value={t}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </option>
        ))}
      </select>

      <select
        value={filterRound}
        onChange={(e) => setFilterRound(e.target.value)}
        className={selectCls}
      >
        <option value="">All rounds</option>
        {allRounds.map((r) => (
          <option key={r} value={r}>
            Round {r}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={filterDate}
        onChange={(e) => setFilterDate(e.target.value)}
        className={selectCls + " [color-scheme:dark]"}
      />

      {isFiltering && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 h-9 px-3 rounded-xl text-xs text-white/40 hover:text-white/70 hover:bg-white/6 transition-all"
        >
          <FiX size={12} />
          Clear
        </button>
      )}

      <span className="ml-auto text-[11px] text-white/30 font-medium">
        {isFiltering
          ? `${filteredCount} of ${totalLoaded}${hasMore ? "+" : ""}`
          : `${totalLoaded}${hasMore ? "+" : ""} recordings`}
      </span>
    </div>
  </div>
);

export default AudioLibraryFilters;