"use client";

import { useState } from "react";
import { doc, getDoc, collection, addDoc, updateDoc, arrayUnion, getDocs } from "firebase/firestore";
import { db } from "../firebase/config"; // Adjust as needed
import Papa from "papaparse";

export function useProjectDetails(organizationId) {
  const [project, setProject] = useState(null);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjectById = async (projectId) => {
    if (!organizationId || !projectId) {
      setError("Missing organization ID or project ID");
      return;
    }
    // console.log(organizationId, projectId);

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

  const fetchSchools = async (projectId) => {
    if (!organizationId || !projectId) {
      setError("Missing organization ID or project ID");
      return;
    }

    setLoading(true);
    try {
      const schoolsCollectionRef = collection(db, `organization/${organizationId}/projects/${projectId}/schools`);
      const snapshot = await getDocs(schoolsCollectionRef);
      const schoolsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSchools(schoolsList);
      return schoolsList;
    } catch (err) {
      setError(`Failed to fetch schools: ${err.message}`);
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
          createdAt: new Date().toISOString(), // 02:43 PM EAT, May 21, 2025
        });
        schoolUids.push(docRef.id);
      }

      const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
      await updateDoc(projectRef, {
        schools: arrayUnion(...schoolUids),
      });

      await fetchSchools(projectId); // Refresh schools list
      return { success: true, count: validSchools.length };
    } catch (err) {
      setError(`Failed to upload schools: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createCamp = async (projectId, schoolIds, { name, subject, startDate, endDate }) => {
    // console.log(name,subject,startDate,endDate)
    if (!organizationId || !projectId || !schoolIds || schoolIds.length === 0) {
      setError("Missing organization ID, project ID, or school IDs");
      return;
    }

    if (!name || !subject || !startDate || !endDate) {
      setError("Missing required camp details (name, subject, startDate, or endDate)");
      return;
    }

    setLoading(true);
    try {
      const campData = {
        name,
        subject,
        startDate,
        endDate,
        createdAt: new Date().toISOString(), // 02:43 PM EAT, May 21, 2025
      };

      // Create the camp under the projects subcollection
      const campsCollectionRef = collection(db, `organization/${organizationId}/projects/${projectId}/camps`);
      const campRef = await addDoc(campsCollectionRef, campData);
      const campId = campRef.id;

      // Update each selected school's document with the camp UID
      const updatePromises = schoolIds.map(async (schoolId) => {
        const schoolRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId);
        await updateDoc(schoolRef, {
          camps: arrayUnion(campId),
        });
      });

      await Promise.all(updatePromises);

      return { success: true, campId };
    } catch (err) {
      setError(`Failed to create camp: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    project,
    schools,
    loading,
    error,
    fetchProjectById,
    fetchSchools,
    addSchoolsByCsv,
    createCamp,
  };
}