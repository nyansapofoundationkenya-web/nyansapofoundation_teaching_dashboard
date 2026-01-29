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
const LEVEL_ORDER = { beginner: 1, letter: 2, word: 3, paragraph: 4, story: 5, above: 6 };
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function POST(request) {
  try {
    const { organization_id } = await request.json();
    if (!organization_id) {
      return Response.json({ success: false, error: "Missing organization_id" }, { status: 400 });
    }

    const statsRef = db
      .collection("organization")
      .doc(organization_id)
      .collection("stats")
      .doc("student_improvement");

    const now = Date.now();
    const cachedDoc = await statsRef.get();

    // 1️⃣ If cached data exists
    if (cachedDoc.exists) {
      const data = cachedDoc.data();
      const isFresh =
        data.last_updated && now - data.last_updated.toMillis() < CACHE_DURATION;

      if (isFresh) {
        console.log(`✅ Using cached student improvement stats for ${organization_id}`);
        return Response.json({
          success: true,
          data: data.result,
          cached: true,
          last_updated: data.last_updated.toDate(),
        });
      }

      // Return stale data immediately, start background recalculation
      console.log(`⏳ Cache stale, returning old data while recalculating...`);
      const response = Response.json({
        success: true,
        data: data.result,
        cached: true,
        last_updated: data.last_updated.toDate(),
        refreshing: true,
      });

      (async () => {
        try {
          console.log(`♻️ Background recalculation started for ${organization_id}`);
          const freshResult = await computeStudentImprovement(organization_id);
          await statsRef.set({ result: freshResult, last_updated: new Date() });
          console.log(`✅ Background cache updated for ${organization_id}`);
        } catch (err) {
          console.error("ERROR in background recalculation:", err);
        }
      })();

      return response;
    }

    // 2️⃣ No cache found — compute fresh
    const result = await computeStudentImprovement(organization_id);
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
async function computeStudentImprovement(organization_id) {
  let totalStudents = 0;
  let studentsWithBoth = 0;
  let studentsImproved = 0;

  const projectsSnapshot = await db.collection(`organization/${organization_id}/projects`).get();

  for (const projectDoc of projectsSnapshot.docs) {
    const projectId = projectDoc.id;
    const schoolsSnapshot = await db
      .collection(`organization/${organization_id}/projects/${projectId}/schools`)
      .get();

    for (const schoolDoc of schoolsSnapshot.docs) {
      const schoolId = schoolDoc.id;
      const studentsSnapshot = await db
        .collection(
          `organization/${organization_id}/projects/${projectId}/schools/${schoolId}/students`
        )
        .get();

      for (const studentDoc of studentsSnapshot.docs) {
        const student = studentDoc.data();
        totalStudents++;

        const baseline = student.baseline?.toLowerCase().trim();
        const endline = student.endline?.toLowerCase().trim();

        if (
          baseline &&
          endline &&
          LEVEL_ORDER[baseline] !== undefined &&
          LEVEL_ORDER[endline] !== undefined
        ) {
          studentsWithBoth++;
          if (LEVEL_ORDER[endline] > LEVEL_ORDER[baseline]) studentsImproved++;
        }
      }
    }
  }

  const improvementPercentage =
    studentsWithBoth > 0
      ? parseFloat(((studentsImproved / studentsWithBoth) * 100).toFixed(2))
      : 0;

  return {
    students_improved: studentsImproved,
    improvement_percentage: improvementPercentage,
    students_assessed: studentsWithBoth,
    total_students: totalStudents,
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
