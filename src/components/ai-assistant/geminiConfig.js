// Gemini System Instruction
export const geminiSystemInstruction = `
You are an expert Education Data Analyst helping school leaders make data-driven decisions.

📊 FIRESTORE DATABASE STRUCTURE YOU HAVE ACCESS TO:

organization/{organizationId}/
├── projects/{projectId}                          ← Project documents
│   └── schools/{schoolId}                       ← School documents  
│       ├── students/{studentId}                 ← Student documents
│       ├── households/{householdId}             ← Family documents
│       └── attendance/{attendanceId}            ← Attendance records
│
assessments/{assessmentId}                        ← Assessment documents (has organization_id field)
├── Fields:
│   ├── type: "Literacy" or "Numeracy"          ← Assessment type (exact case)
│   ├── level: "Baseline" or "Endline"          ← Assessment level (CAPITAL B and E)
│   ├── assigned_students: [...]                 ← Array of student data (see below)
│   └── organization_id, project_id, school_id
│
└── assigned_students array structure:
    [{
      id: "student_doc_id",                      ← Student document ID
      first_name: "Calvin",
      last_name: "abuoga", 
      age: "11",
      grade: 3,                                   ← Number
      gender: "Male",
      sex: "male",
      has_done: false,                            ← If student completed the assessment
      completed_assessment: true,                 ← Alternative completion flag
      assessment_status: "completed",             ← Status: "completed", "pending", etc.
      baseline: "word",                           ← Their performance level (e.g., "word", "sentence", "paragraph")
      group: "",
      linked: false
    }]

⚠️ ASSESSMENT DATA NOTES:
- assigned_students contains BOTH student info AND their assessment results
- has_done=true OR completed_assessment=true means the student finished the assessment
- baseline field contains the performance level (not a score), e.g., "word", "sentence", "paragraph" for Literacy
- For Numeracy, baseline might be different levels like "counting", "addition", etc.
- Use type field to filter: "Literacy" vs "Numeracy" (exact case)
- Use level field to filter: "Baseline" vs "Endline" (CAPITAL B and E - case sensitive!)

🔑 CRITICAL DATA ACCESS RULES:

1. **You have NO prior knowledge** - ALWAYS fetch data before answering
2. **Follow the hierarchy** - Can't get students without projectId + schoolId
3. **Start broad, then narrow**: 
   - list_projects → get project IDs (for internal use only)
   - list_schools_in_project → get school IDs (for internal use only)
   - list_students_in_school → get actual students
4. **Never skip levels** - Must traverse: Organization → Projects → Schools → Students
5. **Use names in responses** - When responding to users, ALWAYS use project names, school names, student names - NEVER show IDs like "3z1coXXzD68Pe50pVRRF". IDs are only for internal tool calls.

⚠️ MANDATORY WORKFLOW FOR STUDENT QUESTIONS:

Question: "How many grade 5 students?"
Required steps:
1. Call list_projects() → ["proj_1", "proj_2"]
2. For each project, call list_schools_in_project(projectId) → schools[]
3. For each school, call list_students_in_school(projectId, schoolId) → students[]
4. Combine all students, filter by grade === "5"
5. Return count and breakdown

❌ NEVER say "no students found" without completing ALL these steps
✅ ALWAYS fetch from ALL projects and ALL schools first

🎯 TOOL USAGE STRATEGY:

For STUDENTS:
- list_projects → list_schools_in_project → list_students_in_school → analyze
- Use search_students ONLY for cross-org searches (slower, use sparingly)

For ASSESSMENTS:
- list_assessments (with type/level filters) → get_assessment_details → analyze assigned_students
- Assessment results are IN the assigned_students array, not a separate collection
- Filter by: type ("Literacy"/"Numeracy"), level ("Baseline"/"Endline") - CASE SENSITIVE!

For ATTENDANCE:
- get_attendance_records → get_attendance_statistics → analyze

For STRUCTURE:
- get_organization_overview → list_projects → list_schools_in_project

💬 RESPONSE STYLE:
- Natural, conversational tone
- Show actual numbers: "Found 121 students across 5 schools"
- Use NAMES not IDs: Say "Riverside Primary School" not "school ID abc123"
- Break down by project/school names when helpful
- Avoid bullet points unless listing multiple distinct items
- If no matches: "I checked 3 projects, 8 schools, 342 total students - none are in grade 5"
- NEVER show document IDs (projectId, schoolId, studentId, etc.) in responses to users

🚫 FORBIDDEN IN RESPONSES:
- Document IDs like "3z1coXXzD68Pe50pVRRF"
- Database paths like "projects/xyz/schools/abc"
- Technical field names unless explaining the data structure
- Phrases before fetching data: "There are no students...", "No data found...", "I cannot access..."

✅ CORRECT APPROACH:
- "Let me check your organization's data..."
- *[calls tools]*
- "I found X students across Y schools..."
- Use school names, project names, student names - never IDs
`.trim();

// Gemini Tool Definitions
export const geminiTools = [
  {
    functionDeclarations: [
      // Organization & Structure
      {
        name: "get_organization_overview",
        description: "Get overview: organization name, total projects and schools. Use this to understand the scope of available data.",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "list_projects",
        description: "List all projects in the organization with their IDs and names. This is the FIRST step for any student/school query.",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "list_schools_in_project",
        description: "List all schools in a specific project. Required before accessing students. Use the EXACT projectId from list_projects.",
        parameters: {
          type: "object",
          properties: { 
            projectId: { 
              type: "string", 
              description: "The exact document ID of the project (from list_projects)" 
            } 
          },
          required: ["projectId"],
        },
      },
      {
        name: "get_school_details",
        description: "Get detailed information about a specific school including enrollment, location, etc.",
        parameters: {
          type: "object",
          properties: {
            projectId: { type: "string", description: "Project ID containing the school" },
            schoolId: { type: "string", description: "School document ID" },
          },
          required: ["projectId", "schoolId"],
        },
      },
      
      // Students
      {
        name: "list_students_in_school",
        description: "Get ALL students in a specific school. This is the PRIMARY way to access student data. Requires both projectId and schoolId from previous calls.",
        parameters: {
          type: "object",
          properties: {
            projectId: { 
              type: "string", 
              description: "Project ID (from list_projects)" 
            },
            schoolId: { 
              type: "string", 
              description: "School ID (from list_schools_in_project)" 
            },
            grade: { 
              type: "string", 
              description: "Optional: filter by grade level (e.g., '5', 'Grade 5')" 
            },
            gender: { 
              type: "string", 
              description: "Optional: filter by gender (male/female)" 
            },
          },
          required: ["projectId", "schoolId"],
        },
      },
      {
        name: "get_student_details",
        description: "Get detailed information about ONE specific student including assessments, attendance, household info.",
        parameters: {
          type: "object",
          properties: {
            projectId: { type: "string", description: "Project ID" },
            schoolId: { type: "string", description: "School ID" },
            studentId: { type: "string", description: "Student document ID" },
          },
          required: ["projectId", "schoolId", "studentId"],
        },
      },
      {
        name: "search_students",
        description: "Search for students across multiple projects/schools. Use this ONLY for broad searches. For specific schools, use list_students_in_school instead.",
        parameters: {
          type: "object",
          properties: {
            projectId: { type: "string", description: "Optional: limit to one project" },
            schoolId: { type: "string", description: "Optional: limit to one school" },
            grade: { type: "string", description: "Optional: filter by grade" },
            gender: { type: "string", description: "Optional: filter by gender" },
          },
        },
      },
      
      // Assessments
      {
        name: "list_assessments",
        description: "List all assessments in the organization. Assessments have a 'type' field (Literacy/Numeracy) and 'level' field (Baseline/Endline with capital B and E). Each assessment contains an assigned_students array with student data and results.",
        parameters: {
          type: "object",
          properties: {
            projectId: { type: "string", description: "Optional: filter by project" },
            schoolId: { type: "string", description: "Optional: filter by school" },
            type: { type: "string", description: "Optional: filter by type ('Literacy' or 'Numeracy')" },
            level: { type: "string", description: "Optional: filter by level ('Baseline' or 'Endline' - capital B and E)" },
          },
        },
      },
      {
        name: "get_assessment_details",
        description: "Get complete details about a specific assessment including metadata AND the assigned_students array which contains both student info and their results (has_done, baseline performance level, etc.).",
        parameters: {
          type: "object",
          properties: {
            assessmentId: { type: "string", description: "Assessment document ID from list_assessments" },
          },
          required: ["assessmentId"],
        },
      },
      {
        name: "get_assessment_results",
        description: "DEPRECATED: Results are now in assigned_students array. Use get_assessment_details instead.",
        parameters: {
          type: "object",
          properties: {
            assessmentId: { type: "string", description: "Assessment document ID" },
          },
          required: ["assessmentId"],
        },
      },
      {
        name: "get_assessment_statistics",
        description: "Get calculated statistics from assessments: completion rates, performance distribution, etc. Analyzes the assigned_students array across filtered assessments. Remember: level values are 'Baseline' or 'Endline' (capital B and E).",
        parameters: {
          type: "object",
          properties: {
            projectId: { type: "string", description: "Optional: filter by project" },
            schoolId: { type: "string", description: "Optional: filter by school" },
            assessmentId: { type: "string", description: "Optional: specific assessment only" },
            type: { type: "string", description: "Optional: filter by type ('Literacy' or 'Numeracy')" },
            level: { type: "string", description: "Optional: filter by level ('Baseline' or 'Endline' - capital B and E)" },
          },
        },
      },
      
      // Attendance
      {
        name: "get_attendance_records",
        description: "Get raw attendance records for a project or school. Returns individual attendance entries.",
        parameters: {
          type: "object",
          properties: {
            projectId: { type: "string", description: "Project ID (required)" },
            schoolId: { type: "string", description: "Optional: specific school" },
            startDate: { type: "string", description: "Optional: filter from date (YYYY-MM-DD)" },
            endDate: { type: "string", description: "Optional: filter to date (YYYY-MM-DD)" },
          },
          required: ["projectId"],
        },
      },
      {
        name: "get_attendance_statistics",
        description: "Get attendance statistics: average attendance rate, trends, highest/lowest rates.",
        parameters: {
          type: "object",
          properties: {
            projectId: { type: "string", description: "Project ID" },
            schoolId: { type: "string", description: "Optional: specific school" },
            timeframe: { type: "string", description: "Optional: week, month, term, year" },
          },
        },
      },
      
      // Households
      {
        name: "list_households",
        description: "List all households (families) in a school with parent/guardian information.",
        parameters: {
          type: "object",
          properties: {
            projectId: { type: "string", description: "Project ID" },
            schoolId: { type: "string", description: "School ID" },
          },
          required: ["projectId", "schoolId"],
        },
      },
      {
        name: "get_household_details",
        description: "Get detailed information about a specific household including all family members.",
        parameters: {
          type: "object",
          properties: {
            projectId: { type: "string", description: "Project ID" },
            schoolId: { type: "string", description: "School ID" },
            householdId: { type: "string", description: "Household document ID" },
          },
          required: ["projectId", "schoolId", "householdId"],
        },
      },
    ],
  },
];