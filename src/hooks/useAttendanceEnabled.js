// hooks/useAttendanceEnabled.js
"use client";

import { useEffect, useState } from "react";
import { useOrganizations } from "@/hooks/useOrganization";

// Same rule the sidebar uses: true / "true" / 1 all count as enabled,
// so legacy string values in Firestore don't silently hide the section.
export const truthy = (v) => v === true || v === "true" || v === 1;

/**
 * Returns true when the organization has attendance turned on
 * (organization.takesAttendance), matching the sidebar's gating.
 */
export function useAttendanceEnabled(organizationId) {
  const { handleFetchOrganizationById } = useOrganizations();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;

    (async () => {
      try {
        const org = await handleFetchOrganizationById(organizationId);
        if (!cancelled) setEnabled(truthy(org?.takesAttendance));
      } catch (err) {
        console.error("Failed to load attendance setting:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Only re-fetch when the organization changes (same approach as the sidebar).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  return enabled;
}