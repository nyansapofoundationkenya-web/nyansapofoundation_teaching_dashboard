// utils/survey/logicEngine.js

/**
 * Evaluate a logic tree against current answers.
 * answers: { [questionId]: value }
 */
export function evaluateLogic(logic, answers) {
  if (!logic) return true;
  if (logic.all) return logic.all.every((c) => evaluateCondition(c, answers));
  if (logic.any) return logic.any.some((c) => evaluateCondition(c, answers));
  return true;
}

function evaluateCondition(cond, answers) {
  const answer = answers[cond.question_id];
  const v = answer && typeof answer === "object" && !Array.isArray(answer)
    ? answer.option_id ?? answer.option_ids ?? answer.index ?? answer.value ?? answer
    : answer;
  const expected = cond.value;
  switch (cond.op) {
    case "equals":
      return Array.isArray(v) ? v.includes(expected) : v === expected;
    case "not_equals":
      return Array.isArray(v) ? !v.includes(expected) : v !== expected;
    case "in":
      return Array.isArray(expected) && (
        Array.isArray(v) ? v.some((value) => expected.includes(value)) : expected.includes(v)
      );
    case "not_in":
      return Array.isArray(expected) && (
        Array.isArray(v) ? v.every((value) => !expected.includes(value)) : !expected.includes(v)
      );
    case "contains":
      return Array.isArray(v) ? v.includes(expected) : String(v ?? "").includes(String(expected));
    case "gt": return Number(v) > Number(expected);
    case "gte": return Number(v) >= Number(expected);
    case "lt": return Number(v) < Number(expected);
    case "lte": return Number(v) <= Number(expected);
    case "is_empty":
      return v == null || v === "" || (Array.isArray(v) && v.length === 0);
    case "is_not_empty":
      return !(v == null || v === "" || (Array.isArray(v) && v.length === 0));
    default: return true;
  }
}

/**
 * Given the survey (with pages + questions) and current answers,
 * return the list of question ids that should be visible right now.
 */
export function visibleQuestionIds(survey, questions, answers) {
  const visible = new Set();
  const pagesById = new Map((survey?.pages ?? []).map((page) => [page.id, page]));
  for (const q of questions) {
    const pageId = q.pageId ?? q.page_id;
    const page = pagesById.get(pageId);
    if (page && !evaluateLogic(page.logic?.show_if, answers)) continue;
    if (q.logic?.show_if) {
      if (evaluateLogic(q.logic.show_if, answers)) visible.add(q.id);
    } else {
      visible.add(q.id);
    }
  }
  return visible;
}