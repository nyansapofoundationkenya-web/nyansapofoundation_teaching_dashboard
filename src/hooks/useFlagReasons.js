// hooks/useFlagReasons.js
import { db } from "@/firebase/config";
import { doc, getDoc, writeBatch, increment } from "firebase/firestore";

// ── Literacy flag reasons ────────────────────────────────────────────────────
export function useFlagReasons(assessmentId, studentId) {
  const resultsDocId = `${assessmentId}_${studentId}`;
  const flagsDocRef  = () => doc(db, "model_retraining_status", "literacy_flags");

  const saveFlagReasons = async (globalIndex, newReasons, prevReasons = []) => {
    const docRef    = doc(db, "assessments", assessmentId, "assessments-results", resultsDocId);
    const freshSnap = await getDoc(docRef);
    if (!freshSnap.exists()) throw new Error("Results document not found");

    const freshData    = freshSnap.data();
    const readingArray = [...(freshData?.literacy_results?.reading_results || [])];
    if (!readingArray[globalIndex]) throw new Error(`Item at globalIndex ${globalIndex} not found`);

    readingArray[globalIndex] = { ...readingArray[globalIndex], flag_reasons: newReasons };

    const added   = newReasons.filter(r => !prevReasons.includes(r));
    const removed = prevReasons.filter(r => !newReasons.includes(r));

    const counterUpdates = {};
    added.forEach(r   => { counterUpdates[`literacy_flag_reason_${r}`] = increment(1); });
    removed.forEach(r => { counterUpdates[`literacy_flag_reason_${r}`] = increment(-1); });

    const batch = writeBatch(db);
    batch.update(docRef, { "literacy_results.reading_results": readingArray });
    if (Object.keys(counterUpdates).length > 0) {
      batch.set(flagsDocRef(), counterUpdates, { merge: true });
    }
    await batch.commit();
    return readingArray;
  };

  const incrementResolved = async () => {
    const batch = writeBatch(db);
    batch.set(flagsDocRef(), { resolved_literacy_flags: increment(1) }, { merge: true });
    await batch.commit();
  };

  return { saveFlagReasons, incrementResolved };
}

// ── Numeracy flag reasons ────────────────────────────────────────────────────
export function useNumeracyFlagReasons(assessmentId, studentId) {
  const resultsDocId = `${assessmentId}_${studentId}`;
  const flagsDocRef  = () => doc(db, "model_retraining_status", "numeracy_flags");

  /**
   * @param {string}   section      - e.g. "number_recognition", "number_operations"
   * @param {number}   index        - index in the section array
   * @param {string}   reasonType   - "audio" | "image"
   * @param {string[]} newReasons   - reason ids to save
   * @param {string[]} prevReasons  - previously saved reasons for delta calculation
   */
  const saveNumeracyFlagReasons = async (section, index, reasonType, newReasons, prevReasons = []) => {
    const docRef    = doc(db, "assessments", assessmentId, "assessments-results", resultsDocId);
    const freshSnap = await getDoc(docRef);
    if (!freshSnap.exists()) throw new Error("Results document not found");

    const freshData    = freshSnap.data();
    const sectionArray = [...(freshData?.numeracy_results?.[section] || [])];
    if (!sectionArray[index]) throw new Error(`Item at index ${index} not found`);

    // Store audio and image reasons separately on the item
    const reasonField = reasonType === "audio" ? "audio_flag_reasons" : "image_flag_reasons";
    sectionArray[index] = { ...sectionArray[index], [reasonField]: newReasons };

    const added   = newReasons.filter(r => !prevReasons.includes(r));
    const removed = prevReasons.filter(r => !newReasons.includes(r));

    // Counter prefix: numeracy_audio_flag_reason_X or numeracy_image_flag_reason_X
    const prefix         = `numeracy_${reasonType}_flag_reason_`;
    const counterUpdates = {};
    added.forEach(r   => { counterUpdates[`${prefix}${r}`] = increment(1); });
    removed.forEach(r => { counterUpdates[`${prefix}${r}`] = increment(-1); });

    const batch = writeBatch(db);
    // Write full array back — never dot-notation into array indices
    batch.update(docRef, { [`numeracy_results.${section}`]: sectionArray });
    if (Object.keys(counterUpdates).length > 0) {
      batch.set(flagsDocRef(), counterUpdates, { merge: true });
    }
    await batch.commit();
    return sectionArray;
  };

  const incrementResolved = async () => {
    const batch = writeBatch(db);
    batch.set(flagsDocRef(), { resolved_numeracy_flags: increment(1) }, { merge: true });
    await batch.commit();
  };

  return { saveNumeracyFlagReasons, incrementResolved };
}