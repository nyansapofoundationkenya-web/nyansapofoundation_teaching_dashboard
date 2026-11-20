"use client";
export default function ScaleRenderer({ question, value, onChange, disabled }) {
  const { min = 1, max = 10, labels = {} } = question.config ?? {};
  const points = [];
  for (let n = min; n <= max; n++) points.push(n);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {points.map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange?.(n)}
            className={`w-9 h-9 rounded-lg text-sm font-semibold border transition-colors ${
              value === n
                ? "bg-primary-3 text-primary-1 border-primary-3"
                : "bg-background-lighter text-foreground border-gray-600 hover:border-primary-3/50"
            } disabled:opacity-60`}
          >
            {n}
          </button>
        ))}
      </div>
      {(labels.min || labels.mid || labels.max) && (
        <div className="flex justify-between text-xs text-gray-400 px-1">
          <span>{labels.min}</span>
          <span>{labels.mid}</span>
          <span>{labels.max}</span>
        </div>
      )}
    </div>
  );
}