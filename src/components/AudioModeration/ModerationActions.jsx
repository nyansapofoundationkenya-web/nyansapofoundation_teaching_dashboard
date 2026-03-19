"use client";

import { useState } from "react";
import { Edit3, Trash2, CheckCircle2, XCircle, Flag, Check, ChevronDown, Loader2 } from "lucide-react";

const FLAG_REASONS = [
  { id: "audio_quality",          label: "Audio Quality Issues",      description: "Recording was too noisy, clipped, or too quiet to hear clearly" },
  { id: "environmental_interference", label: "Environmental Interference", description: "Background noise, echo, or other sounds disrupted the recording" },
  { id: "scoring_discrepancy",    label: "Scoring Discrepancy",       description: "The transcript looks correct but the student was still marked wrong" },
  { id: "learner_identification", label: "Wrong Student Audio",       description: "The audio does not match this student — may belong to someone else" },
  { id: "multiple_speakers",      label: "Multiple Speakers",         description: "A teacher, parent, or another person's voice is mixed into the recording" },
  { id: "incomplete_attempt",     label: "Incomplete Attempt",        description: "The student started but stopped before finishing — recording cuts off" },
  { id: "dialect_accent_mismatch", label: "Accent Not Recognised",   description: "The student's accent or dialect confused the model's transcription" },
  { id: "border_case",            label: "Close But Marked Wrong",    description: "The student's answer was almost correct but the model penalised them" },
  { id: "low_confidence",         label: "Uncertain Transcription",   description: "The model was not confident in what it heard — result may be unreliable" },
];

export default function ModerationActions({
  editMode,
  setEditMode,
  onCorrect,
  onIncorrect,
  onSaveEdit,
  onDeleteRound,
  onConfirmModeration,
  disabled = false,
  isFlagged = false,
  existingFlagReasons = [],
  onSaveFlagReasons,
  savingFlagReasons,
  hasMadeDecision = false,
  currentPassedStatus,
}) {
  const [selectedReasons, setSelectedReasons] = useState(existingFlagReasons);
  const [reasonsPanelOpen, setReasonsPanelOpen] = useState(false);

  const handleToggleReason = async (id) => {
    const updated = selectedReasons.includes(id)
      ? selectedReasons.filter(r => r !== id)
      : [...selectedReasons, id];
    setSelectedReasons(updated);
    if (!onSaveFlagReasons) return;
    const hasChanges =
      JSON.stringify([...updated].sort()) !== JSON.stringify([...existingFlagReasons].sort());
    if (hasChanges) await onSaveFlagReasons(updated);
  };

  // Already moderated state
  if (disabled) {
    return (
      <div className="flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl border"
        style={{ background: 'rgba(76,175,80,0.08)', borderColor: 'rgba(76,175,80,0.25)' }}
      >
        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(76,175,80,0.2)' }}>
          <Check size={11} style={{ color: 'var(--secondary-2)' }} />
        </div>
        <span className="text-sm font-semibold" style={{ color: 'var(--secondary-2)' }}>Moderated</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">

      {/* Flag reasons panel */}
      {isFlagged && (
        <div className="rounded-2xl border overflow-hidden"
          style={{ background: 'rgba(230,126,34,0.06)', borderColor: 'rgba(230,126,34,0.25)' }}
        >
          <button
            onClick={() => setReasonsPanelOpen(p => !p)}
            className="w-full flex items-center justify-between px-4 py-3 transition-colors"
            style={{ background: reasonsPanelOpen ? 'rgba(230,126,34,0.1)' : 'transparent' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(230,126,34,0.2)' }}
              >
                <Flag size={13} style={{ color: 'var(--secondary-1)' }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: 'var(--secondary-1)' }}>Why was this marked incorrect?</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {selectedReasons.length > 0
                    ? `${selectedReasons.length} reason${selectedReasons.length > 1 ? 's' : ''} selected`
                    : 'Select why this was flagged'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedReasons.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(230,126,34,0.25)', color: 'var(--secondary-1)' }}
                >
                  {selectedReasons.length}
                </span>
              )}
              <ChevronDown
                size={14}
                style={{ color: 'rgba(255,255,255,0.3)', transform: reasonsPanelOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              />
            </div>
          </button>

          {reasonsPanelOpen && (
            <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: 'rgba(230,126,34,0.15)' }}>
              <div className="grid grid-cols-1 gap-1.5 mt-2">
                {FLAG_REASONS.map(({ id, label, description }) => {
                  const isSelected = selectedReasons.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => handleToggleReason(id)}
                      disabled={savingFlagReasons}
                      className="w-full text-left px-3 py-2.5 rounded-xl border transition-all disabled:opacity-50"
                      style={{
                        background: isSelected ? 'rgba(230,126,34,0.15)' : 'rgba(255,255,255,0.03)',
                        borderColor: isSelected ? 'rgba(230,126,34,0.5)' : 'rgba(255,255,255,0.07)',
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all"
                          style={{
                            background: isSelected ? 'var(--secondary-1)' : 'transparent',
                            borderColor: isSelected ? 'var(--secondary-1)' : 'rgba(255,255,255,0.2)',
                          }}
                        >
                          {isSelected && <Check size={10} color="white" />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: isSelected ? 'var(--secondary-1)' : 'rgba(255,255,255,0.75)' }}>
                            {label}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            {description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {savingFlagReasons && (
                <div className="flex items-center gap-1.5 mt-3">
                  <Loader2 size={11} className="animate-spin" style={{ color: 'var(--secondary-1)' }} />
                  <p className="text-xs" style={{ color: 'rgba(230,126,34,0.6)' }}>Saving…</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-4 gap-2">

        {/* Edit / Save */}
        {editMode ? (
          <button
            onClick={onSaveEdit}
            className="col-span-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border transition-all group"
            style={{ background: 'rgba(90,162,206,0.12)', borderColor: 'rgba(90,162,206,0.35)' }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'rgba(90,162,206,0.2)' }}
            >
              <Check size={15} style={{ color: 'var(--primary-2)' }} />
            </div>
            <span className="text-xs font-semibold" style={{ color: 'var(--primary-2)' }}>Save</span>
          </button>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="col-span-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border transition-all"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.09)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            >
              <Edit3 size={14} style={{ color: 'rgba(255,255,255,0.6)' }} />
            </div>
            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Edit</span>
          </button>
        )}

        {/* Correct */}
        <button
          onClick={onCorrect}
          className="col-span-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border transition-all"
          style={{
            background: currentPassedStatus === true ? 'rgba(76,175,80,0.18)' : 'rgba(76,175,80,0.06)',
            borderColor: currentPassedStatus === true ? 'rgba(76,175,80,0.6)' : 'rgba(76,175,80,0.2)',
            boxShadow: currentPassedStatus === true ? '0 0 0 3px rgba(76,175,80,0.12)' : 'none',
          }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: currentPassedStatus === true ? 'rgba(76,175,80,0.25)' : 'rgba(76,175,80,0.1)' }}
          >
            <CheckCircle2 size={15} style={{ color: 'var(--secondary-2)' }} />
          </div>
          <span className="text-xs font-semibold" style={{ color: 'var(--secondary-2)' }}>Correct</span>
        </button>

        {/* Incorrect */}
        <button
          onClick={onIncorrect}
          className="col-span-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border transition-all"
          style={{
            background: currentPassedStatus === false ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.06)',
            borderColor: currentPassedStatus === false ? 'rgba(239,68,68,0.6)' : 'rgba(239,68,68,0.2)',
            boxShadow: currentPassedStatus === false ? '0 0 0 3px rgba(239,68,68,0.12)' : 'none',
          }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: currentPassedStatus === false ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.1)' }}
          >
            <XCircle size={15} style={{ color: '#ef4444' }} />
          </div>
          <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>Incorrect</span>
        </button>

        {/* Delete */}
        <button
          onClick={onDeleteRound}
          disabled={editMode}
          className="col-span-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.09)' }}
          onMouseEnter={e => { if (!editMode) { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'; e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; }}}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <Trash2 size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
          </div>
          <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>Delete</span>
        </button>
      </div>

      {/* Confirm button */}
      {hasMadeDecision && (
        <button
          onClick={onConfirmModeration}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold text-sm transition-all"
          style={{
            background: 'rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.85)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.11)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
          }}
        >
          <div className="w-5 h-5 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            <Check size={12} color="white" />
          </div>
          Confirm Moderation
        </button>
      )}
    </div>
  );
}