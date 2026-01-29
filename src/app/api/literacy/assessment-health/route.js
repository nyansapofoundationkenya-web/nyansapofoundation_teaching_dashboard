import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function POST(request) {
  try {
    const { organization_id } = await request.json();
    if (!organization_id) {
      return Response.json(
        { success: false, error: "Missing organization_id" },
        { status: 400 }
      );
    }

    const statsRef = db
      .collection("organization")
      .doc(organization_id)
      .collection("stats")
      .doc("assessment_health");

    const now = Date.now();
    const cachedDoc = await statsRef.get();

    // 1️⃣ If cached data exists
    if (cachedDoc.exists) {
      const data = cachedDoc.data();
      const isFresh =
        data.last_updated && now - data.last_updated.toMillis() < CACHE_DURATION;

      // Serve fresh cache
      if (isFresh) {
        console.log(`✅ Using cached assessment health data for ${organization_id}`);
        return Response.json({
          success: true,
          data: data.result,
          cached: true,
          last_updated: data.last_updated.toDate(),
        });
      }

      // Serve stale data immediately + start background recalc
      console.log(`⏳ Assessment health cache stale, returning old data while recalculating...`);
      const response = Response.json({
        success: true,
        data: data.result,
        cached: true,
        last_updated: data.last_updated.toDate(),
        refreshing: true,
      });

      // Trigger background recalculation (non-blocking)
      ;(async () => {
        try {
          console.log(`♻️ Background recalculation started for assessment health ${organization_id}`);
          const freshResult = await computeAssessmentHealth(organization_id);
          await statsRef.set({ result: freshResult, last_updated: new Date() });
          console.log(`✅ Background assessment health cache updated for ${organization_id}`);
        } catch (err) {
          console.error("ERROR in background assessment health recalculation:", err);
        }
      })();

      return response;
    }

    // 2️⃣ No cache found — compute fresh
    const result = await computeAssessmentHealth(organization_id);
    await statsRef.set({ result, last_updated: new Date() });

    return Response.json({
      success: true,
      data: result,
      cached: false,
      last_updated: new Date(),
    });
  } catch (error) {
    console.error("ERROR:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ----------------------
// Heavy computation helper
async function computeAssessmentHealth(organization_id) {
  // Fetch all assessments for this organization
  const assessmentsSnapshot = await db
    .collection("assessments")
    .where("organization_id", "==", organization_id)
    .get();

  if (assessmentsSnapshot.empty) {
    return {
      literacy: {
        completion_rate: 0,
        avg_completion_time: 0,
        total_assessments: 0,
        total_students_assigned: 0,
        total_students_completed: 0,
      },
      numeracy: {
        completion_rate: 0,
        avg_completion_time: 0,
        total_assessments: 0,
        total_students_assigned: 0,
        total_students_completed: 0,
      },
      overall: {
        completion_rate: 0,
        avg_completion_time: 0,
        total_assessments: 0,
        total_students_assigned: 0,
        total_students_completed: 0,
      }
    };
  }

  // Initialize counters for Literacy and Numeracy
  const literacy = {
    totalAssessments: 0,
    totalStudentsAssigned: 0,
    totalStudentsCompleted: 0,
    totalCompletionTime: 0,
    assessmentsWithTime: 0,
  };

  const numeracy = {
    totalAssessments: 0,
    totalStudentsAssigned: 0,
    totalStudentsCompleted: 0,
    totalCompletionTime: 0,
    assessmentsWithTime: 0,
  };

  // Process each assessment
  for (const assessDoc of assessmentsSnapshot.docs) {
    const assessData = assessDoc.data();
    const assignedStudents = assessData.assigned_students || [];
    const assessmentType = assessData.type; // "Literacy", "Numeracy", or "Endline"

    // Skip if no students assigned
    if (assignedStudents.length === 0) continue;

    const totalStudents = assignedStudents.length;

    // Count completed students
    const completedStudents = assignedStudents.filter(
      (student) =>
        student.completed_assessment === true ||
        student.assessment_status === "completed"
    );

    const completedCount = completedStudents.length;

    // Calculate completion time if available
    const studentsWithTime = completedStudents.filter(
      (s) => s.completion_time && typeof s.completion_time === "number"
    );

    let totalTime = 0;
    if (studentsWithTime.length > 0) {
      totalTime = studentsWithTime.reduce(
        (sum, s) => sum + s.completion_time,
        0
      );
    }

    // Route to appropriate category based on type
    if (assessmentType === "Literacy") {
      literacy.totalAssessments++;
      literacy.totalStudentsAssigned += totalStudents;
      literacy.totalStudentsCompleted += completedCount;
      if (studentsWithTime.length > 0) {
        literacy.totalCompletionTime += totalTime;
        literacy.assessmentsWithTime += studentsWithTime.length;
      }
    } else if (assessmentType === "Numeracy") {
      numeracy.totalAssessments++;
      numeracy.totalStudentsAssigned += totalStudents;
      numeracy.totalStudentsCompleted += completedCount;
      if (studentsWithTime.length > 0) {
        numeracy.totalCompletionTime += totalTime;
        numeracy.assessmentsWithTime += studentsWithTime.length;
      }
    }
    // Note: "Endline" assessments are not counted separately
    // If you want to include them, add another category or decide which type they belong to
  }

  // Calculate metrics for Literacy
  const literacyCompletionRate =
    literacy.totalStudentsAssigned > 0
      ? parseFloat(
          ((literacy.totalStudentsCompleted / literacy.totalStudentsAssigned) * 100).toFixed(2)
        )
      : 0;

  const literacyAvgTime =
    literacy.assessmentsWithTime > 0
      ? Math.round(literacy.totalCompletionTime / literacy.assessmentsWithTime)
      : 18; // Default 18 minutes

  // Calculate metrics for Numeracy
  const numeracyCompletionRate =
    numeracy.totalStudentsAssigned > 0
      ? parseFloat(
          ((numeracy.totalStudentsCompleted / numeracy.totalStudentsAssigned) * 100).toFixed(2)
        )
      : 0;

  const numeracyAvgTime =
    numeracy.assessmentsWithTime > 0
      ? Math.round(numeracy.totalCompletionTime / numeracy.assessmentsWithTime)
      : 18; // Default 18 minutes

  // Calculate overall metrics
  const overallStudentsAssigned = literacy.totalStudentsAssigned + numeracy.totalStudentsAssigned;
  const overallStudentsCompleted = literacy.totalStudentsCompleted + numeracy.totalStudentsCompleted;
  const overallCompletionRate =
    overallStudentsAssigned > 0
      ? parseFloat(
          ((overallStudentsCompleted / overallStudentsAssigned) * 100).toFixed(2)
        )
      : 0;

  const overallAvgTime =
    (literacy.assessmentsWithTime + numeracy.assessmentsWithTime) > 0
      ? Math.round(
          (literacy.totalCompletionTime + numeracy.totalCompletionTime) /
          (literacy.assessmentsWithTime + numeracy.assessmentsWithTime)
        )
      : 18;

  return {
    literacy: {
      completion_rate: literacyCompletionRate,
      avg_completion_time: literacyAvgTime,
      total_assessments: literacy.totalAssessments,
      total_students_assigned: literacy.totalStudentsAssigned,
      total_students_completed: literacy.totalStudentsCompleted,
    },
    numeracy: {
      completion_rate: numeracyCompletionRate,
      avg_completion_time: numeracyAvgTime,
      total_assessments: numeracy.totalAssessments,
      total_students_assigned: numeracy.totalStudentsAssigned,
      total_students_completed: numeracy.totalStudentsCompleted,
    },
    overall: {
      completion_rate: overallCompletionRate,
      avg_completion_time: overallAvgTime,
      total_assessments: literacy.totalAssessments + numeracy.totalAssessments,
      total_students_assigned: overallStudentsAssigned,
      total_students_completed: overallStudentsCompleted,
    }
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";