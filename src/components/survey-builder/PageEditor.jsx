"use client";

import { useEffect, useState } from "react";
import FlowLogicEditor from "./FlowLogicEditor";

export default function PageEditor({
  page,
  pages,
  visibilityQuestions,
  routeQuestions,
  onChange,
  canEdit,
}) {
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  useEffect(() => {
    setDraftTitle(page?.title ?? "");
    setDraftDescription(page?.description ?? "");
  }, [page?.id, page?.title, page?.description]);

  if (!page) {
    return (
      <aside className="w-80 shrink-0 rounded-2xl border border-background-lighter bg-background-light p-5 text-center text-sm text-gray-500">
        Select a page to edit its title and flow.
      </aside>
    );
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-background-lighter bg-background-light">
      <div className="border-b border-background-lighter p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500">Page settings</p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">
          {page.title || "Untitled page"}
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <Field label="Page title">
          <input
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onBlur={() => {
              if (draftTitle !== (page.title ?? "")) onChange({ title: draftTitle });
            }}
            disabled={!canEdit}
            className="page-input"
            maxLength={80}
          />
        </Field>
        <Field label="Page description">
          <textarea
            rows={3}
            value={draftDescription}
            onChange={(event) => setDraftDescription(event.target.value)}
            onBlur={() => {
              if (draftDescription !== (page.description ?? "")) {
                onChange({ description: draftDescription });
              }
            }}
            disabled={!canEdit}
            className="page-input"
            maxLength={500}
          />
        </Field>

        <label className="flex items-center gap-2 text-xs text-foreground">
          <input
            type="checkbox"
            checked={page.randomize_questions === true}
            onChange={(event) => onChange({ randomize_questions: event.target.checked })}
            disabled={!canEdit}
            className="accent-primary-3"
          />
          Randomize questions on this page
        </label>

        <FlowLogicEditor
          mode="page"
          logic={page.logic}
          onChange={(logic) => onChange({ logic })}
          questions={routeQuestions}
          visibilityQuestions={visibilityQuestions}
          routeQuestions={routeQuestions}
          pages={pages}
          currentPageId={page.id}
          disabled={!canEdit}
        />

        {!canEdit && (
          <p className="text-xs text-yellow-400/80">You have read-only access to this survey.</p>
        )}
      </div>

      <style jsx>{`
        .page-input {
          width: 100%;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: inherit;
          font-size: 13px;
          outline: none;
        }
        .page-input:focus {
          border-color: #f7cc1c;
          box-shadow: 0 0 0 2px rgba(247, 204, 28, 0.15);
        }
      `}</style>
    </aside>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}
