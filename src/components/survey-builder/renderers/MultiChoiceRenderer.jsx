"use client";
import { useMemo } from "react";
export default function MultiChoiceRenderer({ question, value, onChange, disabled }) {
  const selected = new Set(value?.option_ids || []);
  const options = useMemo(() => {
    const ordered = [...(question.options ?? [])].sort((a, b) => a.position - b.position);
    if (question.config?.randomize_options) {
      for (let i = ordered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
      }
    }
    return ordered;
  }, [question.options, question.config?.randomize_options]);
  const toggle = (id) => {
    const next = new Set(selected);
    const isSelected = next.has(id);
    const maximum = Number(question.config?.max_select);
    if (!isSelected && question.config?.max_select != null && next.size >= maximum) return;
    isSelected ? next.delete(id) : next.add(id);
    const hasOther = question.options?.some((option) => next.has(option.id) && option.is_other);
    onChange({
      option_ids: Array.from(next),
      ...(hasOther ? { other_text: value?.other_text ?? "" } : {}),
    });
  };
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt.id}
          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
            selected.has(opt.id)
              ? "bg-primary-3/10 border-primary-3/50"
              : "bg-background-lighter border-gray-600 hover:border-gray-500"
          }`}
        >
          <input
            type="checkbox"
            checked={selected.has(opt.id)}
            onChange={() => toggle(opt.id)}
            disabled={
              disabled ||
              (question.config?.max_select != null &&
                selected.size >= Number(question.config.max_select) &&
                !selected.has(opt.id))
            }
            className="accent-primary-3"
          />
          <span className="text-sm text-foreground">{opt.label}</span>
        </label>
      ))}
      {question.options?.some((option) => selected.has(option.id) && option.is_other) && (
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