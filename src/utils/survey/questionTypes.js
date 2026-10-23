// utils/survey/questionTypes.js
import {
  Type, AlignLeft, Hash, CircleDot, CheckSquare, List, ToggleLeft,
  Star, SlidersHorizontal, Calendar, Heading, Info,
} from "lucide-react";

/**
 * The single source of truth for question types in v1.
 * Each entry drives:
 *   - the type picker (icon + label + description)
 *   - default config when a new question of this type is created
 *   - which renderer to use (in renderers/index.js)
 *   - which inspector controls to show (in QuestionEditor)
 */
export const QUESTION_TYPES = {
  short_text: {
    label: "Short text",
    description: "A single line of text.",
    icon: Type,
    group: "Text",
    hasOptions: false,
    defaultConfig: { max_length: 120, placeholder: "" },
    defaultAnswerShape: () => "",
  },
  long_text: {
    label: "Long text",
    description: "A paragraph or more.",
    icon: AlignLeft,
    group: "Text",
    hasOptions: false,
    defaultConfig: { max_length: 2000, rows: 4, placeholder: "" },
    defaultAnswerShape: () => "",
  },
  number: {
    label: "Number",
    description: "Numeric input with optional bounds.",
    icon: Hash,
    group: "Numeric",
    hasOptions: false,
    defaultConfig: { min: null, max: null, step: 1, integer_only: false },
    defaultAnswerShape: () => null,
  },
  single_choice: {
    label: "Single choice",
    description: "Pick one option.",
    icon: CircleDot,
    group: "Choice",
    hasOptions: true,
    defaultConfig: { randomize_options: false, layout: "vertical" },
    defaultAnswerShape: () => ({ option_id: null }),
  },
  multi_choice: {
    label: "Multiple choice",
    description: "Pick one or more options.",
    icon: CheckSquare,
    group: "Choice",
    hasOptions: true,
    defaultConfig: { min_select: 0, max_select: null, randomize_options: false },
    defaultAnswerShape: () => ({ option_ids: [] }),
  },
  dropdown: {
    label: "Dropdown",
    description: "Pick one option from a menu.",
    icon: List,
    group: "Choice",
    hasOptions: true,
    defaultConfig: { searchable: false, randomize_options: false },
    defaultAnswerShape: () => ({ option_id: null }),
  },
  boolean: {
    label: "Yes / No",
    description: "A true/false toggle.",
    icon: ToggleLeft,
    group: "Choice",
    hasOptions: false,
    defaultConfig: { true_label: "Yes", false_label: "No" },
    defaultAnswerShape: () => null,
  },
  rating: {
    label: "Rating",
    description: "Stars, hearts, or similar scale.",
    icon: Star,
    group: "Rating",
    hasOptions: false,
    defaultConfig: { max: 5, icon: "star" },
    defaultAnswerShape: () => 0,
  },
  scale: {
    label: "Scale",
    description: "A labeled numeric range.",
    icon: SlidersHorizontal,
    group: "Rating",
    hasOptions: false,
    defaultConfig: {
      min: 1, max: 10,
      labels: { min: "", mid: "", max: "" },
    },
    defaultAnswerShape: () => null,
  },
  date: {
    label: "Date",
    description: "A calendar date.",
    icon: Calendar,
    group: "Date",
    hasOptions: false,
    defaultConfig: { min_date: null, max_date: null },
    defaultAnswerShape: () => null,
  },
  section: {
    label: "Section header",
    description: "A heading that groups questions. Has no answer.",
    icon: Heading,
    group: "Layout",
    hasOptions: false,
    isLayoutOnly: true,
    defaultConfig: { subtitle: "" },
    defaultAnswerShape: () => null,
  },
  info: {
    label: "Info / text block",
    description: "Static text shown to the respondent. Has no answer.",
    icon: Info,
    group: "Layout",
    hasOptions: false,
    isLayoutOnly: true,
    defaultConfig: { body: "Add context or instructions here." },
    defaultAnswerShape: () => null,
  },
};

export const QUESTION_TYPE_GROUPS = ["Text", "Numeric", "Choice", "Rating", "Date", "Layout"];

export function getTypeMeta(type) {
  return QUESTION_TYPES[type] ?? null;
}

export function isLayoutType(type) {
  return QUESTION_TYPES[type]?.isLayoutOnly === true;
}

export function typeHasOptions(type) {
  return QUESTION_TYPES[type]?.hasOptions === true;
}