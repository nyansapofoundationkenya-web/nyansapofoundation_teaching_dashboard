"use client";

import { useState } from "react";
import { doc, getDoc, collection, addDoc, updateDoc, arrayUnion } from "firebase/firestore"; // Import arrayUnion directly
import { db } from "../firebase/config"; // Adjust as needed
import Papa from "papaparse";

export function useProjectDetails(organizationId) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjectById = async (projectId) => {
    if (!organizationId || !projectId) {
      setError("Missing organization ID or project ID");
      return;
    }
    console.log(organizationId, projectId);

    setLoading(true);
    try {
      const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
      const snapshot = await getDoc(projectRef);

      if (snapshot.exists()) {
        const data = { id: snapshot.id, ...snapshot.data() };
        setProject(data);
        return data;
      } else {
        setError("Project not found.");
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addSchoolsByCsv = async (projectId, csvFile) => {
    if (!organizationId || !projectId) {
      setError("Missing organization ID or project ID");
      return;
    }
    if (!csvFile) {
      setError("No CSV file provided");
      return;
    }

    setLoading(true);
    try {
      const parseCsv = (file) =>
        new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => resolve(result.data),
            error: (err) => reject(err),
          });
        });

      const schoolsData = await parseCsv(csvFile);

      const validSchools = schoolsData.filter((school) => school.name && school.name.trim() !== "");
      if (validSchools.length === 0) {
        setError("No valid schools found in CSV. Each row must have a 'name' column.");
        return;
      }

      const schoolsCollectionRef = collection(db, `organization/${organizationId}/projects/${projectId}/schools`);
      const schoolUids = [];
      for (const school of validSchools) {
        const docRef = await addDoc(schoolsCollectionRef, {
          name: school.name,
          createdAt: new Date().toISOString(), // Using current date/time: 12:40 PM EAT, May 21, 2025
        });
        schoolUids.push(docRef.id);
      }

      const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
      await updateDoc(projectRef, {
        schools: arrayUnion(...schoolUids), // Use arrayUnion directly
      });

      return { success: true, count: validSchools.length };
    } catch (err) {
      setError(`Failed to upload schools: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    project,
    loading,
    error,
    fetchProjectById,
    addSchoolsByCsv,
  };
}