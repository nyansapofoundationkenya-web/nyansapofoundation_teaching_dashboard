# Mobile survey implementation

This guide describes how the mobile app should display and complete surveys
created in the Nyansapo dashboard. It is based on the survey builder linked from
the dashboard's **Household** page.

## Current dashboard behavior

On **Household**, users with the `super_admin`, `admin`, or `project_manager`
role can select **Survey Builder**. This opens the organization's survey list
at `/dashboard/{organizationId}/surveys`, where an authorized user can create,
edit, preview, and publish surveys.

The dashboard stores editable surveys and questions, validates them on publish,
and writes an immutable published-version document. The dashboard's Preview
route is for testing only: it does not save answers. The current dashboard code
does not implement a respondent submission collection or a mobile submission
API. Mobile response persistence therefore needs an agreed storage contract and
appropriate Firestore rules or a trusted backend before it is released.

## Firestore definition paths

All paths are scoped to the organization:

```text
organization/{organizationId}/surveys/{surveyId}
organization/{organizationId}/surveys/{surveyId}/questions/{questionId}
organization/{organizationId}/surveys/{surveyId}/versions/{version}
```

The survey and question documents are the editable draft. **Do not render these
draft documents in the respondent flow.** Read the survey's `publishedVersion`,
then fetch that version from the `versions` subcollection. If the survey is a
draft, has no published version, or the version document is missing, do not
offer it as a respondent survey.

Example published document shape (abridged):

```json
{
  "schema_version": 1,
  "organization_id": "org_123",
  "id": "survey_456",
  "slug": "household-baseline",
  "title": "Household baseline",
  "description": "Household survey",
  "status": "published",
  "version": 2,
  "settings": {},
  "welcome": {
    "title": "Household baseline",
    "body": "Please answer the following questions."
  },
  "thank_you": {
    "title": "Thank you",
    "body": "Your response has been recorded."
  },
  "pages": [
    {
      "id": "page_intro",
      "survey_id": "survey_456",
      "title": "Household details",
      "position": 0,
      "logic": null,
      "randomize_questions": false
    }
  ],
  "questions": [
    {
      "id": "q_household_size",
      "survey_id": "survey_456",
      "page_id": "page_intro",
      "type": "number",
      "text": "How many people live in this household?",
      "description": "",
      "required": true,
      "position": 0,
      "config": {
        "min": 1,
        "max": null,
        "step": 1,
        "integer_only": true
      },
      "options": [],
      "logic": null
    }
  ]
}
```

Pages and questions are already ordered in the published snapshot. For reliable
rendering, still sort pages by `position` and questions by `page_id`, then
`position`. Keep IDs as strings and use stable question and option IDs; labels
are for display, not answer keys. The published fields use `snake_case` in
places, including `organization_id`, `page_id`, and `survey_id`.

The snapshot has `schema_version: 1`. Handle an unsupported schema version as an
explicit error rather than trying to guess how to render it.

## Question types and answer values

Render the question based on `type`, `config`, and `options`. `section` and
`info` are presentational and do not collect answers.

| Type | Mobile input | Answer value |
| --- | --- | --- |
| `short_text` | Single-line text input; honor `config.max_length` and placeholder | String |
| `long_text` | Multiline text input; honor `config.max_length`, `config.rows`, and placeholder | String |
| `number` | Numeric input; honor `min`, `max`, `step`, and `integer_only` | Number |
| `single_choice` | Select one option; honor configured layout if useful on device | `{ "option_id": "option-id" }` |
| `dropdown` | Select one option from a native/mobile-friendly list | `{ "option_id": "option-id" }` |
| `multi_choice` | Select multiple options; honor `min_select` and `max_select` | `{ "option_ids": ["option-id"] }` |
| `boolean` | Yes/no control using `true_label` and `false_label` | Boolean |
| `rating` | Rating control, using configured `min`, `max`, and `icon` | Number |
| `scale` | Numeric scale, using `min`, `max`, and configured labels | Number |
| `date` | Date picker; store a date-only `YYYY-MM-DD` string | String |
| `section` | Section heading and optional subtitle | No answer |
| `info` | Informational text block | No answer |

For a single choice or dropdown with an `is_other` option, include the selected
option ID and the respondent's text:

```json
{ "option_id": "option_other", "other_text": "Respondent's answer" }
```

For multi-choice, use:

```json
{
  "option_ids": ["option_a", "option_other"],
  "other_text": "Respondent's answer"
}
```

Only show the "other" text input when an `is_other` option is selected. Require
non-blank `other_text` when that option is selected.

## Respondent flow

1. **Enter from a household.** Keep the selected household's stable ID and the
   current organization ID as context. Do not rely on a household name as an
   identifier. The dashboard Household list links into household details with
   organization, household, project, and school context; preserve whichever of
   those IDs the mobile app uses.
2. **Find eligible surveys.** Load surveys only within the current organization
   and expose published surveys with a valid `publishedVersion`. Enforce access
   settings through the app's trusted authorization mechanism; hiding a survey
   in the UI is not authorization.
3. **Load the published snapshot.** Fetch
   `organization/{organizationId}/surveys/{surveyId}/versions/{publishedVersion}`.
   Retain its `version` for the response. If a new version is published while a
   respondent is in progress, finish against the version already loaded.
4. **Show the welcome screen.** Display `welcome.title` and `welcome.body` with
   a clear start action.
5. **Render page-by-page.** Start with pages sorted by `position`. On each
   visible page, render its questions sorted by `position`, filtering questions
   whose `logic.show_if` evaluates false.
6. **Validate before moving on.** Validate only visible answer-producing
   questions on the active page. Show an inline error next to its question and
   keep the respondent on that page until corrected.
7. **Apply page routing.** After a page is valid, evaluate its `logic.after_submit`
   rules in stored order and take the first matching rule. Otherwise use
   `logic.default_action` (default is `next_page`). Skip pages whose
   `logic.show_if` is false. `jump_to_page` moves to the configured later page;
   `skip_page` omits the configured later page and continues after it;
   `end_survey` completes normally; `disqualify` ends with the disqualification
   outcome. If no visible page remains, complete the survey.
8. **Complete and submit.** Persist the response using the submission contract
   agreed for the mobile app (see below). Show `thank_you.title` and
   `thank_you.body` only after the submission has been accepted. Do not show a
   successful-submission screen when persistence failed.

### Logic format

`show_if` and routing conditions use `all` for AND or `any` for OR:

```json
{
  "show_if": {
    "all": [
      {
        "question_id": "q_has_children",
        "op": "equals",
        "value": true
      }
    ]
  }
}
```

Supported operators are `equals`, `not_equals`, `in`, `not_in`, `contains`,
`gt`, `gte`, `lt`, `lte`, `is_empty`, and `is_not_empty`. Choice conditions
refer to option IDs. For choice answers, read `option_id` or `option_ids` when
evaluating a condition; do not compare a display label.

The dashboard validates that logic refers to earlier answer questions and that
page routes point forward. The mobile client should still handle malformed or
unresolvable logic safely and visibly (for example, stop the respondent flow and
report an invalid survey), rather than silently selecting an arbitrary route.

## Validation requirements

Use the published question definition as the source of validation rules:

- `required` means a non-empty answer is required.
- For `multi_choice`, enforce `min_select` (default 0) and `max_select` when set.
- Choice answers must reference option IDs that exist in that question.
- Enforce numeric bounds, `integer_only`, and `step` where configured.
- Enforce rating/scale bounds and date `min_date` / `max_date` when set.
- Enforce text `max_length`.
- Enforce non-empty `other_text` for a selected "other" choice.
- Do not validate `section` or `info` as questions.

The dashboard's JavaScript validation helper is not a mobile API. Reimplement
these checks in the mobile client and validate submissions again in the trusted
backend or Firestore rules before accepting them.

## Submission storage: agreement required

The dashboard currently has no response writer, response collection, or
submission API. Agree on the write path, authorization, duplicate prevention,
and offline synchronization behavior with the dashboard/backend owners before
implementing production submissions. Do not write to the draft survey or
published-version document.

Suggested response payload (field names and location are a proposal, not an
existing dashboard contract):

```json
{
  "organization_id": "org_123",
  "survey_id": "survey_456",
  "survey_version": 2,
  "household_id": "household_789",
  "respondent_id": "user_001",
  "status": "submitted",
  "answers": {
    "q_household_size": 5,
    "q_has_children": true,
    "q_household_type": { "option_id": "option_a" }
  },
  "started_at": "2026-10-21T07:00:00.000Z",
  "submitted_at": "2026-10-21T07:12:00.000Z"
}
```

Recommended properties of the final contract:

- Store answers keyed by stable question ID, and choices keyed by stable option
  ID; keep `other_text` alongside the choice answer when present.
- Include organization, survey, published version, and the mobile household
  context required to associate the response.
- Define whether respondent identity is allowed/required based on the survey's
  access and privacy settings. Avoid collecting IP address, device identifiers,
  or unrelated household data unless explicitly required and authorized.
- Make retries idempotent so an offline retry cannot create duplicate completed
  responses.
- Define how drafts are saved and resumed if
  `settings.behavior.allow_save_and_resume` is enabled, and how editing after
  submission is handled if `allow_edit_after_submit` is enabled.
- Enforce `one_response_per_respondent`, `max_responses`, `opens_at`,
  `closes_at`, and `time_limit_minutes` in the trusted write path, not only in
  the UI.
- Define retention/deletion behavior from `settings.privacy.data_retention_days`.
- Do not treat a locally queued offline response as submitted until the backend
  confirms the write.

## Settings to honor

The published `settings` object contains `access`, `limits`, `behavior`,
`privacy`, `notifications`, and `appearance` settings. At minimum, the mobile
client and submission service should agree on behavior for:

- `behavior.allow_back_navigation`
- `behavior.allow_save_and_resume`
- `behavior.show_progress_bar`
- `behavior.show_question_numbers`
- `behavior.randomize_pages`
- `limits.opens_at`, `limits.closes_at`, `limits.time_limit_minutes`
- `limits.one_response_per_respondent`, `limits.max_responses`
- `privacy.anonymous`
- `appearance.primary_color`, `appearance.logo_url`, and `appearance.language`

Do not infer authorization from `access.mode` alone. The dashboard currently
maps `link_only` to `public` in the published snapshot, and mobile/backend
authorization behavior must be explicitly defined.

## Mobile implementation checklist

- [ ] Load surveys under the active organization, not across organizations.
- [ ] Offer only published surveys with a readable published version.
- [ ] Preserve the selected household ID through launch and submission.
- [ ] Render all 12 supported types, including layout-only types.
- [ ] Use question/option IDs in saved answers, never labels as identifiers.
- [ ] Match conditional question and page visibility and page-routing behavior.
- [ ] Validate visible questions before page navigation and final submission.
- [ ] Support back navigation, progress, save/resume, and randomization according
  to settings.
- [ ] Pin the published version for the life of an in-progress response.
- [ ] Agree and implement the response path/API, security, idempotency, and
  offline retry contract.
- [ ] Cover each question type, required/optional answers, "other" choices,
  logic branches, skipped pages, route endings, and failed/retried submission
  in tests.

## Dashboard references

- Survey builder overview and data model: [SURVEY_BUILDER.md](./SURVEY_BUILDER.md)
- Household page: `src/app/dashboard/[organizationId]/household/page.jsx`
- Survey schema and answer validation: `src/utils/survey/surveyValidation.js`
- Logic evaluation: `src/utils/survey/logicEngine.js`
- Question types: `src/utils/survey/questionTypes.js`
