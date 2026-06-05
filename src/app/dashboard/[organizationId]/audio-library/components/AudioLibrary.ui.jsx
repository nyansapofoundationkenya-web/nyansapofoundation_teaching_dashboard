"use client";
// ─────────────────────────────────────────────────────────────
// UI PRIMITIVES — AudioLibrary.ui.jsx
// ─────────────────────────────────────────────────────────────
import {
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiDatabase,
} from "react-icons/fi";

// ── Animated waveform bars ────────────────────────────────────
export const WaveformBars = ({ playing }) => {
  const heights = [35, 60, 42, 78, 52, 88, 33, 68, 48, 82, 43, 72, 57, 38, 76];
  return (
    <div className="flex items-center gap-[2px] h-6 w-20" aria-hidden="true">
      {heights.map((h, i) => (
        <div
          key={i}
          className={`flex-1 rounded-[2px] transition-all duration-500 ${
            playing
              ? "bg-[#f7cc1c] opacity-90"
              : "bg-white/20"
          }`}
          style={{
            height: `${h}%`,
            ...(playing
              ? {
                  animation: `wave 1s ease-in-out infinite`,
                  animationDelay: `${i * 0.07}s`,
                }
              : {}),
          }}
        />
      ))}
      <style jsx>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.4); }
        }
      `}</style>
    </div>
  );
};

// ── Result status badge ───────────────────────────────────────
export const ResultBadge = ({ status }) => {
  if (status === "loading")
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
        <div className="w-14 h-4 rounded-full bg-white/10 animate-pulse" />
      </div>
    );
  if (status === null) return null;

  const configs = {
    missing: {
      icon: FiXCircle,
      label: "No result",
      cls: "bg-red-500/15 text-red-400 border-red-500/30",
    },
    failed: {
      icon: FiAlertCircle,
      label: "Transcription failed",
      cls: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    },
    ok: {
      icon: FiCheckCircle,
      label: "Result saved",
      cls: "bg-[#4caf50]/15 text-[#4caf50] border-[#4caf50]/30",
    },
    "no-firestore": {
      icon: FiDatabase,
      label: "Not in Firestore",
      cls: "bg-[#f7cc1c]/15 text-[#f7cc1c] border-[#f7cc1c]/30",
    },
  };

  const cfg = configs[status];
  if (!cfg) return null;
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-semibold tracking-wide ${cfg.cls}`}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  );
};

// ── Skeleton card ─────────────────────────────────────────────
export const CardSkeleton = () => (
  <div className="rounded-2xl h-[88px] animate-pulse bg-white/5 border border-white/5" />
);

// ── Stat card ─────────────────────────────────────────────────
export const StatCard = ({ icon: Icon, label, value, loading, accent }) => (
  <div className="bg-[#1e3a63] rounded-2xl p-4 flex items-center gap-3 border border-white/5 hover:border-white/10 transition-colors">
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        accent || "bg-[#f7cc1c]/15"
      }`}
    >
      <Icon size={17} className="text-[#f7cc1c]" />
    </div>
    <div>
      <p className="text-[11px] text-white/50 mb-0.5 font-medium uppercase tracking-wider">
        {label}
      </p>
      {loading ? (
        <div className="h-6 w-10 bg-white/10 rounded animate-pulse" />
      ) : (
        <p className="text-xl font-bold text-white">{value}</p>
      )}
    </div>
  </div>
);

// ── Empty state ───────────────────────────────────────────────
export const EmptyState = ({ filtered }) => (
  <div className="flex flex-col items-center gap-4 py-20 text-white/30">
    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" />
      </svg>
    </div>
    <div className="text-center">
      <p className="text-base font-semibold text-white/40">No recordings found</p>
      <p className="text-sm mt-1 text-white/25">
        {filtered
          ? "Try adjusting your filters or search query"
          : "No audio files have been uploaded yet"}
      </p>
    </div>
  </div>
);