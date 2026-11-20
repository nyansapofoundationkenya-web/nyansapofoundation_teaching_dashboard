"use client";
import { QUESTION_TYPE_META } from "./renderers";

export default function QuestionTypePicker({ open, onClose, onPick }) {
  if (!open) return null;
  const groups = {};
  Object.entries(QUESTION_TYPE_META).forEach(([type, meta]) => {
    (groups[meta.group] ||= []).push([type, meta]);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
    >
      <div className="w-full max-w-2xl bg-background-light rounded-3xl p-6 shadow-2xl border border-background-lighter max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-foreground">Add a question</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-foreground text-sm"
          >
            Close
          </button>
        </div>

        <div className="space-y-5">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                {group}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {items.map(([type, meta]) => (
                  <button
                    key={type}
                    onClick={() => onPick(type)}
                    className="text-left px-3 py-3 rounded-xl bg-background-lighter border border-gray-600 hover:border-primary-3 hover:bg-primary-3/5 transition-all text-sm text-foreground"
                  >
                    {meta.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}