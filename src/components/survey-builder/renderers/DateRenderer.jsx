"use client";
export default function DateRenderer({ question, value, onChange, disabled }) {
  const { min_date, max_date } = question.config ?? {};
  return (
    <input
      type="date"
      value={value ?? ""}
      disabled={disabled}
      min={min_date ?? undefined}
      max={max_date ?? undefined}
      onChange={(e) => onChange?.(e.target.value || null)}
      className="px-4 py-3 bg-background-lighter border border-gray-600 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-3 disabled:opacity-60"
    />
  );
}