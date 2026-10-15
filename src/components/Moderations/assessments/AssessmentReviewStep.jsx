// @/components/assessments/AssessmentReviewStep.jsx
"use client";

import StepProgress from "./StepProgress";
import { computeEndDate, describeDuration } from "./scheduleUtils";

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-700 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

export default function AssessmentReviewStep({
  formData,
  projects,
  schools,
  students,
  createWithoutStudents,
  selectedLetters,
  selectedWords,
  step,
}) {
  const project = projects.find((p) => p.id === formData.projectId);
  const selectedSchools = schools.filter((s) => formData.schoolIds.includes(s.id));
  const totalStudents = createWithoutStudents
    ? 0
    : formData.schoolIds.reduce((sum, id) => sum + (students[id]?.length || 0), 0);
  const endDate = computeEndDate(formData);

  return (
    <div className="space-y-6">
      <StepProgress step={step} />

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
          Review & Create
        </h3>
        <p className="text-sm text-gray-400 mb-6 text-center">
          Double-check everything below before creating the assessments.
        </p>
      </div>

      <div className="bg-background-lighter border border-gray-600 rounded-xl p-5">
        <SummaryRow label="Assessment name" value={formData.assessmentName || "—"} />
        <SummaryRow label="Project" value={project?.name || "—"} />
        <SummaryRow label="Level" value={formData.level || "—"} />
        <SummaryRow
          label="Schools"
          value={
            selectedSchools.length > 0
              ? `${selectedSchools.length} school${selectedSchools.length === 1 ? "" : "s"}`
              : "—"
          }
        />
        <SummaryRow label="Type" value={formData.type || "—"} />
        <SummaryRow
          label="Content"
          value={formData.assessmentNumber !== null ? `#${formData.assessmentNumber}` : "—"}
        />
        {formData.type === "Literacy" && (selectedLetters.length > 0 || selectedWords.length > 0) && (
          <>
            <SummaryRow
              label="Letters"
              value={selectedLetters.length > 0 ? selectedLetters.join(", ") : "Using all"}
            />
            <SummaryRow
              label="Words"
              value={selectedWords.length > 0 ? selectedWords.join(", ") : "Using all"}
            />
          </>
        )}
        <SummaryRow label="Start date" value={formData.to_be_done || "—"} />
        <SummaryRow label="Duration" value={describeDuration(formData)} />
        <SummaryRow label="Target end date" value={endDate || "—"} />
        <SummaryRow
          label="Students"
          value={createWithoutStudents ? "Creating empty (no students)" : `${totalStudents} total`}
        />
      </div>

      {selectedSchools.length > 0 && (
        <div className="bg-primary-2/10 border border-primary-2/30 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-primary-2 mb-3">Schools in this batch</h4>
          <div className="flex flex-wrap gap-2">
            {selectedSchools.map((school) => (
              <span
                key={school.id}
                className="bg-background-lighter border border-gray-600 text-foreground text-xs font-medium px-3 py-1.5 rounded-full"
              >
                {school.name}
                <span className="text-gray-400 ml-1.5">
                  ({createWithoutStudents ? 0 : students[school.id]?.length || 0})
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 text-center">
        Clicking "Create Assessments" will create one assessment per selected school.
      </p>
    </div>
  );
}