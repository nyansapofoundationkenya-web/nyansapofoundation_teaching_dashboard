// hooks/stats/useStats.js
"use client";

import { useState, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

const CLOUD_FUNCTION_URL = process.env.NEXT_PUBLIC_CLOUD_FUNCTION_URL;

export function useStats() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // ─────────────────────────────────────────────
  // Generic helper to read student levels from any entity path
  // ─────────────────────────────────────────────
  const fetchStudentLevels = useCallback(async (pathSegments) => {
    setLoading(true);
    setError(null);

    try {
      const literacyRef = doc(db, ...pathSegments, "stats", "student_levels");
      const numeracyRef = doc(db, ...pathSegments, "stats", "numeracy_levels");

      const [literacySnap, numeracySnap] = await Promise.all([
        getDoc(literacyRef),
        getDoc(numeracyRef),
      ]);

      const data = {
        literacy: null,
        numeracy: null,
        last_updated: null,
      };

      if (literacySnap.exists()) {
        const docData = literacySnap.data();
        const result = docData?.result || {};

        data.literacy = {
          baseline: result.baseline || {},
          endline: result.endline || {},
          stats: result.stats || {},
        };

        // Try to get last_updated (from root or from result)
        if (docData.last_updated?.toDate) {
          data.last_updated = docData.last_updated.toDate();
        } else if (result.last_updated?.toDate) {
          data.last_updated = result.last_updated.toDate();
        }
      }

      if (numeracySnap.exists()) {
        const docData = numeracySnap.data();
        const result = docData?.result || {};

        data.numeracy = {
          baseline: result.baseline_numeracy || {},
          endline: result.endline_numeracy || {},
          stats: result.stats || {},
        };

        // Merge last_updated if not already set
        if (!data.last_updated && result.last_updated?.toDate) {
          data.last_updated = result.last_updated.toDate();
        }
      }

      setStats(data);
      return data;
    } catch (err) {
      const msg = err.message || "Failed to load student levels";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─────────────────────────────────────────────
  // Public fetch methods
  // ─────────────────────────────────────────────
  const fetchOrganizationStats = useCallback(async (organizationId) => {
    if (!organizationId) throw new Error("organizationId is required");
    return fetchStudentLevels(["organization", organizationId]);
  }, [fetchStudentLevels]);

  const fetchProjectStats = useCallback(async (organizationId, projectId) => {
    if (!organizationId || !projectId) throw new Error("organizationId and projectId are required");
    return fetchStudentLevels(["organization", organizationId, "projects", projectId]);
  }, [fetchStudentLevels]);

  const fetchSchoolStats = useCallback(async (organizationId, projectId, schoolId) => {
    if (!organizationId || !projectId || !schoolId) throw new Error("organizationId, projectId and schoolId are required");
    return fetchStudentLevels(["organization", organizationId, "projects", projectId, "schools", schoolId]);
  }, [fetchStudentLevels]);

  // ─────────────────────────────────────────────
  // Refresh methods
  // ─────────────────────────────────────────────
  const triggerRefresh = useCallback(async (body) => {
    if (!CLOUD_FUNCTION_URL) {
      throw new Error("NEXT_PUBLIC_CLOUD_FUNCTION_URL is not set in environment");
    }

    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Cloud function responded with status ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Refresh request failed");
    }

    return result;
  }, []);

  const refreshOrganizationStats = useCallback((organizationId) =>
    triggerRefresh({ organization_id: organizationId }), [triggerRefresh]);

  const refreshProjectStats = useCallback((organizationId, projectId) =>
    triggerRefresh({ organization_id: organizationId, project_id: projectId }), [triggerRefresh]);

  const refreshSchoolStats = useCallback((organizationId, projectId, schoolId) =>
    triggerRefresh({ organization_id: organizationId, project_id: projectId, school_id: schoolId }), [triggerRefresh]);

  // ─────────────────────────────────────────────
  // Reset / clear
  // ─────────────────────────────────────────────
  const resetStats = useCallback(() => {
    setStats(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    stats,                      // { literacy, numeracy, last_updated? }
    fetchOrganizationStats,
    fetchProjectStats,
    fetchSchoolStats,
    refreshOrganizationStats,
    refreshProjectStats,
    refreshSchoolStats,
    resetStats,
  };
}