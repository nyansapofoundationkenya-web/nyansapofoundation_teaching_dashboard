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
      .doc("missed_numbers");

    const now = Date.now();
    const cachedDoc = await statsRef.get();

    // 1️⃣ Serve cached data if fresh
    if (cachedDoc.exists) {
      const data = cachedDoc.data();
      const isFresh =
        data.last_updated && now - data.last_updated.toMillis() < CACHE_DURATION;

      if (isFresh) {
        console.log(`✅ Using cached numeracy data for ${organization_id}`);
        return Response.json({
          success: true,
          data: data.result,
          cached: true,
          last_updated: data.last_updated.toDate(),
        });
      }

      // Serve stale data immediately + trigger background update
      console.log(`⏳ Cache stale, returning old data while recalculating numeracy...`);
      const response = Response.json({
        success: true,
        data: data.result,
        cached: true,
        last_updated: data.last_updated.toDate(),
        refreshing: true,
      });

      (async () => {
        try {
          console.log(`♻️ Background numeracy recalculation started for ${organization_id}`);
          const freshResult = await computeMissedNumbers(organization_id);
          await statsRef.set({ result: freshResult, last_updated: new Date() });
          console.log(`✅ Background numeracy cache updated for ${organization_id}`);
        } catch (err) {
          console.error("ERROR in background numeracy recalculation:", err);
        }
      })();

      return response;
    }

    // 2️⃣ No cache found — compute fresh
    const result = await computeMissedNumbers(organization_id);
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
// 🧮 Compute Missed Numbers
async function computeMissedNumbers(organization_id) {
  const assessmentsSnapshot = await db
    .collection("assessments")
    .where("organization_id", "==", organization_id)
    .where("type", "==", "Numeracy")
    .get();

  if (assessmentsSnapshot.empty) {
    return {
      top_3_missed: [],
      stats: {
        total_assessments: 0,
        total_number_questions: 0,
        total_numbers_missed: 0,
        total_numbers_correct: 0,
        success_rate: 0,
      },
    };
  }

  const numberMistakes = {};
  let totalNumberQuestions = 0;
  let totalNumbersMissed = 0;

  for (const assessDoc of assessmentsSnapshot.docs) {
    const assessId = assessDoc.id;
    const resultsSnapshot = await db
      .collection(`assessments/${assessId}/assessments-results`)
      .get();

    for (const resultDoc of resultsSnapshot.docs) {
      const result = resultDoc.data();
      const numeracy = result.numeracy_results || {};
      const recognition = numeracy.number_recognition || [];

      for (const item of recognition) {
        const metadata = item.metadata || {};
        const passed = metadata.passed || false;
        const content = item.content?.trim();

        if (content) {
          totalNumberQuestions++;
          if (!passed) {
            totalNumbersMissed++;
            numberMistakes[content] = (numberMistakes[content] || 0) + 1;
          }
        }
      }
    }
  }

  const top3MissedNumbers = Object.entries(numberMistakes)
    .map(([num, count]) => ({
      number: num,
      times_missed: count,
      percentage: parseFloat(((count / totalNumberQuestions) * 100).toFixed(2)),
    }))
    .sort((a, b) => b.times_missed - a.times_missed)
    .slice(0, 3);

  const successRate = parseFloat(
    (
      ((totalNumberQuestions - totalNumbersMissed) / totalNumberQuestions) *
      100
    ).toFixed(2)
  );

  return {
    top_3_missed: top3MissedNumbers,
    stats: {
      total_assessments: assessmentsSnapshot.size,
      total_number_questions: totalNumberQuestions,
      total_numbers_missed: totalNumbersMissed,
      total_numbers_correct: totalNumberQuestions - totalNumbersMissed,
      success_rate: successRate,
    },
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
