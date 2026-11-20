const AUTO_GRADED_TYPES = ["letter", "word"];

const tokenizeForComparison = (value) => {
  if (!value) return [];
  return value.toString().toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
};

// A letter/word passes when its target appears as a contiguous transcript token run.
export const determinePassedFromTranscript = (type, content, transcript) => {
  const normalizedType = (type || "").toLowerCase();
  if (!AUTO_GRADED_TYPES.includes(normalizedType)) return undefined;

  const targetTokens = tokenizeForComparison(content);
  if (targetTokens.length === 0) return undefined;

  const transcriptTokens = tokenizeForComparison(transcript);
  if (transcriptTokens.length === 0) return false;

  for (
    let i = 0;
    i + targetTokens.length <= transcriptTokens.length;
    i++
  ) {
    if (
      targetTokens.every(
        (targetToken, offset) => transcriptTokens[i + offset] === targetToken
      )
    ) {
      return true;
    }
  }

  return false;
};
