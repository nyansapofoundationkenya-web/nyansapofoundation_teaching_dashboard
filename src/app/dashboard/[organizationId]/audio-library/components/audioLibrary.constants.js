// ─────────────────────────────────────────────────────────────
// CONSTANTS & HELPERS — audioLibrary.constants.js
// ─────────────────────────────────────────────────────────────

export const BUCKET_FOLDERS = {
  literacy: "Nyansapo_Teaching_Literacy_Assessment_test_Audio",
};

export const PAGE_SIZE = 20;

export const RETRIGGER_URL =
  process.env.NEXT_PUBLIC_RETRIGGER_FUNCTION_URL || "";

// Matches: audio_{assessmentId}_{studentId}_{round}_{type}_{content...}_{timestamp}.wav
// The timestamp group is ISO-8601-like: 2024-05-01T13:45:00.000Z
// Using a specific timestamp pattern so content (which may contain underscores) is not mistakenly
// consumed by the timestamp group.
export const FILE_PATTERN =
  /^audio_([^_]+)_([^_]+)_(\d+)_([a-zA-Z]+)_(.+?)(?:_(\d{4}-\d{2}-\d{2}T[\d:.Z]+))?\.wav$/;

// Type badge color map
export const TYPE_COLORS = {
  reading:   { bg: "bg-[#5aa2ce]/15",  text: "text-[#5aa2ce]",   border: "border-[#5aa2ce]/30"  },
  fluency:   { bg: "bg-[#4caf50]/15",  text: "text-[#4caf50]",   border: "border-[#4caf50]/30"  },
  phonics:   { bg: "bg-[#f7cc1c]/15",  text: "text-[#f7cc1c]",   border: "border-[#f7cc1c]/30"  },
  writing:   { bg: "bg-purple-400/15", text: "text-purple-300",   border: "border-purple-400/30" },
  letter:    { bg: "bg-pink-400/15",   text: "text-pink-300",     border: "border-pink-400/30"   },
  word:      { bg: "bg-cyan-400/15",   text: "text-cyan-300",     border: "border-cyan-400/30"   },
  paragraph: { bg: "bg-indigo-400/15", text: "text-indigo-300",   border: "border-indigo-400/30" },
  story:     { bg: "bg-rose-400/15",   text: "text-rose-300",     border: "border-rose-400/30"   },
  default:   { bg: "bg-white/10",      text: "text-white/70",     border: "border-white/20"      },
};

// ─── Helpers ──────────────────────────────────────────────────

export function parseFileName(filePath) {
  // Strip folder prefix — match only the filename portion
  const name = filePath.includes("/") ? filePath.split("/").pop() : filePath;
  const match = name.match(FILE_PATTERN);
  if (!match) return null;
  const [, assessmentId, studentId, round, type, rawContent, timestamp] = match;

  // Mirror Python exactly:
  //   content = urllib.parse.unquote(raw_content.strip())
  //
  // Underscores in the raw segment are LITERAL — NOT spaces.
  // The Cloud Function never converts underscores to spaces before writing
  // to Firestore, so we must not either. Decode percent-encoding only.
  const content = decodeURIComponent(rawContent.trim());

  return {
    assessmentId,
    studentId,
    round,
    type: type.toLowerCase(),
    content,
    // Keep raw (undecoded, underscore-intact) segment for Firestore fallback matching
    rawContent,
    timestamp: timestamp || "",
  };
}

export function dayKey(iso) {
  if (!iso) return "unknown";
  return iso.slice(0, 10);
}

export function formatDayHeading(dateStr) {
  if (dateStr === "unknown") return "Unknown date";
  const dt = new Date(dateStr + "T00:00:00");
  return dt.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function getTypeBadge(type) {
  return TYPE_COLORS[type] || TYPE_COLORS.default;
}

export function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}