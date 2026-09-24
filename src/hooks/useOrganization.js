"use client";

import { useState, useCallback } from "react";
import {
  collection, getDocs, doc, getDoc,
  addDoc, serverTimestamp, deleteDoc, updateDoc, writeBatch
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

  const handleAddOrganization = useCallback(async (
    orgName,
    organizationType = "partner",
    createSandbox = false
  ) => {
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
        organizationType,
        ispartner: organizationType === "partner",
        isfortesting: organizationType === "testing",
        isSandbox: false,
        sandboxId: null, // populated below if a sandbox is created alongside this org
        createdAt: serverTimestamp(),
        total_projects: 0,
        total_teachers: 0,
        total_schools: 0,
        total_students: 0
      };

      const docRef = await addDoc(orgsRef, newOrg);
      const mainOrgId = docRef.id;

      setOrganizations((prev) => [...prev, { id: mainOrgId, ...newOrg }]);

      let sandboxId = null;

      if (organizationType === "partner" && createSandbox) {
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
            ispartner: false,
            isfortesting: false,
            organizationType: "sandbox",
            organizationId: mainOrgId, // relational link back to the main org
            total_projects: 0,
            total_teachers: 0,
            total_schools: 0,
            total_students: 0
          };
          const sandboxRef = await addDoc(orgsRef, sandboxOrg);
          sandboxId = sandboxRef.id;

          // Write the reverse pointer onto the main org
          await updateDoc(docRef, { sandboxId });

          setOrganizations((prev) => [
            ...prev.map((o) => (o.id === mainOrgId ? { ...o, sandboxId } : o)),
            { id: sandboxId, ...sandboxOrg },
          ]);
        }
      }

      return { id: mainOrgId, ...newOrg, sandboxId };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBackfillOrganizationFlags = useCallback(async () => {
    if (role !== "super_admin") {
      throw new Error("Only super administrators can update organization classifications");
    }

    setLoading(true);
    setError(null);

    try {
      const snapshot = await getDocs(collection(db, "organization"));

      // Build a name -> id index up front so we can resolve sandbox <-> parent
      // links for legacy docs that predate the organizationId/sandboxId fields.
      const byId = new Map();
      const byLowerName = new Map();
      snapshot.docs.forEach((d) => {
        const data = d.data();
        byId.set(d.id, data);
        byLowerName.set((data.name || "").trim().toLowerCase(), d.id);
      });

      const batch = writeBatch(db);
      let writes = 0;
      const commits = [];
      const flush = () => {
        commits.push(batch.commit());
      };

      snapshot.docs.forEach((organizationDoc) => {
        const data = organizationDoc.data();
        const nameTrimmed = (data.name || "").trim();
        const isSandbox =
          data.isSandbox === true ||
          data.organizationType === "sandbox" ||
          /[-\s]sandbox$/i.test(nameTrimmed);
        const isTesting = !isSandbox && (
          data.isfortesting === true || data.organizationType === "testing"
        );

        const updates = {
          isSandbox,
          ispartner: !isSandbox && !isTesting,
          isfortesting: isTesting,
        };

        if (isSandbox) {
          // Resolve organizationId (pointer to parent) if missing
          if (!data.organizationId) {
            let parentId = data.parentOrganization || null; // older field name, if present
            if (!parentId) {
              const parentName = nameTrimmed.replace(/[-\s]sandbox$/i, "").trim().toLowerCase();
              parentId = byLowerName.get(parentName) || null;
            }
            if (parentId) updates.organizationId = parentId;
          }
        } else {
          // Resolve sandboxId (pointer to child sandbox) if missing
          if (!data.sandboxId) {
            const sandboxName = `${nameTrimmed}-sandbox`.toLowerCase();
            const sandboxId = byLowerName.get(sandboxName) || null;
            if (sandboxId) updates.sandboxId = sandboxId;
          }
        }

        batch.update(organizationDoc.ref, updates);
        writes += 1;
        if (writes >= 400) {
          flush();
          writes = 0;
        }
      });

      if (writes > 0) flush();
      await Promise.all(commits);

      const updatedOrganizations = organizations.map((organization) => {
        const nameTrimmed = (organization.name || "").trim();
        const isSandbox =
          organization.isSandbox === true ||
          organization.organizationType === "sandbox" ||
          /[-\s]sandbox$/i.test(nameTrimmed);
        const isTesting = !isSandbox && (
          organization.isfortesting === true || organization.organizationType === "testing"
        );
        return {
          ...organization,
          isSandbox,
          ispartner: !isSandbox && !isTesting,
          isfortesting: isTesting,
        };
      });
      setOrganizations(updatedOrganizations);
      return snapshot.docs.length;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [organizations, role]);

  const handleUpdateOrganizationClassification = useCallback(async (orgId, organizationType) => {
    if (role !== "super_admin") {
      throw new Error("Only super administrators can update organization classifications");
    }
    if (!orgId) throw new Error("Organization ID is required");
    if (!["partner", "testing", "sandbox"].includes(organizationType)) {
      throw new Error("Invalid organization classification");
    }

    const isSandbox = organizationType === "sandbox";
    const updates = {
      organizationType,
      isSandbox,
      ispartner: organizationType === "partner",
      isfortesting: organizationType === "testing",
    };

    setLoading(true);
    setError(null);
    try {
      await updateDoc(doc(db, "organization", orgId), updates);
      setOrganizations((prev) =>
        prev.map((organization) =>
          organization.id === orgId ? { ...organization, ...updates } : organization
        )
      );
      return updates;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [role]);

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
    handleBackfillOrganizationFlags,
    handleUpdateOrganizationClassification,
    handleDeleteOrganization,
  };
}