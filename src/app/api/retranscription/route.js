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

const GRADIO_SPACE = "Nyansapoaike/nyansapo_stt"; // English model, matches transcribe_audio.py
const HF_TOKEN = process.env.HF_TOKEN;
const STORAGE_BUCKET = process.env.STORAGE_BUCKET; // same bucket used by the storage trigger

// Give the route as much runway as your plan allows. This MUST be >=
// TIME_BUDGET_MS below (with margin), or the platform will still kill the
// request before our own budget logic gets a chance to bail out cleanly.
// Vercel: Hobby caps this at 10s regardless of what you set here — Pro/
// Enterprise can go up to 300s/800s. Adjust to match your actual plan.
export const maxDuration = 300; // seconds

// Overall wall-clock budget for the whole transcribe-with-retry loop,
// kept comfortably under maxDuration so we always have time to return a
// clean JSON error instead of getting hard-killed mid-response.
const TIME_BUDGET_MS = 270_000; // 270s, 30s of margin under maxDuration

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
// _transcribe_with_gradio in the Python version — but now time-budgeted so
// it can never run long enough to get killed by the platform's own
// function timeout (which would return a non-JSON error page and break
// the client's res.json() call).
async function transcribeWithRetry(audioBlob, assessmentType) {
  const isLongAudio = ["paragraph", "story"].includes(assessmentType);
  const maxAttempts = isLongAudio ? 4 : 3;
  const client = await getGradioClient();

  const startedAt = Date.now();
  const timeLeft = () => TIME_BUDGET_MS - (Date.now() - startedAt);

  let lastError = null;
  let timedOut = false;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (timeLeft() <= 0) {
      timedOut = true;
      console.warn(`[GRADIO] Time budget exhausted before attempt ${attempt + 1}`);
      break;
    }

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
        return { transcript: transcription, timedOut: false };
      }

      console.warn(`[GRADIO] Empty result on attempt ${attempt + 1}`);
    } catch (err) {
      lastError = err;
      const msg = String(err?.message || err);
      let wait;
      if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
        wait = 60_000 * (attempt + 1);
        console.warn(`[GRADIO] Rate-limited, wanted to wait ${wait}ms`);
      } else if (/timeout|timed out/i.test(msg)) {
        wait = 30_000 * (attempt + 1);
        console.warn(`[GRADIO] Timeout, wanted to wait ${wait}ms`);
      } else {
        wait = 2 ** attempt * 1000;
        console.error(`[GRADIO] Error (wanted wait=${wait}ms):`, err);
      }

      // Never schedule a wait that would blow the remaining budget.
      wait = Math.min(wait, Math.max(timeLeft() - 1000, 0));

      if (attempt < maxAttempts - 1 && wait > 0) {
        await new Promise((r) => setTimeout(r, wait));
        continue;
      } else if (attempt < maxAttempts - 1) {
        timedOut = true;
        break;
      }
    }

    if (attempt < maxAttempts - 1) {
      let wait = 5000 * (attempt + 1);
      wait = Math.min(wait, Math.max(timeLeft() - 1000, 0));
      if (wait <= 0) {
        timedOut = true;
        break;
      }
      await new Promise((r) => setTimeout(r, wait));
    }
  }

  if (lastError) console.error("[GRADIO] All attempts failed:", lastError);
  return { transcript: null, timedOut };
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
    const { transcript, timedOut } = await transcribeWithRetry(audioBlob, assessmentType);

    if (!transcript) {
      if (timedOut) {
        // 504 lets the client distinguish "model never answered in time"
        // from a hard model/API failure (502).
        return jsonError(
          "Re-transcription timed out before the model returned a result. Please try again.",
          504
        );
      }
      return jsonError("Transcription failed — model returned no result", 502);
    }

    return NextResponse.json({ transcript });
  } catch (err) {
    console.error("[RETRANSCRIBE] Failed:", err);
    return jsonError("Re-transcription failed", 500);
  }
}