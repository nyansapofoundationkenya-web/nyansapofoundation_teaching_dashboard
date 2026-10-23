import { QUESTION_TYPES } from "./questionTypes";

const CONDITION_OPERATORS = new Set([
  "equals",
  "not_equals",
  "in",
  "not_in",
  "contains",
  "gt",
  "gte",
  "lt",
  "lte",
  "is_empty",
  "is_not_empty",
]);

export function validateQuestionAnswer(question, value) {
  if (["section", "info"].includes(question.type)) return null;

  const isEmpty = value == null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0) ||
    (value.option_id !== undefined && !value.option_id) ||
    (value.option_ids !== undefined && value.option_ids.length === 0);
  const minimumSelections = Number(question.config?.min_select ?? 0);
  if (question.required && isEmpty) return "This question is required.";
  if (isEmpty) {
    if (question.type === "multi_choice" && minimumSelections > 0) {
      return `Select at least ${minimumSelections} option${minimumSelections === 1 ? "" : "s"}.`;
    }
    return null;
  }

  if (question.type === "multi_choice") {
    const count = value.option_ids?.length ?? 0;
    const maximum = question.config?.max_select;
    const selectedIds = value.option_ids ?? [];
    if (selectedIds.some((id) => !question.options?.some((option) => option.id === id))) {
      return "Choose valid options for this question.";
    }
    if (count < minimumSelections) {
      return `Select at least ${minimumSelections} option${minimumSelections === 1 ? "" : "s"}.`;
    }
    if (maximum != null && count > Number(maximum)) {
      return `Select no more than ${maximum} options.`;
    }
    if (
      selectedIds.some((id) => question.options?.some((option) => option.id === id && option.is_other)) &&
      !value.other_text?.trim()
    ) {
      return "Please specify your other answer.";
    }
  }
  if (["single_choice", "dropdown"].includes(question.type)) {
    const selectedOption = question.options?.find((option) => option.id === value.option_id);
    if (!selectedOption) return "Choose a valid option for this question.";
    if (selectedOption.is_other && !value.other_text?.trim()) {
      return "Please specify your other answer.";
    }
  }
  if (question.type === "number") {
    const number = Number(value);
    const config = question.config ?? {};
    if (!Number.isFinite(number)) return "Enter a valid number.";
    if (config.integer_only && !Number.isInteger(number)) return "Enter a whole number.";
    if (config.min != null && number < Number(config.min)) return `Enter a number of at least ${config.min}.`;
    if (config.max != null && number > Number(config.max)) return `Enter a number no greater than ${config.max}.`;
  }
  if (question.type === "scale" || question.type === "rating") {
    const number = Number(value);
    const config = question.config ?? {};
    if (!Number.isFinite(number)) return "Choose a valid rating.";
    if (config.min != null && number < Number(config.min)) return `Choose a value of at least ${config.min}.`;
    if (config.max != null && number > Number(config.max)) return `Choose a value no greater than ${config.max}.`;
  }
  if (question.type === "date") {
    const config = question.config ?? {};
    if (config.min_date && value < config.min_date) return `Choose a date on or after ${config.min_date}.`;
    if (config.max_date && value > config.max_date) return `Choose a date on or before ${config.max_date}.`;
  }
  if (["short_text", "long_text"].includes(question.type)) {
    const maxLength = question.config?.max_length;
    if (maxLength != null && value.length > Number(maxLength)) {
      return `Keep your answer to ${maxLength} characters or fewer.`;
    }
  }

  return null;
}

function validateConditions(group, questionMap, questionOrder, errors, label, entityOrder) {
  if (!group || (!Array.isArray(group.all) && !Array.isArray(group.any))) {
    errors.push(`${label}: choose at least one valid condition group.`);
    return;
  }
  if (Array.isArray(group.all) && Array.isArray(group.any)) {
    errors.push(`${label}: use either "all" or "any" conditions, not both.`);
  }

  const conditions = [...(group.all ?? []), ...(group.any ?? [])];
  if (conditions.length === 0) {
    errors.push(`${label}: add at least one condition.`);
    return;
  }

  conditions.forEach((condition, index) => {
    const source = questionMap.get(condition.question_id);
    if (!source) {
      errors.push(`${label}: condition ${index + 1} refers to a missing question.`);
      return;
    }
    if (["section", "info"].includes(source.type)) {
      errors.push(`${label}: conditions must reference a question that collects an answer.`);
    }
    if (!CONDITION_OPERATORS.has(condition.op)) {
      errors.push(`${label}: condition ${index + 1} uses an unsupported operator.`);
    }
    if (questionOrder.get(source.id) >= entityOrder) {
      errors.push(`${label}: conditions can only use answers from earlier questions.`);
    }
    const isChoice = ["single_choice", "multi_choice", "dropdown"].includes(source.type);
    const isNumeric = ["number", "rating", "scale"].includes(source.type);
    const allowedOperators = isChoice
      ? ["equals", "not_equals", "in", "not_in", "contains", "is_empty", "is_not_empty"]
      : isNumeric || source.type === "date"
        ? ["equals", "not_equals", "gt", "gte", "lt", "lte", "is_empty", "is_not_empty"]
        : source.type === "boolean"
          ? ["equals", "not_equals", "is_empty", "is_not_empty"]
          : ["equals", "not_equals", "contains", "is_empty", "is_not_empty"];
    if (!allowedOperators.includes(condition.op)) {
      errors.push(`${label}: condition ${index + 1} uses an operator that doesn't match its question type.`);
    }
    if (["in", "not_in"].includes(condition.op) && !Array.isArray(condition.value)) {
      errors.push(`${label}: "is one of" conditions must provide a list of values.`);
    }
    if (
      !["is_empty", "is_not_empty"].includes(condition.op) &&
      (condition.value == null || condition.value === "" ||
        (Array.isArray(condition.value) && condition.value.length === 0))
    ) {
      errors.push(`${label}: condition ${index + 1} needs an answer value.`);
    }
    if (
      isChoice &&
      condition.value != null &&
      condition.op !== "is_empty" &&
      condition.op !== "is_not_empty"
    ) {
      const values = Array.isArray(condition.value) ? condition.value : [condition.value];
      if (values.some((value) => !source.options?.some((option) => option.id === value))) {
        errors.push(`${label}: a condition refers to an option that no longer exists.`);
      }
    }
  });
}

export function validateSurveyDefinition(survey, questions) {
  const errors = [];
  const pages = [...(survey?.pages ?? [])].sort((a, b) => a.position - b.position);
  const orderedQuestions = [...questions].sort((a, b) => {
    const pageA = pages.findIndex((page) => page.id === a.pageId);
    const pageB = pages.findIndex((page) => page.id === b.pageId);
    return pageA - pageB || a.position - b.position;
  });
  const questionMap = new Map(orderedQuestions.map((question) => [question.id, question]));
  const questionOrder = new Map(orderedQuestions.map((question, index) => [question.id, index]));
  const pagePositions = new Map(pages.map((page, index) => [page.id, index]));

  if ((survey?.title ?? "").trim().length < 2) {
    errors.push("Survey title must be at least 2 characters.");
  }
  if (pages.length === 0) errors.push("Add at least one page.");
  if (new Set(pages.map((page) => page.id)).size !== pages.length) {
    errors.push("Page IDs must be unique.");
  }
  if (new Set(orderedQuestions.map((question) => question.id)).size !== orderedQuestions.length) {
    errors.push("Question IDs must be unique.");
  }
  if (orderedQuestions.length === 0) errors.push("Add at least one question.");
  if (!orderedQuestions.some((question) => !["section", "info"].includes(question.type))) {
    errors.push("Add at least one question that collects an answer.");
  }
  const maxResponses = survey?.settings?.limits?.max_responses;
  if (maxResponses != null && (!Number.isInteger(Number(maxResponses)) || Number(maxResponses) < 1)) {
    errors.push("Maximum responses must be a positive whole number.");
  }
  if (
    survey?.settings?.limits?.opens_at &&
    survey?.settings?.limits?.closes_at &&
    new Date(survey.settings.limits.opens_at).getTime() >=
      new Date(survey.settings.limits.closes_at).getTime()
  ) {
    errors.push("The close time must be later than the open time.");
  }
  for (const field of ["opens_at", "closes_at"]) {
    const value = survey?.settings?.limits?.[field];
    if (value && Number.isNaN(new Date(value).getTime())) {
      errors.push(`The response ${field === "opens_at" ? "open" : "close"} time is invalid.`);
    }
  }
  const timeLimit = survey?.settings?.limits?.time_limit_minutes;
  if (timeLimit != null && (!Number.isFinite(Number(timeLimit)) || Number(timeLimit) < 1)) {
    errors.push("The time limit must be a positive number of minutes.");
  }
  const accessMode = survey?.settings?.access?.mode;
  if (accessMode && !["public", "authenticated", "invite_only", "link_only"].includes(accessMode)) {
    errors.push("Choose a supported respondent access mode.");
  }
  if (
    survey?.settings?.behavior?.randomize_pages &&
    (
      pages.some((page) => page.logic?.show_if || page.logic?.after_submit?.length) ||
      orderedQuestions.some((question) => question.logic?.show_if)
    )
  ) {
    errors.push("Page order cannot be randomized when the survey uses conditional flow.");
  }

  orderedQuestions.forEach((question, index) => {
    if (!QUESTION_TYPES[question.type]) {
      errors.push(`Question ${index + 1} has an unsupported type.`);
    }
    if (
      question.target_entity != null &&
      !["household", "child"].includes(question.target_entity)
    ) {
      errors.push(`Question ${index + 1} has an unsupported target entity.`);
    }
    if (!pagePositions.has(question.pageId)) {
      errors.push(`Question ${index + 1} is not assigned to a survey page.`);
    }
    if (!["section", "info"].includes(question.type) && !question.text?.trim()) {
      errors.push(`Question ${index + 1} needs a prompt.`);
    }
    if (QUESTION_TYPES[question.type]?.hasOptions) {
      const options = question.options ?? [];
      if (options.length === 0 || options.some((option) => !option.label?.trim())) {
        errors.push(`Question ${index + 1} needs at least one option with a label.`);
      }
      if (new Set(options.map((option) => option.id)).size !== options.length) {
        errors.push(`Question ${index + 1} has duplicate option IDs.`);
      }
    }
    if (
      question.type === "multi_choice" &&
      (
        Number(question.config?.min_select ?? 0) < 0 ||
        (question.config?.max_select != null &&
          (
            Number(question.config.max_select) < 1 ||
            Number(question.config.max_select) < Number(question.config.min_select ?? 0)
          ))
      )
    ) {
      errors.push(`Question ${index + 1} selection limits are invalid.`);
    }
    if (
      ["number", "scale"].includes(question.type) &&
      question.config?.min != null &&
      question.config?.max != null &&
      Number(question.config.min) > Number(question.config.max)
    ) {
      errors.push(`Question ${index + 1} minimum cannot be greater than its maximum.`);
    }
    if (
      question.logic?.show_if &&
      pages.find((page) => page.id === question.pageId)?.randomize_questions
    ) {
      errors.push(`Question ${index + 1} cannot depend on earlier answers while its page is randomized.`);
    }
    if (question.logic?.show_if) {
      validateConditions(
        question.logic.show_if,
        questionMap,
        questionOrder,
        errors,
        `Question ${index + 1}`,
        index
      );
    }
  });

  pages.forEach((page, index) => {
    const pageQuestions = orderedQuestions.filter((question) => question.pageId === page.id);
    const eligibleQuestions = new Map(
      orderedQuestions
        .filter((question) => pagePositions.get(question.pageId) < index)
        .map((question) => [question.id, question])
    );
    const firstQuestionOnOrAfterPageIndex =
      orderedQuestions.findIndex((question) => pagePositions.get(question.pageId) >= index);
    const pageEntryOrder = firstQuestionOnOrAfterPageIndex >= 0
      ? firstQuestionOnOrAfterPageIndex
      : orderedQuestions.length;
    if (page.logic?.show_if) {
      validateConditions(
        page.logic.show_if,
        eligibleQuestions,
        questionOrder,
        errors,
        `Page "${page.title || index + 1}"`,
        pageEntryOrder
      );
    }

    for (const [ruleIndex, rule] of (page.logic?.after_submit ?? []).entries()) {
      const lastPageQuestion = pageQuestions.at(-1);
      validateConditions(
        rule.if,
        questionMap,
        questionOrder,
        errors,
        `Page "${page.title || index + 1}" rule ${ruleIndex + 1}`,
        lastPageQuestion
          ? questionOrder.get(lastPageQuestion.id) + 1
          : pageEntryOrder
      );
      if (!["jump_to_page", "end_survey", "disqualify", "skip_page"].includes(rule.action)) {
        errors.push(`Page "${page.title || index + 1}" has an unsupported flow action.`);
      }
      if (
        ["jump_to_page", "skip_page"].includes(rule.action) &&
        (!pagePositions.has(rule.target_page_id) || pagePositions.get(rule.target_page_id) <= index)
      ) {
        errors.push(`Page "${page.title || index + 1}" must choose a later page for this flow action.`);
      }
    }
    if (!["next_page", "end_survey"].includes(page.logic?.default_action ?? "next_page")) {
      errors.push(`Page "${page.title || index + 1}" has an unsupported default action.`);
    }
  });

  return errors;
}

export function createPublishedSurveyDefinition({ organizationId, survey, questions, version }) {
  const pages = [...(survey.pages ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((page) => ({
      id: page.id,
      survey_id: survey.id,
      title: page.title ?? "",
      description: page.description ?? "",
      position: page.position,
      logic: page.logic ?? null,
      randomize_questions: page.randomize_questions === true,
    }));
  const orderedQuestions = [...questions]
    .sort((a, b) => {
      const pageA = pages.findIndex((page) => page.id === a.pageId);
      const pageB = pages.findIndex((page) => page.id === b.pageId);
      return pageA - pageB || a.position - b.position;
    })
    .map((question) => ({
      id: question.id,
      survey_id: survey.id,
      page_id: question.pageId,
      type: question.type,
      target_entity: question.target_entity === "child" ? "child" : "household",
      text: question.text ?? "",
      description: question.description ?? "",
      created_at: question.createdAt ?? null,
      required: question.required === true,
      position: question.position,
      config: question.config ?? {},
      options: (question.options ?? []).map((option, position) => ({
        id: option.id,
        label: option.label ?? "",
        value: option.value ?? "",
        position: option.position ?? position,
        is_other: option.is_other === true,
      })),
      logic: question.logic ?? null,
    }));

  const settings = {
    ...(survey.settings ?? {}),
    access: {
      ...(survey.settings?.access ?? {}),
      mode: survey.settings?.access?.mode === "link_only"
        ? "public"
        : survey.settings?.access?.mode ?? "public",
    },
  };

  return {
    schema_version: 2,
    organization_id: organizationId,
    id: survey.id,
    slug: survey.slug ?? "",
    owner_id: survey.createdBy ?? null,
    title: survey.title.trim(),
    description: survey.description ?? "",
    status: "published",
    version,
    created_at: survey.createdAt ?? null,
    updated_at: survey.updatedAt ?? null,
    settings,
    welcome: survey.welcome ?? null,
    thank_you: survey.thank_you ?? null,
    pages,
    questions: orderedQuestions,
  };
}
