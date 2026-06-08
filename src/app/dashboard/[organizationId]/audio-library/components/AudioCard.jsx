"use client";
// ─────────────────────────────────────────────────────────────
// AUDIO CARD — AudioCard.jsx
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import {
  FiPlay, FiPause, FiEye, FiEyeOff,
  FiRotateCw, FiCheckCircle, FiAlertCircle, FiXCircle,
} from "react-icons/fi";
import { WaveformBars } from "./AudioLibrary.ui";
import { checkResultExists, retriggerFile } from "./audioLibrary.service";
import { getTypeBadge, formatTime, formatFileSize, RETRIGGER_URL } from "./audioLibrary.constants";

// ── Tiny inline status pill that sits in the tag row ─────────
const StatusPill = ({ status }) => {
  if (!status || status === "idle") return null;

  if (status === "loading") return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-white/6 border border-white/10 text-white/40">
      <span className="w-2 h-2 rounded-full border border-white/20 border-t-white/60 animate-spin" />
      Checking…
    </span>
  );

  if (status === "missing") return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-semibold">
      <FiXCircle size={10} />
      Not in Firestore
    </span>
  );

  if (status === "failed") return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 font-semibold">
      <FiAlertCircle size={10} />
      Transcription failed
    </span>
  );

  if (status === "ok") return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#4caf50]/15 border border-[#4caf50]/30 text-[#4caf50] font-semibold">
      <FiCheckCircle size={10} />
      In Firestore
    </span>
  );

  return null;
};

// ── Retrigger + transcript drawer (only for missing/failed) ──
const ActionDrawer = ({ status, retriggerState, retriggerError, onRetrigger, onDismiss, resultDetail, showTranscript, onToggleTranscript }) => {
  // Only show for actionable states
  if (status !== "missing" && status !== "failed" && status !== "ok") return null;

  return (
    <div className="mt-2.5 pt-2.5 border-t border-white/5 flex flex-col gap-2">

      {/* Transcript (ok state) */}
      {status === "ok" && resultDetail?.transcript && (
        <div>
          <button
            onClick={onToggleTranscript}
            className="flex items-center gap-1.5 text-[11px] text-white/35 hover:text-white/60 transition-colors"
          >
            {showTranscript ? <FiEyeOff size={11} /> : <FiEye size={11} />}
            {showTranscript ? "Hide transcript" : "Show transcript"}
            {resultDetail.mistakes != null && (
              <span className="ml-1 text-white/25">
                · {resultDetail.mistakes} mistake{resultDetail.mistakes !== 1 ? "s" : ""}
              </span>
            )}
          </button>
          {showTranscript && (
            <p className="mt-1.5 text-[11px] text-white/50 bg-white/4 rounded-xl px-3 py-2.5 leading-relaxed border border-white/8">
              {resultDetail.transcript}
            </p>
          )}
        </div>
      )}

      {/* Retrigger for missing / failed */}
      {(status === "missing" || status === "failed") && RETRIGGER_URL && (
        <>
          {retriggerState === "idle" && (
            <button
              onClick={onRetrigger}
              className="self-start flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#e67e22]/15 text-[#e67e22] border border-[#e67e22]/30 hover:bg-[#e67e22]/25 active:scale-95 transition-all text-[11px] font-semibold"
            >
              <FiRotateCw size={11} />
              Re-run transcription
            </button>
          )}

          {retriggerState === "running" && (
            <div className="flex items-center gap-2 text-[11px] text-white/40">
              <span className="w-3 h-3 rounded-full border-2 border-[#e67e22]/30 border-t-[#e67e22] animate-spin flex-shrink-0" />
              Sending to Cloud Function…
            </div>
          )}

          {retriggerState === "done" && (
            <div className="flex items-center gap-2 text-[11px] text-[#4caf50]">
              <FiCheckCircle size={11} />
              Triggered — re-checking in 8s…
            </div>
          )}

          {retriggerState === "error" && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[11px] text-red-400">
                <FiAlertCircle size={11} className="flex-shrink-0" />
                <span className="truncate">{retriggerError}</span>
              </div>
              <button onClick={onDismiss} className="self-start text-[11px] text-white/30 hover:text-white/60 underline">
                Dismiss
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
const AudioCard = ({ file, isPlaying, onPlayPause, showResults }) => {
  const [currentTime, setCurrentTime]       = useState(0);
  const [duration, setDuration]             = useState(0);
  const [progress, setProgress]             = useState(0);
  const [resultStatus, setResultStatus]     = useState("idle");
  const [resultDetail, setResultDetail]     = useState(null);
  const [retriggerState, setRetriggerState] = useState("idle");
  const [retriggerError, setRetriggerError] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);

  const audioRef       = useRef(null);
  const progressBarRef = useRef(null);
  const typeBadge      = getTypeBadge(file.type);

  // ── Firestore check ────────────────────────────────────────
  const runCheck = () => {
    setResultStatus("loading");
    setResultDetail(null);
    checkResultExists(file).then((res) => {
      if (res.exists === null)            setResultStatus(null);
      else if (!res.exists)               setResultStatus("missing");
      else if (res.transcriptionFailed) { setResultStatus("failed");  setResultDetail(res); }
      else                              { setResultStatus("ok");       setResultDetail(res); }
    });
  };

  useEffect(() => {
    if (!showResults) { setResultStatus("idle"); setResultDetail(null); return; }
    runCheck();
  }, [showResults, file.id]);

  // ── Audio ──────────────────────────────────────────────────
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const ct  = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 0;
    setCurrentTime(ct);
    setDuration(dur);
    setProgress(dur ? (ct / dur) * 100 : 0);
  };

  const handleEnded = () => { setProgress(0); setCurrentTime(0); onPlayPause(null); };

  const handleProgressClick = (e) => {
    if (!audioRef.current || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * (audioRef.current.duration || 0);
  };

  // ── Retrigger ──────────────────────────────────────────────
  const handleRetrigger = async () => {
    setRetriggerState("running");
    setRetriggerError("");
    try {
      await retriggerFile(file);
      setRetriggerState("done");
      setTimeout(() => { setRetriggerState("idle"); runCheck(); }, 8000);
    } catch (err) {
      setRetriggerState("error");
      setRetriggerError(err.message);
    }
  };

  const displayTime = duration > 0 ? `${formatTime(currentTime)} / ${formatTime(duration)}` : "—";

  // Card border reflects status at a glance
  const borderCls = isPlaying
    ? "border-[#f7cc1c]/50 shadow-lg shadow-[#f7cc1c]/5"
    : resultStatus === "missing" ? "border-red-500/25"
    : resultStatus === "failed"  ? "border-orange-500/25"
    : resultStatus === "ok"      ? "border-[#4caf50]/15"
    : "border-white/5 hover:border-white/10";

  const showDrawer = showResults && (resultStatus === "missing" || resultStatus === "failed" || resultStatus === "ok");

  return (
    <div className={`rounded-2xl border bg-[#1e3a63] transition-all duration-200 ${borderCls}`}>
      <audio
        ref={audioRef}
        src={file.downloadURL}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />

      <div className="p-4 flex flex-col gap-3">
        {/* ── Main row ── */}
        <div className="flex items-center gap-3">

          {/* Play/Pause */}
          <button
            onClick={() => onPlayPause(file.id)}
            aria-label={isPlaying ? "Pause" : "Play"}
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
              isPlaying
                ? "bg-[#f7cc1c] text-[#142848] shadow-md shadow-[#f7cc1c]/30"
                : "bg-white/8 text-white hover:bg-[#f7cc1c]/20 hover:text-[#f7cc1c]"
            }`}
          >
            {isPlaying ? <FiPause size={15} /> : <FiPlay size={15} />}
          </button>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Content */}
            <p className="text-sm font-semibold text-white truncate mb-1.5 leading-tight">
              {file.content}
            </p>

            {/* ── Tag row — status pill lives here ── */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold tracking-wide ${typeBadge.bg} ${typeBadge.text} ${typeBadge.border}`}>
                {file.type}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/8 text-white/50 border border-white/10">
                R{file.round}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#5aa2ce]/15 text-[#5aa2ce] border border-[#5aa2ce]/25 font-medium">
                {file.assessmentId}
              </span>

              {/* ← status pill right here in the tag row */}
              {showResults && <StatusPill status={resultStatus} />}
            </div>

            {/* Meta row */}
            <p className="text-[11px] text-white/35 mt-1.5 flex items-center gap-2 flex-wrap">
              <span>
                Student <span className="text-white/55 font-medium">{file.studentId}</span>
              </span>
              {file.timestamp && (
                <>
                  <span className="opacity-30">·</span>
                  <span>
                    {new Date(file.timestamp).toLocaleTimeString("en-GB", {
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </>
              )}
              {file.size && (
                <>
                  <span className="opacity-30">·</span>
                  <span>{formatFileSize(file.size)}</span>
                </>
              )}
            </p>
          </div>

          {/* Waveform + time */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <WaveformBars playing={isPlaying} />
            <span className="text-[11px] text-white/35 font-mono tabular-nums">{displayTime}</span>
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div
          ref={progressBarRef}
          onClick={handleProgressClick}
          className="h-[3px] bg-white/8 rounded-full cursor-pointer overflow-hidden"
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${isPlaying ? "bg-[#f7cc1c]" : "bg-white/20"}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* ── Action drawer: retrigger button / transcript ── */}
        {showDrawer && (
          <ActionDrawer
            status={resultStatus}
            retriggerState={retriggerState}
            retriggerError={retriggerError}
            onRetrigger={handleRetrigger}
            onDismiss={() => setRetriggerState("idle")}
            resultDetail={resultDetail}
            showTranscript={showTranscript}
            onToggleTranscript={() => setShowTranscript(p => !p)}
          />
        )}
      </div>
    </div>
  );
};

export default AudioCard;