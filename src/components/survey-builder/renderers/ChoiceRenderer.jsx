"use client";
import { useMemo } from "react";

export default function ChoiceRenderer({ question, value, onChange, disabled }) {
  const { type, options = [], config = {} } = question;

  const ordered = useMemo(() => {
    const list = [...options].sort((a, b) => a.position - b.position);
    if (config.randomize_options) {
      // Stable shuffle per mount is fine for preview; live can seed by response id.
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
    }
    return list;
  }, [options, config.randomize_options]);

  if (type === "dropdown") {
    return (
      <select
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value || null)}
        className="w-full px-4 py-3 bg-background-lighter border border-gray-600 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-3 disabled:opacity-60"
      >
        <option value="">Select…</option>
        {ordered.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    );
  }

  if (type === "multi_choice") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="flex flex-col gap-2">
        {ordered.map((o) => {
          const checked = selected.includes(o.id);
          return (
            <label key={o.id} className="flex items-center gap-3 p-3 rounded-xl bg-background-lighter border border-gray-600 cursor-pointer hover:border-primary-3/50 transition-colors">
              <input
                type="checkbox"
                disabled={disabled}
                checked={checked}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selected, o.id]
                    : selected.filter((id) => id !== o.id);
                  onChange?.(next);
                }}
                className="accent-primary-3"
              />
              <span className="text-sm text-foreground">{o.label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  // single_choice
  return (
    <div className="flex flex-col gap-2">
      {ordered.map((o) => {
        const checked = value === o.id;
        return (
          <label key={o.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${checked ? "bg-primary-3/10 border-primary-3/50" : "bg-background-lighter border-gray-600 hover:border-primary-3/50"}`}>
            <input
              type="radio"
              disabled={disabled}
              checked={checked}
              onChange={() => onChange?.(o.id)}
              name={`q_${question.id}`}
              className="accent-primary-3"
            />
            <span className="text-sm text-foreground">{o.label}</span>
          </label>
        );
      })}
    </div>
  );
}