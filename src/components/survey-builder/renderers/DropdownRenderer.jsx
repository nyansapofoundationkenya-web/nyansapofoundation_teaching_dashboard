"use client";
import { useMemo, useState } from "react";
export default function DropdownRenderer({ question, value, onChange, disabled }) {
  const [search, setSearch] = useState("");
  const orderedOptions = useMemo(() => {
    const ordered = [...(question.options ?? [])].sort((a, b) => a.position - b.position);
    if (question.config?.randomize_options) {
      for (let i = ordered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
      }
    }
    return ordered;
  }, [question.options, question.config?.randomize_options]);
  const options = useMemo(() => orderedOptions.filter((option) =>
    !question.config?.searchable ||
    String(option.label ?? "").toLowerCase().includes(search.toLowerCase())
  ), [orderedOptions, question.config?.searchable, search]);
  return (
    <div className="space-y-2">
      {question.config?.searchable && (
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          disabled={disabled}
          placeholder="Search choices"
          className="w-full rounded-xl border border-gray-600 bg-background-lighter px-4 py-2 text-sm text-foreground"
        />
      )}
      <select
        value={value?.option_id || ""}
        onChange={(e) => {
          const option = question.options?.find((item) => item.id === e.target.value);
          onChange({
            option_id: e.target.value || null,
            ...(option?.is_other ? { other_text: value?.other_text ?? "" } : {}),
          });
        }}
        disabled={disabled}
        className="w-full px-4 py-3 bg-background-lighter border border-gray-600 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary-3"
      >
        <option value="">Select…</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>{opt.label}</option>
        ))}
      </select>
      {question.options?.some((option) => option.id === value?.option_id && option.is_other) && (
        <input
          type="text"
          value={value?.other_text ?? ""}
          onChange={(event) => onChange({ ...value, other_text: event.target.value })}
          disabled={disabled}
          placeholder="Please specify"
          className="w-full rounded-lg border border-gray-600 bg-background-lighter px-3 py-2 text-sm text-foreground"
        />
      )}
    </div>
  );
}