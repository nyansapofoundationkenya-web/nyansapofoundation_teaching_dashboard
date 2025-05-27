// hooks/useProjects.js
"use client";

import { useState } from 'react';
import {
  doc,
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  arrayUnion,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/config';

export function useProjects(organizationId) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getProjectsCollectionRef = () => {
    return collection(db, `organization/${organizationId}/projects`);
  };

  const createProject = async ({ name, location }) => {
    if (!organizationId) throw new Error("Missing organization ID");
  
    setLoading(true);
    try {
      const locationArray = location
        .split(",")
        .map((loc) => loc.trim())
        .filter(Boolean);
  
      const newProject = {
        name,
        location: locationArray,
        createdAt: new Date(),
      };
  
      // Step 1: Create the project and get the document reference
      const projectRef = await addDoc(getProjectsCollectionRef(), newProject);
  
      // Step 2: Update the organization's document to include this project ID
      const orgRef = doc(db, "organization", organizationId);
      await updateDoc(orgRef, {
        projects: arrayUnion(projectRef.id),
      });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  

  const fetchRecentProjects = async () => {
    if (!organizationId) throw new Error("Missing organization ID");

    setLoading(true);
    try {
      const q = query(getProjectsCollectionRef(), orderBy('createdAt', 'desc'), limit(2));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProjects = async () => {
    if (!organizationId) throw new Error("Missing organization ID");
    // console.log(organizationId)
  
    setLoading(true);
    try {
      const snapshot = await getDocs(getProjectsCollectionRef());
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  const addProjectManager = async ({ name, email, phone, selectedProjectIds }) => {
    if (!organizationId) throw new Error("Missing organization ID");
  
    try {
      const userId = `${Date.now()}_${email}`; // use Firebase auth UID if available
  
      // 🔹 Fetch org name from Firestore
      const orgRef = doc(db, "organization", organizationId);
      const orgSnap = await getDoc(orgRef);
      const orgName = orgSnap.exists() ? orgSnap.data().name || "Unnamed Org" : "Unknown Organization";
  
      const selectedProjects = projects
        .filter((p) => selectedProjectIds.includes(p.id))
        .map((p) => ({
          id: p.id,
          name: p.name,
          is_manager: true,
          
        }));
  
      const newUser = {
        uid: userId,
        name,
        email,
        phone,
        // class: "project_manager",
        createdAt: new Date().toISOString(),
        lastUpdated: new Date(),
        organizations: [
          {
            id: organizationId,
            name: orgName,
            projects: selectedProjects
          }
        ]
      };
  
      await setDoc(doc(db, "user", userId), newUser);
    } catch (err) {
      console.error("Error creating project manager:", err);
      throw err;
    }
  };
  

  return {
    projects,
    loading,
    error,
    createProject,
    fetchRecentProjects,
    fetchAllProjects,
    addProjectManager
  };
}
