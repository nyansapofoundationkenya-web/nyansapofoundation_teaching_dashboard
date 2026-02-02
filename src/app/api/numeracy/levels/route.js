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

// 🔢 Define Numeracy Levels
const NUMERACY_LEVELS = [
  "beginner",
  "number_recognition",
  "addition",
  "subtraction",
  "multiplication",
  "division",
];

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
      .doc("numeracy_levels");

    const now = Date.now();
    const cachedDoc = await statsRef.get();

    // ✅ Use cache if fresh
    if (cachedDoc.exists) {
      const data = cachedDoc.data();
      const isFresh =
        data.last_updated && now - data.last_updated.toMillis() < CACHE_DURATION;

      if (isFresh) {
        console.log(`✅ Using cached numeracy stats for ${organization_id}`);
        return Response.json({
          success: true,
          data: data.result,
          cached: true,
          last_updated: data.last_updated.toDate(),
        });
      }

      // ⏳ Return stale cache while recalculating in background
      console.log(`♻️ Cache stale, returning old data while recalculating...`);
      const response = Response.json({
        success: true,
        data: data.result,
        cached: true,
        last_updated: data.last_updated.toDate(),
        refreshing: true,
      });

      (async () => {
        try {
          console.log(`🔄 Recomputing numeracy stats for ${organization_id}...`);
          const freshResult = await computeNumeracyLevels(organization_id);
          await statsRef.set({ result: freshResult, last_updated: new Date() });
          console.log(`✅ Cache updated for numeracy stats of ${organization_id}`);
        } catch (err) {
          console.error("ERROR in background recalculation:", err);
        }
      })();

      return response;
    }

    // 🚀 Compute fresh if no cache
    const result = await computeNumeracyLevels(organization_id);
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
// 🧮 Compute Numeracy Stats
async function computeNumeracyLevels(organization_id) {
  const baselineCounts = {
    beginner: 0,
    number_recognition: 0,
    addition: 0,
    subtraction: 0,
    multiplication: 0,
    division: 0,
  };

  const endlineCounts = { ...baselineCounts };
  let totalStudents = 0;
  let studentsWithBaseline = 0;
  let studentsWithEndline = 0;

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

        const numeracyBaseline = student.numeracy_baseline?.toLowerCase().trim();
        const numeracyEndline = student.numeracy_endline?.toLowerCase().trim();

        if (numeracyBaseline && NUMERACY_LEVELS.includes(numeracyBaseline)) {
          baselineCounts[numeracyBaseline]++;
          studentsWithBaseline++;
        }
        if (numeracyEndline && NUMERACY_LEVELS.includes(numeracyEndline)) {
          endlineCounts[numeracyEndline]++;
          studentsWithEndline++;
        }
      }
    }
  }

  return {
    numeracy_baseline: baselineCounts,
    numeracy_endline: endlineCounts,
    stats: {
      total_students: totalStudents,
      students_with_baseline: studentsWithBaseline,
      students_with_endline: studentsWithEndline,
    },
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
