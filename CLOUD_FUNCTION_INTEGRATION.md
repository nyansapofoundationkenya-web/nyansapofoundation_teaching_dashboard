# Cloud Function Integration Guide

## Overview
Your Python cloud function has been integrated into the frontend components. The function tracks daily student participation in assessments and calculates overall assessment status.

## Updated Components

### 1. Filter.jsx
**File:** `src/components/Moderations/Filter.jsx`

**Changes:**
- Now fetches from `daily_assessment_counts` subcollection instead of checking `has_done` flags
- Queries the subcollection for each assessment and retrieves the daily student count
- Dynamically determines which count field to use based on assessment type:
  - Literacy → `literacy_student_count`
  - Numeracy → `numeracy_student_count`
- Shows the last 10 dates with assessments

**Data Flow:**
```
assessments/{assessmentId}/daily_assessment_counts/{YYYY-MM-DD}
└── literacy_student_count: number
└── numeracy_student_count: number
└── created_at: timestamp
└── last_updated: timestamp
```

### 2. AssessmentGraph.jsx
**File:** `src/components/Moderations/AssessmentGraph.jsx`

**No Changes Required** - The component already works with the data structure provided by Filter.jsx. It receives:
```javascript
{
  date: "YYYY-MM-DD",
  displayDate: Date object,
  assessments: [
    {
      id: "assessmentId",
      completedCount: number,  // from daily_assessment_counts
      name: "Assessment Name",
      type: "Literacy" | "Numeracy",
      level: "Baseline" | "Endline"
    }
  ]
}
```

### 3. AssessmentList.jsx
**File:** `src/components/Moderations/AssessmentList.jsx`

**Changes:**
- Now displays the `status` field calculated by the cloud function
- Shows status badge in the top-right of each assessment card
- Status values and colors:
  - `not_started` → Gray badge "Not Started"
  - `ongoing` → Yellow badge "Ongoing"
  - `completed` → Green badge "Completed"

**Status Calculation Logic (from cloud function):**
```python
if completed_count == 0:
    status = "not_started"
elif completed_count == total_assigned:
    status = "completed"
else:
    status = "ongoing"
```

## Cloud Function Behavior

### Trigger
Triggered when a student result is created, updated, or deleted:
```
assessments/{assessmentId}/assessments-results/{documentId}
```

### Actions
1. **Track Daily Participation**: Increments or creates daily student count
   - Counts each student only once per day
   - Only counts relevant items:
     - **Literacy**: reading_results
     - **Numeracy**: number_operations, number_recognition, word_problem

2. **Update Assessment Status**: Recalculates overall status after every change

## Integration Checklist

- [x] Filter component updated to use `daily_assessment_counts`
- [x] AssessmentGraph receives properly formatted data
- [x] AssessmentList displays status badge
- [ ] Cloud function deployed to Firebase
- [ ] Test with sample assessment data
- [ ] Verify daily counts are being tracked
- [ ] Verify status calculations are correct

## Testing

### Test Case 1: New Assessment Created
1. Create a new assessment
2. Assign students
3. Expected: Status should be "not_started"

### Test Case 2: Student Completes Assessment
1. Student submits assessment results
2. Cloud function processes the results
3. Expected: 
   - Daily count increments for that date
   - Status changes to "ongoing"
   - Graph updates with the new count

### Test Case 3: All Students Complete
1. All assigned students complete the assessment
2. Cloud function processes final results
3. Expected: Status changes to "completed"

### Test Case 4: Delete Student Result
1. Delete a student result
2. Cloud function recalculates
3. Expected:
   - Daily count decrements
   - Status recalculates correctly

## Data Structure Reference

### Assessment Document
```javascript
{
  id: "assessmentId",
  name: "Assessment Name",
  type: "Literacy" | "Numeracy",
  level: "Baseline" | "Endline",
  organization_id: "orgId",
  status: "not_started" | "ongoing" | "completed",
  created_at: "2024-01-15T10:30:00Z",
  assigned_students: [
    {
      id: "studentId",
      first_name: "John",
      last_name: "Doe",
      baseline: "letter",
      has_done: true,
      completed_entire_assessment: true
    }
  ]
}
```

### Daily Assessment Counts Document
```javascript
{
  date: "2024-01-15",
  literacy_student_count: 45,  // only if type is literacy
  numeracy_student_count: 38,  // only if type is numeracy
  created_at: "2024-01-15T10:30:00Z",
  last_updated: "2024-01-15T14:45:00Z"
}
```

## Troubleshooting

### Graph shows no data
- Verify `daily_assessment_counts` subcollection exists
- Check that count fields match assessment type (lowercase)
- Ensure dates are in YYYY-MM-DD format

### Status badge not showing
- Verify `status` field exists in assessment document
- Check that status value is one of: "not_started", "ongoing", "completed"

### Daily counts not updating
- Check cloud function logs in Firebase Console
- Verify assessment type is lowercase in assessment document
- Ensure student results have `done_time` in metadata

## Performance Notes

- Filter component now makes one getDocs query per assessment
- Consider indexing on `organization_id` and `created_at` in assessments collection
- Daily counts grow over time; consider archiving old data after 90 days
