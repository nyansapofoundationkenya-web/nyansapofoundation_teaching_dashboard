// @/components/assessments/AssessmentScheduleStep.jsx
"use client";

import StepProgress from "./StepProgress";
import { computeEndDate } from "./scheduleUtils";

export default function AssessmentScheduleStep({ formData, setFormData, step }) {
  const today = new Date().toISOString().split("T")[0];

  const setDurationMode = (mode) => {
    setFormData((prev) => ({ ...prev, durationMode: mode }));
  };

  const endDate = computeEndDate(formData);

  return (
    <div className="space-y-6">
      <StepProgress step={step} />

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
          Schedule
        </h3>
        <p className="text-sm text-gray-400 mb-6 text-center">
          Set when this assessment should start and how long it should run.
        </p>
      </div>

      {/* Start date */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-3">
          When should this assessment start? *
        </label>
        <div className="relative">
          <input
            type="date"
            value={formData.to_be_done}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, to_be_done: e.target.value }))
            }
            min={today}
            className="w-full px-4 py-3 border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-2 text-foreground bg-background-lighter transition-colors"
            required
            style={{ colorScheme: "dark", position: "relative", zIndex: 10 }}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
            onClick={(e) =>
              e.currentTarget.previousElementSibling?.showPicker?.()
            }
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Duration */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-3">
          How long will this assessment take?
        </label>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            type="button"
            onClick={() => setDurationMode("days")}
            className={`p-4 rounded-xl border-2 text-sm font-medium transition-all text-left ${
              formData.durationMode === "days"
                ? "bg-primary-2/10 border-primary-2/50 text-primary-2"
                : "bg-background-lighter border-gray-600 text-gray-300 hover:bg-background-light"
            }`}
          >
            <span className="block font-semibold">Set number of days</span>
            <span className="block text-xs text-gray-400 mt-1">
              e.g. "this should take 7 days"
            </span>
          </button>
          <button
            type="button"
            onClick={() => setDurationMode("date")}
            className={`p-4 rounded-xl border-2 text-sm font-medium transition-all text-left ${
              formData.durationMode === "date"
                ? "bg-primary-2/10 border-primary-2/50 text-primary-2"
                : "bg-background-lighter border-gray-600 text-gray-300 hover:bg-background-light"
            }`}
          >
            <span className="block font-semibold">Pick an end date</span>
            <span className="block text-xs text-gray-400 mt-1">
              e.g. "must be done by June 30"
            </span>
          </button>
        </div>

        {formData.durationMode === "date" ? (
          <input
            type="date"
            value={formData.end_date || ""}
            min={formData.to_be_done || today}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, end_date: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-2 text-foreground bg-background-lighter transition-colors"
            style={{ colorScheme: "dark" }}
          />
        ) : (
          <input
            type="number"
            min={1}
            value={formData.duration_days || ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, duration_days: e.target.value }))
            }
            placeholder="e.g., 7"
            className="w-full px-4 py-3 border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-2 text-foreground bg-background-lighter transition-colors"
          />
        )}

        {endDate ? (
          <p className="text-xs text-gray-400 mt-2">
            Target end date: <span className="text-primary-2 font-medium">{endDate}</span>
          </p>
        ) : (
          <p className="text-xs text-gray-500 mt-2">
            Enter a duration to see the target end date.
          </p>
        )}
      </div>
    </div>
  );
}