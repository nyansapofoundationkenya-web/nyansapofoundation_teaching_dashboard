"use client";
import { useMemo } from "react";
export default function SingleChoiceRenderer({ question, value, onChange, disabled }) {
  const selected = value?.option_id;
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
  return (
    <div className={question.config?.layout === "horizontal" ? "flex flex-wrap gap-2" : "space-y-2"}>
      {options.map((opt) => (
        <label
          key={opt.id}
          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
            selected === opt.id
              ? "bg-primary-3/10 border-primary-3/50"
              : "bg-background-lighter border-gray-600 hover:border-gray-500"
          }`}
        >
          <input
            type="radio"
            name={question.id}
            checked={selected === opt.id}
            onChange={() => onChange({
              option_id: opt.id,
              ...(opt.is_other ? { other_text: value?.other_text ?? "" } : {}),
            })}
            disabled={disabled}
            className="accent-primary-3"
          />
          <span className="text-sm text-foreground">{opt.label}</span>
        </label>
      ))}
      {options.some((option) => option.id === selected && option.is_other) && (
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