import ShortTextRenderer from "./ShortTextRenderer";
import LongTextRenderer from "./LongTextRenderer";
import NumberRenderer from "./NumberRenderer";
import SingleChoiceRenderer from "./SingleChoiceRenderer";
import MultiChoiceRenderer from "./MultiChoiceRenderer";
import DropdownRenderer from "./DropdownRenderer";
import BooleanRenderer from "./BooleanRenderer";
import RatingRenderer from "./RatingRenderer";
import ScaleRenderer from "./ScaleRenderer";
import DateRenderer from "./DateRenderer";
import SectionRenderer from "./SectionRenderer";
import InfoRenderer from "./InfoRenderer";

export const QUESTION_RENDERERS = {
  short_text: ShortTextRenderer,
  long_text: LongTextRenderer,
  number: NumberRenderer,
  single_choice: SingleChoiceRenderer,
  multi_choice: MultiChoiceRenderer,
  dropdown: DropdownRenderer,
  boolean: BooleanRenderer,
  rating: RatingRenderer,
  scale: ScaleRenderer,
  date: DateRenderer,
  section: SectionRenderer,
  info: InfoRenderer,
};

export const QUESTION_TYPE_META = {
  short_text: { label: "Short text", group: "text" },
  long_text: { label: "Long text", group: "text" },
  number: { label: "Number", group: "text" },
  single_choice: { label: "Single choice", group: "choice" },
  multi_choice: { label: "Multiple choice", group: "choice" },
  dropdown: { label: "Dropdown", group: "choice" },
  boolean: { label: "Yes / No", group: "choice" },
  rating: { label: "Rating", group: "scale" },
  scale: { label: "Scale", group: "scale" },
  date: { label: "Date", group: "date" },
  section: { label: "Section heading", group: "layout" },
  info: { label: "Info block", group: "layout" },
};

// Types that produce an answer (vs. layout-only)
export const ANSWER_TYPES = new Set([
  "short_text", "long_text", "number",
  "single_choice", "multi_choice", "dropdown", "boolean",
  "rating", "scale", "date",
]);