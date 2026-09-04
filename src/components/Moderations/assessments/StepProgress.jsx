// @/components/assessments/StepProgress.jsx
"use client";

import { STEPS } from "./stepsConfig";

export default function StepProgress({ step }) {
  return (
    <div className="flex items-center justify-center mb-8 overflow-x-auto">
      <div className="flex items-center">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  step > s.id
                    ? "bg-primary-2"
                    : step === s.id
                    ? "bg-primary-2 ring-2 ring-primary-2/40"
                    : "bg-gray-600"
                }`}
              >
                {step > s.id ? (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span
                    className={`font-semibold text-sm ${
                      step === s.id ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {s.id}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 whitespace-nowrap">
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-6 sm:w-10 mx-1 transition-colors ${
                  step > s.id ? "bg-primary-2" : "bg-gray-600"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}