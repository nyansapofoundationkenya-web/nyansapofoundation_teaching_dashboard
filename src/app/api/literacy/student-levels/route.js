import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// Initialize Firebase Admin once
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

// Define the two possible literacy schemas
const DEFAULT_SCHEMA = ["beginner", "letter", "word", "paragraph", "story", "above"];
const NON_READER_SCHEMA = [
  "non-reader",
  "letter",
  "word",
  "paragraph",
  "reading-comprehension",
];

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
      .doc("student_levels");

    const now = Date.now();
    const cachedDoc = await statsRef.get();

    if (cachedDoc.exists) {
      const data = cachedDoc.data();

      // Normalize last_updated (handles Timestamp or Date)
      let lastUpdated = null;
      if (data.last_updated instanceof Date) {
        lastUpdated = data.last_updated;
      } else if (data.last_updated?.toDate) {
        lastUpdated = data.last_updated.toDate();
      }

      const isFresh =
        lastUpdated && now - lastUpdated.getTime() < CACHE_DURATION;

      if (isFresh) {
        console.log(`✅ Using cached student levels for ${organization_id}`);
        return Response.json({
          success: true,
          data: data.result,
          cached: true,
          last_updated: lastUpdated,
        });
      }

      // Return stale data immediately + start background recalculation
      console.log(`♻️ Cache stale, returning old data while recalculating...`);
      const response = Response.json({
        success: true,
        data: data.result,
        cached: true,
        last_updated: lastUpdated,
        refreshing: true,
      });

      // Background refresh (non-blocking)
      (async () => {
        try {
          console.log(`🔄 Background recalculation started for ${organization_id}`);
          const freshResult = await computeStudentLevels(organization_id);
          await statsRef.set({
            result: freshResult,
            last_updated: Timestamp.now(),
          });
          console.log(`✅ Background cache updated for ${organization_id}`);
        } catch (err) {
          console.error("ERROR in background recalculation:", err);
        }
      })();

      return response;
    }

    // No cache found — compute fresh
    console.log(`🆕 No cache found, computing student levels for ${organization_id}`);
    const result = await computeStudentLevels(organization_id);
    await statsRef.set({ result, last_updated: Timestamp.now() });

    return Response.json({
      success: true,
      data: result,
      cached: false,
      last_updated: new Date(),
    });
  } catch (error) {
    console.error("❌ ERROR:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Heavy computation helper
async function computeStudentLevels(organization_id) {
  // Determine which schema this organization uses
  let usesNonReaderSchema = false;

  const projectsSnapshot = await db
    .collection(`organization/${organization_id}/projects`)
    .get();

  // Quick scan to detect which schema is used
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
        const baseline = student.baseline?.toLowerCase().trim();
        const endline = student.endline?.toLowerCase().trim();

        if (
          baseline === "non-reader" ||
          endline === "non-reader" ||
          baseline === "reading-comprehension" ||
          endline === "reading-comprehension"
        ) {
          usesNonReaderSchema = true;
          break;
        }
      }
      if (usesNonReaderSchema) break;
    }
    if (usesNonReaderSchema) break;
  }

  // Choose appropriate schema
  const schema = usesNonReaderSchema ? NON_READER_SCHEMA : DEFAULT_SCHEMA;
  console.log(`📘 Organization ${organization_id} uses schema:`, schema);

  // Initialize counters
  const baselineCounts = {};
  const endlineCounts = {};
  schema.forEach((level) => {
    baselineCounts[level] = 0;
    endlineCounts[level] = 0;
  });

  let totalStudents = 0;
  let studentsWithBaseline = 0;
  let studentsWithEndline = 0;

  // Compute student levels
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

        if (baseline && baselineCounts[baseline] !== undefined) {
          baselineCounts[baseline]++;
          studentsWithBaseline++;
        }

        if (endline && endlineCounts[endline] !== undefined) {
          endlineCounts[endline]++;
          studentsWithEndline++;
        }
      }
    }
  }

  // Return results
  return {
    baseline: baselineCounts,
    endline: endlineCounts,
    stats: {
      total_students: totalStudents,
      students_with_baseline: studentsWithBaseline,
      students_with_endline: studentsWithEndline,
    },
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
