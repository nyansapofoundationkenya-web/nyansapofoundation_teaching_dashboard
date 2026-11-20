"use client";
export default function LongTextRenderer({ question, value, onChange, disabled }) {
  const { placeholder = "", max_length, rows = 4 } = question.config ?? {};
  return (
    <textarea
      value={value ?? ""}
      disabled={disabled}
      rows={rows}
      maxLength={max_length || undefined}
      placeholder={placeholder || "Your answer"}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full px-4 py-3 bg-background-lighter border border-gray-600 rounded-xl text-sm text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-3 resize-y disabled:opacity-60"
    />
  );
}