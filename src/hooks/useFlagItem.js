// hooks/useFlagItem.js
import { db } from "@/firebase/config";
import { doc, getDoc, writeBatch, increment } from "firebase/firestore";

export function useFlagItem(assessmentId, studentId, assessmentType) {
  const resultsDocId  = `${assessmentId}_${studentId}`;
  const flagsDocId    = assessmentType === "numeracy" ? "numeracy_flags" : "literacy_flags";
  const counterField  = assessmentType === "numeracy" ? "total_numeracy_flags" : "total_literacy_flags";

  const getCounterRef = () => doc(db, "model_retraining_status", flagsDocId);

  const isAlreadyModerated = (item) =>
    item?.metadata?.modeltranscriptionverified === true;

  /**
   * Returns true if this item should be skipped for flagging:
   * - already flagged (pending review)
   * - already moderated (modeltranscriptionverified === true), regardless of flagged value
   */
  const shouldSkipFlagging = (item) =>
    item.flagged === true || isAlreadyModerated(item);

  // ── NUMERACY ──────────────────────────────────────────────────────────────
  const flagNumeracyItem = async (section, index) => {
    const docRef    = doc(db, "assessments", assessmentId, "assessments-results", resultsDocId);
    const freshSnap = await getDoc(docRef);
    if (!freshSnap.exists()) throw new Error("Results document not found");

    const freshData    = freshSnap.data();
    const sectionArray = [...(freshData?.numeracy_results?.[section] || [])];
    if (!sectionArray[index]) throw new Error(`Item at index ${index} not found`);

    const item = sectionArray[index];
    if (shouldSkipFlagging(item)) return;

    sectionArray[index] = { ...item, flagged: true };

    const batch = writeBatch(db);
    batch.update(docRef, { [`numeracy_results.${section}`]: sectionArray });
    batch.set(getCounterRef(), { [counterField]: increment(1) }, { merge: true });
    await batch.commit();
  };

  // ── LITERACY reading_results ───────────────────────────────────────────────
  const flagLiteracyReadingItem = async (globalIndex) => {
    const docRef    = doc(db, "assessments", assessmentId, "assessments-results", resultsDocId);
    const freshSnap = await getDoc(docRef);
    if (!freshSnap.exists()) throw new Error("Results document not found");

    const freshData    = freshSnap.data();
    const readingArray = [...(freshData?.literacy_results?.reading_results || [])];
    if (!readingArray[globalIndex]) throw new Error(`Item at globalIndex ${globalIndex} not found`);

    const item = readingArray[globalIndex];
    if (shouldSkipFlagging(item)) return;

    readingArray[globalIndex] = { ...item, flagged: true };

    const batch = writeBatch(db);
    batch.update(docRef, { "literacy_results.reading_results": readingArray });
    batch.set(getCounterRef(), { [counterField]: increment(1) }, { merge: true });
    await batch.commit();
  };

  return { flagNumeracyItem, flagLiteracyReadingItem };
}