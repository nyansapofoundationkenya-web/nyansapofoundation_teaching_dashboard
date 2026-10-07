// @/components/assessments/scheduleUtils.js

/**
 * Computes the target end date for an assessment based on the chosen
 * duration mode. Returns "" if it can't be computed yet (missing inputs).
 *
 * formData.durationMode: "days" | "date"
 * formData.to_be_done:   "YYYY-MM-DD" start date
 * formData.duration_days: number/string, used when durationMode === "days"
 * formData.end_date:     "YYYY-MM-DD", used when durationMode === "date"
 */
export function computeEndDate(formData) {
  if (!formData?.to_be_done) return "";

  if (formData.durationMode === "date") {
    return formData.end_date || "";
  }

  // default / "days" mode
  const days = Number(formData.duration_days);
  if (!days || days <= 0) return "";

  const start = new Date(formData.to_be_done);
  if (Number.isNaN(start.getTime())) return "";

  start.setDate(start.getDate() + days);
  return start.toISOString().split("T")[0];
}

/**
 * Human-readable duration summary, e.g. "7 days" or "Jun 30, 2026".
 */
export function describeDuration(formData) {
  if (formData.durationMode === "date") {
    return formData.end_date
      ? `Ends ${formData.end_date}`
      : "No end date set";
  }
  const days = Number(formData.duration_days);
  if (!days || days <= 0) return "No duration set";
  return `${days} day${days === 1 ? "" : "s"}`;
}