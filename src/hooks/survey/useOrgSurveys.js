"use client";

import { useState, useCallback } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useSelector } from "react-redux";
import { defaultSurveySettings } from "@/utils/survey/surveyDefaults";

const surveysCol = (orgId) => collection(db, "organization", orgId, "surveys");

const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);

export function useOrgSurveys(organizationId) {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user: currentUser } = useSelector((s) => s.auth);
  const role = currentUser?.role;

  const canManage =
    role === "super_admin" || role === "admin" || role === "project_manager";
  const canPublish = role === "super_admin" || role === "admin";
  const canDelete = role === "super_admin" || role === "admin";

  const fetchSurveys = useCallback(async () => {
    if (!organizationId) return [];
    setLoading(true);
    setError(null);
    try {
      const q = query(surveysCol(organizationId), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSurveys(list);
      return list;
    } catch (err) {
      // If the composite index doesn't exist yet, fall back to unsorted
      try {
        const snap = await getDocs(surveysCol(organizationId));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSurveys(list);
        return list;
      } catch (fallbackErr) {
        setError(fallbackErr.message);
        throw fallbackErr;
      }
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const createSurvey = useCallback(
    async ({ title, description = "", template = "blank" }) => {
      if (!organizationId) throw new Error("Organization id required");
      if (!canManage) throw new Error("You do not have permission to create surveys");
      const trimmed = (title || "").trim();
      if (trimmed.length < 2) throw new Error("Title must be at least 2 characters");

      const pageId = `page_${Date.now().toString(36)}`;
      const payload = {
        title: trimmed,
        description,
        slug: slugify(trimmed) || `survey-${Date.now()}`,
        status: "draft",
        version: 0,
        template,
        settings: defaultSurveySettings(),
        welcome: { title: trimmed, body: description || "" },
        thank_you: {
          title: "Thank you",
          body: "Your response has been recorded.",
          redirect_url: null,
        },
        pages: [{ id: pageId, title: "Page 1", position: 0 }],
        questionOrder: [{ pageId, questionIds: [] }],
        createdBy: currentUser?.uid ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: null,
      };

      const ref = await addDoc(surveysCol(organizationId), payload);
      const created = { id: ref.id, ...payload };
      setSurveys((prev) => [created, ...prev]);
      return created;
    },
    [organizationId, canManage, currentUser?.uid]
  );

  const deleteSurvey = useCallback(
    async (surveyId) => {
      if (!canDelete) throw new Error("You do not have permission to delete surveys");
      // NOTE: does not clean up questions/versions subcollections. That's a
      // Pass-2 concern (needs a batched cleanup or a Cloud Function).
      await deleteDoc(doc(db, "organization", organizationId, "surveys", surveyId));
      setSurveys((prev) => prev.filter((s) => s.id !== surveyId));
    },
    [organizationId, canDelete]
  );

  const getSurvey = useCallback(
    async (surveyId) => {
      const snap = await getDoc(
        doc(db, "organization", organizationId, "surveys", surveyId)
      );
      if (!snap.exists()) throw new Error("Survey not found");
      return { id: snap.id, ...snap.data() };
    },
    [organizationId]
  );

  const updateSurveyMeta = useCallback(
    async (surveyId, patch) => {
      if (!canManage) throw new Error("You do not have permission to edit this survey");
      await updateDoc(
        doc(db, "organization", organizationId, "surveys", surveyId),
        { ...patch, updatedAt: serverTimestamp() }
      );
      setSurveys((prev) =>
        prev.map((s) => (s.id === surveyId ? { ...s, ...patch } : s))
      );
    },
    [organizationId, canManage]
  );

  return {
    surveys,
    loading,
    error,
    canManage,
    canPublish,
    canDelete,
    fetchSurveys,
    createSurvey,
    deleteSurvey,
    getSurvey,
    updateSurveyMeta,
  };
}