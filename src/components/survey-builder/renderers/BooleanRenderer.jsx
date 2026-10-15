"use client";
export default function BooleanRenderer({ question, value, onChange, disabled }) {
  const { true_label = "Yes", false_label = "No" } = question.config ?? {};
  return (
    <div className="flex gap-2">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          type="button"
          disabled={disabled}
          onClick={() => onChange?.(v)}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
            value === v
              ? "bg-primary-3 text-primary-1 border-primary-3"
              : "bg-background-lighter text-foreground border-gray-600 hover:border-primary-3/50"
          } disabled:opacity-60`}
        >
          {v ? true_label : false_label}
        </button>
      ))}
    </div>
  );
}