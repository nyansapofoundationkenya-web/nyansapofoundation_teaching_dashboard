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
      .doc("missed_letters");

    const now = Date.now();
    const cachedDoc = await statsRef.get();

    // 1️⃣ If cached data exists
    if (cachedDoc.exists) {
      const data = cachedDoc.data();
      const isFresh =
        data.last_updated && now - data.last_updated.toMillis() < CACHE_DURATION;

      // Serve fresh cache
      if (isFresh) {
        console.log(`✅ Using cached data for ${organization_id}`);
        return Response.json({
          success: true,
          data: data.result,
          cached: true,
          last_updated: data.last_updated.toDate(),
        });
      }

      // Serve stale data immediately + start background recalc
      console.log(`⏳ Cache stale, returning old data while recalculating...`);
      // Return cached data right away!
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
          console.log(`♻️ Background recalculation started for ${organization_id}`);
          const freshResult = await computeMissedLetters(organization_id);
          await statsRef.set({ result: freshResult, last_updated: new Date() });
          console.log(`✅ Background cache updated for ${organization_id}`);
        } catch (err) {
          console.error("ERROR in background recalculation:", err);
        }
      })();

      // Return immediately so Next.js sees a response
      return response;
    }

    // 2️⃣ No cache found — compute fresh
    const result = await computeMissedLetters(organization_id);
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
async function computeMissedLetters(organization_id) {
  const assessmentsSnapshot = await db
    .collection("assessments")
    .where("organization_id", "==", organization_id)
    .where("type", "==", "Literacy")
    .get();

  if (assessmentsSnapshot.empty)
    return {
      top_3_missed: [],
      stats: {
        total_assessments: 0,
        total_letter_questions: 0,
        total_letters_missed: 0,
        total_letters_correct: 0,
        success_rate: 0,
      },
    };

  const letterMistakes = {};
  let totalLetterQuestions = 0;
  let totalLetterMissed = 0;

  for (const assessDoc of assessmentsSnapshot.docs) {
    const assessId = assessDoc.id;
    const resultsSnapshot = await db
      .collection(`assessments/${assessId}/assessments-results`)
      .get();

    for (const resultDoc of resultsSnapshot.docs) {
      const result = resultDoc.data();
      const literacy = result.literacy_results || {};
      const readingResults = literacy.reading_results || [];

      for (const r of readingResults) {
        const metadata = r.metadata || {};
        const type = metadata.type?.toLowerCase();
        const passed = metadata.passed || false;

        if (type === "letter") {
          totalLetterQuestions++;
          if (!passed) {
            totalLetterMissed++;
            const content = r.content?.trim().toLowerCase();
            if (content)
              letterMistakes[content] = (letterMistakes[content] || 0) + 1;
          }
        }
      }
    }
  }

  const top3MissedLetters = Object.entries(letterMistakes)
    .map(([letter, count]) => ({
      letter,
      times_missed: count,
      percentage: parseFloat(
        ((count / totalLetterQuestions) * 100).toFixed(2)
      ),
    }))
    .sort((a, b) => b.times_missed - a.times_missed)
    .slice(0, 3);

  const successRate = parseFloat(
    (
      ((totalLetterQuestions - totalLetterMissed) / totalLetterQuestions) *
      100
    ).toFixed(2)
  );

  return {
    top_3_missed: top3MissedLetters,
    stats: {
      total_assessments: assessmentsSnapshot.size,
      total_letter_questions: totalLetterQuestions,
      total_letters_missed: totalLetterMissed,
      total_letters_correct: totalLetterQuestions - totalLetterMissed,
      success_rate: successRate,
    },
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
