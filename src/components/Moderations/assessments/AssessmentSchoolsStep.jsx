// @/components/assessments/AssessmentSchoolsStep.jsx
"use client";

import StepProgress from "./StepProgress";

export default function AssessmentSchoolsStep({
  formData,
  schools,
  students,
  studentsLoading,
  toggleSchool,
  selectAllSchools,
  setSelectAllSchools,
  createWithoutStudents,
  setCreateWithoutStudents,
  step,
}) {
  return (
    <div className="space-y-6">
      <StepProgress step={step} />

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
          Select Schools
        </h3>
        <p className="text-sm text-gray-400 mb-6 text-center">
          Pick which schools will receive this assessment.
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-3">
          Schools *
          <span className="ml-2 text-xs text-gray-400">(Using student list)</span>
        </label>

        {!formData.projectId ? (
          <div className="text-center py-8 bg-background-lighter rounded-xl border border-gray-600">
            <svg className="w-12 h-12 mx-auto text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-sm text-gray-400">
              Please select a project first to load schools
            </p>
          </div>
        ) : schools.length === 0 ? (
          <div className="text-center py-8 bg-background-lighter rounded-xl border border-gray-600">
            <svg className="w-12 h-12 mx-auto text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-gray-400">
              No schools found for this project
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background-lighter rounded-xl border border-gray-600">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-2/20 text-primary-2 text-sm font-medium px-3 py-1 rounded-lg">
                  {formData.schoolIds.length} selected
                </div>
                <span className="text-sm text-gray-300">
                  of {schools.length} schools
                </span>
              </div>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={selectAllSchools}
                    onChange={(e) => setSelectAllSchools(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${selectAllSchools ? "bg-primary-2" : "bg-gray-600"}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${selectAllSchools ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-primary-2 transition-colors">
                  Select All
                </span>
              </label>
            </div>

            {/* Toggle for creating empty assessments */}
            <div className="flex items-center justify-between p-4 bg-primary-2/10 rounded-xl border border-primary-2/30">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-primary-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-sm text-foreground">Create empty assessments (no students)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={createWithoutStudents}
                  onChange={(e) => setCreateWithoutStudents(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-primary-2 peer-focus:ring-2 peer-focus:ring-primary-2 transition-all">
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${createWithoutStudents ? 'translate-x-5' : ''}`} />
                </div>
              </label>
            </div>

            <div className="max-h-72 overflow-y-auto scrollbar-hide border border-gray-600 rounded-xl bg-background-lighter p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {schools.map((school) => (
                  <label
                    key={school.id}
                    className={`flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                      formData.schoolIds.includes(school.id)
                        ? "bg-primary-2/10 border-primary-2/50 shadow-md"
                        : "bg-background-light border-gray-600 hover:bg-background-lighter hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={formData.schoolIds.includes(school.id)}
                        onChange={() => toggleSchool(school.id)}
                        className="w-4 h-4 text-primary-2 bg-background-lighter border-gray-500 rounded focus:ring-primary-2 focus:ring-2"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground truncate block">
                          {school.name}
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          {studentsLoading
                            ? "Loading..."
                            : (students[school.id]?.length || 0) + " students"}
                        </span>
                      </div>
                    </div>
                    {formData.schoolIds.includes(school.id) && (
                      <svg className="w-4 h-4 text-primary-2 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {studentsLoading && formData.schoolIds.length > 0 && (
          <div className="mt-4 p-4 bg-primary-2/10 border border-primary-2/30 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-2"></div>
              <div>
                <p className="text-sm font-medium text-primary-2">
                  Loading students for selected schools...
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  This may take a few seconds depending on the number of students
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}