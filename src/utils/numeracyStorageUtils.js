// utils/numeracyStorageUtils.js

import { ref, listAll, getDownloadURL } from "firebase/storage";
import { storage } from "@/firebase/config";

const WORKOUT_IMAGES_FOLDER = "Nyansapo_Teaching_Numeracy_Assessment_test_workout_Images";

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

//Round extractor
/**
 * Extract round from a number_operations screenshot_url filename.
 * Filename: image_answer_<uuid>_<studentId>_<round>_<num1>_<TYPE>_<num2>_<expected>.wav
 */
export const extractRoundFromOperationUrl = (screenshotUrl) => {
  try {
    if (!screenshotUrl) return null;
    const decoded  = decodeURIComponent(screenshotUrl);
    const filename = decoded.split("/").pop().split("?")[0];
    const match    = filename.match(/^image_answer_[0-9a-f-]+_[A-Za-z0-9]+_(\d+)_/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

//Pattern builders
const buildNumberOperationsPattern = (assessmentId, studentId, result) => {
  const round    = extractRoundFromOperationUrl(result.metadata?.screenshot_url);
  const num1     = result.operations_number1 || "";
  const type     = (result.type || "").toUpperCase();
  const num2     = result.operations_number2 || "";
  const expected = result.expected_answer || "";

  return new RegExp(
    `^image_workArea_${esc(assessmentId)}_${esc(studentId)}_${esc(round)}_${esc(num1)}_${esc(type)}_${esc(num2)}_${esc(expected)}_workout\\.wav$`,
    "i"
  );
};

const buildWordProblemPattern = (assessmentId, studentId, result, resultIndex) => {
  const round    = resultIndex ?? 0;
  const question = result.question || "";
  const expected = result.expected_number || "";

  return new RegExp(
    `^image_workout_${esc(assessmentId)}_${esc(studentId)}_${esc(round)}_wordProblem_${esc(question)}_${esc(expected)}\\.wav$`,
    "i"
  );
};

//Core scanner
export const scanWorkoutImageUrl = async (pattern) => {
  try {
    const listResult = await listAll(ref(storage, WORKOUT_IMAGES_FOLDER));
    const match      = listResult.items.find(item => pattern.test(item.name));
    if (!match) return null;
    return await getDownloadURL(match);
  } catch {
    return null;
  }
};

//Public finders
export const findNumberOperationsWorkoutUrl = (assessmentId, studentId, result) =>
  scanWorkoutImageUrl(buildNumberOperationsPattern(assessmentId, studentId, result));

export const findWordProblemWorkoutUrl = (assessmentId, studentId, result, resultIndex) =>
  scanWorkoutImageUrl(buildWordProblemPattern(assessmentId, studentId, result, resultIndex));

export const getWorkoutUrlFinder = (section) => {
  switch (section) {
    case "number_operations": return findNumberOperationsWorkoutUrl;
    case "word_problem":      return findWordProblemWorkoutUrl;
    default:                  return null;
  }
};