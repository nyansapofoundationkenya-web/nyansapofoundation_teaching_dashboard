import {
  collection,
  doc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { db, kiswahiliAuth, kiswahiliDb } from "@/firebase/config";

const BATCH_SIZE = 400;

const isSwahiliAssessment = (assessment) =>
  String(assessment?.language || "").trim().toLowerCase() === "swahili";

export async function exportKiswahiliAssessment({ assessment, assessmentId }) {
  if (!isSwahiliAssessment(assessment)) {
    throw new Error("Only Swahili assessments can be exported.");
  }

  if (!kiswahiliDb) {
    throw new Error(
      "The Kiswahili Firebase project is not configured. Add its NEXT_PUBLIC_KISWAHILI_* values."
    );
  }

  if (!kiswahiliAuth) {
    throw new Error(
      "The Kiswahili Firebase Authentication configuration is missing."
    );
  }

  if (!kiswahiliAuth.currentUser) {
    await signInAnonymously(kiswahiliAuth);
  }

  const resultsSnapshot = await getDocs(
    collection(db, `assessments/${assessmentId}/assessments-results`)
  );
  const records = [];
  let skipped = 0;

  resultsSnapshot.forEach((resultDocument) => {
    const readingResults =
      resultDocument.data()?.literacy_results?.reading_results || [];

    readingResults.forEach((readingResult) => {
      const transcript = readingResult?.metadata?.transcript?.trim();
      const audioUrl = readingResult?.metadata?.audio_url?.trim();

      if (!transcript || !audioUrl) {
        skipped += 1;
        return;
      }

      records.push({ label: transcript, url: audioUrl });
    });
  });

  for (let start = 0; start < records.length; start += BATCH_SIZE) {
    const batch = writeBatch(kiswahiliDb);
    records.slice(start, start + BATCH_SIZE).forEach((record) => {
      batch.set(doc(collection(kiswahiliDb, "kiswahili")), record);
    });
    await batch.commit();
  }

  return {
    exported: records.length,
    skipped,
    students: resultsSnapshot.size,
  };
}
