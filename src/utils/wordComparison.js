// utils/wordComparison.js

/**
 * Normalizes text by converting to lowercase, removing punctuation, and splitting into words
 */
export function normalizeText(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // remove punctuation
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Aligns expected words with spoken words using Levenshtein distance algorithm
 * Returns matched indices and total mistakes count
 */
export function levenshteinAlignment(expectedWords, spokenWords) {
  const m = expectedWords.length;
  const n = spokenWords.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (expectedWords[i - 1] === spokenWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  // Backtrack to find matched indices
  const matchedIndices = new Set();
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (expectedWords[i - 1] === spokenWords[j - 1]) {
      matchedIndices.add(i - 1);
      i--;
      j--;
    } else if (dp[i - 1][j - 1] <= dp[i - 1][j] && dp[i - 1][j - 1] <= dp[i][j - 1]) {
      i--;
      j--;
    } else if (dp[i - 1][j] < dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  const mistakes = dp[m][n];
  return { mistakes, matchedIndices };
}

/**
 * Compares expected content with transcript and returns colored words and statistics
 * For use in React components - returns JSX elements
 */
export function getColoredWords(content, transcript, options = {}) {
  const {
    correctClass = "text-secondary-2",
    incorrectClass = "text-red-400",
    wordClassName = "",
    showSpace = true
  } = options;

  if (!content) {
    return {
      coloredWords: null,
      stats: { totalWords: 0, mistakes: 0, accuracy: 0 },
    };
  }

  const expectedWords = normalizeText(content);
  const spokenWords = normalizeText(transcript || "");

  const { mistakes, matchedIndices } = levenshteinAlignment(expectedWords, spokenWords);

  const totalWords = expectedWords.length;
  const accuracy = totalWords ? Math.max(0, ((totalWords - mistakes) / totalWords) * 100) : 0;

  const contentWords = content.trim().split(/\s+/);

  const coloredWords = contentWords.map((word, index) => {
    const matched = matchedIndices.has(index);
    
    return (
      <span
        key={index}
        className={`${wordClassName} ${matched ? correctClass : incorrectClass}`}
      >
        {word}
        {showSpace && index < contentWords.length - 1 && " "}
      </span>
    );
  });

  return {
    coloredWords,
    stats: { totalWords, mistakes, accuracy: accuracy.toFixed(1) },
  };
}

/**
 * Returns just the statistics without JSX (useful for non-React contexts or when you only need stats)
 */
export function getComparisonStats(content, transcript) {
  if (!content) {
    return { totalWords: 0, mistakes: 0, accuracy: 0 };
  }

  const expectedWords = normalizeText(content);
  const spokenWords = normalizeText(transcript || "");

  const { mistakes } = levenshteinAlignment(expectedWords, spokenWords);

  const totalWords = expectedWords.length;
  const accuracy = totalWords ? Math.max(0, ((totalWords - mistakes) / totalWords) * 100) : 0;

  return { totalWords, mistakes, accuracy: accuracy.toFixed(1) };
}