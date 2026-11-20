// @/components/assessments/AssessmentNameStep.jsx
"use client";

import StepProgress from "./StepProgress";

export default function AssessmentNameStep({ formData, setFormData, step }) {
  const MAX_LENGTH = 20;

  const handleNameChange = (e) => {
    // Strip numbers and special characters in real time.
    // Only letters (a-z, A-Z) and spaces are allowed through.
    const cleaned = e.target.value.replace(/[^a-zA-Z\s]/g, "");
    // Enforce max length
    const trimmed = cleaned.slice(0, MAX_LENGTH);
    setFormData((prev) => ({ ...prev, assessmentName: trimmed }));
  };

  const remaining = MAX_LENGTH - (formData.assessmentName?.length || 0);
  const isAtLimit = remaining === 0;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <StepProgress step={step} />

        <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
          Name Your Assessment
        </h3>
        <p className="text-sm text-gray-400 mb-6 text-center">
          Enter a name for this assessment. It will be combined with school names
          to create unique assessment names.
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-3">
          Assessment Name *
        </label>
        <input
          type="text"
          value={formData.assessmentName}
          onChange={handleNameChange}
          placeholder="e.g., Term One Math"
          maxLength={MAX_LENGTH}
          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-2 text-foreground bg-background-lighter transition-colors ${
            isAtLimit ? "border-yellow-500" : "border-gray-500"
          }`}
          required
        />

        {/* Character counter */}
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-400">
            Letters and spaces only — no numbers or special characters.
          </p>
          <p
            className={`text-xs font-medium ${
              isAtLimit ? "text-yellow-400" : "text-gray-400"
            }`}
          >
            {formData.assessmentName?.length || 0}/{MAX_LENGTH}
          </p>
        </div>

        {isAtLimit && (
          <p className="text-xs text-yellow-400 mt-1">
            Maximum {MAX_LENGTH} characters reached.
          </p>
        )}
      </div>

      <div className="bg-primary-2/20 border border-primary-2/30 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-primary-2 mb-2">Example:</h4>
        <p className="text-sm text-foreground">
          If you enter{" "}
          <span className="font-semibold text-primary-2">"Term One"</span> and
          select a school named{" "}
          <span className="font-semibold text-primary-2">
            "Kitende Primary"
          </span>
          , the assessment will be named:
        </p>
        <div className="mt-2 p-3 bg-background-light rounded-lg border border-gray-600">
          <code className="text-primary-2 font-mono">
            {formData.assessmentName
              ? `${formData.assessmentName}_Kitende_Primary`
              : "Term_One_Kitende_Primary"}
          </code>
        </div>
      </div>
    </div>
  );
}