import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

/**
 * Execute a tool call from Gemini
 * @param {object} call - The function call object from Gemini
 * @param {string} organizationId - The organization ID
 * @param {object} db - Firestore database instance
 * @returns {Promise<object>} The result of the tool execution
 */
export const executeToolCall = async (call, organizationId, db) => {
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
        
        const allStudents = assessments.flatMap((a) => 
          (a.assigned_students || []).map(s => ({ ...s, assessmentType: a.type, assessmentLevel: a.level }))
        );
        const total = allStudents.length;
        const completed = allStudents.filter((s) => s.has_done || s.completed_assessment).length;
        
        const performanceLevels = {};
        allStudents.forEach(s => {
          if (s.baseline && s.baseline !== "") {
            performanceLevels[s.baseline] = (performanceLevels[s.baseline] || 0) + 1;
          }
        });
        
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