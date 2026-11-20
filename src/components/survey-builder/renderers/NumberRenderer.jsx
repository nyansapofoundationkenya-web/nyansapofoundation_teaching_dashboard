"use client";
export default function NumberRenderer({ question, value, onChange, disabled }) {
  const { min, max, step = 1, integer_only } = question.config ?? {};
  return (
    <input
      type="number"
      value={value ?? ""}
      disabled={disabled}
      min={min ?? undefined}
      max={max ?? undefined}
      step={integer_only ? 1 : step}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "") return onChange?.(null);
        const n = integer_only ? parseInt(raw, 10) : Number(raw);
        onChange?.(Number.isNaN(n) ? null : n);
      }}
      className="w-40 px-4 py-3 bg-background-lighter border border-gray-600 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-3 disabled:opacity-60"
    />
  );
}