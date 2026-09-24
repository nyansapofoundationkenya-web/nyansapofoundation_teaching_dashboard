// lib/studentLevelChartData.js
//
// Shared chart-data helpers for the Student Level Distribution chart family.
// Both the "Overall" view (flat baseline/midline/endline docs) and the
// "Grade" / "Age" / "Gender" views (nested demographics cross-tab doc) funnel
// through the same transformData() core so level ordering, naming, and
// number-parsing never drift apart between them.

export const ChartDataFormatter = {
  formatLevelName: (level) => {
    if (!level) return "Unknown"
    const special = {
      "non-reader": "Non-Reader",
      "reading-comprehension": "Reading Comprehension",
      "beginner": "Beginner",
      "letter": "Letter",
      "word": "Word",
      "paragraph": "Paragraph",
      "story": "Story",
      "above": "Above",
      "number_recognition": "Number Recognition",
      "addition": "Addition",
      "subtraction": "Subtraction",
      "multiplication": "Multiplication",
      "division": "Division",
    }
    if (special[level]) return special[level]
    return level.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
  }
}

export const ChartDataParser = {
  safeNumber: (v) => {
    if (v == null || v === '' || v === undefined) return 0
    const n = Number(v)
    return isNaN(n) || !isFinite(n) || n < 0 ? 0 : n
  }
}

const LEVEL_ORDER = {
  literacy: {
    "non-reader": 0,
    "beginner": 0,
    "letter": 1,
    "word": 2,
    "paragraph": 3,
    "story": 4,
    "reading-comprehension": 4,
    "above": 5
  },
  numeracy: {
    "beginner": 0,
    "number_recognition": 1,
    "addition": 2,
    "subtraction": 3,
    "multiplication": 4,
    "division": 5
  }
}

const DEFAULT_LEVELS = {
  literacy: ["beginner", "letter", "word", "paragraph", "story", "above"],
  numeracy: ["beginner", "number_recognition", "addition", "subtraction", "multiplication", "division"]
}

export const ChartDataTransformer = {
  /**
   * Transform a raw { assessmentKey: { level: count } } object into
   * recharts-ready rows.
   *
   * `keys` lets callers point at differently-named assessment fields:
   *   - Overall docs: literacy uses "baseline"/"midline"/"endline",
   *     numeracy uses "baseline_numeracy"/"midline_numeracy"/"endline_numeracy"
   *   - Demographic cross-tab docs (grade/age/gender): always plain
   *     "baseline"/"midline"/"endline", since category (literacy/numeracy)
   *     is already a separate parent key there.
   */
  transformData: (data, levelType, keys = null) => {
    if (!data || typeof data !== 'object') return []

    const baseKey = keys?.baseline ?? (levelType === "literacy" ? "baseline" : "baseline_numeracy")
    const midKey  = keys?.midline  ?? (levelType === "literacy" ? "midline"  : "midline_numeracy")
    const endKey  = keys?.endline  ?? (levelType === "literacy" ? "endline"  : "endline_numeracy")

    const baseline = data[baseKey] || {}
    const midline  = data[midKey]  || {}
    const endline  = data[endKey]  || {}

    const allLevels = new Set([
      ...Object.keys(baseline),
      ...Object.keys(midline),
      ...Object.keys(endline)
    ])

    let levels = Array.from(allLevels)
    if (levels.length === 0) {
      levels = DEFAULT_LEVELS[levelType] || []
    }

    const orderMap = LEVEL_ORDER[levelType] || {}
    const sorted = [...levels].sort((a, b) => (orderMap[a] ?? 99) - (orderMap[b] ?? 99))

    return sorted.map(level => ({
      level: ChartDataFormatter.formatLevelName(level),
      baseline: ChartDataParser.safeNumber(baseline[level]),
      midline: ChartDataParser.safeNumber(midline[level]),
      endline: ChartDataParser.safeNumber(endline[level]),
      rawLevel: level,
      rank: orderMap[level] ?? 99
    })).reverse()
  },

  /**
   * Pull one grade/age/gender bucket's literacy or numeracy breakdown out
   * of the demographics doc and run it through the same transform.
   */
  transformDemographicBucket: (demographicsData, demoType, bucketKey, levelType) => {
    const bucket = demographicsData?.[demoType]?.[bucketKey]?.[levelType]
    return ChartDataTransformer.transformData(bucket, levelType, {
      baseline: "baseline", midline: "midline", endline: "endline"
    })
  },

  /**
   * Sorted list of available bucket keys for a demo type
   * (grade/age sort numerically, gender sorts alphabetically).
   */
  getAvailableBuckets: (demographicsData, demoType) => {
    const buckets = demographicsData?.[demoType]
    if (!buckets || typeof buckets !== 'object') return []

    const keysArr = Object.keys(buckets)
    const allNumeric = keysArr.length > 0 && keysArr.every(k => !isNaN(Number(k)))

    return allNumeric
      ? keysArr.sort((a, b) => Number(a) - Number(b))
      : keysArr.sort((a, b) => a.localeCompare(b))
  }
}

/**
 * Compute the "Key Insights" cards for a given chart dataset.
 * Works for both literacy and numeracy since it only reasons about
 * rank (lowest/highest level) and modal (most populous level), never
 * specific level names.
 *
 * Returns null when there isn't enough data to say anything meaningful.
 */
export function computeInsights(chartData) {
  if (!chartData || chartData.length === 0) return null

  const hasAnyData = chartData.some(d => d.baseline > 0 || d.midline > 0 || d.endline > 0)
  if (!hasAnyData) return null

  const totalEndline  = chartData.reduce((sum, d) => sum + d.endline, 0)
  const totalBaseline = chartData.reduce((sum, d) => sum + d.baseline, 0)
  const total = totalEndline > 0 ? totalEndline : totalBaseline
  if (total === 0) return null

  const pct = (count, denom) => denom > 0 ? Math.round((count / denom) * 100) : 0

  // Modal level = most populous at endline (falls back to baseline if no endline data yet)
  const modal = [...chartData].sort((a, b) => {
    const aVal = totalEndline > 0 ? a.endline : a.baseline
    const bVal = totalEndline > 0 ? b.endline : b.baseline
    return bVal - aVal
  })[0]
  const modalCount = totalEndline > 0 ? modal.endline : modal.baseline
  const modalPct = pct(modalCount, total)

  let modalGrowth = null
  if (modal.baseline > 0) {
    const growthPct = Math.round(((modal.endline - modal.baseline) / modal.baseline) * 100)
    modalGrowth = { direction: growthPct >= 0 ? "increased" : "decreased", value: Math.abs(growthPct) }
  } else if (modal.endline > 0) {
    modalGrowth = { direction: "new", value: null }
  }

  // Lowest-ranked level (e.g. non-reader / beginner)
  const lowest = [...chartData].sort((a, b) => a.rank - b.rank)[0]
  const lowestBaselinePct = pct(lowest.baseline, totalBaseline || total)
  const lowestEndlinePct  = pct(lowest.endline, totalEndline || total)

  // Highest-ranked level (e.g. above / reading-comprehension)
  const highest = [...chartData].sort((a, b) => b.rank - a.rank)[0]
  const highestBaselinePct = pct(highest.baseline, totalBaseline || total)
  const highestEndlinePct  = pct(highest.endline, totalEndline || total)

  let highestChangeWord = "changed"
  if (highestBaselinePct > 0) {
    const ratio = highestEndlinePct / highestBaselinePct
    if (ratio >= 1.8 && ratio <= 2.2) highestChangeWord = "doubled"
    else if (ratio > 1) highestChangeWord = "increased"
    else if (ratio < 1) highestChangeWord = "decreased"
  } else if (highestEndlinePct > 0) {
    highestChangeWord = "increased"
  }

  return {
    total,
    modal:   { label: modal.level, pct: modalPct, growth: modalGrowth },
    lowest:  {
      label: lowest.level,
      baselinePct: lowestBaselinePct,
      endlinePct: lowestEndlinePct,
      direction: lowestEndlinePct <= lowestBaselinePct ? "decreased" : "increased"
    },
    highest: {
      label: highest.level,
      baselinePct: highestBaselinePct,
      endlinePct: highestEndlinePct,
      changeWord: highestChangeWord
    },
  }
}