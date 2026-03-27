"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/firebase/config";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

export function useEngagementStats({
  organizationId,
  projectId = null,
  schoolId = null,
}) {
  const [stats, setStats] = useState({
    today: null,
    last7Days: [],
    loading: true,
    error: null,
  });

  const fetchEngagement = useCallback(async () => {
    if (!organizationId) return;

    setStats((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // NEW STRUCTURE: organization/{orgId}/daily-engagement/{date}
      let basePath = `organization/${organizationId}/daily-engagement`;

      if (schoolId && projectId) {
        basePath = `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/daily-engagement`;
      } else if (projectId) {
        basePath = `organization/${organizationId}/projects/${projectId}/daily-engagement`;
      }

      const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // 1. Fetch Today's data
      const todayRef = doc(db, `${basePath}/${todayStr}`);
      const todaySnap = await getDoc(todayRef);
      const todayData = todaySnap.exists() ? todaySnap.data() : null;

      // 2. Fetch Last 7 Days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const last7Query = query(
        collection(db, basePath),
        where("__name__", ">=", sevenDaysAgo.toISOString().split("T")[0]),
        orderBy("__name__", "desc"),
        limit(7)
      );

      const last7Snap = await getDocs(last7Query);
      const last7Days = [];

      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      last7Snap.forEach((docSnap) => {
        const data = docSnap.data();
        const dateObj = new Date(data.date);
        last7Days.push({
          date: data.date,
          dayLabel: dayNames[dateObj.getDay()],
          activeUsersCount: data.activeUsersCount || 0,
          totalSessions: data.totalSessions || 0,
          totalDurationSeconds: data.totalDurationSeconds || 0,
          averageSessionDurationSeconds: data.averageSessionDurationSeconds || 0,
        });
      });

      setStats({
        today: todayData,
        last7Days: last7Days.reverse(), // oldest to newest for chart
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error("Error fetching engagement stats:", err);
      setStats((prev) => ({
        ...prev,
        loading: false,
        error: err.message || "Failed to load engagement data",
      }));
    }
  }, [organizationId, projectId, schoolId]);

  useEffect(() => {
    fetchEngagement();
  }, [fetchEngagement]);

  return {
    ...stats,
    refetch: fetchEngagement,
  };
}