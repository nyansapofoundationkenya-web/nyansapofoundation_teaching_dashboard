"use client";

import { useState } from "react";
import { collection, getDocs, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export function useOrganizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔹 Fetch all organizations
  const handleFetchOrganizations = async () => {
    setLoading(true);
    setError(null);

    try {
      const orgsRef = collection(db, "organization");
      const orgsSnap = await getDocs(orgsRef);
      const orgsList = orgsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrganizations(orgsList);
      return orgsList;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch single organization by ID
  const handleFetchOrganizationById = async (id) => {
    setLoading(true);
    setError(null);

    try {
      const orgRef = doc(db, "organization", id);
      const orgSnap = await getDoc(orgRef);
      if (!orgSnap.exists()) {
        throw new Error("Organization not found");
      }
      return { id: orgSnap.id, ...orgSnap.data() };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Add new organization
  const handleAddOrganization = async (orgName) => {
    if (!orgName) throw new Error("Organization name is required");

    setLoading(true);
    setError(null);

    try {
      const orgsRef = collection(db, "organization");
      const newOrg = {
        name: orgName,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(orgsRef, newOrg);

      // Update local state optimistically
      setOrganizations((prev) => [...prev, { id: docRef.id, ...newOrg }]);

      return { id: docRef.id, ...newOrg };
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
