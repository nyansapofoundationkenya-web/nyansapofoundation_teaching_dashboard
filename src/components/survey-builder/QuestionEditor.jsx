"use client";
import { Copy, Plus, Trash2 } from "lucide-react";
import FlowLogicEditor from "./FlowLogicEditor";
import { newId } from "@/utils/survey/surveyDefaults";

export default function QuestionEditor({
  question,
  onChange,
  canEdit,
  canDelete,
  conditionQuestions = [],
  pages = [],
  onMove,
  onDuplicate,
}) {
  if (!question) {
    return (
      <aside className="w-80 shrink-0 bg-background-light border border-background-lighter rounded-2xl p-5 text-center text-gray-500 text-sm">
        Select a question to edit it
      </aside>
    );
  }

  const set = (patch) => onChange(question.id, patch);
  const setConfig = (patch) => set({ config: { ...question.config, ...patch } });

  const isLayout = question.type === "section" || question.type === "info";
  const isChoice = ["single_choice", "multi_choice", "dropdown"].includes(question.type);

  return (
    <aside className="w-80 shrink-0 bg-background-light border border-background-lighter rounded-2xl flex flex-col overflow-hidden">
      <div className="p-4 border-b border-background-lighter">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Question</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {question.type.replace(/_/g, " ")}
            </p>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => onDuplicate(question.id)}
              className="flex items-center gap-1 rounded-lg bg-background-lighter px-2 py-1 text-[11px] text-gray-300 hover:text-primary-3"
            >
              <Copy size={12} /> Duplicate
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Field label={question.type === "section" ? "Heading" : "Prompt"}>
          <input
            value={question.text || ""}
            onChange={(e) => set({ text: e.target.value })}
            disabled={!canEdit}
            className="input"
          />
        </Field>

        {question.type === "section" && (
          <Field label="Subtitle">
            <input
              value={question.config?.subtitle ?? ""}
              onChange={(e) => setConfig({ subtitle: e.target.value })}
              disabled={!canEdit}
              className="input"
            />
          </Field>
        )}

        {question.type !== "section" && (
          <Field label="Description / helper text">
            <textarea
              rows={2}
              value={question.description || ""}
              onChange={(e) => set({ description: e.target.value })}
              disabled={!canEdit}
              className="input"
            />
          </Field>
        )}

        {!isLayout && (
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={!!question.required}
              onChange={(e) => set({ required: e.target.checked })}
              disabled={!canEdit}
              className="accent-primary-3"
            />
            Required
          </label>
        )}

        {pages.length > 1 && (
          <Field label="Page">
            <select
              value={question.pageId}
              onChange={(event) => onMove(question.id, event.target.value)}
              disabled={!canEdit}
              className="input"
            >
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.title || "Untitled page"}
                </option>
              ))}
            </select>
          </Field>
        )}

        {/* ── Type-specific config ─────────────────────────── */}
        {question.type === "short_text" && (
          <>
            <Field label="Placeholder">
              <input
                value={question.config?.placeholder ?? ""}
                onChange={(e) => setConfig({ placeholder: e.target.value })}
                disabled={!canEdit}
                className="input"
              />
            </Field>
            <Field label="Max length">
              <input
                type="number"
                min="1"
                value={question.config?.max_length ?? ""}
                onChange={(e) => setConfig({ max_length: e.target.value === "" ? null : Number(e.target.value) })}
                disabled={!canEdit}
                className="input"
              />
            </Field>
          </>
        )}

        {question.type === "long_text" && (
          <>
            <Field label="Rows">
              <input
                type="number"
                min="2"
                value={question.config?.rows ?? 4}
                onChange={(e) => setConfig({ rows: parseInt(e.target.value, 10) || 4 })}
                disabled={!canEdit}
                className="input"
              />
            </Field>
            <Field label="Max length">
              <input
                type="number"
                min="1"
                value={question.config?.max_length ?? ""}
                onChange={(e) => setConfig({ max_length: e.target.value === "" ? null : Number(e.target.value) })}
                disabled={!canEdit}
                className="input"
              />
            </Field>
            <Field label="Placeholder">
              <input
                value={question.config?.placeholder ?? ""}
                onChange={(e) => setConfig({ placeholder: e.target.value })}
                disabled={!canEdit}
                className="input"
              />
            </Field>
          </>
        )}

        {question.type === "number" && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Min">
              <input
                type="number"
                value={question.config?.min ?? ""}
                onChange={(e) =>
                  setConfig({ min: e.target.value === "" ? null : Number(e.target.value) })
                }
                disabled={!canEdit}
                className="input"
              />
            </Field>
            <Field label="Max">
              <input
                type="number"
                value={question.config?.max ?? ""}
                onChange={(e) =>
                  setConfig({ max: e.target.value === "" ? null : Number(e.target.value) })
                }
                disabled={!canEdit}
                className="input"
              />
            </Field>
            <label className="col-span-2 flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={!!question.config?.integer_only}
                onChange={(e) => setConfig({ integer_only: e.target.checked })}
                disabled={!canEdit}
                className="accent-primary-3"
              />
              Integer only
            </label>
            <Field label="Step">
              <input
                type="number"
                min="0.01"
                value={question.config?.step ?? 1}
                onChange={(e) => setConfig({ step: Number(e.target.value) || 1 })}
                disabled={!canEdit}
                className="input"
              />
            </Field>
          </div>
        )}

        {isChoice && (
          <>
            <OptionsEditor
              options={question.options || []}
              onChange={(options) => set({ options })}
              disabled={!canEdit}
            />
            {question.type === "single_choice" && (
              <>
                <Field label="Choice layout">
                  <select
                    value={question.config?.layout ?? "vertical"}
                    onChange={(e) => setConfig({ layout: e.target.value })}
                    disabled={!canEdit}
                    className="input"
                  >
                    <option value="vertical">Vertical</option>
                    <option value="horizontal">Horizontal</option>
                  </select>
                </Field>
                <Check
                  label="Randomize choices"
                  checked={!!question.config?.randomize_options}
                  onChange={(value) => setConfig({ randomize_options: value })}
                  disabled={!canEdit}
                />
              </>
            )}
            {question.type === "multi_choice" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Minimum selections">
                    <input
                      type="number"
                      min="0"
                      value={question.config?.min_select ?? 0}
                      onChange={(e) => setConfig({ min_select: Number(e.target.value) || 0 })}
                      disabled={!canEdit}
                      className="input"
                    />
                  </Field>
                  <Field label="Maximum selections">
                    <input
                      type="number"
                      min="1"
                      value={question.config?.max_select ?? ""}
                      onChange={(e) => setConfig({ max_select: e.target.value === "" ? null : Number(e.target.value) })}
                      disabled={!canEdit}
                      className="input"
                    />
                  </Field>
                </div>
                <Check
                  label="Randomize choices"
                  checked={!!question.config?.randomize_options}
                  onChange={(value) => setConfig({ randomize_options: value })}
                  disabled={!canEdit}
                />
              </>
            )}
            {question.type === "dropdown" && (
              <>
                <Check
                  label="Allow searching choices"
                  checked={!!question.config?.searchable}
                  onChange={(value) => setConfig({ searchable: value })}
                  disabled={!canEdit}
                />
                <Check
                  label="Randomize choices"
                  checked={!!question.config?.randomize_options}
                  onChange={(value) => setConfig({ randomize_options: value })}
                  disabled={!canEdit}
                />
              </>
            )}
          </>
        )}

        {question.type === "boolean" && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="True label">
              <input
                value={question.config?.true_label || ""}
                onChange={(e) => setConfig({ true_label: e.target.value })}
                disabled={!canEdit}
                className="input"
              />
            </Field>
            <Field label="False label">
              <input
                value={question.config?.false_label || ""}
                onChange={(e) => setConfig({ false_label: e.target.value })}
                disabled={!canEdit}
                className="input"
              />
            </Field>
          </div>
        )}

        {question.type === "rating" && (
          <>
            <Field label="Maximum rating">
              <input
                type="number"
                min="2"
                max="10"
                value={question.config?.max ?? 5}
                onChange={(e) => setConfig({ max: Math.max(2, Math.min(10, Number(e.target.value) || 5)) })}
                disabled={!canEdit}
                className="input"
              />
            </Field>
            <Field label="Rating icon">
              <select
                value={question.config?.icon ?? "star"}
                onChange={(e) => setConfig({ icon: e.target.value })}
                disabled={!canEdit}
                className="input"
              >
                <option value="star">Stars</option>
                <option value="heart">Hearts</option>
                <option value="thumb">Thumbs</option>
              </select>
            </Field>
          </>
        )}

        {question.type === "scale" && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Min">
              <input
                type="number"
                value={question.config?.min ?? 1}
                onChange={(e) => setConfig({ min: parseInt(e.target.value, 10) || 1 })}
                disabled={!canEdit}
                className="input"
              />
            </Field>
            <Field label="Max">
              <input
                type="number"
                value={question.config?.max ?? 10}
                onChange={(e) => setConfig({ max: parseInt(e.target.value, 10) || 10 })}
                disabled={!canEdit}
                className="input"
              />
            </Field>
            <Field label="Low label">
              <input
                value={question.config?.labels?.min || ""}
                onChange={(e) =>
                  setConfig({ labels: { ...(question.config?.labels || {}), min: e.target.value } })
                }
                disabled={!canEdit}
                className="input"
              />
            </Field>
            <Field label="High label">
              <input
                value={question.config?.labels?.max || ""}
                onChange={(e) =>
                  setConfig({ labels: { ...(question.config?.labels || {}), max: e.target.value } })
                }
                disabled={!canEdit}
                className="input"
              />
            </Field>
            <Field label="Middle label">
              <input
                value={question.config?.labels?.mid || ""}
                onChange={(e) =>
                  setConfig({ labels: { ...(question.config?.labels || {}), mid: e.target.value } })
                }
                disabled={!canEdit}
                className="input"
              />
            </Field>
          </div>
        )}

        {question.type === "date" && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Min date">
              <input
                type="date"
                value={question.config?.min_date || ""}
                onChange={(e) => setConfig({ min_date: e.target.value || null })}
                disabled={!canEdit}
                className="input"
              />
            </Field>
            <Field label="Max date">
              <input
                type="date"
                value={question.config?.max_date || ""}
                onChange={(e) => setConfig({ max_date: e.target.value || null })}
                disabled={!canEdit}
                className="input"
              />
            </Field>
          </div>
        )}

        {question.type === "info" && (
          <Field label="Body">
            <textarea
              rows={4}
              value={question.config?.body || ""}
              onChange={(e) => setConfig({ body: e.target.value })}
              disabled={!canEdit}
              className="input"
            />
          </Field>
        )}

        {!isLayout && (
          <FlowLogicEditor
            mode="question"
            logic={question.logic}
            onChange={(logic) => set({ logic })}
            questions={conditionQuestions}
            disabled={!canEdit}
          />
        )}

        {!canEdit && (
          <p className="text-xs text-yellow-400/80">
            You have read-only access to this survey.
          </p>
        )}
        {!canDelete && canEdit && (
          <p className="text-xs text-gray-500">
            You can edit questions but not delete them.
          </p>
        )}
      </div>

      {/* Inline styles for `.input` — swap for a Tailwind class if you prefer */}
      <style jsx>{`
        .input {
          width: 100%;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: inherit;
          font-size: 13px;
          outline: none;
        }
        .input:focus {
          border-color: #f7cc1c;
          box-shadow: 0 0 0 2px rgba(247, 204, 28, 0.15);
        }
      `}</style>
    </aside>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Check({ label, checked, onChange, disabled }) {
  return (
    <label className="flex items-center gap-2 text-xs text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="accent-primary-3"
      />
      {label}
    </label>
  );
}

function OptionsEditor({ options, onChange, disabled }) {
  const update = (idx, patch) => {
    const next = options.map((o, i) => (i === idx ? { ...o, ...patch } : o));
    onChange(next);
  };
  const add = () => {
    onChange([
      ...options,
      {
      id: newId("option"),
        label: `Option ${options.length + 1}`,
      value: "",
      position: options.length,
      is_other: false,
      },
    ]);
  };
  const remove = (idx) => {
    onChange(options.filter((_, i) => i !== idx).map((o, i) => ({ ...o, position: i })));
  };

  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
        Options
      </label>
      <div className="space-y-2">
        {options.map((o, i) => (
          <div key={o.id} className="rounded-lg border border-background-lighter p-2">
            <div className="flex items-center gap-1.5">
              <input
                value={o.label}
                onChange={(e) => update(i, { label: e.target.value })}
                disabled={disabled}
                className="input"
                aria-label={`Choice ${i + 1} label`}
              />
            {!disabled && options.length > 1 && (
              <button
                onClick={() => remove(i)}
                className="text-red-400 hover:text-red-300 p-1"
                title="Remove"
              >
                <Trash2 size={12} />
              </button>
            )}
            </div>
            <input
              value={o.value ?? ""}
              onChange={(e) => update(i, { value: e.target.value })}
              disabled={disabled}
              className="input mt-1.5"
              placeholder="Stored value (optional)"
              aria-label={`Choice ${i + 1} stored value`}
            />
            <Check
              label="Allow respondent to enter another answer"
              checked={!!o.is_other}
              onChange={(value) => update(i, { is_other: value })}
              disabled={disabled}
            />
          </div>
        ))}
        {!disabled && (
          <button
            onClick={add}
            className="text-xs text-primary-3 hover:underline flex items-center gap-1 mt-1"
          >
            <Plus size={12} /> Add option
          </button>
        )}
      </div>
    </div>
  );
}