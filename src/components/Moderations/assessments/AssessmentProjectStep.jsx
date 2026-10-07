// @/components/assessments/AssessmentProjectStep.jsx
"use client";

import StepProgress from "./StepProgress";

export default function AssessmentProjectStep({ formData, setFormData, projects, step }) {
  return (
    <div className="space-y-6">
      <StepProgress step={step} />

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
          Select Project
        </h3>
        <p className="text-sm text-gray-400 mb-6 text-center">
          Choose which project this assessment belongs to.
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-3">
          Project *
        </label>
        <select
          value={formData.projectId}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, projectId: e.target.value }))
          }
          className="w-full px-4 py-3 border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-2 text-foreground bg-background-lighter transition-colors"
          required
        >
          <option value="" disabled className="text-gray-400">
            Choose a project
          </option>
          {projects.map((project) => (
            <option key={project.id} value={project.id} className="text-foreground">
              {project.name}
            </option>
          ))}
        </select>

        {projects.length === 0 && (
          <p className="text-xs text-yellow-400 mt-2">
            No projects found for this organization.
          </p>
        )}
      </div>
    </div>
  );
}