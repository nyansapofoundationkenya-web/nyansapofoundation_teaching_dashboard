"use client";

import { useState, useRef, useEffect } from "react";
import {
  FiSend,
  FiTrash2,
  FiCopy,
  FiCheck,
  FiZap,
  FiInfo,
  FiChevronUp,
} from "react-icons/fi";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { getAI, getGenerativeModel } from "firebase/ai";
import { app, db } from "@/firebase/config";

const DashboardChatBot = ({ organizationId }) => {
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm your AI Education Analyst.\n\nI can answer questions about assessments, student results, performance, attendance, trends — using real-time data from your organization only.\n\nAsk me anything!",
      sender: "bot",
      timestamp: new Date(),
      id: "welcome",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [organizationName, setOrganizationName] = useState("Your Organization");
  const [showContextInfo, setShowContextInfo] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Load organization name for personalized greeting
  useEffect(() => {
    const loadOrgName = async () => {
      if (!organizationId) return;
      try {
        const orgDoc = await getDoc(doc(db, "organization", organizationId));
        if (orgDoc.exists()) {
          const name = orgDoc.data()?.name || "Your Organization";
          setOrganizationName(name);
          setMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== "welcome");
            return [
              {
                text: `Hello! I'm your AI Education Analyst for **${name}**.\n\nI fetch real-time data only when needed to answer your questions accurately.\n\nWhat would you like to know?`,
                sender: "bot",
                timestamp: new Date(),
                id: "welcome-personalized",
              },
              ...filtered,
            ];
          });
        }
      } catch (error) {
        console.error("Error loading organization name:", error);
      }
    };
    loadOrgName();
  }, [organizationId]);

  // Initialize Gemini 2.5 Flash with function calling tools
  const ai = getAI(app);
  const model = getGenerativeModel(ai, {
    model: "gemini-2.5-flash",
    systemInstruction: `
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
    `.trim(),
    tools: [
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
    ],
  });

  // Execute tool calls — secure, on-demand Firestore reads
  const executeTool = async (call) => {
    try {
      const params = call.parameters || call.args || {};
      
      console.log("🔧 Tool called:", call.name);
      console.log("📦 Parameters:", JSON.stringify(params, null, 2));
      
      switch (call.name) {
        // ============ ORGANIZATION & STRUCTURE ============
        case "get_organization_overview": {
          const orgDoc = await getDoc(doc(db, "organization", organizationId));
          const projectsSnap = await getDocs(collection(db, `organization/${organizationId}/projects`));
          let totalSchools = 0;
          for (const proj of projectsSnap.docs) {
            const schoolsSnap = await getDocs(collection(db, `organization/${organizationId}/projects/${proj.id}/schools`));
            totalSchools += schoolsSnap.size;
          }
          return {
            organizationName: orgDoc.data()?.name || "Unknown",
            totalProjects: projectsSnap.size,
            totalSchools,
          };
        }

        case "list_projects": {
          const snap = await getDocs(collection(db, `organization/${organizationId}/projects`));
          const projects = snap.docs.map((d) => ({
            id: d.id,
            name: d.data().name || "Unnamed Project",
            ...d.data(),
          }));
          console.log("📋 Projects found:", projects);
          return { projects, count: projects.length };
        }

        case "list_schools_in_project": {
          const { projectId } = params;
          
          console.log("🔍 Looking for schools in project:", projectId);
          
          if (!projectId) {
            console.error("❌ No projectId provided!");
            return { 
              error: "Project ID is required. Please call list_projects first to get valid project IDs.",
              schools: []
            };
          }
          
          const snap = await getDocs(collection(db, `organization/${organizationId}/projects/${projectId}/schools`));
          const schools = snap.docs.map((d) => ({
            id: d.id,
            name: d.data().name || "Unnamed School",
            ...d.data(),
          }));
          console.log("🏫 Schools found:", schools);
          return { schools, count: schools.length, projectId };
        }

        case "get_school_details": {
          const { projectId, schoolId } = params;
          
          if (!projectId || !schoolId) {
            return { error: "Both projectId and schoolId are required" };
          }
          
          const schoolDoc = await getDoc(doc(db, `organization/${organizationId}/projects/${projectId}/schools/${schoolId}`));
          
          if (!schoolDoc.exists()) {
            return { error: `School not found at path: projects/${projectId}/schools/${schoolId}` };
          }
          
          return { school: { id: schoolDoc.id, ...schoolDoc.data() } };
        }

        // ============ STUDENTS ============
        case "list_students_in_school": {
          const { projectId, schoolId, grade, gender } = params;
          
          if (!projectId || !schoolId) {
            return { 
              error: "Both projectId and schoolId are required. Call list_projects and list_schools_in_project first.",
              students: []
            };
          }
          
          console.log(`👥 Fetching students from project: ${projectId}, school: ${schoolId}`);
          
          const studentsSnap = await getDocs(collection(db, `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students`));
          let students = studentsSnap.docs.map((d) => ({ 
            id: d.id, 
            projectId, 
            schoolId,
            ...d.data() 
          }));
          
          console.log(`✅ Found ${students.length} total students in this school`);
          
          // Apply filters
          if (grade) {
            const beforeFilter = students.length;
            students = students.filter(s => {
              const studentGrade = s.grade?.toString().toLowerCase();
              const searchGrade = grade.toString().toLowerCase();
              return studentGrade === searchGrade || 
                     studentGrade === `grade ${searchGrade}` ||
                     `grade ${studentGrade}` === searchGrade;
            });
            console.log(`🔍 Filtered by grade "${grade}": ${beforeFilter} → ${students.length} students`);
          }
          if (gender) {
            students = students.filter(s => s.gender?.toLowerCase() === gender.toLowerCase());
          }
          
          return { 
            students,
            totalCount: students.length,
            projectId,
            schoolId,
            filters: { grade, gender }
          };
        }

        case "get_student_details": {
          const { projectId, schoolId, studentId } = params;
          
          if (!projectId || !schoolId || !studentId) {
            return { error: "projectId, schoolId, and studentId are all required" };
          }
          
          const studentDoc = await getDoc(doc(db, `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students/${studentId}`));
          
          if (!studentDoc.exists()) {
            return { error: `Student not found at: projects/${projectId}/schools/${schoolId}/students/${studentId}` };
          }
          
          return { student: { id: studentDoc.id, ...studentDoc.data() } };
        }

        case "search_students": {
          const { projectId, schoolId, grade, gender } = params;
          
          const students = [];
          
          if (projectId && schoolId) {
            // Search in specific school
            const studentsSnap = await getDocs(collection(db, `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students`));
            students.push(...studentsSnap.docs.map(d => ({ id: d.id, projectId, schoolId, ...d.data() })));
          } else if (projectId) {
            // Search in all schools of a project
            const schoolsSnap = await getDocs(collection(db, `organization/${organizationId}/projects/${projectId}/schools`));
            for (const schoolDoc of schoolsSnap.docs) {
              const studentsSnap = await getDocs(collection(db, `organization/${organizationId}/projects/${projectId}/schools/${schoolDoc.id}/students`));
              students.push(...studentsSnap.docs.map(d => ({ id: d.id, projectId, schoolId: schoolDoc.id, ...d.data() })));
            }
          } else {
            // Search across entire organization (limit to first 100 for performance)
            const projectsSnap = await getDocs(collection(db, `organization/${organizationId}/projects`));
            let count = 0;
            for (const projDoc of projectsSnap.docs) {
              if (count >= 100) break;
              const schoolsSnap = await getDocs(collection(db, `organization/${organizationId}/projects/${projDoc.id}/schools`));
              for (const schoolDoc of schoolsSnap.docs) {
                if (count >= 100) break;
                const studentsSnap = await getDocs(collection(db, `organization/${organizationId}/projects/${projDoc.id}/schools/${schoolDoc.id}/students`));
                const schoolStudents = studentsSnap.docs.map(d => ({ id: d.id, projectId: projDoc.id, schoolId: schoolDoc.id, ...d.data() }));
                students.push(...schoolStudents);
                count += schoolStudents.length;
              }
            }
          }
          
          // Apply filters
          let filtered = students;
          if (grade) {
            filtered = filtered.filter(s => {
              const studentGrade = s.grade?.toString().toLowerCase();
              const searchGrade = grade.toString().toLowerCase();
              return studentGrade === searchGrade || 
                     studentGrade === `grade ${searchGrade}` ||
                     `grade ${studentGrade}` === searchGrade;
            });
          }
          if (gender) filtered = filtered.filter(s => s.gender?.toLowerCase() === gender.toLowerCase());
          
          return { students: filtered, totalCount: filtered.length };
        }

        // ============ ASSESSMENTS ============
        case "list_assessments": {
          const { projectId, schoolId, type, level } = params;
          
          let q = query(collection(db, "assessments"), where("organization_id", "==", organizationId));
          if (projectId) q = query(q, where("project_id", "==", projectId));
          if (schoolId) q = query(q, where("school_id", "==", schoolId));
          if (type) q = query(q, where("type", "==", type));
          if (level) q = query(q, where("level", "==", level));
          
          const snap = await getDocs(q);
          const assessments = snap.docs.map((d) => ({ 
            id: d.id, 
            ...d.data(),
            studentCount: d.data().assigned_students?.length || 0,
            completedCount: d.data().assigned_students?.filter(s => s.has_done || s.completed_assessment).length || 0
          }));
          
          console.log(`📝 Found ${assessments.length} assessments`);
          
          return { 
            assessments, 
            totalCount: assessments.length,
            filters: { projectId, schoolId, type, level }
          };
        }

        case "get_assessment_details": {
          const { assessmentId } = params;
          
          if (!assessmentId) {
            return { error: "assessmentId is required" };
          }
          
          const assessmentDoc = await getDoc(doc(db, "assessments", assessmentId));
          
          if (!assessmentDoc.exists()) {
            return { error: "Assessment not found" };
          }
          
          const data = assessmentDoc.data();
          const assignedStudents = data.assigned_students || [];
          const completedStudents = assignedStudents.filter(s => s.has_done || s.completed_assessment);
          
          console.log(`📊 Assessment "${data.name || assessmentId}": ${assignedStudents.length} students, ${completedStudents.length} completed`);
          
          return { 
            assessment: { 
              id: assessmentDoc.id, 
              ...data,
              summary: {
                totalStudents: assignedStudents.length,
                completedCount: completedStudents.length,
                completionRate: assignedStudents.length ? Math.round((completedStudents.length / assignedStudents.length) * 100) : 0
              }
            } 
          };
        }

        case "get_assessment_results": {
          const { assessmentId } = params;
          
          if (!assessmentId) {
            return { error: "assessmentId is required" };
          }
          
          // Results are now in assigned_students array
          const assessmentDoc = await getDoc(doc(db, "assessments", assessmentId));
          
          if (!assessmentDoc.exists()) {
            return { error: "Assessment not found" };
          }
          
          const assignedStudents = assessmentDoc.data().assigned_students || [];
          
          return { 
            results: assignedStudents,
            totalCount: assignedStudents.length,
            note: "Results are from the assigned_students array in the assessment document"
          };
        }

        case "get_assessment_statistics": {
          const { projectId, schoolId, assessmentId, type, level } = params;
          
          let assessments = [];
          
          if (assessmentId) {
            const assessmentDoc = await getDoc(doc(db, "assessments", assessmentId));
            if (assessmentDoc.exists()) {
              assessments = [{ id: assessmentDoc.id, ...assessmentDoc.data() }];
            }
          } else {
            let q = query(collection(db, "assessments"), where("organization_id", "==", organizationId));
            if (projectId) q = query(q, where("project_id", "==", projectId));
            if (schoolId) q = query(q, where("school_id", "==", schoolId));
            if (type) q = query(q, where("type", "==", type));
            if (level) q = query(q, where("level", "==", level));
            
            const snap = await getDocs(q);
            assessments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          }
          
          // Analyze assigned_students arrays
          const allStudents = assessments.flatMap((a) => 
            (a.assigned_students || []).map(s => ({ ...s, assessmentType: a.type, assessmentLevel: a.level }))
          );
          const total = allStudents.length;
          const completed = allStudents.filter((s) => s.has_done || s.completed_assessment).length;
          
          // Performance level distribution (baseline field)
          const performanceLevels = {};
          allStudents.forEach(s => {
            if (s.baseline && s.baseline !== "") {
              performanceLevels[s.baseline] = (performanceLevels[s.baseline] || 0) + 1;
            }
          });
          
          // Grade distribution
          const gradeDistribution = {};
          allStudents.forEach(s => {
            if (s.grade) {
              gradeDistribution[s.grade] = (gradeDistribution[s.grade] || 0) + 1;
            }
          });
          
          return {
            totalAssessments: assessments.length,
            totalStudents: total,
            completedCount: completed,
            completionRate: total ? Math.round((completed / total) * 100) : 0,
            performanceLevels,
            gradeDistribution,
            assessmentTypes: {
              literacy: assessments.filter(a => a.type === "Literacy").length,
              numeracy: assessments.filter(a => a.type === "Numeracy").length
            },
            assessmentLevels: {
              baseline: assessments.filter(a => a.level === "Baseline").length,
              endline: assessments.filter(a => a.level === "Endline").length
            },
            filters: { projectId, schoolId, assessmentId, type, level }
          };
        }

        // ============ ATTENDANCE ============
        case "get_attendance_records": {
          const { projectId, schoolId, startDate, endDate } = params;
          
          if (!projectId) {
            return { error: "projectId is required" };
          }
          
          let path = `organization/${organizationId}/projects/${projectId}`;
          if (schoolId) {
            path += `/schools/${schoolId}/attendance`;
          } else {
            const schoolsSnap = await getDocs(collection(db, `organization/${organizationId}/projects/${projectId}/schools`));
            const allRecords = [];
            
            for (const schoolDoc of schoolsSnap.docs) {
              const attendanceSnap = await getDocs(collection(db, `organization/${organizationId}/projects/${projectId}/schools/${schoolDoc.id}/attendance`));
              const records = attendanceSnap.docs.map(d => ({ 
                id: d.id, 
                schoolId: schoolDoc.id,
                schoolName: schoolDoc.data().name,
                ...d.data() 
              }));
              allRecords.push(...records);
            }
            
            return { records: allRecords, totalCount: allRecords.length };
          }
          
          const snap = await getDocs(collection(db, path));
          const records = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          
          return { records, totalCount: records.length };
        }

        case "get_attendance_statistics": {
          const { projectId, schoolId, timeframe } = params;
          
          let path = `organization/${organizationId}/projects`;
          if (projectId) path += `/${projectId}/schools`;
          if (schoolId) path += `/${schoolId}/attendance`;
          
          const snap = await getDocs(collection(db, path));
          const rates = snap.docs.map((d) => d.data()?.rate || 0).filter((r) => r > 0);
          const avg = rates.length ? (rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(1) : "N/A";
          
          return { 
            averageAttendanceRate: avg, 
            totalRecords: snap.size,
            highestRate: rates.length ? Math.max(...rates).toFixed(1) : "N/A",
            lowestRate: rates.length ? Math.min(...rates).toFixed(1) : "N/A",
          };
        }

        // ============ HOUSEHOLDS ============
        case "list_households": {
          const { projectId, schoolId } = params;
          
          if (!projectId || !schoolId) {
            return { error: "Both projectId and schoolId are required" };
          }
          
          const householdsSnap = await getDocs(collection(db, `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/households`));
          const households = householdsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          
          return { households, totalCount: households.length };
        }

        case "get_household_details": {
          const { projectId, schoolId, householdId } = params;
          
          if (!projectId || !schoolId || !householdId) {
            return { error: "projectId, schoolId, and householdId are all required" };
          }
          
          const householdDoc = await getDoc(doc(db, `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/households/${householdId}`));
          
          if (!householdDoc.exists()) {
            return { error: "Household not found" };
          }
          
          return { household: { id: householdDoc.id, ...householdDoc.data() } };
        }

        default:
          return { error: `Unknown tool: ${call.name}` };
      }
    } catch (error) {
      console.error("Tool execution error:", error);
      return { error: `Failed to fetch data: ${error.message}` };
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userQuestion = input.trim();
    const userMessage = {
      text: userQuestion,
      sender: "user",
      timestamp: new Date(),
      id: Date.now().toString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const chat = model.startChat({
        history: [],
      });

      let result = await chat.sendMessage(userQuestion);
      let functionCalls = result.response.functionCalls?.() || [];

      let iterationCount = 0;
      const maxIterations = 15; // Increased for complex multi-step queries

      while (functionCalls.length > 0 && iterationCount < maxIterations) {
        iterationCount++;
        const toolResponses = [];

        console.log(`🔄 Iteration ${iterationCount}: Processing ${functionCalls.length} tool call(s)`);

        for (const call of functionCalls) {
          console.log("➡️ Executing:", call.name);
          console.log("📦 Parameters:", JSON.stringify(call.parameters || call.args, null, 2));
          
          const toolResult = await executeTool(call);
          console.log("⬅️ Result:", JSON.stringify(toolResult, null, 2));
          
          toolResponses.push({
            functionResponse: {
              name: call.name,
              response: toolResult,
            },
          });
        }

        result = await chat.sendMessage(toolResponses);
        functionCalls = result.response.functionCalls?.() || [];
      }

      if (iterationCount >= maxIterations) {
        console.warn("⚠️ Max iterations reached. Stopping to prevent infinite loop.");
      }

      const aiText = result.response.text?.() || "I couldn't generate a response.";

      const botMessage = {
        text: aiText,
        sender: "bot",
        timestamp: new Date(),
        id: (Date.now() + 1).toString(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, something went wrong. Please try rephrasing your question or try again later.",
          sender: "bot",
          timestamp: new Date(),
          id: Date.now().toString(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        text: `Chat cleared. Still ready to help with data from **${organizationName}**. Ask away!`,
        sender: "bot",
        timestamp: new Date(),
        id: `cleared-${Date.now()}`,
      },
    ]);
  };

  const formatTime = (date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col h-full bg-[var(--background)] text-[var(--foreground)] font-sans">
      {/* Header */}
      <div className="p-5 border-b border-[var(--background-lighter)] bg-[var(--background-light)]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[var(--primary-2)]/20 rounded-xl">
              <FiZap className="w-6 h-6 text-[var(--primary-2)]" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">AI Education Analyst</h3>
              <p className="text-sm opacity-80">Gemini 2.5 Flash • Real-time Data</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowContextInfo(!showContextInfo)}
              className="p-2.5 rounded-lg bg-[var(--background-lighter)]/50 hover:bg-[var(--background-lighter)]/80 transition"
            >
              <FiInfo className="w-5 h-5" />
            </button>
            <button
              onClick={clearChat}
              className="p-2.5 rounded-lg bg-[var(--background-lighter)]/50 hover:bg-[var(--background-lighter)]/80 transition"
            >
              <FiTrash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showContextInfo && (
          <div className="p-4 bg-[var(--background-lighter)]/30 rounded-xl border border-[var(--primary-2)]/20">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium">Context</span>
              <button onClick={() => setShowContextInfo(false)}>
                <FiChevronUp className="w-5 h-5" />
              </button>
            </div>
            <p className="text-lg font-semibold">{organizationName}</p>
            <p className="text-xs opacity-70 mt-1">ID: {organizationId?.slice(0, 10)}...</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-2xl px-5 py-4 rounded-2xl shadow-lg ${
                msg.sender === "user"
                  ? "bg-gradient-to-r from-[var(--primary-2)] to-[#7ab8e6] text-white"
                  : msg.isError
                  ? "bg-red-900/30 border border-red-600/50 text-red-200"
                  : "bg-[var(--background-light)] border border-[var(--background-lighter)]"
              }`}
            >
              <div className="flex justify-between items-start gap-4 mb-2">
                <span className="text-xs font-medium opacity-70">
                  {msg.sender === "user" ? "You" : "AI Analyst"}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs opacity-60">{formatTime(msg.timestamp)}</span>
                  <button
                    onClick={() => copyToClipboard(msg.text, msg.id)}
                    className="opacity-60 hover:opacity-100 transition"
                  >
                    {copiedMessageId === msg.id ? (
                      <FiCheck className="w-4 h-4 text-green-400" />
                    ) : (
                      <FiCopy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="text-base whitespace-pre-wrap leading-relaxed">{msg.text}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[var(--background-light)] border border-[var(--background-lighter)] rounded-2xl px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex space-x-2">
                  <div className="w-2.5 h-2.5 bg-[var(--primary-2)] rounded-full animate-pulse"></div>
                  <div className="w-2.5 h-2.5 bg-[var(--primary-3)] rounded-full animate-pulse delay-150"></div>
                  <div className="w-2.5 h-2.5 bg-[var(--primary-2)] rounded-full animate-pulse delay-300"></div>
                </div>
                <span className="text-sm opacity-80">Analyzing your data...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-5 border-t border-[var(--background-lighter)] bg-[var(--background-light)]">
        <div className="flex gap-4">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about performance, results, attendance, trends..."
            className="flex-1 px-5 py-4 bg-[var(--background)] border border-[var(--background-lighter)] rounded-2xl placeholder:opacity-60 focus:outline-none focus:ring-2 focus:ring-[var(--primary-2)] resize-none"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`px-6 py-4 rounded-2xl font-medium transition-all ${
              !input.trim() || isLoading
                ? "bg-[var(--background-lighter)]/50 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-[var(--primary-2)] to-[#7ab8e6] hover:from-[#7ab8e6] hover:to-[var(--primary-2)] text-white shadow-lg"
            }`}
          >
            <FiSend className="w-6 h-6" />
          </button>
        </div>
        <div className="mt-3 flex justify-between text-xs opacity-70">
          <span>Gemini 2.5 Flash • On-demand Data</span>
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Connected
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardChatBot;