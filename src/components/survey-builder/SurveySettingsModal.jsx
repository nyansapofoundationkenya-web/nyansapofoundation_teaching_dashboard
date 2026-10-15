"use client";
import { useState, useEffect } from "react";
import { defaultSurveySettings } from "@/utils/survey/surveyDefaults";

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function toIsoDateTime(value) {
  return value ? new Date(value).toISOString() : null;
}

export default function SurveySettingsModal({ open, survey, onClose, onSave, canEdit }) {
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  useEffect(() => {
    if (open && survey) {
      const defaults = defaultSurveySettings();
      const settings = survey.settings ?? {};
      setDraft({
        title: survey.title || "",
        description: survey.description || "",
        welcome: {
          title: survey.welcome?.title ?? survey.title ?? "",
          body: survey.welcome?.body ?? survey.description ?? "",
          button_label: survey.welcome?.button_label ?? "Start",
        },
        thank_you: {
          title: survey.thank_you?.title ?? "Thank you",
          body: survey.thank_you?.body ?? "Your response has been recorded.",
          redirect_url: survey.thank_you?.redirect_url ?? null,
        },
        settings: {
          ...defaults,
          ...settings,
          access: {
            ...defaults.access,
            ...settings.access,
            mode: settings.access?.mode === "link_only"
              ? "public"
              : settings.access?.mode ?? defaults.access.mode,
          },
          limits: {
            ...defaults.limits,
            ...settings.limits,
            opens_at: toDateTimeLocal(settings.limits?.opens_at),
            closes_at: toDateTimeLocal(settings.limits?.closes_at),
          },
          behavior: { ...defaults.behavior, ...settings.behavior },
          privacy: { ...defaults.privacy, ...settings.privacy },
          appearance: { ...defaults.appearance, ...settings.appearance },
          notifications: { ...defaults.notifications, ...settings.notifications },
        },
      });
      setSaveError("");
    }
  }, [open, survey]);

  if (!open || !draft) return null;

  const setSettings = (group, patch) =>
    setDraft((current) => ({
      ...current,
      settings: {
        ...current.settings,
        [group]: { ...current.settings[group], ...patch },
      },
    }));

  const save = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await onSave({
        ...draft,
        settings: {
          ...draft.settings,
          limits: {
            ...draft.settings.limits,
            opens_at: toIsoDateTime(draft.settings.limits.opens_at),
            closes_at: toIsoDateTime(draft.settings.limits.closes_at),
          },
        },
      });
      onClose();
    } catch (error) {
      setSaveError(error.message || "Could not save survey details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
    >
      <div className="w-full max-w-lg bg-background-light rounded-3xl p-6 shadow-2xl border border-background-lighter max-h-[85vh] overflow-y-auto">
        <h2 className="text-base font-bold text-foreground mb-2">Survey details</h2>
        <p className="text-xs text-gray-400 mb-5">
          Configure the survey introduction, response behavior, and app access. You can close this
          panel at any time and continue building questions.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Title
            </label>
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              disabled={!canEdit}
              className="mt-1 w-full px-3 py-2 bg-background-lighter border border-gray-600 rounded-lg text-sm text-foreground"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Description
            </label>
            <textarea
              rows={2}
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              disabled={!canEdit}
              className="mt-1 w-full px-3 py-2 bg-background-lighter border border-gray-600 rounded-lg text-sm text-foreground"
            />
          </div>

          <div className="rounded-xl border border-background-lighter p-3 space-y-3">
            <p className="text-xs font-semibold text-foreground">Welcome screen</p>
            <Field label="Heading">
              <input
                value={draft.welcome?.title ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    welcome: { ...current.welcome, title: event.target.value },
                  }))
                }
                disabled={!canEdit}
                className="settings-input"
              />
            </Field>
            <Field label="Introduction">
              <textarea
                rows={2}
                value={draft.welcome?.body ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    welcome: { ...current.welcome, body: event.target.value },
                  }))
                }
                disabled={!canEdit}
                className="settings-input"
              />
            </Field>
            <Field label="Start button">
              <input
                value={draft.welcome?.button_label ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    welcome: { ...current.welcome, button_label: event.target.value },
                  }))
                }
                disabled={!canEdit}
                className="settings-input"
              />
            </Field>
          </div>

          <div className="rounded-xl border border-background-lighter p-3 space-y-3">
            <p className="text-xs font-semibold text-foreground">After submission</p>
            <Field label="Thank-you heading">
              <input
                value={draft.thank_you?.title ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    thank_you: { ...current.thank_you, title: event.target.value },
                  }))
                }
                disabled={!canEdit}
                className="settings-input"
              />
            </Field>
            <Field label="Confirmation message">
              <textarea
                rows={2}
                value={draft.thank_you?.body ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    thank_you: { ...current.thank_you, body: event.target.value },
                  }))
                }
                disabled={!canEdit}
                className="settings-input"
              />
            </Field>
          </div>

          <div className="rounded-xl border border-background-lighter p-3 space-y-3">
            <p className="text-xs font-semibold text-foreground">Respondent access</p>
            <p className="text-[11px] text-gray-500">
              These settings describe who may answer in the app. The consuming app enforces access.
            </p>
            <Field label="Who can answer">
              <select
                value={draft.settings.access.mode === "link_only" ? "public" : draft.settings.access.mode}
                onChange={(event) => setSettings("access", {
                  mode: event.target.value,
                  require_login: event.target.value === "authenticated",
                })}
                disabled={!canEdit}
                className="settings-input"
              >
                <option value="public">Available to users in the app</option>
                <option value="authenticated">Signed-in app users</option>
                <option value="invite_only">Invited users</option>
              </select>
            </Field>
          </div>

          <div className="rounded-xl border border-background-lighter p-3 space-y-3">
            <p className="text-xs font-semibold text-foreground">Response behavior</p>
            <Field label="Maximum responses (optional)">
              <input
                type="number"
                min="1"
                value={draft.settings.limits.max_responses ?? ""}
                onChange={(event) =>
                  setSettings("limits", {
                    max_responses: event.target.value === "" ? null : Number(event.target.value),
                  })
                }
                disabled={!canEdit}
                className="settings-input"
              />
            </Field>
            <Check
              label="One response per respondent"
              checked={!!draft.settings.limits.one_response_per_respondent}
              onChange={(value) => setSettings("limits", { one_response_per_respondent: value })}
              disabled={!canEdit}
            />
            <Check
              label="Allow save and resume"
              checked={!!draft.settings.behavior.allow_save_and_resume}
              onChange={(value) => setSettings("behavior", { allow_save_and_resume: value })}
              disabled={!canEdit}
            />
            <Check
              label="Allow respondents to go back"
              checked={!!draft.settings.behavior.allow_back_navigation}
              onChange={(value) => setSettings("behavior", { allow_back_navigation: value })}
              disabled={!canEdit}
            />
            <Check
              label="Allow editing after submission"
              checked={!!draft.settings.behavior.allow_edit_after_submit}
              onChange={(value) => setSettings("behavior", { allow_edit_after_submit: value })}
              disabled={!canEdit}
            />
            <Check
              label="Show progress"
              checked={!!draft.settings.behavior.show_progress_bar}
              onChange={(value) => setSettings("behavior", { show_progress_bar: value })}
              disabled={!canEdit}
            />
            <Check
              label="Show question numbers"
              checked={!!draft.settings.behavior.show_question_numbers}
              onChange={(value) => setSettings("behavior", { show_question_numbers: value })}
              disabled={!canEdit}
            />
            <Check
              label="Randomize page order"
              checked={!!draft.settings.behavior.randomize_pages}
              onChange={(value) => setSettings("behavior", { randomize_pages: value })}
              disabled={!canEdit}
            />
            <Field label="Open at (optional)">
              <input
                type="datetime-local"
                value={draft.settings.limits.opens_at ?? ""}
                onChange={(event) => setSettings("limits", { opens_at: event.target.value || null })}
                disabled={!canEdit}
                className="settings-input"
              />
            </Field>
            <Field label="Close at (optional)">
              <input
                type="datetime-local"
                value={draft.settings.limits.closes_at ?? ""}
                onChange={(event) => setSettings("limits", { closes_at: event.target.value || null })}
                disabled={!canEdit}
                className="settings-input"
              />
            </Field>
            <Field label="Time limit in minutes (optional)">
              <input
                type="number"
                min="1"
                value={draft.settings.limits.time_limit_minutes ?? ""}
                onChange={(event) =>
                  setSettings("limits", {
                    time_limit_minutes: event.target.value === "" ? null : Number(event.target.value),
                  })
                }
                disabled={!canEdit}
                className="settings-input"
              />
            </Field>
            <Check
              label="Anonymous responses"
              checked={!!draft.settings.privacy.anonymous}
              onChange={(value) => setSettings("privacy", { anonymous: value })}
              disabled={!canEdit}
            />
            <Check
              label="Collect IP address"
              checked={!!draft.settings.privacy.collect_ip}
              onChange={(value) => setSettings("privacy", { collect_ip: value })}
              disabled={!canEdit}
            />
            <Check
              label="Collect device information"
              checked={!!draft.settings.privacy.collect_user_agent}
              onChange={(value) => setSettings("privacy", { collect_user_agent: value })}
              disabled={!canEdit}
            />
            <Field label="Data retention in days (optional)">
              <input
                type="number"
                min="1"
                value={draft.settings.privacy.data_retention_days ?? ""}
                onChange={(event) =>
                  setSettings("privacy", {
                    data_retention_days: event.target.value === "" ? null : Number(event.target.value),
                  })
                }
                disabled={!canEdit}
                className="settings-input"
              />
            </Field>
          </div>

          <div className="rounded-xl border border-background-lighter p-3 space-y-3">
            <p className="text-xs font-semibold text-foreground">Appearance and notifications</p>
            <Field label="Primary color">
              <input
                type="text"
                value={draft.settings.appearance.primary_color ?? ""}
                onChange={(event) => setSettings("appearance", { primary_color: event.target.value })}
                disabled={!canEdit}
                className="settings-input"
                placeholder="#f7cc1c"
              />
            </Field>
            <Field label="Language">
              <input
                value={draft.settings.appearance.language ?? ""}
                onChange={(event) => setSettings("appearance", { language: event.target.value })}
                disabled={!canEdit}
                className="settings-input"
              />
            </Field>
            <Check
              label="Notify survey owner for new responses"
              checked={!!draft.settings.notifications?.notify_owner_on_response}
              onChange={(value) => setSettings("notifications", { notify_owner_on_response: value })}
              disabled={!canEdit}
            />
            <Check
              label="Send a receipt to respondents"
              checked={!!draft.settings.notifications?.send_receipt_to_respondent}
              onChange={(value) => setSettings("notifications", { send_receipt_to_respondent: value })}
              disabled={!canEdit}
            />
          </div>

        </div>

        {saveError && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">
            {saveError}
          </p>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!canEdit || saving}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary-3 text-primary-1 hover:bg-yellow-400 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      <style jsx>{`
        .settings-input {
          width: 100%;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: inherit;
          font-size: 13px;
          outline: none;
        }
        .settings-input:focus {
          border-color: #f7cc1c;
          box-shadow: 0 0 0 2px rgba(247, 204, 28, 0.15);
        }
      `}</style>
    </div>
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
