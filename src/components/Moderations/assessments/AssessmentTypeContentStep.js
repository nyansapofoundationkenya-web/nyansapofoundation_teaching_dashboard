// @/components/assessments/AssessmentTypeContentStep.jsx
"use client";

import { useState } from "react";
import StepProgress from "./StepProgress";
import AssessmentPreview from "./AssessmentPreview";
import FullAssessmentViewer from "./FullAssessmentViewer";

// ── Letter / Word selector ─────────────────────────────────────
function ItemSelector({ label, emoji, items, selected, onToggle, max, bgClass, borderClass, textClass }) {
  const atCap = selected.length >= max;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span>{emoji}</span>
          {label}
        </h5>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
            atCap
              ? "bg-primary-3/20 border-primary-3/40 text-primary-3"
              : "bg-background-lighter border-gray-600 text-gray-400"
          }`}>
            {selected.length} / {max} selected
          </span>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => selected.forEach(onToggle)}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {atCap && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-primary-3/10 border border-primary-3/30 rounded-lg">
          <svg className="w-4 h-4 text-primary-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-primary-3">
            Maximum of {max} reached. Deselect one to choose a different item.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => {
          const isSelected = selected.includes(item);
          const isDisabled = atCap && !isSelected;

          return (
            <button
              key={idx}
              type="button"
              disabled={isDisabled}
              onClick={() => onToggle(item)}
              className={`
                px-3 py-2 rounded-xl font-bold text-lg border-2 transition-all duration-150 select-none
                ${isSelected
                  ? `${bgClass} ${borderClass} ${textClass} shadow-md ring-2 ring-offset-1 ring-offset-background-lighter ring-current`
                  : isDisabled
                    ? "bg-background border-gray-700 text-gray-600 cursor-not-allowed opacity-40"
                    : `bg-background-lighter border-gray-600 text-gray-300 hover:${bgClass} hover:${borderClass} hover:${textClass} cursor-pointer`
                }
              `}
            >
              {isSelected && <span className="mr-1 text-xs align-middle">✓</span>}
              {item}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-gray-500">Selected:</span>
          {selected.map((item, idx) => (
            <span
              key={idx}
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${bgClass} ${borderClass} ${textClass}`}
            >
              {item}
              <button
                type="button"
                onClick={() => onToggle(item)}
                className="ml-0.5 hover:opacity-70 transition-opacity"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AssessmentTypeContentStep({
  formData,
  setFormData,
  currentAssessment,
  loadingAssessment,
  noContentAvailable,
  availableAssessmentNumbers,
  minAssessmentNumber,
  maxAssessmentNumber,
  nextAssessment,
  prevAssessment,
  selectedLetters,
  selectedWords,
  toggleLetter,
  toggleWord,
  step,
}) {
  const [showFullViewer, setShowFullViewer] = useState(false);

  const getDisplayRange = () => {
    if (availableAssessmentNumbers.length === 0) return "0-0";
    return `${minAssessmentNumber}-${maxAssessmentNumber}`;
  };

  const showLetterWordPicker =
    formData.type === "Literacy" &&
    currentAssessment &&
    !noContentAvailable &&
    (
      (currentAssessment.letters?.length ?? 0) > 5 ||
      (currentAssessment.words?.length ?? 0) > 5
    );

  return (
    <div className="space-y-6">
      <StepProgress step={step} />

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
          Assessment Content
        </h3>
        <p className="text-sm text-gray-400 mb-6 text-center">
          Choose the type of assessment and the content to use.
        </p>
      </div>

      {/* Assessment Type */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-3">
          Assessment Type *
        </label>
        <div className="grid grid-cols-2 gap-4">
          {["Numeracy", "Literacy"].map((t) => (
            <label
              key={t}
              className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border-2 ${
                formData.type === t
                  ? "bg-primary-2/10 border-primary-2/50 shadow-md"
                  : "bg-background-lighter border-gray-600 hover:bg-background-light"
              }`}
            >
              <input
                type="radio"
                value={t}
                checked={formData.type === t}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value,
                    assessmentNumber: null,
                  }))
                }
                className="w-4 h-4 text-primary-2 bg-background-lighter border-gray-500 focus:ring-primary-2 focus:ring-2"
              />
              <span className="ml-3 text-sm font-medium text-foreground">{t}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Assessment Content Selection */}
      <div className="bg-primary-2/20 border border-primary-2/30 rounded-xl p-6 mb-6">
        <label className="block text-sm font-semibold text-primary-2 mb-3">
          Choose Assessment Content
          <span className="ml-2 text-xs font-normal text-primary-2">
            (Organization-specific)
          </span>
        </label>

        {noContentAvailable ? (
          <div className="text-center py-6">
            <svg className="w-12 h-12 mx-auto text-yellow-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-yellow-400 mb-2">
              No assessment content available for your organization
            </p>
            <p className="text-xs text-gray-400">
              Please contact your administrator to create assessment content first
            </p>
          </div>
        ) : availableAssessmentNumbers.length === 0 ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-2 mx-auto mb-3"></div>
            <p className="text-sm text-gray-400">Loading assessment content...</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-primary-2 mb-6">
              Preview and select the assessment content available for your organization.
            </p>
            <div className="flex items-center justify-between space-x-4">
              <button
                type="button"
                onClick={prevAssessment}
                disabled={
                  formData.assessmentNumber <= minAssessmentNumber ||
                  formData.assessmentNumber === null
                }
                className="flex items-center px-5 py-3 bg-primary-2 text-white rounded-xl hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <div className="text-center flex-1 mx-4">
                <span className="text-lg font-bold text-primary-2 block">
                  {formData.type} Assessment #{formData.assessmentNumber || "Not Selected"}
                </span>
                <div className="text-sm text-primary-2 mt-1">
                  Available: {getDisplayRange()}{" "}
                  {formData.assessmentNumber !== null && `(Current: ${formData.assessmentNumber})`}
                </div>
              </div>
              <button
                type="button"
                onClick={nextAssessment}
                disabled={
                  formData.assessmentNumber >= maxAssessmentNumber ||
                  formData.assessmentNumber === null
                }
                className="flex items-center px-5 py-3 bg-primary-2 text-white rounded-xl hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
              >
                Next
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Letter & Word Picker (Literacy only) ───────────────── */}
      {showLetterWordPicker && (
        <div className="border-2 border-primary-2/30 rounded-xl p-6 bg-background-light mb-6 space-y-6">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-primary-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="text-base font-semibold text-foreground">
              Select Assessment Items
            </h3>
          </div>

          <p className="text-xs text-gray-400">
            Choose up to <span className="text-primary-2 font-semibold">5 letters</span> and{" "}
            <span className="text-secondary-2 font-semibold">5 words</span> to include in this assessment.
            These will be saved as the assessment content for the selected schools.
          </p>

          {(currentAssessment.letters?.length ?? 0) > 5 && (
            <ItemSelector
              label={
                currentAssessment.language === "swahili"
                  ? "Silabi za Kutambua (Select up to 5)"
                  : "Letters to Identify (Select up to 5)"
              }
              emoji="🔤"
              items={currentAssessment.letters}
              selected={selectedLetters}
              onToggle={toggleLetter}
              max={5}
              bgClass="bg-primary-2/20"
              borderClass="border-primary-2/50"
              textClass="text-primary-2"
            />
          )}

          {(currentAssessment.words?.length ?? 0) > 5 && (
            <ItemSelector
              label={
                currentAssessment.language === "swahili"
                  ? "Maneno ya Kusoma (Select up to 5)"
                  : "Words to Read (Select up to 5)"
              }
              emoji="📝"
              items={currentAssessment.words}
              selected={selectedWords}
              onToggle={toggleWord}
              max={5}
              bgClass="bg-secondary-2/20"
              borderClass="border-secondary-2/50"
              textClass="text-secondary-2"
            />
          )}

          {(selectedLetters.length > 0 || selectedWords.length > 0) && (
            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Letters:</span>
                <span className="text-xs font-semibold text-primary-2">
                  {selectedLetters.length > 0 ? selectedLetters.join(", ") : "None"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Words:</span>
                <span className="text-xs font-semibold text-secondary-2">
                  {selectedWords.length > 0 ? selectedWords.join(", ") : "None"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assessment Preview */}
      {!noContentAvailable && currentAssessment && (
        <div className="border-2 border-primary-2/30 rounded-xl p-6 bg-background-light mb-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-foreground">
              Assessment Preview
            </h3>
            <button
              type="button"
              onClick={() => setShowFullViewer(true)}
              className="px-4 py-2 bg-primary-2 hover:bg-blue-400 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Full Assessment
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto scrollbar-hide">
            <AssessmentPreview
              currentAssessment={currentAssessment}
              loadingAssessment={loadingAssessment}
              type={formData.type}
            />
          </div>
        </div>
      )}

      {showFullViewer && (
        <FullAssessmentViewer
          assessment={currentAssessment}
          type={formData.type}
          onClose={() => setShowFullViewer(false)}
        />
      )}
    </div>
  );
}