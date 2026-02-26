"use client";

import { useState } from "react";
import {
  collection, getDocs, doc, getDoc,
  addDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useSelector } from "react-redux";

export function useOrganizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { user: currentUser, loading: userLoading } = useSelector((state) => state.auth);
  const role = currentUser?.role;

  const handleFetchOrganizations = async () => {
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
  };

  const handleFetchOrganizationById = async (orgId) => {
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
  };

  const handleAddOrganization = async (orgName, createSandbox = false) => {
    if (!orgName) throw new Error("Organization name is required");

    setLoading(true);
    setError(null);

    try {
      const orgsRef = collection(db, "organization");

      const newOrg = { name: orgName, createdAt: serverTimestamp() };
      const docRef = await addDoc(orgsRef, newOrg);
      const mainOrgId = docRef.id;

      setOrganizations((prev) => [...prev, { id: mainOrgId, ...newOrg }]);

      if (createSandbox) {
        const sandboxOrg = {
          name: `${orgName}-sandbox`,
          createdAt: serverTimestamp(),
          isSandbox: true,
          parentOrganization: mainOrgId,
        };
        const sandboxRef = await addDoc(orgsRef, sandboxOrg);
        setOrganizations((prev) => [...prev, { id: sandboxRef.id, ...sandboxOrg }]);
      }

      return { id: mainOrgId, ...newOrg };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    organizations,
    loading,
    error,
    handleFetchOrganizations,
    handleFetchOrganizationById,
    handleAddOrganization,
  };
}