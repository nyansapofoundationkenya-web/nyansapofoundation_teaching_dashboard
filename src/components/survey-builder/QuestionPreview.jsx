"use client";
import { QUESTION_RENDERERS } from "./renderers";

export default function QuestionPreview({ question, value, onChange }) {
  const Renderer = QUESTION_RENDERERS[question.type];
  if (!Renderer) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">
        Unknown question type: {question.type}
      </div>
    );
  }
  const isLayout = question.type === "section" || question.type === "info";

  return (
    <div className="rounded-2xl bg-background-light border border-background-lighter p-5">
      {!isLayout && (
        <>
          <p className="text-sm font-semibold text-foreground mb-1">
            {question.text || <span className="text-gray-500">Untitled</span>}
            {question.required && <span className="text-red-400 ml-1">*</span>}
          </p>
          {question.description && (
            <p className="text-xs text-gray-400 mb-3">{question.description}</p>
          )}
        </>
      )}
      <Renderer
        question={question}
        value={value}
        onChange={onChange}
        disabled={false}
      />
    </div>
  );
}