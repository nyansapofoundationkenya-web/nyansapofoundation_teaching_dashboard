// hooks/survey/useSurveyBuilder.js
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  collection, doc, query, orderBy, onSnapshot,
  updateDoc, deleteDoc, writeBatch, serverTimestamp, setDoc, runTransaction,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useSelector } from "react-redux";
import {
  createNewQuestion, createNewPage, createNewOption, newId,
} from "@/utils/survey/surveyDefaults";
import {
  createPublishedSurveyDefinition,
  validateSurveyDefinition,
} from "@/utils/survey/surveyValidation";

export function useSurveyBuilder(organizationId, surveyId) {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const role = currentUser?.role;
  const canEdit = ["super_admin", "admin", "project_manager"].includes(role);
  const canPublish = ["super_admin", "admin"].includes(role);
  const canDeleteQuestion = ["super_admin", "admin"].includes(role);

  // ── Load survey doc ───────────────────────────────────────────
  useEffect(() => {
    if (!organizationId || !surveyId) return;
    setLoading(true);
    const ref = doc(db, "organization", organizationId, "surveys", surveyId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setSurvey(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setLoading(false);
      },
      (err) => { setError(err.message); setLoading(false); }
    );
    return () => unsub();
  }, [organizationId, surveyId]);

  // ── Load questions ────────────────────────────────────────────
  useEffect(() => {
    if (!organizationId || !surveyId) return;
    const col = collection(db, "organization", organizationId, "surveys", surveyId, "questions");
    const q = query(col, orderBy("position", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setQuestions(snap.docs.map((d) => ({
          ...d.data(),
          id: d.data().id ?? d.id,
          _docId: d.id,
        })));
      },
      (err) => setError(err.message)
    );
    return () => unsub();
  }, [organizationId, surveyId]);

  // ── Helpers ───────────────────────────────────────────────────
  const surveyRef = useMemo(
    () => surveyId ? doc(db, "organization", organizationId, "surveys", surveyId) : null,
    [organizationId, surveyId]
  );
  const questionsCol = useMemo(
    () => surveyId ? collection(db, "organization", organizationId, "surveys", surveyId, "questions") : null,
    [organizationId, surveyId]
  );
  const questionsByPage = useCallback(
    (pageId) => questions.filter((question) => question.pageId === pageId),
    [questions]
  );

  const touchSurvey = useCallback(async () => {
    if (!surveyRef) return;
    setSaving(true);
    try {
      await updateDoc(surveyRef, {
        updatedAt: serverTimestamp(),
        ...(survey?.status === "published" ? { hasUnpublishedChanges: true } : {}),
      });
    } finally {
      setSaving(false);
    }
  }, [surveyRef, survey?.status]);

  // ── Survey fields ─────────────────────────────────────────────
  const updateSurveyFields = useCallback(async (patch) => {
    if (!surveyRef) return;
    if (!canEdit) throw new Error("You do not have permission to edit this survey");
    setSaving(true);
    try {
      await updateDoc(surveyRef, {
        ...patch,
        updatedAt: serverTimestamp(),
        ...(survey?.status === "published" ? { hasUnpublishedChanges: true } : {}),
      });
    } finally {
      setSaving(false);
    }
  }, [surveyRef, canEdit, survey?.status]);

  // ── Pages ─────────────────────────────────────────────────────
  // Pages are embedded as an array on the survey doc (small, no 1 MiB risk).
  const addPage = useCallback(async () => {
    if (!survey) return;
    if (!canEdit) throw new Error("You do not have permission to edit this survey");
    const pages = Array.isArray(survey.pages) ? [...survey.pages] : [];
    const page = createNewPage({ title: `Page ${pages.length + 1}`, position: pages.length });
    pages.push(page);
    await updateSurveyFields({ pages });
    return page;
  }, [survey, canEdit, updateSurveyFields]);

  const updatePage = useCallback(async (pageId, patch) => {
    if (!canEdit) throw new Error("You do not have permission to edit this survey");
    if (!surveyRef) throw new Error("Survey is not available");
    setSaving(true);
    try {
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(surveyRef);
        if (!snapshot.exists()) throw new Error("Survey not found");
        const data = snapshot.data();
        let updated = false;
        const pages = (data.pages ?? []).map((page) => {
          if (page.id !== pageId) return page;
          updated = true;
          return { ...page, ...patch };
        });
        if (!updated) throw new Error("Page not found");
        transaction.update(surveyRef, {
          pages,
          updatedAt: serverTimestamp(),
          ...(data.status === "published" ? { hasUnpublishedChanges: true } : {}),
        });
      });
    } finally {
      setSaving(false);
    }
  }, [surveyRef, canEdit]);

  const removePage = useCallback(async (pageId) => {
    if (!survey) return;
    if (!canEdit) throw new Error("You do not have permission to edit this survey");
    // Move or delete questions that lived on this page? For v1, block if not empty.
    const hasQuestions = questions.some((q) => q.pageId === pageId);
    if (hasQuestions) {
      throw new Error("Cannot delete a page that still has questions. Move or delete them first.");
    }
    const pages = (survey.pages ?? []).filter((p) => p.id !== pageId);
    if (pages.length === 0) throw new Error("A survey must have at least one page.");
    await updateSurveyFields({ pages });
  }, [survey, canEdit, questions, updateSurveyFields]);

  const reorderPages = useCallback(async (from, to) => {
    if (!survey) return;
    if (!canEdit) throw new Error("You do not have permission to edit this survey");
    const pages = [...(survey.pages ?? [])].sort((a, b) => a.position - b.position);
    if (from < 0 || to < 0 || from >= pages.length || to >= pages.length || from === to) return;
    const [movedPage] = pages.splice(from, 1);
    pages.splice(to, 0, movedPage);
    await updateSurveyFields({
      pages: pages.map((page, position) => ({ ...page, position })),
    });
  }, [survey, canEdit, updateSurveyFields]);

  // ── Questions ─────────────────────────────────────────────────
  const addQuestion = useCallback(async (type, pageId) => {
    if (!questionsCol) throw new Error("Survey questions are not available");
    if (!canEdit) throw new Error("You do not have permission to edit this survey");
    const pageQuestions = questions.filter((q) => q.pageId === pageId);
    const position = pageQuestions.length;
    const q = createNewQuestion({ type, pageId, position });
    await setDoc(doc(questionsCol, q.id), q);
    await touchSurvey();
    return { ...q, _docId: q.id };
  }, [questionsCol, questions, canEdit, touchSurvey]);

  const updateQuestion = useCallback(async (questionId, patch) => {
    if (!questionsCol) return;
    if (!canEdit) throw new Error("You do not have permission to edit this survey");
    const question = questions.find((item) => item.id === questionId);
    if (!question) throw new Error("Question not found");
    const ref = doc(questionsCol, question._docId ?? question.id);
    setSaving(true);
    try {
      await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
      await touchSurvey();
    } finally {
      setSaving(false);
    }
  }, [questionsCol, questions, canEdit, touchSurvey]);

  const deleteQuestion = useCallback(async (questionId) => {
    if (!questionsCol) return;
    if (!canDeleteQuestion) throw new Error("You do not have permission to delete questions");
    const question = questions.find((item) => item.id === questionId);
    if (!question) throw new Error("Question not found");
    await deleteDoc(doc(questionsCol, question._docId ?? question.id));
    const rest = questions
      .filter((x) => x.pageId === question.pageId && x.id !== questionId)
      .sort((a, b) => a.position - b.position);
    if (rest.length > 0) {
      const batch = writeBatch(db);
      rest.forEach((x, i) =>
        batch.update(doc(questionsCol, x._docId ?? x.id), { position: i })
      );
      await batch.commit();
    }
    await touchSurvey();
  }, [questionsCol, questions, canDeleteQuestion, touchSurvey]);

  const duplicateQuestion = useCallback(async (questionId) => {
    const q = questions.find((x) => x.id === questionId);
    if (!q || !questionsCol) return;
    if (!canEdit) throw new Error("You do not have permission to edit this survey");
    const cloneId = newId("q");
    const clone = {
      ...q,
      id: cloneId,
      text: `${q.text} (copy)`,
      position: q.position + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    delete clone._docId;
    const batch = writeBatch(db);
    batch.set(doc(questionsCol, cloneId), clone);
    questions
      .filter((question) => question.pageId === q.pageId && question.position > q.position)
      .forEach((question) => {
        batch.update(doc(questionsCol, question._docId ?? question.id), {
          position: question.position + 1,
        });
      });
    await batch.commit();
    await touchSurvey();
      return { ...clone, _docId: cloneId };
  }, [questions, questionsCol, canEdit, touchSurvey]);

  const moveQuestion = useCallback(async (questionId, pageId) => {
    if (!questionsCol) return;
    if (!canEdit) throw new Error("You do not have permission to edit this survey");
    if (!survey?.pages?.some((page) => page.id === pageId)) {
      throw new Error("Choose a valid destination page");
    }
    const question = questions.find((item) => item.id === questionId);
    if (!question) throw new Error("Question not found");
    if (question.pageId === pageId) return;

    const targetQuestions = questions
      .filter((item) => item.pageId === pageId)
      .sort((a, b) => a.position - b.position);
    const sourceQuestions = questions
      .filter((item) => item.pageId === question.pageId && item.id !== questionId)
      .sort((a, b) => a.position - b.position);
    const batch = writeBatch(db);
    batch.update(doc(questionsCol, question._docId ?? question.id), {
      pageId,
      position: targetQuestions.length,
    });
    sourceQuestions.forEach((item, index) => {
      batch.update(doc(questionsCol, item._docId ?? item.id), { position: index });
    });
    await batch.commit();
    await touchSurvey();
  }, [questionsCol, canEdit, survey?.pages, questions, touchSurvey]);

  // ── Options (embedded array on question doc — small) ──────────
  const addOption = useCallback(async (questionId) => {
    const q = questions.find((x) => x.id === questionId);
    if (!q || !questionsCol) return;
    const options = [...(q.options ?? []), createNewOption((q.options ?? []).length)];
    await updateQuestion(questionId, { options });
  }, [questions, questionsCol, updateQuestion]);

  const updateOption = useCallback(async (questionId, optionId, patch) => {
    const q = questions.find((x) => x.id === questionId);
    if (!q) return;
    const options = (q.options ?? []).map((o) =>
      o.id === optionId ? { ...o, ...patch } : o
    );
    await updateQuestion(questionId, { options });
  }, [questions, updateQuestion]);

  const removeOption = useCallback(async (questionId, optionId) => {
    const q = questions.find((x) => x.id === questionId);
    if (!q) return;
    const options = (q.options ?? [])
      .filter((o) => o.id !== optionId)
      .map((o, i) => ({ ...o, position: i }));
    await updateQuestion(questionId, { options });
  }, [questions, updateQuestion]);

  // ── Reorder questions across the whole list ───────────────────
  // order: array of { id, pageId } in the new desired order.
  const reorderQuestions = useCallback(async (ordered) => {
    if (!questionsCol) return;
    if (!canEdit) throw new Error("You do not have permission to edit this survey");
    const batch = writeBatch(db);
    // count per page
    const counts = {};
    ordered.forEach((item) => {
      const question = questions.find((candidate) => candidate.id === item.id);
      if (!question) throw new Error("Cannot reorder a question that no longer exists");
      counts[item.pageId] = (counts[item.pageId] ?? 0);
      batch.update(doc(questionsCol, question._docId ?? question.id), {
        pageId: item.pageId,
        position: counts[item.pageId],
      });
      counts[item.pageId] += 1;
    });
    await batch.commit();
    await touchSurvey();
  }, [questionsCol, questions, canEdit, touchSurvey]);

  const publishSurvey = useCallback(async () => {
    if (!canPublish) throw new Error("You do not have permission to publish surveys");
    if (!surveyRef || !survey) throw new Error("Survey is not available");
    const validationErrors = validateSurveyDefinition(survey, questions);
    if (validationErrors.length) throw new Error(validationErrors.join("\n"));

    const version = (Number(survey.version) || 0) + 1;
    const definition = createPublishedSurveyDefinition({
      organizationId,
      survey: { ...survey, id: surveyId },
      questions,
      version,
    });
    const serializedSize = new TextEncoder().encode(JSON.stringify(definition)).length;
    if (serializedSize > 900 * 1024) {
      throw new Error("This survey is too large to publish as one Firestore version. Reduce its questions or options.");
    }
    const versionRef = doc(surveyRef, "versions", String(version));
    const batch = writeBatch(db);
    batch.set(versionRef, {
      ...definition,
      published_at: serverTimestamp(),
      published_by: currentUser?.uid ?? null,
    });
    batch.update(surveyRef, {
      status: "published",
      version,
      publishedVersion: version,
      publishedAt: serverTimestamp(),
      hasUnpublishedChanges: false,
      updatedAt: serverTimestamp(),
    });
    setSaving(true);
    try {
      await batch.commit();
    } finally {
      setSaving(false);
    }
  }, [canPublish, surveyRef, survey, questions, organizationId, surveyId, currentUser?.uid]);

  return {
    survey, questions, questionsByPage, loading, error, saving,
    canEdit, canPublish, canDeleteQuestion, publishSurvey,
    updateSurveyFields,
    addPage, updatePage, removePage, deletePage: removePage, reorderPages,
    updateSurveySettings: updateSurveyFields,
    addQuestion, updateQuestion, deleteQuestion, duplicateQuestion,
    moveQuestion,
    addOption, updateOption, removeOption,
    reorderQuestions,
  };
}