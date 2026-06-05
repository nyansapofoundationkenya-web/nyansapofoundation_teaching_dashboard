"use client";
// ─────────────────────────────────────────────────────────────
// DAY GROUP — AudioDayGroup.jsx
// ─────────────────────────────────────────────────────────────
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import AudioCard from "./AudioCard";
import { formatDayHeading } from "./audioLibrary.constants";

const AudioDayGroup = ({
  day,
  files,
  collapsed,
  onToggle,
  playingId,
  onPlayPause,
  showResults,
}) => (
  <div className="space-y-2">
    {/* Day header */}
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-1 py-1 group"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-1.5 h-1.5 rounded-full bg-[#f7cc1c]/60" />
        <span className="text-sm font-semibold text-white/70 group-hover:text-white/90 transition-colors">
          {formatDayHeading(day)}
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f7cc1c]/12 text-[#f7cc1c]/80 border border-[#f7cc1c]/20 font-semibold">
          {files.length}
        </span>
      </div>
      <span className="text-white/25 group-hover:text-white/50 transition-colors">
        {collapsed ? <FiChevronDown size={15} /> : <FiChevronUp size={15} />}
      </span>
    </button>

    {/* Cards */}
    {!collapsed && (
      <div className="space-y-2 pl-0">
        {files.map((file) => (
          <AudioCard
            key={file.id}
            file={file}
            isPlaying={playingId === file.id}
            onPlayPause={onPlayPause}
            showResults={showResults}
          />
        ))}
      </div>
    )}
  </div>
);

export default AudioDayGroup;