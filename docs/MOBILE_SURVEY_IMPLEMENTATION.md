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

## Complete published survey schema

The published snapshot is the complete, immutable definition the mobile app
renders. The example below shows all top-level fields and settings currently
written by the dashboard, plus household- and child-targeted question examples.
Question `config` varies by `type`; the supported config keys are listed in the
question type table below.

```json
{
  "schema_version": 2,
  "organization_id": "org_123",
  "id": "survey_456",
  "slug": "household-baseline",
  "owner_id": "user_001",
  "title": "Household baseline",
  "description": "Household survey",
  "status": "published",
  "version": 2,
  "created_at": "2026-10-21T07:00:00.000Z",
  "updated_at": "2026-10-21T07:10:00.000Z",
  "published_at": "2026-10-21T07:10:00.000Z",
  "published_by": "user_001",
  "settings": {
    "access": {
      "mode": "public",
      "require_login": false,
      "allowed_domains": [],
      "password": null
    },
    "limits": {
      "one_response_per_respondent": false,
      "max_responses": null,
      "opens_at": null,
      "closes_at": null,
      "time_limit_minutes": null
    },
    "behavior": {
      "allow_save_and_resume": true,
      "allow_back_navigation": true,
      "allow_edit_after_submit": false,
      "show_progress_bar": true,
      "show_question_numbers": true,
      "randomize_pages": false
    },
    "privacy": {
      "anonymous": true,
      "collect_ip": false,
      "collect_user_agent": false,
      "data_retention_days": 365
    },
    "notifications": {
      "notify_owner_on_response": false,
      "send_receipt_to_respondent": false
    },
    "appearance": {
      "theme": "default",
      "primary_color": "#f7cc1c",
      "logo_url": null,
      "language": "en"
    }
  },
  "welcome": {
    "title": "Household baseline",
    "body": "Please answer the following questions.",
    "button_label": "Start"
  },
  "thank_you": {
    "title": "Thank you",
    "body": "Your response has been recorded.",
    "redirect_url": null
  },
  "pages": [
    {
      "id": "page_intro",
      "survey_id": "survey_456",
      "title": "Household details",
      "description": "",
      "position": 0,
      "logic": {
        "after_submit": [
          {
            "if": {
              "all": [
                {
                  "question_id": "q_household_size",
                  "op": "gt",
                  "value": 10
                }
              ]
            },
            "action": "end_survey"
          }
        ],
        "default_action": "next_page"
      },
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
      "created_at": 1792566000000,
      "required": true,
      "position": 0,
      "target_entity": "household",
      "config": {
        "min": 1,
        "max": null,
        "step": 1,
        "integer_only": true
      },
      "options": [],
      "logic": null
    },
    {
      "id": "q_child_first_name",
      "survey_id": "survey_456",
      "page_id": "page_intro",
      "type": "short_text",
      "text": "What is the child's first name?",
      "description": "",
      "created_at": 1792566000000,
      "required": true,
      "position": 1,
      "target_entity": "child",
      "config": {
        "max_length": 120,
        "placeholder": ""
      },
      "options": [],
      "logic": null
    }
  ]
}
```

The survey-level `created_at`, `updated_at`, and `published_at` values are
Firestore timestamps; ISO strings above are illustrative JSON representations.
Question `created_at` is copied from the draft and is currently an epoch
millisecond number (or `null`). The builder may omit optional fields such as
`owner_id`, `created_at`, `updated_at`, `published_by`, `welcome.button_label`,
or question `created_at` when the source draft has no value.

Pages and questions are already ordered in the published snapshot. For reliable
rendering, still sort pages by `position` and questions by `page_id`, then
`position`. Keep IDs as strings and use stable question and option IDs; labels
are for display, not answer keys. Published fields use `snake_case`, including
`organization_id`, `page_id`, `survey_id`, `created_at`, and `target_entity`.
Newly published snapshots use `schema_version: 2`. Version-1 snapshots predate
`target_entity`; treat a missing value as `"household"`. Reject unsupported
schema versions explicitly rather than guessing how to render them.

### Question and option schema

Every published question has this structure:

```json
{
  "id": "stable-question-id",
  "survey_id": "survey_456",
  "page_id": "page_intro",
  "type": "single_choice",
  "text": "What is the child's primary language?",
  "description": "Choose one answer.",
  "created_at": null,
  "required": false,
  "position": 2,
  "target_entity": "child",
  "config": {
    "randomize_options": false,
    "layout": "vertical"
  },
  "options": [
    {
      "id": "option_english",
      "label": "English",
      "value": "en",
      "position": 0,
      "is_other": false
    },
    {
      "id": "option_other",
      "label": "Other",
      "value": "",
      "position": 1,
      "is_other": true
    }
  ],
  "logic": null
}
```

`config` and `options` are empty objects/arrays when not applicable. Each option
has a stable ID, display label, optional stored value, position, and
`is_other` flag. Question `logic` can contain `show_if`; pages can contain
`show_if`, `after_submit`, and `default_action` flow rules.

A page route rule has this shape:

```json
{
  "if": {
    "all": [
      {
        "question_id": "q_has_children",
        "op": "equals",
        "value": true
      }
    ]
  },
  "action": "jump_to_page",
  "target_page_id": "page_children"
}
```

The route actions are `jump_to_page`, `skip_page`, `end_survey`, and
`disqualify`. `target_page_id` is required for `jump_to_page` and `skip_page`.

Each page has `id`, `survey_id`, `title`, `description`, `position`, `logic`,
and `randomize_questions`.

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

The dashboard's default configurations are:

| Type | Default `config` |
| --- | --- |
| `short_text` | `{ "max_length": 120, "placeholder": "" }` |
| `long_text` | `{ "max_length": 2000, "rows": 4, "placeholder": "" }` |
| `number` | `{ "min": null, "max": null, "step": 1, "integer_only": false }` |
| `single_choice` | `{ "randomize_options": false, "layout": "vertical" }` |
| `multi_choice` | `{ "min_select": 0, "max_select": null, "randomize_options": false }` |
| `dropdown` | `{ "searchable": false, "randomize_options": false }` |
| `boolean` | `{ "true_label": "Yes", "false_label": "No" }` |
| `rating` | `{ "max": 5, "icon": "star" }` |
| `scale` | `{ "min": 1, "max": 10, "labels": { "min": "", "mid": "", "max": "" } }` |
| `date` | `{ "min_date": null, "max_date": null }` |
| `section` | `{ "subtitle": "" }` |
| `info` | `{ "body": "Add context or instructions here." }` |

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

## Household vs child/student questions

The builder exposes **Question is about** on each question:

- `target_entity: "household"` — answer once for the household, parent, or
  caregiver. This is the default, including for version-1 published surveys
  where the field is absent.
- `target_entity: "child"` — answer separately for each child in the household.
  The mobile app should show the question in a child-specific context, identify
  the child by stable household-child ID, and keep each child's answer separate.

`target_entity` tells the app **whose information the question describes**. It
does not, by itself, name a Firestore destination or map a question to a student
document field or assessment field. Until an explicit field-mapping contract is
added, preserve all answers in the survey response and have the trusted
integration map approved child details into student records and assessment
flows. Do not guess mappings from question text or write arbitrary survey
answers into those collections.

Example mobile answer grouping for a household with two children:

```json
{
  "household_answers": {
    "q_household_size": 5
  },
  "child_answers": [
    {
      "household_child_id": "child_101",
      "student_id": "student_abc",
      "answers": {
        "q_child_first_name": "Amina",
        "q_child_language": {
          "option_id": "option_english"
        }
      }
    },
    {
      "household_child_id": "child_102",
      "student_id": null,
      "answers": {
        "q_child_first_name": "Baraka",
        "q_child_language": {
          "option_id": "option_other",
          "other_text": "Kikuyu"
        }
      }
    }
  ]
}
```

The exact persisted response envelope is still subject to the response contract
below. `household_child_id` must refer to a stable child record/ID, not a name or
array index. If the child already has a student record, preserve its student
document ID (currently exposed in household data as `linkedLearnerId`) and do
not create a duplicate student. If no student record exists, student creation
must be an explicit, authorized operation that returns a stable student ID and
links it back to that household child.

### Existing student and assessment locations

The dashboard currently reads/writes student records under:

```text
organization/{organizationId}/projects/{projectId}/schools/{schoolId}/students/{studentId}
```

The codebase's student import uses fields such as `first_name`, `last_name`,
`grade`, `age`, and `sex`; this is not a complete canonical student schema.
Coordinate required fields, household linkage, duplicate matching, and
counter updates with the owners of student registration before creating
students from a survey.

Assessment definitions and results are separate from survey responses. Existing
assessment results use the pattern:

```text
assessments/{assessmentId}/assessments-results/{assessmentId}_{studentId}
```

Do not write generic household survey answers directly into an assessment
result document. Assessment results have their own assessment-specific shape.
Use the established assessment workflow (including an assessment ID, student
ID, and required result fields), or define a reviewed mapping and trusted
backend operation that transforms selected child answers into that shape.
Survey response data should remain traceable to its survey ID and published
version even when selected data is copied to student or assessment records.

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
   whose `logic.show_if` evaluates false. Render household-targeted questions
   once. Render child-targeted questions once per selected household child and
   retain the child ID with every answer.
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

For a child-targeted question, evaluate visibility and validation in the
context of that specific child. Do not let one child's answer reveal or hide
another child's questions. The dashboard flow editor currently does not
configure a child context for conditions; until that support is added, avoid
conditional rules that depend on child-targeted answers.

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
    "household": {
      "q_household_size": 5
    },
    "children": {
      "child_101": {
        "student_id": "student_abc",
        "answers": {
          "q_child_first_name": "Amina"
        }
      }
    }
  },
  "started_at": "2026-10-21T07:00:00.000Z",
  "submitted_at": "2026-10-21T07:12:00.000Z"
}
```

Recommended properties of the final contract:

- Store answers keyed by stable question ID, and choices keyed by stable option
  ID; keep `other_text` alongside the choice answer when present.
- Keep household answers separate from child answers. Key child answers by a
  stable household-child ID and include the linked student ID when one exists.
- Do not treat `target_entity` as a write destination. A future mapping feature
  should explicitly identify approved student/assessment fields and validate
  those mappings against their respective schemas.
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
- [ ] Render household questions once and child questions for each child; bind
  each child answer set to that child's stable ID and optional student ID.
- [ ] Render all 12 supported types, including layout-only types.
- [ ] Use question/option IDs in saved answers, never labels as identifiers.
- [ ] Match conditional question and page visibility and page-routing behavior.
- [ ] Validate visible questions before page navigation and final submission.
- [ ] Support back navigation, progress, save/resume, and randomization according
  to settings.
- [ ] Pin the published version for the life of an in-progress response.
- [ ] Treat missing `target_entity` in schema-version-1 surveys as `household`.
- [ ] Keep survey answer storage distinct from student-profile and assessment
  result writes unless a trusted, field-mapped integration is approved.
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
