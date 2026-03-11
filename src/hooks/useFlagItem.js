// hooks/useFlagItem.js
import { db } from "@/firebase/config";
import { doc, getDoc, writeBatch, increment } from "firebase/firestore";

export function useFlagItem(assessmentId, studentId, assessmentType) {
  const resultsDocId  = `${assessmentId}_${studentId}`;
  const flagsDocId    = assessmentType === "numeracy" ? "numeracy_flags" : "literacy_flags";
  const counterField  = assessmentType === "numeracy" ? "total_numeracy_flags" : "total_literacy_flags";

  const getCounterRef = () => doc(db, "model_retraining_status", flagsDocId);

  // ── NUMERACY ──────────────────────────────────────────────────────────────
  const flagNumeracyItem = async (section, index) => {
    const docRef    = doc(db, "assessments", assessmentId, "assessments-results", resultsDocId);
    const freshSnap = await getDoc(docRef);
    if (!freshSnap.exists()) throw new Error("Results document not found");

    const freshData    = freshSnap.data();
    const sectionArray = [...(freshData?.numeracy_results?.[section] || [])];
    if (!sectionArray[index]) throw new Error(`Item at index ${index} not found`);
    if (sectionArray[index].flagged === true) return; // already flagged, skip counter

    sectionArray[index] = { ...sectionArray[index], flagged: true };

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
    if (readingArray[globalIndex].flagged === true) return;

    readingArray[globalIndex] = { ...readingArray[globalIndex], flagged: true };

    const batch = writeBatch(db);
    batch.update(docRef, { "literacy_results.reading_results": readingArray });
    batch.set(getCounterRef(), { [counterField]: increment(1) }, { merge: true });
    await batch.commit();
  };

  // ── LITERACY comprehension ────────────────────────────────────────────────
  const flagLiteracyComprehensionItem = async (field, groupIndex, questionIndex) => {
    const docRef    = doc(db, "assessments", assessmentId, "assessments-results", resultsDocId);
    const freshSnap = await getDoc(docRef);
    if (!freshSnap.exists()) throw new Error("Results document not found");

    const freshData = freshSnap.data();
    const batch     = writeBatch(db);

    if (field === "comprehension_multiple_choice_questions") {
      const groups   = JSON.parse(JSON.stringify(freshData?.literacy_results?.[field] || []));
      const question = groups?.[groupIndex]?.questions?.[questionIndex];
      if (!question) throw new Error("Comprehension question not found");
      if (question.flagged === true) return;

      groups[groupIndex].questions[questionIndex] = { ...question, flagged: true };
      batch.update(docRef, { [`literacy_results.${field}`]: groups });
    } else {
      const questions = [...(freshData?.literacy_results?.[field] || [])];
      if (!questions[questionIndex]) throw new Error("Question not found");
      if (questions[questionIndex].flagged === true) return;

      questions[questionIndex] = { ...questions[questionIndex], flagged: true };
      batch.update(docRef, { [`literacy_results.${field}`]: questions });
    }

    batch.set(getCounterRef(), { [counterField]: increment(1) }, { merge: true });
    await batch.commit();
  };

  return { flagNumeracyItem, flagLiteracyReadingItem, flagLiteracyComprehensionItem };
}