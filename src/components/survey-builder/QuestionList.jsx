"use client";
import { Plus, Trash2, GripVertical, Settings2 } from "lucide-react";
import { QUESTION_TYPE_META } from "./renderers";

export default function QuestionList({
  survey,
  questionsByPage,
  selectedQuestionId,
  onSelect,
  onAddQuestion,
  onAddPage,
  onDeletePage,
  onDeleteQuestion,
  onReorder,
  canEdit,
  canDeleteQuestion,
  activePageId,
  onPageChange,
  onEditPage,
  onReorderPages,
}) {
  const orderedPages = [...(survey.pages ?? [])].sort((a, b) => a.position - b.position);

  return (
    <aside className="w-72 shrink-0 bg-background-light border border-background-lighter rounded-2xl flex flex-col overflow-hidden">
      <div className="p-3 border-b border-background-lighter">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Pages
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {orderedPages.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              draggable={canEdit}
              onDragStart={(event) => event.dataTransfer.setData("text/page-index", String(idx))}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                const from = Number(event.dataTransfer.getData("text/page-index"));
                if (Number.isInteger(from) && from !== idx) onReorderPages(from, idx);
              }}
              onClick={() => onPageChange(p.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                activePageId === p.id
                  ? "bg-primary-3 text-primary-1"
                  : "bg-background-lighter text-gray-300 hover:text-foreground"
              }`}
            >
              {p.title}
            </button>
          ))}
          {canEdit && (
            <button
              type="button"
              onClick={onAddPage}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-background-lighter text-primary-3 hover:bg-primary-3/10"
            >
              + Page
            </button>
          )}
        </div>
        {activePageId && (
          <button
            type="button"
            onClick={onEditPage}
            className="mt-2 flex items-center gap-1 text-[11px] text-gray-400 hover:text-primary-3"
          >
            <Settings2 size={12} /> Edit page title and flow
          </button>
        )}
        {canEdit && orderedPages.length > 1 && (
          <button
            onClick={() => onDeletePage(activePageId)}
            className="text-[11px] text-red-400 hover:text-red-300 mt-2"
          >
            Delete current page
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {questionsByPage(activePageId).map((q, idx) => (
          <QuestionRow
            key={q.id}
            q={q}
            idx={idx}
            isSelected={selectedQuestionId === q.id}
            onSelect={() => onSelect(q.id)}
            onDelete={() => onDeleteQuestion(q.id)}
            onReorder={onReorder}
            canDelete={canDeleteQuestion}
          />
        ))}
        {questionsByPage(activePageId).length === 0 && (
          <p className="text-xs text-gray-500 text-center py-6">
            No questions on this page yet.
          </p>
        )}
      </div>

      {canEdit && (
        <div className="p-2 border-t border-background-lighter">
          <button
            onClick={onAddQuestion}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-3 text-primary-1 font-semibold text-sm hover:bg-yellow-400 transition-all"
          >
            <Plus size={14} /> Add question
          </button>
        </div>
      )}
    </aside>
  );
}

function QuestionRow({ q, idx, isSelected, onSelect, onDelete, onReorder, canDelete }) {
  const meta = QUESTION_TYPE_META[q.type] || { label: q.type };
  return (
    <div
      onClick={onSelect}
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/idx", String(idx))}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const from = parseInt(e.dataTransfer.getData("text/idx"), 10);
        if (!Number.isNaN(from) && from !== idx) onReorder(from, idx);
      }}
      className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
        isSelected
          ? "bg-primary-3/10 border border-primary-3/40"
          : "bg-background-lighter border border-transparent hover:border-gray-600"
      }`}
    >
      <GripVertical size={14} className="text-gray-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">
          {q.text || meta.label}
        </p>
        <p className="text-[10px] text-gray-500">{meta.label}</p>
      </div>
      {canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Delete this question?")) onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}