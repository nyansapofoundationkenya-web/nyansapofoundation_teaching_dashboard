// @/components/assessments/AssessmentLevelStep.jsx
"use client";

import StepProgress from "./StepProgress";

export default function AssessmentLevelStep({ formData, handleLevelChange, step }) {
  return (
    <div className="space-y-6">
      <StepProgress step={step} />

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
          Assessment Level
        </h3>
        <p className="text-sm text-gray-400 mb-6 text-center">
          Choosing a level here, before picking schools, so your school
          selection won't be reset later.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {["Baseline", "Midline", "Endline"].map((lvl) => (
          <label
            key={lvl}
            className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border-2 ${
              formData.level === lvl
                ? "bg-primary-2/10 border-primary-2/50 shadow-md"
                : "bg-background-lighter border-gray-600 hover:bg-background-light"
            }`}
          >
            <input
              type="radio"
              value={lvl}
              checked={formData.level === lvl}
              onChange={(e) => handleLevelChange(e.target.value)}
              className="w-4 h-4 text-primary-2 bg-background-lighter border-gray-500 focus:ring-primary-2 focus:ring-2"
            />
            <div className="ml-3">
              <span className="text-sm font-medium text-foreground block">
                {lvl}
              </span>
              <span className="text-xs text-gray-400 mt-1">
                {lvl === "Baseline"
                  ? "Initial assessment"
                  : lvl === "Midline"
                  ? "Mid-term assessment"
                  : "Final assessment"}
              </span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}