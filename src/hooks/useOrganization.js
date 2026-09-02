"use client";

import { useState, useCallback } from "react";
import {
  collection, getDocs, doc, getDoc,
  addDoc, serverTimestamp, deleteDoc, query, where
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useSelector } from "react-redux";

export function useOrganizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user: currentUser, loading: userLoading } = useSelector((state) => state.auth);
  const role = currentUser?.role;

  const handleFetchOrganizations = useCallback(async () => {
    if (userLoading || !currentUser) return [];

    setLoading(true);
    setError(null);

    try {
      const userOrgs = currentUser.organizations || [];

      if (role === "super_admin") {
        const snap = await getDocs(collection(db, "organization"));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setOrganizations(list);
        return list;
      }

      if (!userOrgs.length) {
        setOrganizations([]);
        return [];
      }

      const orgDocs = await Promise.all(
        userOrgs.map((o) => getDoc(doc(db, "organization", o.id)))
      );

      const list = orgDocs
        .filter((d) => d.exists())
        .map((d) => ({ id: d.id, ...d.data() }));

      setOrganizations(list);
      return list;

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userLoading, currentUser, role]);

  const handleFetchOrganizationById = useCallback(async (orgId) => {
    if (!orgId) return null;

    setLoading(true);
    setError(null);

    try {
      const orgSnap = await getDoc(doc(db, "organization", orgId));
      if (!orgSnap.exists()) throw new Error("Organization not found");

      const orgData = { id: orgSnap.id, ...orgSnap.data() };

      if (!currentUser) return orgData;

      const userOrgs = currentUser.organizations || [];

      if (role === "super_admin" || role === "admin") return orgData;

      if (role === "project_manager") {
        const userOrg = userOrgs.find((o) => o.id === orgId);
        const assignedProjectIds = (userOrg?.projects || []).map((p) => p.id ?? p);

        const projectDocs = await Promise.all(
          assignedProjectIds.map((pid) =>
            getDoc(doc(db, "organization", orgId, "projects", pid))
          )
        );

        return {
          ...orgData,
          projects: projectDocs
            .filter((d) => d.exists())
            .map((d) => ({ id: d.id, ...d.data() })),
        };
      }

      // school_head / teacher → just the org info
      return orgData;

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, role]);

  const handleAddOrganization = useCallback(async (orgName, createSandbox = false) => {
    if (!orgName) throw new Error("Organization name is required");

    // Client-side validation
    const trimmedName = orgName.trim();

    if (trimmedName.length < 3) {
      throw new Error("Organization name must be at least 3 characters");
    }

    if (trimmedName.length > 50) {
      throw new Error("Organization name must be less than 50 characters");
    }

    // Validate characters (allow letters, numbers, spaces, hyphens, apostrophes, periods, commas, ampersands)
    const validNameRegex = /^[a-zA-Z0-9\s\-'.,&]+$/;
    if (!validNameRegex.test(trimmedName)) {
      throw new Error("Organization name can only contain letters, numbers, spaces, hyphens (-), apostrophes ('), periods (.), commas (,), and ampersands (&)");
    }

    // Prevent names that are just numbers
    if (/^\d+$/.test(trimmedName)) {
      throw new Error("Organization name cannot be only numbers");
    }

    // Prevent names with excessive repeated characters
    if (/(.)\1{4,}/.test(trimmedName)) {
      throw new Error("Organization name cannot have too many repeated characters");
    }

    setLoading(true);
    setError(null);

    try {
      const orgsRef = collection(db, "organization");

      // Check for duplicate organization names (case-insensitive)
      const allOrgs = await getDocs(orgsRef);
      const existingOrg = allOrgs.docs.find(
        doc => doc.data().name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (existingOrg) {
        throw new Error(`An organization named "${trimmedName}" already exists`);
      }

      const newOrg = {
        name: trimmedName,
        createdAt: serverTimestamp(),
        total_projects: 0,
        total_teachers: 0,
        total_schools: 0,
        total_students: 0
      };

      const docRef = await addDoc(orgsRef, newOrg);
      const mainOrgId = docRef.id;

      setOrganizations((prev) => [...prev, { id: mainOrgId, ...newOrg }]);

      if (createSandbox) {
        // Sanitize sandbox name
        const sandboxName = `${trimmedName}-sandbox`;

        // Check if sandbox already exists
        const existingSandbox = allOrgs.docs.find(
          doc => doc.data().name.toLowerCase() === sandboxName.toLowerCase()
        );

        if (!existingSandbox) {
          const sandboxOrg = {
            name: sandboxName,
            createdAt: serverTimestamp(),
            isSandbox: true,
            parentOrganization: mainOrgId,
            total_projects: 0,
            total_teachers: 0,
            total_schools: 0,
            total_students: 0
          };
          const sandboxRef = await addDoc(orgsRef, sandboxOrg);
          setOrganizations((prev) => [...prev, { id: sandboxRef.id, ...sandboxOrg }]);
        }
      }

      return { id: mainOrgId, ...newOrg };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteOrganization = useCallback(async (orgId) => {
    if (!orgId) throw new Error("Organization ID is required");

    // Check if user is super_admin
    if (role !== "super_admin") {
      throw new Error("Only super administrators can delete organizations");
    }

    setLoading(true);
    setError(null);

    try {
      // Get the organization to check if it's empty
      const orgRef = doc(db, "organization", orgId);
      const orgSnap = await getDoc(orgRef);

      if (!orgSnap.exists()) {
        throw new Error("Organization not found");
      }

      const orgData = orgSnap.data();

      // Verify organization has no associated data
      if (
        (orgData.total_projects && orgData.total_projects > 0) ||
        (orgData.total_teachers && orgData.total_teachers > 0) ||
        (orgData.total_schools && orgData.total_schools > 0) ||
        (orgData.total_students && orgData.total_students > 0)
      ) {
        throw new Error("Cannot delete organization with existing projects, teachers, schools, or students");
      }

      // Delete the organization
      await deleteDoc(orgRef);

      // Remove from local state
      setOrganizations((prev) => prev.filter((org) => org.id !== orgId));

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [role]);

  return {
    organizations,
    loading,
    error,
    handleFetchOrganizations,
    handleFetchOrganizationById,
    handleAddOrganization,
    handleDeleteOrganization,
  };
}