"use client";

import { useState } from "react";
import { doc, getDoc, collection, addDoc, updateDoc, arrayUnion, setDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
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

  const fetchCampsByIds = async (projectId, campIds) => {
    // console.log(projectId,campIds)
    if (!organizationId || !projectId || !campIds || campIds.length === 0) {
      return [];
    }

    setLoading(true);
    try {
      const campPromises = campIds.map(async (campId) => {
        const campRef = doc(db, `organization/${organizationId}/projects/${projectId}/camps`, campId);
        const campSnap = await getDoc(campRef);
        if (campSnap.exists()) {
          return { id: campSnap.id, ...campSnap.data() };
        }
        return null;
      });

      const camps = (await Promise.all(campPromises)).filter((camp) => camp !== null);
      return camps;
    } catch (err) {
      setError(`Failed to fetch camps: ${err.message}`);
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
          createdAt: new Date().toISOString(), // 05:12 PM EAT, May 21, 2025
        });
        schoolUids.push(docRef.id);
      }

      const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
      await updateDoc(projectRef, {
        schools: arrayUnion(...schoolUids),
      });

      await fetchSchools(projectId);
      return { success: true, count: validSchools.length };
    } catch (err) {
      setError(`Failed to upload schools: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createCamp = async (projectId, schoolIds, { name, subject, startDate, endDate }) => {
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
        createdAt: new Date().toISOString(), // 05:12 PM EAT, May 21, 2025
      };

      const campsCollectionRef = collection(db, `organization/${organizationId}/projects/${projectId}/camps`);
      const campRef = await addDoc(campsCollectionRef, campData);
      const campId = campRef.id;

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

  const createInstructor = async (organizationId, projectId, schoolId, campId, { name, email, phone }) => {
    if (!organizationId || !projectId || !schoolId || !campId || !name || !email || !phone) {
      setError("Missing required instructor details (organizationId, projectId, schoolId, campId, name, email, or phone)");
      return;
    }

    setLoading(true);
    try {
      const organizationRef = doc(db, "organization", organizationId);
      const organizationSnap = await getDoc(organizationRef);
      const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
      const projectSnap = await getDoc(projectRef);
      const schoolRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId);
      const schoolSnap = await getDoc(schoolRef);
      const campRef = doc(db, `organization/${organizationId}/projects/${projectId}/camps`, campId);
      const campSnap = await getDoc(campRef);

      if (!organizationSnap.exists() || !projectSnap.exists() || !schoolSnap.exists() || !campSnap.exists()) {
        setError("Organization, project, school, or camp not found");
        return;
      }

      const organizationData = organizationSnap.data();
      const projectData = projectSnap.data();
      const schoolData = schoolSnap.data();
      const campData = campSnap.data();

      const instructorData = {
        uid: doc(collection(db, "user")).id,
        name,
        email,
        phone,
        class: "instructor",
        createdAt: new Date().toISOString(), // 05:12 PM EAT, May 21, 2025
        lastUpdated: new Date().toISOString(),
        organizations: [
          {
            name: organizationData.name || "Unknown Organization",
            id: organizationId,
            projects: [
              {
                name: projectData.name || "Unknown Project",
                id: projectId,
                is_manager: false,
                schools: [
                  {
                    name: schoolData.name || "Unknown School",
                    id: schoolId,
                    camps: [
                      {
                        name: campData.name || "Unknown Camp",
                        id: campId,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const userRef = doc(db, "user", instructorData.uid);
      await setDoc(userRef, instructorData);

      const orgRef = doc(db, "organization", organizationId);
      await updateDoc(orgRef, {
        teachers: arrayUnion(instructorData.uid),
      });

      const projRef = doc(db, `organization/${organizationId}/projects`, projectId);
      await updateDoc(projRef, {
        teachers: arrayUnion(instructorData.uid),
      });

      const schoolUpdateRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId);
      await updateDoc(schoolUpdateRef, {
        teachers: arrayUnion(instructorData.uid),
      });

      const campUpdateRef = doc(db, `organization/${organizationId}/projects/${projectId}/camps`, campId);
      await updateDoc(campUpdateRef, {
        teachers: arrayUnion(instructorData.uid),
      });

      return { success: true, instructorId: instructorData.uid };
    } catch (err) {
      setError(`Failed to create instructor: ${err.message}`);
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
    fetchCampsByIds,
    addSchoolsByCsv,
    createCamp,
    createInstructor,
  };
}