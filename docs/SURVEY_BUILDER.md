# Organization survey builder

The dashboard stores each organization's surveys under its own Firestore path:

```text
organization/{organizationId}/surveys/{surveyId}
organization/{organizationId}/surveys/{surveyId}/questions/{questionId}
organization/{organizationId}/surveys/{surveyId}/versions/{version}
```

The survey and question documents are the editable draft. Pages are embedded on the
survey document; questions are separate documents with stable IDs and a `pageId`.
All survey and question reads must remain scoped to the organization path.

## Supported question definitions

The builder currently supports:

| Type | Answer value |
| --- | --- |
| `short_text`, `long_text` | string |
| `number` | number |
| `single_choice`, `dropdown` | `{ "option_id": "option-id" }` |
| `multi_choice` | `{ "option_ids": ["option-id"] }` |
| `boolean` | boolean |
| `rating`, `scale` | number |
| `date` | `YYYY-MM-DD` string |
| `section`, `info` | layout only; no answer |

Questions also carry `required`, `description`, `config`, `options`, and optional
`logic`. An option has a stable `id`, display `label`, optional stored `value`, order,
and `is_other` flag. When an `is_other` option is selected, the answer may also
include `other_text`.

## Conditional flow

Question visibility is stored on the question:

```json
{
  "logic": {
    "show_if": {
      "all": [
        { "question_id": "q_household_type", "op": "equals", "value": "option-id" }
      ]
    }
  }
}
```

Use `all` for AND and `any` for OR. Conditions may refer to prior answer-producing
questions and use `equals`, `not_equals`, `in`, `not_in`, `contains`, `gt`, `gte`,
`lt`, `lte`, `is_empty`, or `is_not_empty`.

Page visibility uses `page.logic.show_if`. Page routing is evaluated in order after
the page is answered:

```json
{
  "logic": {
    "after_submit": [
      {
        "if": {
          "all": [
            { "question_id": "q_needs_support", "op": "equals", "value": true }
          ]
        },
        "action": "jump_to_page",
        "target_page_id": "page_follow_up"
      }
    ],
    "default_action": "next_page"
  }
}
```

Supported route actions are `jump_to_page`, `end_survey`, `disqualify`, and
`skip_page` (with `target_page_id` set to the later page to omit). The default action is `next_page` or `end_survey`. Publishing checks
that references exist, conditions only depend on answers already available, and
page jumps only point forward (so page routing cannot loop).

## Publishing and app integration

Publishing validates the complete draft, increments its version, and writes an
immutable snapshot to `versions/{version}` in the same Firestore batch that updates
the survey's `status`, `version`, and `publishedVersion`. The snapshot uses the
documented snake_case fields (`organization_id`, `page_id`, `survey_id`) and
contains ordered `pages` and `questions`, settings, welcome content, and thank-you
content. It currently contains `schema_version: 2`.

The app integration should:

1. Load `organization/{organizationId}/surveys`, selecting published surveys.
2. Read the survey's `publishedVersion` and fetch
   `organization/{organizationId}/surveys/{surveyId}/versions/{publishedVersion}`.
3. Render each question using its `type`, `config`, and `options`; sort by page and
   question `position`.
4. Evaluate question/page `show_if` rules using saved answer values, then apply
   `after_submit` rules in order before falling back to `default_action`.
5. Keep any submitted response linked to `organization_id`, `survey_id`, and the
   published `survey_version`, with answers keyed by stable `question_id`.

Edits after publishing update the editable draft only. They set
`hasUnpublishedChanges: true`; the app can continue using the last published
snapshot until an administrator publishes a new version.

The dashboard's Preview route simulates welcome content, answer validation,
conditional visibility, page routing, progress, and the thank-you/disqualification
screen. It is a builder preview only and does not write respondent data.

Each question includes `target_entity`: `household` (the default) or `child`.
Child-targeted questions are intended to be answered separately for each child
in the household. Newly published snapshots use `schema_version: 2`; mobile
clients reading older version-1 snapshots should treat a missing
`target_entity` as `household`.

For the mobile respondent flow, published-version loading, question rendering,
logic, and the response-storage gap, see
[MOBILE_SURVEY_IMPLEMENTATION.md](./MOBILE_SURVEY_IMPLEMENTATION.md).
