// utils/survey/surveyDefaults.js
import { QUESTION_TYPES } from "./questionTypes";

export function newId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function slugify(str) {
  return (str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function defaultSurveySettings() {
  return {
    access: {
      mode: "public",
      require_login: false,
      allowed_domains: [],
      password: null,
    },
    limits: {
      one_response_per_respondent: false,
      max_responses: null,
      opens_at: null,
      closes_at: null,
      time_limit_minutes: null,
    },
    behavior: {
      allow_save_and_resume: true,
      allow_back_navigation: true,
      allow_edit_after_submit: false,
      show_progress_bar: true,
      show_question_numbers: true,
      randomize_pages: false,
    },
    privacy: {
      anonymous: true,
      collect_ip: false,
      collect_user_agent: false,
      data_retention_days: 365,
    },
    notifications: {
      notify_owner_on_response: false,
      send_receipt_to_respondent: false,
    },
    appearance: {
      theme: "default",
      primary_color: "#f7cc1c",
      logo_url: null,
      language: "en",
    },
  };
}

export function createNewSurvey({ title = "Untitled survey", createdBy = null } = {}) {
  const now = Date.now();
  return {
    title,
    description: "",
    slug: slugify(title) || `survey-${now}`,
    status: "draft",
    version: 1,
    settings: defaultSurveySettings(),
    welcome: { title, body: "", button_label: "Start" },
    thank_you: {
      title: "Thank you",
      body: "Your response has been recorded.",
      redirect_url: null,
    },
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    createdBy,
  };
}

export function createNewPage({ title = "", position = 0 } = {}) {
  return {
    id: newId("page"),
    title,
    position,
    logic: null,
    randomize_questions: false,
    questionIds: [],
  };
}

export function createNewQuestion({ type = "short_text", pageId, position = 0 } = {}) {
  const meta = QUESTION_TYPES[type] ?? QUESTION_TYPES.short_text;
  return {
    id: newId("q"),
    pageId,
    position,
    type,
    text: defaultTextFor(type),
    description: "",
    required: false,
    target_entity: "household",
    config: { ...meta.defaultConfig },
    logic: null,
    options: meta.hasOptions ? [createNewOption(0), createNewOption(1)] : [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createNewOption(position = 0) {
  return {
    id: newId("o"),
    label: `Option ${position + 1}`,
    value: "",
    value: "",
    position,
    is_other: false,
  };
}

function defaultTextFor(type) {
  switch (type) {
    case "short_text": return "Untitled question";
    case "long_text": return "Tell us more";
    case "number": return "Enter a number";
    case "single_choice": return "Choose one";
    case "multi_choice": return "Choose all that apply";
    case "dropdown": return "Select an option";
    case "boolean": return "Is this true?";
    case "rating": return "How would you rate this?";
    case "scale": return "Rate on a scale";
    case "date": return "Pick a date";
    case "section": return "Section title";
    case "info": return "Information";
    default: return "Untitled question";
  }
}