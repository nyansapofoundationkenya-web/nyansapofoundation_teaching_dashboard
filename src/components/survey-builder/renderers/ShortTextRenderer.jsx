"use client";
export default function ShortTextRenderer({ question, value, onChange, disabled }) {
  const { placeholder = "", max_length } = question.config ?? {};
  return (
    <input
      type="text"
      value={value ?? ""}
      disabled={disabled}
      maxLength={max_length || undefined}
      placeholder={placeholder || "Your answer"}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full px-4 py-3 bg-background-lighter border border-gray-600 rounded-xl text-sm text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-3 disabled:opacity-60"
    />
  );
}