// utils/exportAssessmentData.js
import {
  collection,
  doc,
  getDocs,
  writeBatch,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { db, kiswahiliAuth, kiswahiliDb } from "@/firebase/config";

const BATCH_SIZE = 400;

// Destination config — one external project, multiple collections.
const DEST_AUTH = kiswahiliAuth;
const DEST_DB = kiswahiliDb;
const COLLECTIONS = {
  kiswahili: "kiswahili",
  english: "english",
  drawings: "drawings",
};

const normalizeLanguage = (assessment) =>
  String(assessment?.language || "").trim().toLowerCase();

const normalizeType = (assessment) =>
  String(assessment?.type || "literacy").trim().toLowerCase();

const normalizeReadingType = (raw) =>
  String(raw || "").trim().toLowerCase();

// ── Ensure we're signed in to the destination project ────────────────────
let signInPromise = null;
async function ensureDestinationSignedIn() {
  if (!DEST_DB) {
    throw new Error(
      "The destination Firebase project is not configured. Add its NEXT_PUBLIC_KISWAHILI_* values."
    );
  }
  if (!DEST_AUTH) {
    throw new Error(
      "The destination Firebase Authentication configuration is missing."
    );
  }
  if (DEST_AUTH.currentUser) return;

  if (!signInPromise) {
    signInPromise = signInAnonymously(DEST_AUTH).catch((err) => {
      signInPromise = null; // allow retry on next call
      throw err;
    });
  }
  await signInPromise;
}

// ── Generic batched writer (targets the destination project) ─────────────
async function batchWrite(collectionName, records) {
  for (let start = 0; start < records.length; start += BATCH_SIZE) {
    const batch = writeBatch(DEST_DB);
    records.slice(start, start + BATCH_SIZE).forEach((record) => {
      batch.set(doc(collection(DEST_DB, collectionName)), record);
    });
    await batch.commit();
  }
}

// ── Shared metadata attached to EVERY migrated record ────────────────────
function buildBaseMeta({
  assessment,
  assessmentId,
  group,
  migratedBy,
  migratedByName,
}) {
  return {
    assessmentId,
    assessmentName: assessment?.name || null,
    organizationId:
      assessment?.organizationId ?? assessment?.organization_id ?? null,
    projectId:
      assessment?.projectId ?? assessment?.project_id ?? null,
    group: group || null,
    migratedBy: migratedBy || null,
    migratedByName: migratedByName || null,
    source: "assessment-migration",
    migratedAt: serverTimestamp(),
  };
}

function extractStudentId(resultDocId, assessmentId) {
  if (!resultDocId) return null;
  const prefix = `${assessmentId}_`;
  if (resultDocId.startsWith(prefix)) {
    return resultDocId.slice(prefix.length) || null;
  }
  const idx = resultDocId.indexOf("_");
  return idx >= 0 ? resultDocId.slice(idx + 1) : null;
}

// ── LITERACY (english) ────────────────────────────────────────────────────
function collectLiteracyEnglishRecords({
  assessment,
  assessmentId,
  resultsSnapshot,
  baseMeta,
}) {
  const records = [];
  let skipped = 0;

  resultsSnapshot.forEach((resultDocument) => {
    const studentId = extractStudentId(resultDocument.id, assessmentId);
    const readingResults =
      resultDocument.data()?.literacy_results?.reading_results || [];

    readingResults.forEach((item) => {
      const transcript = item?.metadata?.transcript?.trim();
      const audioUrl = item?.metadata?.audio_url?.trim();
      const type = normalizeReadingType(item?.metadata?.type || item?.type);

      if (!transcript || !audioUrl || !type) {
        skipped += 1;
        return;
      }

      records.push({
        ...baseMeta,
        studentId,
        label: transcript,
        url: audioUrl,
        type,
      });
    });
  });

  return { records, skipped };
}

// ── NUMERACY → english (number recognition) ──────────────────────────────
function collectNumberRecognitionRecords({
  assessment,
  assessmentId,
  resultsSnapshot,
  baseMeta,
}) {
  const records = [];
  let skipped = 0;

  resultsSnapshot.forEach((resultDocument) => {
    const studentId = extractStudentId(resultDocument.id, assessmentId);
    const recognitionItems =
      resultDocument.data()?.numeracy_results?.number_recognition || [];

    recognitionItems.forEach((item) => {
      const transcript = item?.metadata?.transcript?.trim();
      const audioUrl = item?.metadata?.audio_url?.trim();
      const content = item?.content ?? item?.metadata?.content;

      if (!transcript || !audioUrl) {
        skipped += 1;
        return;
      }

      records.push({
        ...baseMeta,
        studentId,
        label: transcript,
        url: audioUrl,
        type: "number",
        content: content != null ? String(content) : null,
      });
    });
  });

  return { records, skipped };
}

// ── NUMERACY → drawings ──────────────────────────────────────────────────
function collectDrawingsRecords({
  assessment,
  assessmentId,
  resultsSnapshot,
  baseMeta,
}) {
  const records = [];
  let skipped = 0;

  resultsSnapshot.forEach((resultDocument) => {
    const studentId = extractStudentId(resultDocument.id, assessmentId);
    const numeracy = resultDocument.data()?.numeracy_results || {};

    (numeracy.number_operations || []).forEach((item) => {
      const transcript = item?.metadata?.transcript?.trim();
      const screenshotUrl = item?.metadata?.screenshot_url?.trim();

      if (!transcript || !screenshotUrl) {
        skipped += 1;
        return;
      }

      records.push({
        ...baseMeta,
        studentId,
        label: transcript,
        url: screenshotUrl,
        type: "number_operation",
        tag: "new",
        operation: {
          type: item?.type || null,
          number1: item?.operations_number1 ?? null,
          number2: item?.operations_number2 ?? null,
          passed: item?.metadata?.passed ?? null,
        },
      });
    });

    (numeracy.word_problem || []).forEach((item) => {
      const transcript = item?.metadata?.transcript?.trim();
      const screenshotUrl = item?.metadata?.screenshot_url?.trim();

      if (!transcript || !screenshotUrl) {
        skipped += 1;
        return;
      }

      records.push({
        ...baseMeta,
        studentId,
        label: transcript,
        url: screenshotUrl,
        type: "word_problem",
        tag: "new",
        question: item?.question || null,
        expectedAnswer: item?.expected_number ?? null,
        passed: item?.metadata?.passed ?? null,
      });
    });
  });

  return { records, skipped };
}

// ── KISWAHILI ────────────────────────────────────────────────────────────
function collectKiswahiliRecords({
  assessmentId,
  resultsSnapshot,
  baseMeta,
}) {
  const records = [];
  let skipped = 0;

  resultsSnapshot.forEach((resultDocument) => {
    const studentId = extractStudentId(resultDocument.id, assessmentId);
    const readingResults =
      resultDocument.data()?.literacy_results?.reading_results || [];

    readingResults.forEach((readingResult) => {
      const transcript = readingResult?.metadata?.transcript?.trim();
      const audioUrl = readingResult?.metadata?.audio_url?.trim();
      const type = normalizeReadingType(
        readingResult?.metadata?.type || readingResult?.type
      );

      if (!transcript || !audioUrl) {
        skipped += 1;
        return;
      }

      records.push({
        ...baseMeta,
        studentId,
        label: transcript,
        url: audioUrl,
        type: type || null,
      });
    });
  });

  return { records, skipped };
}

// ── Public API ───────────────────────────────────────────────────────────
/**
 * @param {Object}  args
 * @param {Object}  args.assessment
 * @param {string}  args.assessmentId
 * @param {string}  args.group            // fine-tune batch name (required)
 * @param {string}  [args.migratedBy]     // uid
 * @param {string}  [args.migratedByName] // display name / email
 */
export async function exportAssessmentData({
  assessment,
  assessmentId,
  group,
  migratedBy = null,
  migratedByName = null,
}) {
  if (!assessment || !assessmentId) {
    throw new Error("Assessment and assessmentId are required.");
  }
  if (!group || !String(group).trim()) {
    throw new Error(
      "A group name is required so records can be tagged for fine-tuning."
    );
  }

  const cleanGroup = String(group).trim();
  const language = normalizeLanguage(assessment);
  const type = normalizeType(assessment);

  // Read the source results from the app's own Firestore
  const resultsSnapshot = await getDocs(
    collection(db, `assessments/${assessmentId}/assessments-results`)
  );

  // Make sure the destination project is ready before any writes
  await ensureDestinationSignedIn();

  const baseMeta = buildBaseMeta({
    assessment,
    assessmentId,
    group: cleanGroup,
    migratedBy,
    migratedByName,
  });

  const summary = {
    students: resultsSnapshot.size,
    group: cleanGroup,
    kiswahili: null,
    english: null,
    drawings: null,
  };

  const assessmentUpdate = {};

  // ── SWAHILI LITERACY ──
  if (language === "swahili" && type === "literacy") {
    const { records, skipped } = collectKiswahiliRecords({
      assessmentId,
      resultsSnapshot,
      baseMeta,
    });
    if (records.length > 0) {
      await batchWrite(COLLECTIONS.kiswahili, records);
    }
    summary.kiswahili = {
      exported: records.length,
      skipped,
      students: resultsSnapshot.size,
    };
    assessmentUpdate.kiswahiliTransferred = true;
  }

  // ── ENGLISH LITERACY ──
  else if (language === "english" && type === "literacy") {
    const { records, skipped } = collectLiteracyEnglishRecords({
      assessment,
      assessmentId,
      resultsSnapshot,
      baseMeta,
    });
    if (records.length > 0) {
      await batchWrite(COLLECTIONS.english, records);
    }
    summary.english = {
      exported: records.length,
      skipped,
      students: resultsSnapshot.size,
    };
    assessmentUpdate.englishTransferred = true;
  }

  // ── NUMERACY ──
  else if (type === "numeracy") {
    const recognition = collectNumberRecognitionRecords({
      assessment,
      assessmentId,
      resultsSnapshot,
      baseMeta,
    });
    if (recognition.records.length > 0) {
      await batchWrite(COLLECTIONS.english, recognition.records);
    }

    const drawings = collectDrawingsRecords({
      assessment,
      assessmentId,
      resultsSnapshot,
      baseMeta,
    });
    if (drawings.records.length > 0) {
      await batchWrite(COLLECTIONS.drawings, drawings.records);
    }

    summary.english = {
      exported: recognition.records.length,
      skipped: recognition.skipped,
      students: resultsSnapshot.size,
      kind: "number_recognition",
    };
    summary.drawings = {
      exported: drawings.records.length,
      skipped: drawings.skipped,
      students: resultsSnapshot.size,
    };

    if (recognition.records.length > 0)
      assessmentUpdate.englishTransferred = true;
    if (drawings.records.length > 0)
      assessmentUpdate.drawingsTransferred = true;
  }

  else {
    throw new Error(
      `Unsupported assessment combination: language="${language}", type="${type}".`
    );
  }

  // ── Mark assessment as transferred (writes to the app's own Firestore) ──
  assessmentUpdate.transferredAt = serverTimestamp();
  if (migratedBy) assessmentUpdate.transferredBy = migratedBy;
  if (migratedByName) assessmentUpdate.transferredByName = migratedByName;
  assessmentUpdate.transferGroups = arrayUnion(cleanGroup);
  assessmentUpdate.lastTransferGroup = cleanGroup;

  await updateDoc(doc(db, "assessments", assessmentId), assessmentUpdate);

  return summary;
}