// ─────────────────────────────────────────────────────────────
// SERVICE FUNCTIONS — audioLibrary.service.js
// ─────────────────────────────────────────────────────────────
import { ref, list, getMetadata, getDownloadURL } from "firebase/storage";
import { doc, getDoc } from "firebase/firestore";
import { storage, db } from "@/firebase/config";
import { parseFileName, PAGE_SIZE, RETRIGGER_URL, dayKey } from "./audioLibrary.constants";

const BATCH_CHECK_URL = process.env.NEXT_PUBLIC_BATCH_CHECK_URL || "";

// ── Resolve Storage items → enriched file objects ────────────
export async function resolveItems(itemRefs) {
  const settled = await Promise.allSettled(
    itemRefs.map(async (itemRef) => {
      const [meta, downloadURL] = await Promise.all([
        getMetadata(itemRef),
        getDownloadURL(itemRef),
      ]);
      const parsed = parseFileName(itemRef.name);
      if (!parsed) return null;
      return {
        id: itemRef.name,
        ...parsed,
        downloadURL,
        uploadedAt: meta.timeCreated,
        size: meta.size,
        fullPath: itemRef.fullPath,
        generation: meta.generation,
        bucket: meta.bucket,
      };
    })
  );
  return settled
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter(Boolean);
}

// ── Fetch a single page from Storage ─────────────────────────
export async function fetchStoragePage(folderPath, pageToken) {
  const folderRef = ref(storage, folderPath);
  const result = await list(folderRef, {
    maxResults: PAGE_SIZE,
    ...(pageToken ? { pageToken } : {}),
  });
  const pageFiles = await resolveItems(result.items);
  pageFiles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  return {
    files: pageFiles,
    nextPageToken: result.nextPageToken ?? null,
    hasMore: !!result.nextPageToken,
  };
}

// ── Check Firestore for result existence (kept for fallback) ─
export async function checkResultExists(file) {
  try {
    const docRef = doc(
      db,
      "assessments",
      file.assessmentId,
      "assessments-results",
      `${file.assessmentId}_${file.studentId}`
    );
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return { exists: false, transcriptionFailed: false };
    }
    const results = snap.data()?.literacy_results?.reading_results ?? [];
    const contentForms = new Set(
      [file.content, file.rawContent, file.rawContent?.replace(/_/g, " ")].filter(Boolean)
    );
    const match = results.find((r) => {
      const meta = r.metadata ?? {};
      return (
        (meta.type ?? "").toLowerCase() === file.type &&
        (meta.done_time ?? "") === file.timestamp &&
        contentForms.has(r.content ?? "")
      );
    });
    if (!match) return { exists: false, transcriptionFailed: false };
    return {
      exists: true,
      transcriptionFailed: match.metadata?.transcription_failed === true,
      passed: match.metadata?.passed,
      transcript: match.metadata?.transcript || "",
      mistakes: match.metadata?.mistakes ?? null,
    };
  } catch (err) {
    console.error("[checkResult] ERROR:", err);
    return { exists: null, transcriptionFailed: false };
  }
}

// ── Re-trigger Cloud Function ─────────────────────────────────
export async function retriggerFile(file) {
  if (!RETRIGGER_URL) throw new Error("RETRIGGER_URL not configured");
  const res = await fetch(RETRIGGER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: file.fullPath,
      bucket: file.bucket,
      generation: file.generation,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json().catch(() => ({}));
}

// ── Batch check results via Cloud Function ───────────────────
export async function batchCheckResults(files) {
  if (!BATCH_CHECK_URL) throw new Error("BATCH_CHECK_URL not configured");
  if (!files.length) return {};
  const res = await fetch(BATCH_CHECK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      files: files.map((f) => ({
        id: f.id,
        assessmentId: f.assessmentId,
        studentId: f.studentId,
        type: f.type,
        timestamp: f.timestamp,
        content: f.content,
        rawContent: f.rawContent,
      })),
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.results || {};
}

// ── Fetch files for a specific date (chunked) ────────────────
export async function fetchDayChunk(folderPath, targetDate, pageToken = undefined, maxPages = 10) {
  let currentPageToken = pageToken;
  let dayFiles = [];
  let pagesScanned = 0;
  let hasMoreGlobal = true;
  let exhaustedDate = false;

  while (pagesScanned < maxPages && hasMoreGlobal && !exhaustedDate) {
    const { files, nextPageToken, hasMore } = await fetchStoragePage(folderPath, currentPageToken);

    for (const file of files) {
      const fileDate = dayKey(file.uploadedAt);
      if (fileDate === targetDate) {
        dayFiles.push(file);
      } else if (fileDate < targetDate) {
        exhaustedDate = true;
        break;
      }
    }

    hasMoreGlobal = hasMore;
    currentPageToken = nextPageToken;
    pagesScanned++;
    if (exhaustedDate) break;
  }

  return {
    files: dayFiles,
    nextPageToken: exhaustedDate ? null : currentPageToken,
    hasMore: !exhaustedDate && hasMoreGlobal,
    pagesScanned,
    dateExhausted: exhaustedDate,
  };
}