// ─────────────────────────────────────────────────────────────
// SERVICE FUNCTIONS — audioLibrary.service.js
// ─────────────────────────────────────────────────────────────
import { ref, list, getMetadata, getDownloadURL } from "firebase/storage";
import { doc, getDoc } from "firebase/firestore";
import { storage, db } from "@/firebase/config";
import { parseFileName, PAGE_SIZE, RETRIGGER_URL } from "./audioLibrary.constants";

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

// ── Check Firestore for result existence ──────────────────────
//
// Matching logic mirrors transcribe_audio.py exactly:
//
//   Python writes:
//     { content: urllib.parse.unquote(raw_content.strip()),
//       metadata: { type: "Letter"|"Word"|"Paragraph"|"Story",  ← Capitalised
//                   done_time: timestamp_str_or_empty_string } }
//
//   We match on: content + type (case-insensitive) + done_time
//
//   Content strategy — we try multiple forms because filenames in the
//   wild may be percent-encoded, plain text, or use underscores as spaces:
//     1. file.content   = decodeURIComponent(rawSegment)   ← primary, mirrors Python
//     2. file.rawContent = raw segment, no decoding        ← fallback A
//     3. rawContent with _ replaced by space               ← fallback B (legacy)
//
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

    // ── Document doesn't exist at all ──
    if (!snap.exists()) {
      console.log(
        `[checkResult] No Firestore doc for ${file.assessmentId}_${file.studentId}`
      );
      return { exists: false, transcriptionFailed: false };
    }

    const results = snap.data()?.literacy_results?.reading_results ?? [];

    console.log(
      `[checkResult] Doc found. ${results.length} results for ${file.assessmentId}_${file.studentId}`,
      `| looking for type="${file.type}" timestamp="${file.timestamp}" content="${file.content}"`
    );

    // All content forms we'll accept as a match
    const contentForms = new Set(
      [
        file.content,
        file.rawContent,
        file.rawContent ? file.rawContent.replace(/_/g, " ") : null,
      ].filter(Boolean)
    );

    const match = results.find((r) => {
      const meta             = r.metadata ?? {};
      const firestoreContent = r.content ?? "";
      const firestoreType    = (meta.type ?? "").toLowerCase();   // "letter","word","paragraph","story"
      const firestoreTime    = meta.done_time ?? "";

      const typeMatch      = firestoreType === file.type;
      const timestampMatch = firestoreTime === file.timestamp;
      const contentMatch   = contentForms.has(firestoreContent);

      // Log each candidate so you can see exactly what's in Firestore vs what we parsed
    //   console.log(
    //     `[checkResult]   candidate: content="${firestoreContent}" type="${firestoreType}" done_time="${firestoreTime}"`,
    //     `→ typeMatch=${typeMatch} timestampMatch=${timestampMatch} contentMatch=${contentMatch}`
    //   );

      return typeMatch && timestampMatch && contentMatch;
    });

    if (!match) {
      console.log(`[checkResult] No match found → "missing"`);
      return { exists: false, transcriptionFailed: false };
    }

    console.log(`[checkResult] Match found → exists`);
    return {
      exists: true,
      transcriptionFailed: match.metadata?.transcription_failed === true,
      passed:     match.metadata?.passed,
      transcript: match.metadata?.transcript || "",
      mistakes:   match.metadata?.mistakes ?? null,
    };
  } catch (err) {
    // Surface the error clearly — a silent null hides real bugs
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
      name:       file.fullPath,
      bucket:     file.bucket,
      generation: file.generation,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json().catch(() => ({}));
}