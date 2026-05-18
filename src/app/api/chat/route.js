/**
 * POST /api/chat
 *
 * Nyansapo AI FAQ Chat API
 * Uses Firebase AI (firebase/ai) — same as DashboardChatBot — so no Gemini API
 * key is needed. Firebase handles authentication via your project config.
 *
 * Request body:
 * {
 *   question: string,           // required — the user's current message
 *   history?: Array<{           // optional — previous turns for multi-turn context
 *     role: "user" | "model",
 *     parts: [{ text: string }]
 *   }>
 * }
 *
 * Response (200):
 * {
 *   answer: string,
 *   intent: string | null       // matched FAQ category, if detected
 * }
 *
 * Response (4xx / 5xx):
 * {
 *   error: string
 * }
 */

import { getAI, getGenerativeModel } from "firebase/ai";
import { app } from "@/firebase/config";
import { buildSystemPrompt } from "../../../lib/systemPrompt";
import { faqData } from "../../../data/faqData";

// --------------------------------------------------------------------------
// Simple keyword-based intent detector
// Scans the user's question against all FAQ question texts and returns the
// most likely intent category as metadata. No AI call needed for this step.
// --------------------------------------------------------------------------
function detectIntent(question) {
  const q = question.toLowerCase();
  let bestIntent = null;
  let bestScore = 0;

  for (const category of faqData) {
    for (const item of category.questions) {
      const faqWords = item.question.toLowerCase().split(/\W+/).filter(Boolean);
      const matches = faqWords.filter((word) => word.length > 3 && q.includes(word));
      const score = matches.length / faqWords.length;

      if (score > bestScore) {
        bestScore = score;
        bestIntent = category.intent;
      }
    }
  }

  // Only report an intent if the confidence is reasonable
  return bestScore >= 0.25 ? bestIntent : null;
}

// --------------------------------------------------------------------------
// Route handler
// --------------------------------------------------------------------------
export async function POST(request) {
  // --- Parse & validate body ---
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { question, history = [] } = body;

  if (!question || typeof question !== "string" || !question.trim()) {
    return Response.json(
      { error: "Missing required field: 'question' must be a non-empty string." },
      { status: 400 }
    );
  }

  if (!Array.isArray(history)) {
    return Response.json(
      { error: "'history' must be an array of { role, parts } objects." },
      { status: 400 }
    );
  }

  // --- Detect FAQ intent (no AI cost) ---
  const intent = detectIntent(question.trim());

  // --- Initialise Firebase AI model (same pattern as DashboardChatBot) ---
  try {
    const ai = getAI(app);
    const model = getGenerativeModel(ai, {
      model: "gemini-2.5-flash",            // same model as the dashboard bot
      systemInstruction: buildSystemPrompt(),
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.4,                   // low = more factual answers
      },
    });

    // Start a chat session; pass any client-provided history for context
    const chat = model.startChat({ history });

    const result = await chat.sendMessage(question.trim());
    const answer = result.response.text();

    return Response.json({ answer, intent }, { status: 200 });

  } catch (err) {
    console.error("[/api/chat] Firebase AI error:", err);

    return Response.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

// Reject non-POST requests clearly
export async function GET() {
  return Response.json(
    { error: "Method not allowed. Use POST /api/chat." },
    { status: 405 }
  );
}