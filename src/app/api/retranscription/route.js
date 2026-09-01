// app/api/retranscription/route.js
import { NextResponse } from "next/server";
import { Client as GradioClient } from "@gradio/client";
import { adminAuth, adminDb, adminStorage } from "@/firebase/adminConfig"; 
// ^ adjust this import to wherever your firebase-admin app is initialized.
// It needs to export:
//   adminAuth    -> from admin.auth()
//   adminDb      -> from admin.firestore()
//   adminStorage -> from admin.storage()

// ── Adjust these two if your role lives somewhere else ────────────────────
const USERS_COLLECTION = "user";
const ROLE_FIELD = "role";
// ────────────────────────────────────────────────────────────────────────

const GRADIO_SPACE = "Nzyoka19/nyansapo_audio"; // English model, matches transcribe_audio.py
const HF_TOKEN = process.env.HF_TOKEN;
const STORAGE_BUCKET = process.env.STORAGE_BUCKET; // same bucket used by the storage trigger

let gradioClientPromise = null;
function getGradioClient() {
  // Cache the connection across warm invocations, same idea as the
  // module-level _gradio_client cache in the Python version.
  if (!gradioClientPromise) {
    gradioClientPromise = GradioClient.connect(GRADIO_SPACE, {
      hf_token: HF_TOKEN,
    });
  }
  return gradioClientPromise;
}

function jsonError(message, status) {
  return NextResponse.json({ error: message }, { status });
}

async function getUidFromRequest(req) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch (err) {
    console.warn("[AUTH] Invalid token:", err.message);
    return null;
  }
}

async function isSuperAdmin(uid) {
  const snap = await adminDb.collection(USERS_COLLECTION).doc(uid).get();
  if (!snap.exists) return false;
  return snap.data()?.[ROLE_FIELD] === "super_admin";
}

// Simple retry wrapper, mirroring the retry/backoff behaviour of
// _transcribe_with_gradio in the Python version.
async function transcribeWithRetry(audioBlob, assessmentType) {
  const isLongAudio = ["paragraph", "story"].includes(assessmentType);
  const maxAttempts = isLongAudio ? 4 : 3;
  const client = await getGradioClient();

  let lastError = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      console.log(`[GRADIO] Attempt ${attempt + 1}/${maxAttempts}`);
      const result = await client.predict("/transcribe", {
        audio_path: audioBlob,
      });

      // result.data is typically an array of outputs
      const raw = Array.isArray(result?.data) ? result.data[0] : result?.data;
      const transcription = typeof raw === "string" ? raw.trim() : "";

      if (transcription) {
        console.log(`[GRADIO] Success: "${transcription.slice(0, 200)}"`);
        return transcription;
      }

      console.warn(`[GRADIO] Empty result on attempt ${attempt + 1}`);
    } catch (err) {
      lastError = err;
      const msg = String(err?.message || err);
      let wait;
      if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
        wait = 60_000 * (attempt + 1);
        console.warn(`[GRADIO] Rate-limited, waiting ${wait}ms`);
      } else if (/timeout|timed out/i.test(msg)) {
        wait = 30_000 * (attempt + 1);
        console.warn(`[GRADIO] Timeout, waiting ${wait}ms`);
      } else {
        wait = 2 ** attempt * 1000;
        console.error(`[GRADIO] Error (wait=${wait}ms):`, err);
      }
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
    }

    if (attempt < maxAttempts - 1) {
      const wait = 5000 * (attempt + 1);
      await new Promise((r) => setTimeout(r, wait));
    }
  }

  if (lastError) console.error("[GRADIO] All attempts failed:", lastError);
  return null;
}

export async function POST(req) {
  // ── 1. Auth ──────────────────────────────────────────────────────
  const uid = await getUidFromRequest(req);
  if (!uid) return jsonError("Missing or invalid Authorization header", 401);

  const allowed = await isSuperAdmin(uid);
  if (!allowed) {
    console.warn(`[AUTH] uid=${uid} attempted retranscribe without super_admin role`);
    return jsonError("Forbidden — super admin only", 403);
  }

  // ── 2. Parse body ────────────────────────────────────────────────
  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
  const { assessmentId, studentId, globalIndex } = body || {};
  if (!assessmentId || !studentId || globalIndex === undefined || globalIndex === null) {
    return jsonError("Missing assessmentId, studentId, or globalIndex", 400);
  }

  // ── 3. Look up the entry ────────────────────────────────────────
  // Uses the same "globalIndex into reading_results" concept the client
  // already relies on for moderation updates — no separate entry_key
  // field required.
  const docRef = adminDb
    .collection("assessments")
    .doc(assessmentId)
    .collection("assessments-results")
    .doc(`${assessmentId}_${studentId}`);

  const snap = await docRef.get();
  if (!snap.exists) return jsonError("Assessment result not found", 404);

  const data = snap.data();
  const results = data?.literacy_results?.reading_results || [];

  if (
    typeof globalIndex !== "number" ||
    !Number.isInteger(globalIndex) ||
    globalIndex < 0 ||
    globalIndex >= results.length
  ) {
    return jsonError("Invalid globalIndex", 400);
  }

  const record = results[globalIndex];
  if (!record) return jsonError("Entry not found", 404);

  const meta = record.metadata || {};

  // ── 4. Refuse if already moderated ──────────────────────────────
  if (meta.modeltranscriptionverified === true) {
    return jsonError("This item has already been moderated", 409);
  }

  const audioUrl = meta.audio_url;
  if (!audioUrl) return jsonError("No audio_url on this entry", 400);

  const assessmentType = (meta.type || "").toLowerCase();

  // ── 5. Download audio from its public Storage URL ────────────────
  // audio_url is already a full Firebase Storage download URL (same one
  // the client's <audio> element plays directly), so a plain fetch is
  // enough — no need to resolve a storage_path via adminStorage.
  let audioBuffer;
  try {
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) {
      throw new Error(`Fetch failed with status ${audioRes.status}`);
    }
    const arrayBuffer = await audioRes.arrayBuffer();
    audioBuffer = Buffer.from(arrayBuffer);
    console.log(`[RETRANSCRIBE] uid=${uid} | globalIndex=${globalIndex} | ${audioBuffer.length} bytes`);
  } catch (err) {
    console.error("[RETRANSCRIBE] Download failed:", err);
    return jsonError("Failed to download audio file", 500);
  }

  // ── 6. Re-transcribe (English only) ──────────────────────────────
  try {
    const audioBlob = new Blob([audioBuffer], { type: "audio/wav" });
    const transcript = await transcribeWithRetry(audioBlob, assessmentType);

    if (!transcript) {
      return jsonError("Transcription failed — model returned no result", 502);
    }

    return NextResponse.json({ transcript });
  } catch (err) {
    console.error("[RETRANSCRIBE] Failed:", err);
    return jsonError("Re-transcription failed", 500);
  }
}