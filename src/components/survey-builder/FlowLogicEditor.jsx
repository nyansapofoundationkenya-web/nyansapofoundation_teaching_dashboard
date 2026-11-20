"use client";

import { Plus, Trash2 } from "lucide-react";

const OPERATORS = [
  ["equals", "is equal to"],
  ["not_equals", "is not equal to"],
  ["contains", "contains"],
  ["in", "is one of"],
  ["not_in", "is not one of"],
  ["gt", "is greater than"],
  ["gte", "is at least"],
  ["lt", "is less than"],
  ["lte", "is at most"],
  ["is_empty", "is empty"],
  ["is_not_empty", "is not empty"],
];

const NO_VALUE_OPERATORS = new Set(["is_empty", "is_not_empty"]);

function defaultCondition(question) {
  if (["single_choice", "multi_choice", "dropdown"].includes(question.type)) {
    return {
      question_id: question.id,
      op: "equals",
      value: question.options?.[0]?.id ?? "",
    };
  }
  if (question.type === "boolean") {
    return { question_id: question.id, op: "equals", value: true };
  }
  if (["number", "rating", "scale"].includes(question.type)) {
    return {
      question_id: question.id,
      op: "equals",
      value: question.config?.min ?? 0,
    };
  }
  return { question_id: question.id, op: "is_not_empty", value: null };
}

export default function FlowLogicEditor({
  logic,
  onChange,
  questions,
  visibilityQuestions = questions,
  routeQuestions = questions,
  pages = [],
  currentPageId,
  mode = "question",
  disabled = false,
}) {
  const conditions = logic?.show_if ?? null;
  const groupType = conditions?.any ? "any" : "all";
  const groupItems = conditions?.[groupType] ?? [];
  const conditionQuestions = mode === "page" ? visibilityQuestions : questions;

  const updateShowIf = (nextGroup) => {
    const nextLogic = { ...(logic ?? {}) };
    if (!nextGroup) {
      delete nextLogic.show_if;
    } else {
      nextLogic.show_if = nextGroup;
    }
    onChange(nextLogic);
  };

  const updateGroupType = (nextType) => {
    const items = groupItems;
    updateShowIf({ [nextType]: items });
  };

  const updateCondition = (index, patch) => {
    const nextItems = groupItems.map((item, i) =>
      i === index ? { ...item, ...patch } : item
    );
    updateShowIf({ [groupType]: nextItems });
  };

  const addCondition = () => {
    const firstQuestion = conditionQuestions[0];
    if (!firstQuestion) return;
    const nextItems = [
      ...groupItems,
      defaultCondition(firstQuestion),
    ];
    updateShowIf({ [groupType]: nextItems });
  };

  const removeCondition = (index) => {
    const nextItems = groupItems.filter((_, i) => i !== index);
    updateShowIf(nextItems.length ? { [groupType]: nextItems } : null);
  };

  const updatePageRule = (index, patch) => {
    const rules = [...(logic?.after_submit ?? [])];
    rules[index] = { ...rules[index], ...patch };
    onChange({ ...(logic ?? {}), after_submit: rules });
  };

  const addPageRule = () => {
    const firstQuestion = questions[0];
    if (!firstQuestion) return;
    onChange({
      ...(logic ?? {}),
      after_submit: [
        ...(logic?.after_submit ?? []),
        {
          if: {
            all: [defaultCondition(firstQuestion)],
          },
          action: "end_survey",
          target_page_id: "",
        },
      ],
    });
  };

  const removePageRule = (index) => {
    const rules = (logic?.after_submit ?? []).filter((_, i) => i !== index);
    onChange({ ...(logic ?? {}), after_submit: rules });
  };

  const updateDefaultAction = (default_action) => {
    onChange({ ...(logic ?? {}), default_action });
  };

  return (
    <div className="space-y-3 border-t border-background-lighter pt-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {mode === "question" ? "Show this question when" : "Page flow"}
        </p>
        <p className="mt-1 text-[11px] text-gray-500">
          {mode === "question"
            ? "Leave this empty to always show the question."
            : "Add conditions to control page visibility and where respondents go next."}
        </p>
      </div>

      <ConditionGroup
        questions={conditionQuestions}
        groupType={groupType}
        groupItems={groupItems}
        hasConditions={Boolean(conditions)}
        onGroupTypeChange={updateGroupType}
        onAdd={addCondition}
        onUpdate={updateCondition}
        onRemove={removeCondition}
        disabled={disabled}
        addLabel={mode === "page" ? "Add page visibility condition" : "Add show condition"}
      />

      {mode === "page" && (
        <div className="space-y-2 border-t border-background-lighter pt-3">
          <p className="text-xs font-semibold text-gray-300">After this page</p>
          {(logic?.after_submit ?? []).map((rule, index) => (
            <PageRule
              key={`rule-${index}`}
              rule={rule}
              index={index}
              questions={routeQuestions}
              pages={pages}
              currentPageId={currentPageId}
              onChange={(patch) => updatePageRule(index, patch)}
              onRemove={() => removePageRule(index)}
              disabled={disabled}
            />
          ))}
          {!disabled && (
            <button
              type="button"
              onClick={addPageRule}
              disabled={routeQuestions.length === 0}
              className="flex items-center gap-1 text-xs text-primary-3 hover:underline disabled:opacity-40"
            >
              <Plus size={12} /> Add conditional route
            </button>
          )}
          {routeQuestions.length === 0 && (
            <p className="text-[11px] text-gray-500">Add questions before configuring routes.</p>
          )}
          <Field label="Default destination">
            <select
              value={logic?.default_action ?? "next_page"}
              onChange={(event) => updateDefaultAction(event.target.value)}
              disabled={disabled}
              className="flow-input"
            >
              <option value="next_page">Continue to the next page</option>
              <option value="end_survey">End the survey</option>
            </select>
          </Field>
        </div>
      )}

      <style jsx>{`
        .flow-input {
          width: 100%;
          min-width: 0;
          padding: 7px 9px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          color: inherit;
          font-size: 12px;
          outline: none;
        }
      `}</style>
    </div>
  );
}

function ConditionGroup({
  questions,
  groupType,
  groupItems,
  hasConditions,
  onGroupTypeChange,
  onAdd,
  onUpdate,
  onRemove,
  disabled,
  addLabel,
}) {
  return (
    <div className="space-y-2">
      {hasConditions && (
        <>
          <select
            value={groupType}
            onChange={(event) => onGroupTypeChange(event.target.value)}
            disabled={disabled}
            className="flow-input"
            aria-label="Condition matching"
          >
            <option value="all">Match all conditions (AND)</option>
            <option value="any">Match any condition (OR)</option>
          </select>
          {groupItems.map((condition, index) => (
            <ConditionRow
              key={`${condition.question_id}-${index}`}
              condition={condition}
              questions={questions}
              onChange={(patch) => onUpdate(index, patch)}
              onRemove={() => onRemove(index)}
              disabled={disabled}
            />
          ))}
        </>
      )}
      {!disabled && (
        <button
          type="button"
          onClick={onAdd}
          disabled={questions.length === 0}
          className="flex items-center gap-1 text-xs text-primary-3 hover:underline disabled:opacity-40"
        >
          <Plus size={12} /> {addLabel ?? (hasConditions ? "Add condition" : "Add show condition")}
        </button>
      )}
      {questions.length === 0 && !hasConditions && (
        <p className="text-[11px] text-gray-500">Add an earlier question to use a condition.</p>
      )}
    </div>
  );
}

function ConditionRow({ condition, questions, onChange, onRemove, disabled, canRemove = true }) {
  const sourceQuestion = questions.find((question) => question.id === condition.question_id);
  const choiceQuestion = ["single_choice", "multi_choice", "dropdown"].includes(sourceQuestion?.type);
  const isBoolean = sourceQuestion?.type === "boolean";
  const numericQuestion = ["number", "rating", "scale"].includes(sourceQuestion?.type);
  const isDate = sourceQuestion?.type === "date";
  const hasValue = !NO_VALUE_OPERATORS.has(condition.op);
  const allowedOperators = choiceQuestion
    ? ["equals", "not_equals", "in", "not_in", "contains", "is_empty", "is_not_empty"]
    : numericQuestion || isDate
      ? ["equals", "not_equals", "gt", "gte", "lt", "lte", "is_empty", "is_not_empty"]
      : isBoolean
        ? ["equals", "not_equals", "is_empty", "is_not_empty"]
        : ["equals", "not_equals", "contains", "is_empty", "is_not_empty"];
  const visibleOperators = OPERATORS.filter(
    ([operator]) => allowedOperators.includes(operator) || operator === condition.op
  );

  const changeQuestion = (questionId) => {
    const question = questions.find((item) => item.id === questionId);
    onChange(question ? defaultCondition(question) : { question_id: questionId });
  };

  return (
    <div className="rounded-lg border border-background-lighter p-2 space-y-1.5">
      <div className="flex items-center gap-1">
        <select
          value={sourceQuestion ? condition.question_id : ""}
          onChange={(event) => changeQuestion(event.target.value)}
          disabled={disabled}
          className="flow-input"
          aria-label="Question used by condition"
        >
          {questions.map((question) => (
            <option key={question.id} value={question.id}>{question.text}</option>
          ))}
        </select>
        {!disabled && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-red-400 hover:text-red-300"
            title="Remove condition"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
      <select
        value={condition.op ?? "equals"}
        onChange={(event) => onChange({
          op: event.target.value,
          value: event.target.value === "in" || event.target.value === "not_in"
            ? [condition.value].filter(Boolean)
            : condition.value,
        })}
        disabled={disabled}
        className="flow-input"
        aria-label="Condition operator"
      >
        {visibleOperators.map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      {hasValue && choiceQuestion && (
        <select
          value={Array.isArray(condition.value) ? condition.value[0] ?? "" : condition.value ?? ""}
          onChange={(event) => onChange({
            value: condition.op === "in" || condition.op === "not_in"
              ? [event.target.value]
              : event.target.value,
          })}
          disabled={disabled}
          className="flow-input"
          aria-label="Condition answer"
        >
          {(sourceQuestion.options ?? []).map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      )}
      {hasValue && isBoolean && (
        <select
          value={String(condition.value ?? true)}
          onChange={(event) => onChange({ value: event.target.value === "true" })}
          disabled={disabled}
          className="flow-input"
          aria-label="Condition answer"
        >
          <option value="true">{sourceQuestion.config?.true_label ?? "Yes"}</option>
          <option value="false">{sourceQuestion.config?.false_label ?? "No"}</option>
        </select>
      )}
      {hasValue && !choiceQuestion && !isBoolean && (
        <input
          type={numericQuestion ? "number" : isDate ? "date" : "text"}
          value={condition.value ?? ""}
          onChange={(event) => onChange({
            value: numericQuestion
              ? event.target.value === "" ? null : Number(event.target.value)
              : event.target.value || null,
          })}
          disabled={disabled}
          className="flow-input"
          aria-label="Condition answer"
          placeholder="Answer value"
        />
      )}
    </div>
  );
}

function PageRule({
  rule,
  index,
  questions,
  pages,
  currentPageId,
  onChange,
  onRemove,
  disabled,
}) {
  const ruleQuestions = questions;
  const groupType = rule.if?.any ? "any" : "all";
  const groupItems = rule.if?.[groupType] ?? [];
  const pageIndex = pages.findIndex((page) => page.id === currentPageId);
  const destinationPages = pages.filter((page) =>
    pages.findIndex((item) => item.id === page.id) > pageIndex
  );
  const updateIf = (ifGroup) => {
    onChange({
      if: ifGroup,
      action: rule.action ?? "end_survey",
      target_page_id: rule.target_page_id ?? "",
    });
  };

  return (
    <div className="rounded-lg border border-background-lighter p-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-400">Route {index + 1} when</span>
        {!disabled && (
          <button type="button" onClick={onRemove} className="p-1 text-red-400" title="Remove route">
            <Trash2 size={13} />
          </button>
        )}
      </div>
      <ConditionGroup
        questions={ruleQuestions}
        groupType={groupType}
        groupItems={groupItems}
        hasConditions={Boolean(rule.if)}
        onGroupTypeChange={(type) => updateIf({ [type]: groupItems })}
        onAdd={() => {
          const source = ruleQuestions[0];
          if (!source) return;
          updateIf({
            [groupType]: [...groupItems, defaultCondition(source)],
          });
        }}
        onUpdate={(conditionIndex, patch) => updateIf({
          [groupType]: groupItems.map((item, i) =>
            i === conditionIndex ? { ...item, ...patch } : item
          ),
        })}
        onRemove={(conditionIndex) => {
          const remaining = groupItems.filter((_, i) => i !== conditionIndex);
          updateIf(remaining.length ? { [groupType]: remaining } : { [groupType]: [] });
        }}
        disabled={disabled}
        addLabel="Add route condition"
      />
      <Field label="Then">
        <select
          value={rule.action ?? "end_survey"}
          onChange={(event) => onChange({ action: event.target.value })}
          disabled={disabled}
          className="flow-input"
        >
          <option value="jump_to_page">Go to a page</option>
          <option value="end_survey">End survey</option>
          <option value="disqualify">End and disqualify</option>
          <option value="skip_page">Skip this page</option>
        </select>
      </Field>
      {["jump_to_page", "skip_page"].includes(rule.action) && (
        <Field label={rule.action === "skip_page" ? "Page to skip" : "Destination page"}>
          <select
            value={rule.target_page_id ?? ""}
            onChange={(event) => onChange({ target_page_id: event.target.value })}
            disabled={disabled}
            className="flow-input"
          >
            <option value="">Choose a page…</option>
            {destinationPages.map((page) => (
              <option key={page.id} value={page.id}>{page.title || "Untitled page"}</option>
            ))}
          </select>
        </Field>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      {children}
    </label>
  );
}
