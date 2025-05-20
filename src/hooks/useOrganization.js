// hooks/useOrganizations.js
"use client";

import { useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export function useOrganizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFetchOrganizations = async () => {
    setLoading(true);
    setError(null);

    try {
      const orgsRef = collection(db, 'organization');
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

  //New function to fetch a single org by ID
  const handleFetchOrganizationById = async (id) => {
    setLoading(true);
    setError(null);

    try {
      const orgRef = doc(db, 'organization', id);
      const orgSnap = await getDoc(orgRef);
      if (!orgSnap.exists()) {
        throw new Error('Organization not found');
      }
      return {
        id: orgSnap.id,
        ...orgSnap.data(),
      };
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
  };
}
